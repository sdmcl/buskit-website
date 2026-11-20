(() => {
  const venta = document.querySelector('[data-venta-abordo]');
  if (!venta) return;

  const selector = venta.querySelector('select');
  const boleto = venta.querySelector('.boleto');
  const asiento = boleto.querySelector('[data-boleto-asiento]');
  const codigo = boleto.querySelector('.boleto-code');
  const folio = boleto.querySelector('.boleto-folio');
  const accion = venta.querySelector('.venta-abordo__emitir');
  const aviso = venta.querySelector('[role="status"]');

  function prepararPasaje() {
    asiento.textContent = selector.value;
    folio.textContent = 'BK-0830-' + selector.value;
    codigo.src = 'assets/folio-' + selector.value + '.svg';
    boleto.classList.remove('boleto--emitido');
    accion.textContent = 'Emitir pasaje de muestra';
  }

  prepararPasaje();
  venta.querySelector('.venta-abordo__controles').hidden = false;
  selector.addEventListener('change', () => {
    prepararPasaje();
    aviso.textContent = 'Asiento ' + selector.value + ' seleccionado.';
  });

  accion.addEventListener('click', async () => {
    if (!boleto.classList.contains('boleto--emitido')) {
      boleto.classList.add('boleto--emitido');
      accion.textContent = 'Imprimir muestra';
      aviso.textContent = 'Pasaje emitido. Folio ' + folio.textContent + '.';
      return;
    }

    const asientoImpreso = selector.value;
    try {
      await codigo.decode();
      if (selector.value !== asientoImpreso || !boleto.classList.contains('boleto--emitido')) return;
      document.body.classList.add('imprimir-boleto');
      window.print();
    } catch {
      document.body.classList.remove('imprimir-boleto');
      aviso.textContent = 'El código del pasaje todavía no ha cargado. Intenta imprimir de nuevo.';
    }
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-boleto'));
})();
