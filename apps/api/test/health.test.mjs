import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../src/server.mjs';

async function withServer(run) {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}

test('health endpoint returns status without patient data', async () => {
  await withServer(async (url) => {
    const result = await fetch(`${url}/healthz`);
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await result.json(), { status: 'ok', service: 'madising-api-foundation' });
  });
});

test('unknown API paths do not expose application functions', async () => {
  await withServer(async (url) => {
    for (const path of ['/patients', '/records', '/pharmacy/orders', '/admin']) {
      const result = await fetch(`${url}${path}`);
      assert.equal(result.status, 404);
    }
  });
});

test('health endpoint does not accept writes', async () => {
  await withServer(async (url) => {
    const result = await fetch(`${url}/healthz`, { method: 'POST' });
    assert.equal(result.status, 404);
  });
});
