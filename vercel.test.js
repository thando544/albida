import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const env = {
  ...process.env, VERCEL: '1', ALBIDA_DATA_DIR: '/dev/null/unwritable',
  UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '',
  KV_REST_API_URL: '', KV_REST_API_TOKEN: '',
};

test('Vercel handler imports without disk writes or listening and serves requests', async () => {
  const result = await run(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import handler from './api/index.js';
    function response() {
      return { headersSent: false, writeHead(status) { this.status = status; this.headersSent = true; }, end(body) { this.body = body; } };
    }
    const page = response();
    await handler({url:'/', method:'GET'}, page);
    assert.equal(page.status, 200);
    const api = response();
    await handler({url:'/api/reports', method:'GET'}, api);
    assert.equal(api.status, 404);
    assert.equal(JSON.parse(api.body).error, 'Not found');
  `], { env, timeout: 10000 });
  assert.equal(result.stdout, '');
});
