import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const json = (status, value) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(value)); };
  try {
    const files = {'/':'index.html','/styles.css':'styles.css','/app.js':'app.js','/report-share.js':'report-share.js'};
    if (req.method !== 'GET' || !files[url.pathname]) return json(404, {error:'Not found'});
    const name = files[url.pathname];
    res.writeHead(200, {'Content-Type':name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html'});
    res.end(await readFile(path.join(root,'public',name)));
  } catch (error) { console.error(error); if (!res.headersSent) json(error.statusCode || 500,{error:error.statusCode === 503 ? error.message : 'Unable to complete the request. Please try again.'}); else res.end(); }
}
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain && !process.env.VERCEL) http.createServer(handler).listen(process.env.PORT || 3100, process.env.HOST || '127.0.0.1', () => console.log(`ALBIDA Kitchen: http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3100}`));
