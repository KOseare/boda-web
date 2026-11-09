(() => {
  'use strict';
  const config = window.WEDDING_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const target = new Date('2027-01-16T18:00:00-03:00').getTime();
  function updateCountdown() {
    const total = Math.max(0, Math.floor((target - Date.now()) / 1000));
    const values = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
    ['days', 'hours', 'minutes', 'seconds'].forEach((id, i) => {
      const value = String(values[i]).padStart(2, '0');
      if ($(id).textContent !== value) $(id).textContent = value;
    });
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
  for (const [id, address] of [['ceremony-map', config.ceremonyAddress], ['celebration-map', config.celebrationAddress]]) {
    if (address) $(id).href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  }
  const form = $('rsvp-form');
  const attendance = $('attendance');
  function toggleFields() {
    const attending = attendance.value === 'yes';
    $('attending-fields').hidden = !attending;
    $('guest-count').required = attending;
    $('guest-count').disabled = !attending;
    $('diet').disabled = !attending;
  }
  attendance.addEventListener('change', toggleFields);
  toggleFields();
  let submissionId = '';
  form.addEventListener('input', () => { submissionId = ''; });
  function openConfirmation(text, status, title) {
    $('confirmation-title').textContent = title;
    $('confirmation-text').textContent = text;
    $('confirmation-status').textContent = status;
    $('copy-status').textContent = '';
    $('confirmation').showModal();
    document.body.classList.add('modal-open');
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = $('guest-name').value.trim();
    if (!name) { $('guest-name').setCustomValidity('Ingresá tu nombre y apellido.'); $('guest-name').reportValidity(); return; }
    const attending = attendance.value === 'yes';
    submissionId ||= (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const payload = { 'ID del envío': submissionId, 'Nombre y apellido': name, 'Asistencia': attending, 'Cantidad de asistentes': attending ? Number($('guest-count').value) : 0, 'Restricciones alimentarias': attending ? $('diet').value.trim() : '', 'Fecha y hora de envío': new Date().toISOString() };
    const summary = `Casamiento de Ro & Juli\n16 de enero de 2027\n\nNombre: ${name}\nAsistencia: ${attending ? '¡Sí, voy a estar!' : 'No voy a poder asistir.'}${attending ? `\nPersonas: ${payload['Cantidad de asistentes']}\nRestricciones alimentarias: ${payload['Restricciones alimentarias'] || 'Ninguna'}` : ''}`;
    if (!config.rsvpEndpoint) {
      openConfirmation(summary, 'Tu respuesta está lista para copiar. Todavía no fue enviada: la recepción de confirmaciones estará disponible próximamente.', 'Revisá tu respuesta');
      return;
    }
    const button = $('submit-rsvp');
    button.disabled = true;
    $('form-status').textContent = 'Enviando tu respuesta…';
    try {
      const response = await fetch(config.rsvpEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(55000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || `HTTP_${response.status}`);
      if (!result || (result.ok !== true && result.status !== 'success') || result.ok === false || result.status === 'error') throw new Error('Unconfirmed response');
      $('form-status').textContent = 'Tu respuesta fue enviada correctamente.';
      openConfirmation(summary, attending ? '¡Gracias por confirmar! Nos hace muy felices compartir este día con vos.' : 'Gracias por avisarnos. Te vamos a extrañar en este día tan especial.', '¡Gracias por responder!');
    } catch (error) {
      console.error('No se pudo confirmar el RSVP:', error.name, error.message);
      $('form-status').textContent = 'No pudimos confirmar la recepción. Podés reintentar; tu respuesta sigue en el formulario.';
      openConfirmation(summary, 'No pudimos confirmar que tu respuesta haya llegado. Conservá una copia y volvé a intentar.', 'Guardá tu respuesta');
    } finally { button.disabled = false; }
  });
  $('guest-name').addEventListener('input', () => $('guest-name').setCustomValidity(''));
  $('close-modal').addEventListener('click', () => $('confirmation').close());
  $('confirmation').addEventListener('close', () => document.body.classList.remove('modal-open'));
  $('confirmation').addEventListener('click', (e) => { if (e.target === $('confirmation')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
  async function copy(text, status) {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copiado al portapapeles.';
    } catch { status.textContent = 'No se pudo copiar automáticamente. Seleccioná el texto y copialo manualmente.'; }
  }
  $('copy-confirmation').addEventListener('click', () => copy($('confirmation-text').textContent, $('copy-status')));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copy(button.dataset.copy, button.closest('.bank-card').querySelector('[role="status"]'))));
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-revealing'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
})();
