import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from './server.js';

function response() {
  return { headersSent: false, writeHead(status, headers) { this.status = status; this.headers = headers; this.headersSent = true; }, end(body) { this.body = body; } };
}
test('static form is available and former storage endpoints are disabled', async () => {
  for (const url of ['/', '/app.js', '/styles.css', '/report-share.js']) {
    const res = response();
    await handler({url, method:'GET'}, res);
    assert.equal(res.status, 200);
  }
  for (const [method,url] of [['GET','/api/reports'],['POST','/api/reports'],['GET','/api/reports/example/pdf']]) {
    const res = response();
    await handler({url, method, async *[Symbol.asyncIterator]() { throw Error('Report body must not be consumed'); }}, res);
    assert.equal(res.status, 404);
  }
});
