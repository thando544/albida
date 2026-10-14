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
    assert.equal(api.status, 503);
    assert.match(JSON.parse(api.body).error, /storage is not configured/);
  `], { env, timeout: 10000 });
  assert.equal(result.stdout, '');
});

test('Redis reports persist across store instances and concurrent writes', async () => {
  await run(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const entries = [];
    globalThis.fetch = async (url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      const [command, key, value] = JSON.parse(options.body);
      assert.equal(key, 'test:reports');
      if (command === 'LPUSH') entries.unshift(value);
      else assert.equal(command, 'LRANGE');
      return {ok:true, json:async () => ({result: command === 'LPUSH' ? entries.length : [...entries]})};
    };
    const first = await import('./report-store.js?first');
    await Promise.all([first.saveReport({id:'one'}), first.saveReport({id:'two'})]);
    const second = await import('./report-store.js?second');
    assert.deepEqual(await second.listReports(), [{id:'two'}, {id:'one'}]);
    globalThis.fetch = async () => ({ok:false, status:401});
    await assert.rejects(second.listReports(), /HTTP 401/);
  `], { env: { ...env, UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'test-token', ALBIDA_REPORTS_KEY: 'test:reports' }, timeout: 10000 });
});
