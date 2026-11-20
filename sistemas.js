(() => {
  const section = document.querySelector('.systems');
  if (!section) return;

  const navigation = section.querySelector('.systems-options');
  const tabs = [...navigation.querySelectorAll('a')];
  const panels = [...section.querySelectorAll('.systems-panel')];
  const routeButtons = [...document.querySelectorAll('.route-control button')];
  const cities = routeButtons.map(button => button.querySelector('span').textContent);
  const ink = '#073265';
  const teal = '#00787c';
  const pine = '#004d55';
  const outline = '#7da8ad';
  const paper = '#f8fcfb';

  function line(ctx, points, color = outline, width = 2) {
    ctx.beginPath();
    for (const [index, point] of points.entries()) {
      if (index === 0) ctx.moveTo(...point);
      else ctx.lineTo(...point);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function box(ctx, x, y, w, h, radius, fill, stroke = null) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  function dot(ctx, x, y, r, fill) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function label(ctx, value, x, y, size = 17, color = ink, align = 'left') {
    ctx.font = '600 ' + size + 'px "DM Sans", Arial, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x, y);
  }

  function polygon(ctx, points, fill) {
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Vista superior de un salón ficticio con pasillo central.
  const seats = [9, 13, 4];
  function drawSeats(ctx, step) {
    box(ctx, 64, 28, 476, 126, [38, 13, 13, 38], paper, ink);
    for (const x of [159, 438]) {
      box(ctx, x, 21, 33, 7, 3, ink);
      box(ctx, x, 154, 33, 7, 3, ink);
    }
    box(ctx, 75, 43, 20, 96, [15, 4, 4, 15], '#9ccacd');
    line(ctx, [[104, 39], [104, 143]], outline, 1);
    for (let column = 0; column < 8; column++) {
      for (let row = 0; row < 2; row++) {
        const seat = column * 2 + row + 1;
        const x = 124 + column * 51, y = row === 0 ? 43 : 102;
        const selected = seat === seats[step];
        box(ctx, x, y, 31, 37, 7, selected ? teal : '#e2eeee', selected ? pine : outline);
        line(ctx, [[x + 3, y + 5],[x + 3, y + 32]], selected ? '#81d3ca' : '#a6bfc2');
        if (selected) label(ctx, String(seat).padStart(2, '0'), x + 17, y + 19, 19, '#fff', 'center');
      }
    }
    ctx.setLineDash([6, 6]);
    line(ctx, [[116, 91], [521, 91]], '#a9c7ca', 1.5);
    ctx.setLineDash([]);
  }

  // Cada bulto se dibuja en las mismas tres caras para mantener la escala del conjunto.
  function drawBox(ctx, x, y, width, height, active) {
    const slant = width * .42;
    polygon(ctx, [[x, y],[x + width, y - slant],[x + 2 * width, y],[x + width, y + slant]], active ? '#81d4ca' : '#d6e6e6');
    polygon(ctx, [[x, y],[x + width, y + slant],[x + width, y + height + slant],[x, y + height]], active ? '#229293' : '#a8c6c9');
    polygon(ctx, [[x + width, y + slant],[x + 2 * width, y],[x + 2 * width, y + height],[x + width, y + height + slant]], active ? pine : '#769fa6');
    line(ctx, [[x + width * .48, y - slant * .48],[x + width * 1.48, y + slant * .52],[x + width * 1.48, y + slant * .52 + 11]], active ? '#e2f7f2' : '#f1f8f8', 5);
  }

  function drawShipment(ctx, step) {
    const names = ['Origen', 'En ruta', 'Destino'];
    const positions = [111, 299, 487];
    line(ctx, [[111, 125], [487, 125]], '#a4c0c4', 3);
    line(ctx, [[111, 125], [positions[step], 125]], teal, 4);
    positions.forEach((x, i) => {
      drawBox(ctx, x - 47, 54, 46, 39, i === step);
      dot(ctx, x, 125, 7, i <= step ? teal : '#9bb7bb');
      label(ctx, names[i], x, 151, 20, i === step ? ink : '#4e6e79', 'center');
    });
  }

  function drawJourney(ctx, step) {
    const route = [[48, 112], [145, 112], [205, 66], [301, 66], [375, 112], [543, 112]];
    line(ctx, route, '#aec9cb', 7);
    line(ctx, route.slice(0, [1, 4, 6][step]), teal, 7);
    const stops = [[48,112], [301,66], [543,112]];
    stops.forEach(([x,y],i) => {
      dot(ctx, x, y, i === step ? 18 : 8, i === step ? '#a3ded9' : ink);
      if (i === step) { dot(ctx, x, y, 10, teal); dot(ctx, x, y, 4, '#fff'); }
    });
    label(ctx, cities[0], 48, 143, 20, ink);
    label(ctx, cities[1], 301, 34, 20, ink, 'center');
    label(ctx, cities[2], 543, 143, 20, ink, 'right');
  }

  function drawAgreement(ctx, step) {
    box(ctx, 112, 25, 320, 117, 9, '#cedfe0', '#96b3b9');
    box(ctx, 123, 34, 320, 117, 9, '#e1eded', '#96b3b9');
    box(ctx, 135, 45, 320, 117, 9, paper, ink);
    box(ctx, 151, 60, 7, 23, 2, teal);
    label(ctx, 'Pase de empresa', 169, 72, 24);
    line(ctx, [[152, 104],[298, 104]], outline);
    line(ctx, [[152, 121],[262, 121]], outline);
    for (const [i, width] of [3, 2, 4, 1, 3, 2, 4, 1, 2].entries()) {
      box(ctx, 354 + i * 8, 116, width, 22, 0, '#587785');
    }
    dot(ctx, 420, 64, 32, step ? teal : '#d0e2e2');
    if (step) line(ctx, [[404,64],[416,75],[436,52]], '#fff', 4);
    else { line(ctx, [[410,64],[430,64]], ink, 3); line(ctx, [[420,54],[420,74]], ink, 3); }
  }

  const simulations = {
    pasajes: {
      draw: drawSeats,
      readings: seats.map(seat => 'Asiento ' + String(seat).padStart(2, '0') + ' seleccionado'),
      action: ['Cambiar asiento']
    },
    encomiendas: {
      draw: drawShipment,
      readings: ['Recibido en origen', 'Bulto en ruta', 'Recibido en destino'],
      action: ['Despachar bulto', 'Registrar recepción', 'Reiniciar envío']
    },
    seguimiento: {
      draw: drawJourney,
      readings: ['Salida de ' + cities[0], 'Paso por ' + cities[1], 'Llegada a ' + cities[2]],
      action: ['Avanzar viaje', 'Avanzar viaje', 'Reiniciar viaje']
    },
    convenios: {
      draw: drawAgreement,
      readings: ['Pasaje por emitir', 'Pasaje de convenio emitido'],
      action: ['Emitir muestra', 'Reiniciar muestra']
    }
  };

  let active;
  const steps = new Map();
  function paint() {
    if (!canDraw) return;
    const canvas = active?.querySelector('canvas');
    if (!canvas || !canvas.clientWidth) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    const ctx = canvas.getContext('2d');
    const scale = Math.min(canvas.width / 600, canvas.height / 184);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - 600 * scale) / 2, (canvas.height - 184 * scale) / 2);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    simulations[active.id].draw(ctx, steps.get(active.id));
  }

  function updateStep(panel, step) {
    const simulation = simulations[panel.id];
    steps.set(panel.id, step);
    panel.querySelector('.systems-reading').textContent = simulation.readings[step];
    panel.querySelector('button').textContent = simulation.action[step] || simulation.action[0];
    if (active === panel) paint();
  }

  routeButtons.forEach((button, index) => {
    button.addEventListener('click', () => updateStep(section.querySelector('#seguimiento'), index));
  });

  function selectPanel(panel) {
    active = panel;
    panels.forEach(item => { item.hidden = item !== panel; });
    tabs.forEach(tab => {
      const selected = tab.hash === '#' + panel.id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    paint();
  }

  function followHash() {
    const requested = panels.find(panel => '#' + panel.id === window.location.hash);
    if (!requested) return;
    selectPanel(requested);
    requested.closest('.systems-workbench').scrollIntoView({ block: 'start' });
  }

  navigation.setAttribute('role', 'tablist');
  const canDraw = typeof CanvasRenderingContext2D !== 'undefined' &&
    typeof CanvasRenderingContext2D.prototype.roundRect === 'function' &&
    Boolean(panels[0].querySelector('canvas').getContext('2d'));
  for (const [index, panel] of panels.entries()) {
    const tab = tabs[index];
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    steps.set(panel.id, 0);
    panel.querySelector('.systems-example').hidden = !canDraw;
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      selectPanel(panel);
      if (location.hash !== tab.hash) {
        try { history.replaceState(history.state, '', tab.hash); }
        catch { location.hash = tab.hash; }
      }
    });
    const button = panel.querySelector('button');
    button.addEventListener('click', () => {
      const simulation = simulations[panel.id];
      const step = (steps.get(panel.id) + 1) % simulation.readings.length;
      if (panel.id === 'seguimiento') routeButtons[step].click();
      else updateStep(panel, step);
    });
  }
  navigation.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const next = {
      ArrowDown: (index + 1) % tabs.length, ArrowRight: (index + 1) % tabs.length,
      ArrowUp: (index + tabs.length - 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0, End: tabs.length - 1
    }[event.key];
    if (event.key === ' ') { event.preventDefault(); tabs[index].click(); return; }
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });
  section.classList.add('is-interactive');
  section.querySelector('.systems-disclosure').hidden = !canDraw;
  selectPanel(panels.find(panel => '#' + panel.id === location.hash) || panels[0]);
  window.addEventListener('hashchange', followHash);
  window.addEventListener('resize', paint, { passive: true });
  document.fonts?.ready.then(paint);
})();
