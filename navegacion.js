const header = document.querySelector('.site-header');
const trigger = header.querySelector('.menu-trigger');
const menu = document.getElementById('menu-principal');
const narrowLayout = window.matchMedia('(max-width: 47rem)');

function setMenu(open) {
  menu.hidden = narrowLayout.matches && !open;
  trigger.setAttribute('aria-expanded', String(open));
  trigger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}

function syncLayout() {
  trigger.hidden = !narrowLayout.matches;
  setMenu(false);
}

trigger.addEventListener('click', () => {
  const opening = menu.hidden;
  setMenu(opening);
  if (opening) menu.querySelector('a').focus();
});
header.addEventListener('click', event => {
  if (narrowLayout.matches && event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && narrowLayout.matches && !menu.hidden) {
    setMenu(false);
    trigger.focus();
  }
});
header.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
});
narrowLayout.addEventListener('change', syncLayout);
syncLayout();
