const sceneDuration = 7000;
const takeDuration = 5000;
const galleryTones = new Set(['gold', 'blue', 'green', 'copper']);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function metrics(items) {
  const list = el('dl', 'studio-metrics');
  items.forEach(([label, value]) => {
    const cell = el('div');
    cell.append(el('dt', '', label), el('dd', '', value));
    list.append(cell);
  });
  return list;
}

function activity(values, entries) {
  const block = el('section', 'studio-activity');
  const chart = el('div', 'studio-chart');
  const events = el('ol', 'studio-events');
  chart.setAttribute('aria-hidden', 'true');
  values.forEach((value) => {
    const bar = el('i');
    bar.style.setProperty('--bar-height', Math.max(0, Math.min(value, 100)) + '%');
    chart.append(bar);
  });
  entries.forEach(([time, text]) => {
    const row = el('li');
    row.append(el('time', '', time), el('span', '', text));
    events.append(row);
  });
  block.append(el('h4', '', 'Активность'), chart, events);
  return block;
}

function network(nodes) {
  const block = el('section', 'studio-network');
  const map = el('div', 'studio-map');
  const detail = el('div', 'studio-node-detail');
  const buttons = nodes.map((node) => {
    const button = el('button', 'studio-node');
    button.type = 'button';
    button.append(el('i'), el('span', '', node.name));
    button.setAttribute('aria-label', node.name + ', ' + node.status);
    map.append(button);
    return button;
  });
  const select = (index) => {
    const node = nodes[index];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    detail.replaceChildren(el('strong', '', node.name), metrics([
      ['Узел', node.code], ['Задержка', node.delay], ['Статус', node.status]
    ]));
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  select(0);
  block.append(map, detail);
  return block;
}

function gallery(items) {
  const block = el('section', 'studio-gallery');
  const art = el('div', 'studio-art');
  const caption = el('p', 'studio-gallery-caption');
  const thumbnails = el('div', 'studio-thumbs');
  const expand = el('button', 'studio-control studio-expand', 'Развернуть');
  expand.type = 'button';
  expand.setAttribute('aria-pressed', 'false');
  expand.addEventListener('click', () => {
    const active = block.classList.toggle('expanded');
    expand.textContent = active ? 'Свернуть' : 'Развернуть';
    expand.setAttribute('aria-pressed', String(active));
  });
  const buttons = items.map((item) => {
    const button = el('button', 'studio-thumb', item.title);
    button.type = 'button';
    if (galleryTones.has(item.tone)) button.dataset.tone = item.tone;
    thumbnails.append(button);
    return button;
  });
  const select = (index) => {
    const item = items[index];
    art.dataset.tone = galleryTones.has(item.tone) ? item.tone : 'gold';
    art.replaceChildren(el('span', '', item.code), el('strong', '', item.title));
    caption.textContent = item.type + ' · ' + item.code;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  select(0);
  block.append(art, caption, thumbnails, expand);
  return block;
}

function sceneContent(scene) {
  const frame = el('div', 'studio-content');
  if (scene.kind === 'network') return network(scene.nodes);
  if (scene.kind === 'gallery') return gallery(scene.items);
  if (scene.kind === 'profile') {
    const identity = el('div', 'studio-identity');
    const name = el('p');
    name.append(el('strong', '', scene.name), el('span', '', scene.handle));
    identity.append(el('b', '', scene.initials), name);
    frame.append(identity);
  }
  frame.append(metrics(scene.metrics), activity(scene.values, scene.events));
  return frame;
}

export function mountStudio({ button, dialog, scenes, onVisibilityChange }) {
  const find = (selector) => dialog.querySelector(selector);
  const stage = find('#studioStage');
  const sections = find('#studioSections');
  const status = find('#studioStatus');
  const progress = find('#studioProgress');
  const play = find('#studioPlay');
  const next = find('#studioNext');
  const reset = find('#studioReset');
  const take = find('#studioTake');
  const frameMode = find('#studioFrame');
  const exit = find('#studioExit');
  let index = 0;
  let firstScene = 0;
  let duration = sceneDuration;
  let moduleTitle = '';
  let opener = button;
  let elapsed = 0;
  let startedAt = 0;
  let frame = 0;
  let playing = false;
  let finished = false;
  const tabs = scenes.map((scene, i) => {
    const tab = el('button', 'studio-tab', scene.label);
    tab.type = 'button';
    tab.addEventListener('click', () => select(i));
    sections.append(tab);
    return tab;
  });

  function updateControls() {
    play.textContent = playing ? 'Пауза' : finished ? 'Повторить' : elapsed ? 'Продолжить' : 'Старт';
    next.disabled = index === scenes.length - 1;
    status.textContent = finished ? 'Прогон завершён' : 'Сцена ' + (index + 1) + ' из ' + scenes.length;
  }

  function updateProgress() {
    progress.style.transform = 'scaleX(' + Math.min(elapsed / duration, 1) + ')';
  }

  function render() {
    const scene = scenes[index];
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
    const slide = el('article', 'studio-slide');
    slide.dataset.scene = scene.kind;
    slide.append(el('p', 'studio-capture-brand', 'XANAKEN · ДЕМО'));
    if (moduleTitle) slide.append(el('p', 'studio-module-title', moduleTitle));
    slide.append(el('h3', '', scene.title), el('p', 'studio-description', scene.description), sceneContent(scene));
    stage.replaceChildren(slide);
    updateControls();
    updateProgress();
  }

  function pause() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(frame);
    updateControls();
  }

  function select(i) {
    index = i;
    elapsed = 0;
    finished = false;
    if (playing) startedAt = performance.now();
    render();
  }

  function tick(now) {
    if (!playing) return;
    elapsed = now - startedAt;
    updateProgress();
    if (elapsed >= duration) {
      if (index + 1 === scenes.length) {
        finished = true;
        pause();
        return;
      }
      select(index + 1);
    }
    frame = requestAnimationFrame(tick);
  }

  function togglePlay() {
    if (playing) {
      pause();
      return;
    }
    if (finished) select(firstScene);
    playing = true;
    startedAt = performance.now() - elapsed;
    updateControls();
    frame = requestAnimationFrame(tick);
  }

  function toggleFrame(force) {
    const active = dialog.classList.toggle('studio-frame-mode', force);
    frameMode.textContent = active ? 'Выйти из кадра' : 'Режим кадра';
    frameMode.setAttribute('aria-pressed', String(active));
    if (active) stage.focus({ preventScroll: true });
  }

  function open({ kind, label = '', from = button } = {}) {
    if (dialog.open) return;
    opener = from;
    moduleTitle = label;
    firstScene = Math.max(0, scenes.findIndex((scene) => scene.kind === kind));
    duration = sceneDuration;
    select(firstScene);
    toggleFrame(false);
    dialog.showModal();
    exit.focus({ preventScroll: true });
    onVisibilityChange(true);
  }

  function close() {
    if (!dialog.open) return false;
    pause();
    toggleFrame(false);
    dialog.close();
    opener.focus({ preventScroll: true });
    onVisibilityChange(false);
    return true;
  }

  button.addEventListener('click', () => open());
  exit.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
  play.addEventListener('click', togglePlay);
  next.addEventListener('click', () => select(Math.min(index + 1, scenes.length - 1)));
  reset.addEventListener('click', () => { pause(); select(firstScene); });
  take.addEventListener('click', () => {
    pause();
    moduleTitle = '';
    firstScene = 0;
    duration = takeDuration;
    select(firstScene);
    toggleFrame(true);
    togglePlay();
  });
  frameMode.addEventListener('click', () => toggleFrame(!dialog.classList.contains('studio-frame-mode')));
  dialog.addEventListener('keydown', (event) => {
    if (event.target.closest('button, input, select, textarea') || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.code === 'Space' || event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (event.code === 'Space') togglePlay();
      else select(Math.max(0, Math.min(scenes.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1))));
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  return { open, close };
}
