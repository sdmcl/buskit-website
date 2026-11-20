(() => {
  const acciones = document.querySelector('.boleto__acciones');
  if (!acciones) return;
  const imprimir = acciones.querySelector('.boleto__imprimir');
  const aviso = acciones.querySelector('.boleto__aviso');
  const codigo = acciones.closest('.boleto').querySelector('.boleto-code');

  acciones.hidden = false;
  imprimir.addEventListener('click', async () => {
    imprimir.disabled = true;
    aviso.textContent = '';
    try {
      await codigo.decode();
      document.body.classList.add('imprimir-boleto');
      window.print();
    } catch {
      document.body.classList.remove('imprimir-boleto');
      aviso.textContent = 'No se pudo imprimir el pasaje. Intenta imprimir de nuevo.';
    } finally {
      imprimir.disabled = false;
    }
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-boleto'));
})();
