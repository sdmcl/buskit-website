const paradas = [...document.querySelectorAll('.route-control button')];
const estadoBus = document.querySelector('[data-viaje-estado]');
const avisoViaje = document.querySelector('[data-viaje-aviso]');

paradas.forEach((parada, indice) => {
  parada.disabled = false;
  parada.addEventListener('click', () => {
    paradas.forEach((boton, posicion) => {
      boton.setAttribute('aria-pressed', String(posicion === indice));
      boton.classList.toggle('recorrida', posicion < indice);
    });
    estadoBus.textContent = parada.dataset.estado;
    avisoViaje.textContent = parada.querySelector('span').textContent + ', ' +
      parada.querySelector('time').textContent + '. Máquina 18: ' + parada.dataset.estado + '.';
  });
});
