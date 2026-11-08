const endpoint = 'https://script.google.com/macros/s/AKfycbx46QzgKJV7BExC78rJftjjKg60zTq9mU3IegneFidOBPwvTIlBgEm7e7nKIouz5CyjxQ/exec';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'INVALID_JSON' }, 400);
  }
  if (!payload || typeof payload['ID del envío'] !== 'string' || !payload['ID del envío'].trim() ||
      typeof payload['Nombre y apellido'] !== 'string' || !payload['Nombre y apellido'].trim() ||
      typeof payload['Asistencia'] !== 'boolean' ||
      !Number.isInteger(payload['Cantidad de asistentes']) ||
      (payload['Asistencia'] ? payload['Cantidad de asistentes'] < 1 : payload['Cantidad de asistentes'] !== 0) ||
      typeof payload['Restricciones alimentarias'] !== 'string' ||
      typeof payload['Fecha y hora de envío'] !== 'string' || !Number.isFinite(Date.parse(payload['Fecha y hora de envío']))) {
    return json({ ok: false, error: 'INVALID_SUBMISSION' }, 400);
  }

  try {
    // Un solo POST: repetirlo automáticamente podría duplicar filas en Sheets.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      console.error('RSVP upstream HTTP failure', response.status);
      return json({ ok: false, error: 'UPSTREAM_HTTP' }, 502);
    }
    let result;
    try {
      result = await response.json();
    } catch {
      // Google puede devolver HTML (por ejemplo, un error doGet) con HTTP 200.
      console.error('RSVP upstream returned invalid JSON', response.headers.get('content-type'));
      return json({ ok: false, error: 'UPSTREAM_INVALID_RESPONSE' }, 502);
    }
    if (!result || (result.ok !== true && result.status !== 'success') || result.ok === false || result.status === 'error') {
      console.error('RSVP upstream did not confirm storage');
      return json({ ok: false, error: 'UPSTREAM_UNCONFIRMED' }, 502);
    }
    return json({ ok: true });
  } catch (error) {
    const timeout = error.name === 'TimeoutError';
    console.error('RSVP upstream request failed', error.name);
    return json({ ok: false, error: timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_NETWORK' }, timeout ? 504 : 502);
  }
}
