(() => {
  const form = document.querySelector('.contact-form');
  const status = form.querySelector('.contact-status');
  const submit = form.querySelector('button[type="submit"]');

  for (const link of document.querySelectorAll('[data-consulta]')) {
    link.addEventListener('click', () => {
      form.elements.sistema.value = link.dataset.consulta;
      status.textContent = '';
    });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    if (location.protocol === 'file:') {
      status.textContent = 'El envío de consultas requiere abrir la página desde el sitio web.';
      return;
    }

    submit.disabled = true;
    status.textContent = 'Enviando consulta…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form))
      });
      const result = response.headers.get('content-type')?.includes('application/json')
        ? await response.json() : null;
      if (response.ok && result?.recibida === true) {
        form.reset();
        status.textContent = 'Consulta recibida. El equipo comercial te responderá al correo indicado.';
      } else if (response.status === 429) {
        status.textContent = 'Se alcanzó el límite de envíos. Intenta nuevamente más tarde.';
      } else {
        status.textContent = 'No se pudo enviar la consulta. Tus datos siguen en el formulario para que puedas reintentar.';
      }
    } catch {
      status.textContent = 'La conexión se interrumpió. Tus datos siguen en el formulario.';
    } finally {
      submit.disabled = false;
    }
  });
})();
