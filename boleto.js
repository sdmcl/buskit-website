const boleto = document.querySelector('.boleto');

if (boleto) {
  const selector = boleto.querySelector('.boleto-choice select');
  const numeros = boleto.querySelectorAll('[data-boleto-asiento]');
  const aviso = boleto.querySelector('[role="status"]');
  const codigo = boleto.querySelector('.boleto-code');
  const folio = boleto.querySelector('.boleto-folio');

  function mostrarAsiento() {
    for (const numero of numeros) numero.textContent = selector.value;
    folio.textContent = 'BK-0830-' + selector.value;
    codigo.setAttribute('src', 'assets/folio-' + selector.value + '.svg');
  }

  mostrarAsiento();
  boleto.querySelector('.boleto-actions').hidden = false;
  selector.addEventListener('change', () => {
    mostrarAsiento();
    aviso.textContent = `Asiento ${selector.value} en el pasaje y el talón.`;
  });
  boleto.querySelector('.boleto-print').addEventListener('click', async () => {
    try {
      await codigo.decode();
      document.body.classList.add('imprimir-boleto');
      window.print();
    } catch {
      aviso.textContent = 'El código del pasaje todavía no ha cargado. Vuelve a intentar la impresión.';
    }
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('imprimir-boleto'));
}
