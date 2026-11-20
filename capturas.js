const visor = document.querySelector('.viewer');

if (typeof visor.showModal === 'function') {
  const imagenAmpliada = new Image();
  const titulo = visor.querySelector('h2');
  const cerrar = visor.querySelector('button');
  let origen;

  for (const enlace of document.querySelectorAll('.enlarge')) {
    enlace.addEventListener('click', evento => {
      if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey || evento.button !== 0) return;
      evento.preventDefault();
      origen = enlace;
      const miniatura = enlace.querySelector('img');
      titulo.textContent = enlace.closest('figure').querySelector('figcaption').textContent;
      imagenAmpliada.alt = miniatura.alt;
      imagenAmpliada.src = enlace.href;
      visor.append(imagenAmpliada);
      visor.showModal();
      cerrar.focus();
    });
  }
  cerrar.addEventListener('click', () => visor.close());
  visor.addEventListener('click', evento => {
    if (evento.target !== visor) return;
    const marco = visor.getBoundingClientRect();
    if (evento.clientX < marco.left || evento.clientX > marco.right || evento.clientY < marco.top || evento.clientY > marco.bottom) visor.close();
  });
  visor.addEventListener('close', () => origen?.focus());
}
