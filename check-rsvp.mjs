import assert from 'node:assert/strict';
import { POST } from './api/rsvp.mjs';

const payload = {
  'ID del envío': 'diagnostic-test',
  'Nombre y apellido': 'Prueba local',
  'Asistencia': true,
  'Cantidad de asistentes': 2,
  'Restricciones alimentarias': '',
  'Fecha y hora de envío': '2026-11-08T14:00:00.000Z',
};
const request = (body = payload) => new Request('https://example.test/api/rsvp', { method: 'POST', body: JSON.stringify(body) });
const originalFetch = globalThis.fetch;
let calls = 0;
let upstream;
globalThis.fetch = async (url, options) => {
  calls++;
  assert.match(url, /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/);
  assert.equal(options.method, 'POST');
  assert.equal(options.redirect, 'follow');
  assert.deepEqual(JSON.parse(options.body), payload);
  assert.equal(options.headers.Origin, undefined);
  return upstream();
};
try {
  for (const result of [{ ok: true }, { status: 'success' }]) {
    upstream = () => Response.json(result);
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  for (const [reply, code, status = 502] of [
    [() => new Response('<html>doGet</html>', { headers: { 'Content-Type': 'text/html' } }), 'UPSTREAM_INVALID_RESPONSE'],
    [() => Response.json({ status: 'error', message: 'Error privado' }), 'UPSTREAM_UNCONFIRMED'],
    [() => Response.json({ ok: false, status: 'success' }), 'UPSTREAM_UNCONFIRMED'],
    [() => Response.json({}), 'UPSTREAM_UNCONFIRMED'],
    [() => new Response('', { status: 403 }), 'UPSTREAM_HTTP'],
    [() => { throw new TypeError('fetch failed'); }, 'UPSTREAM_NETWORK'],
    [() => { throw new DOMException('Timeout', 'TimeoutError'); }, 'UPSTREAM_TIMEOUT', 504],
  ]) {
    upstream = reply;
    const before = calls;
    const response = await POST(request());
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { ok: false, error: code });
    assert.equal(calls, before + 1, 'No reintentar el POST automáticamente');
  }
  const before = calls;
  for (const body of [null, {}, { ...payload, 'Asistencia': 'yes' }, { ...payload, 'Cantidad de asistentes': 0 }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal((await POST(new Request('https://example.test/api/rsvp', { method: 'POST', body: '{' }))).status, 400);
  assert.equal(calls, before, 'No enviar datos inválidos a Sheets');
} finally {
  globalThis.fetch = originalFetch;
}
console.log('OK: proxy RSVP, formatos de éxito, HTML con 200, errores HTTP/red/timeout, validación y ausencia de reintentos. Sin escrituras reales.');
