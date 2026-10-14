import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = process.env.ALBIDA_DATA_DIR || fileURLToPath(new URL('./data', import.meta.url));
const database = path.join(directory, 'reports.json');
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redisKey = process.env.ALBIDA_REPORTS_KEY || 'albida:reports';
let saveQueue = Promise.resolve();

function checkStorage() {
  if ((process.env.VERCEL || redisUrl || redisToken) && !(redisUrl && redisToken)) {
    const error = new Error('Report storage is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel, then redeploy.');
    error.statusCode = 503;
    throw error;
  }
}

async function redis(command) {
  const response = await fetch(redisUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Report storage returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error('Report storage command failed');
  return payload.result;
}

export async function listReports() {
  checkStorage();
  if (redisUrl) return (await redis(['LRANGE', redisKey, 0, -1])).map(value => JSON.parse(value));
  try { return JSON.parse(await readFile(database, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return []; }
}

export async function saveReport(report) {
  checkStorage();
  // LPUSH is atomic across concurrent function instances.
  if (redisUrl) return redis(['LPUSH', redisKey, JSON.stringify(report)]);
  const operation = saveQueue.then(async () => {
    const next = [report, ...await listReports()];
    await mkdir(directory, { recursive: true });
    await writeFile(database + '.tmp', JSON.stringify(next, null, 2));
    await rename(database + '.tmp', database);
  });
  saveQueue = operation.catch(() => {});
  return operation;
}
