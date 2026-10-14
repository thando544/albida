import http from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { createReportPdf } from './report-pdf.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.ALBIDA_DATA_DIR || path.join(root, 'data');
await mkdir(dataDir, { recursive: true });
const database = path.join(dataDir, 'reports.json');
let reports;
try { reports = JSON.parse(await readFile(database, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; reports = []; }
const services = ['Breakfast & lunch', 'Dinner'];
const menus = ['Zambezi Menu', 'African Heritage', 'Breakfast & lunch', 'Local Experience'];
function validate(body) {
  const result = {};
  for (const key of ['date', 'chef', 'service', 'menu', 'overview', 'dietary', 'turndown', 'feedback', 'conclusion', 'notes']) {
    if (typeof body[key] !== 'string' || body[key].length > 5000) throw Error(`Invalid ${key}`);
    result[key] = body[key].trim();
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || !Number.isFinite(Date.parse(result.date)) || new Date(result.date).toISOString().slice(0,10) !== result.date) throw Error('Choose a valid date');
  if (!result.chef || !result.overview || !services.includes(result.service) || !menus.includes(result.menu)) throw Error('Complete the required report fields');
  if (!Number.isInteger(body.covers) || body.covers < 0 || body.covers > 10000) throw Error('Covers must be a whole number from 0 to 10,000');
  result.covers = body.covers;
  if (!Array.isArray(body.dishes) || !body.dishes.length || body.dishes.length > 100) throw Error('Add between 1 and 100 dishes');
  result.dishes = body.dishes.map(d => {
    if (typeof d.name !== 'string' || !d.name.trim() || d.name.length > 200 || !Number.isInteger(d.quantity) || d.quantity < 1 || d.quantity > 10000) throw Error('Every dish needs a name and a positive whole-number quantity');
    return { name: d.name.trim(), quantity: d.quantity };
  });
  return result;
}
let saveQueue = Promise.resolve();
function save(report) {
  const operation = saveQueue.then(async () => {
    const next = [report, ...reports];
    await writeFile(database + '.tmp', JSON.stringify(next, null, 2));
    await rename(database + '.tmp', database);
    reports = next;
  });
  saveQueue = operation.catch(() => {});
  return operation;
}
function pdf(report, res) {
  res.writeHead(200, {'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="albida-report-${report.date}.pdf"`});
  createReportPdf(report).pipe(res);
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const json = (status, value) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(value)); };
  try {
    if (url.pathname === '/api/reports' && req.method === 'GET') return json(200, reports);
    if (url.pathname === '/api/reports' && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 100000) return json(413, {error:'Report is too large'}); }
      let report;
      try { report = {...validate(JSON.parse(raw)), id:randomUUID(), createdAt:new Date().toISOString()}; }
      catch (error) { return json(400, {error:error.message}); }
      await save(report);
      return json(201, report);
    }
    const match = url.pathname.match(/^\/api\/reports\/([\w-]+)\/pdf$/);
    if (match && req.method === 'GET') {
      const report = reports.find(r => r.id === match[1]);
      if (!report) return json(404, {error:'Report not found'});
      return pdf(report,res);
    }
    const files = {'/':'index.html','/styles.css':'styles.css','/app.js':'app.js','/report-share.js':'report-share.js'};
    if (req.method !== 'GET' || !files[url.pathname]) return json(404, {error:'Not found'});
    const name = files[url.pathname];
    res.writeHead(200, {'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html'});
    res.end(await readFile(path.join(root,'public',name)));
  } catch (error) { console.error(error); if (!res.headersSent) json(500,{error:'Unable to complete the request. Please try again.'}); else res.end(); }
});
server.listen(process.env.PORT || 3100, process.env.HOST || '127.0.0.1', () => console.log(`ALBIDA Kitchen: http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3100}`));
