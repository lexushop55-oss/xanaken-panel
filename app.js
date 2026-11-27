(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const $ = (s) => document.querySelector(s);
  const tg = window.Telegram && window.Telegram.WebApp;
  const can = (v) => {
    try { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); } catch (e) { return false; }
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BG = '#060709';

  if (tg) {
    try { tg.ready(); tg.expand(); } catch (e) {}
    if (can('6.1')) { try { tg.setHeaderColor(BG); tg.setBackgroundColor(BG); } catch (e) {} }
    if (can('7.10')) { try { tg.setBottomBarColor(BG); } catch (e) {} }
    if (can('7.7')) { try { tg.disableVerticalSwipes(); } catch (e) {} }
  }

  const haptic = (kind, style) => {
    if (!can('6.1')) return;
    try {
      const h = tg.HapticFeedback;
      if (kind === 'impact') h.impactOccurred(style || 'medium');
      else if (kind === 'notify') h.notificationOccurred(style || 'error');
      else h.selectionChanged();
    } catch (e) {}
  };

  const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (u) {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    $('#meName').textContent = name || (u.username ? '@' + u.username : 'Гость');
    $('#meId').textContent = 'ID ' + u.id + (u.username ? ' · @' + u.username : '');
    $('#ava').textContent = (name || u.username || 'X').charAt(0).toUpperCase();
  }

  // Расшифровка текста: символы перебираются и встают на место слева направо
  const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯXZQ0123456789#$%&@';
  const scramble = (el, ms) => {
    if (!el || reduce) return;
    const final = el.textContent;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const fixed = Math.floor(p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) {
        out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    };
    requestAnimationFrame(step);
  };

  // Загрузка и появление экрана
  const boot = $('#boot');
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    document.body.classList.add('shown');
    scramble($('#h1'), 750);
    scramble($('#wordmark'), 600);
  };
  const hideBoot = () => {
    if (!boot || !boot.isConnected) { show(); return; }
    boot.classList.add('out');
    show();
    setTimeout(() => boot.remove(), 320);
  };
  // Время считаем от начала загрузки страницы: скрипт Telegram может грузиться долго,
  // и к этому моменту заставка уже частично прошла
  const BOOT_MS = 1950;
  const elapsed = performance.now();
  if (boot) {
    if (reduce || elapsed >= BOOT_MS + 500) { boot.remove(); show(); }
    else {
      if (elapsed < 600) scramble($('#bootLogo'), 900);
      boot.addEventListener('click', hideBoot, { once: true });
      boot.addEventListener('animationend', (e) => {
        if (e.target === boot && e.animationName === 'bootAway') boot.remove();
      });
      setTimeout(show, Math.max(0, BOOT_MS - elapsed));
    }
  } else show();

  // Пинг
  const ping = $('#ping');
  setInterval(() => {
    if (!document.hidden && ping) ping.textContent = (17 + Math.floor(Math.random() * 24)) + ' мс';
  }, 2200);

  // Терминал: новая строка печатается посимвольно
  const log = $('#termLog');
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pool = [
    () => ['g', 'tunnel ru-07 → nl-02 установлен'],
    () => ['', 'proxy chain 3/3 ok'],
    () => ['y', 'сканирование узла 45.***.**.' + rnd(2, 254) + ' …'],
    () => ['g', 'handshake ok · ' + rnd(14, 48) + ' мс'],
    () => ['', 'пакетов в очереди: ' + rnd(1200, 9800)],
    () => ['y', 'синхронизация базы ' + rnd(12, 99) + '%'],
    () => ['r', 'ключ администратора не найден'],
    () => ['', 'шифрование AES-256-GCM'],
    () => ['g', 'узел de-0' + rnd(1, 9) + ' online'],
    () => ['', 'сигнатуры v4.2.' + rnd(10, 99) + ' обновлены'],
    () => ['y', 'задач в работе: ' + rnd(3, 41)],
    () => ['r', 'уровень GUEST: модули заблокированы'],
    () => ['g', 'маршрут через ' + ['tr', 'ae', 'kz', 'fi', 'sg'][rnd(0, 4)] + '-0' + rnd(1, 6) + ' ok']
  ];
  let last = -1;
  const pad = (n) => String(n).padStart(2, '0');
  const addLine = (typed) => {
    if (!log || document.hidden) return;
    let i;
    do { i = rnd(0, pool.length - 1); } while (i === last);
    last = i;
    const [cls, text] = pool[i]();
    const d = new Date();
    const li = document.createElement('li');
    const t = document.createElement('time');
    t.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    const s = document.createElement('span');
    if (cls) s.className = cls;
    li.append(t, s);
    log.appendChild(li);
    while (log.children.length > 9) log.firstElementChild.remove();
    if (!typed || reduce) { s.textContent = text; return; }
    let k = 0;
    const iv = setInterval(() => {
      k += 2;
      s.textContent = text.slice(0, k);
      if (k >= text.length) clearInterval(iv);
    }, 22);
  };
  for (let k = 0; k < 6; k++) addLine(false);
  const tick = () => { addLine(true); setTimeout(tick, rnd(900, 1700)); };
  setTimeout(tick, 2100);

  // Волна от нажатия
  const ripple = (el, e) => {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'rip';
    dot.style.left = (e.clientX - r.left) + 'px';
    dot.style.top = (e.clientY - r.top) + 'px';
    el.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  };
  document.querySelectorAll('.card, .chip, .item, .btn').forEach((el) => {
    el.addEventListener('pointerdown', (e) => ripple(el, e));
  });

  // Наклон карточки за пальцем или курсором и блик
  if (!reduce) {
    document.querySelectorAll('.card').forEach((card) => {
      const move = (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      };
      const reset = () => {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      };
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerdown', move);
      ['pointerleave', 'pointerup', 'pointercancel'].forEach((ev) => card.addEventListener(ev, reset));
    });
  }

  // Проверка доступа и отказ
  const dlg = $('#deny');
  const mod = $('#denyMod');
  const steps = $('#steps');
  const ok = $('#denyOk');
  const ghost = $('#ghost');
  let timers = [];
  let opener = null;
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const showDenied = () => {
    dlg.classList.add('denied');
    haptic('notify', 'error');
    ok.focus({ preventScroll: true });
  };

  const openDeny = (name, from) => {
    clearTimers();
    opener = from || null;
    haptic('impact', 'medium');
    mod.textContent = 'Модуль · ' + name;
    steps.textContent = '';
    dlg.classList.remove('denied', 'in');
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('in')));
    if (can('6.1')) { try { tg.BackButton.show(); } catch (e) {} }

    if (reduce) { showDenied(); return; }
    const seq = ['запрос к модулю', 'проверка ключа', 'уровень доступа: GUEST'];
    seq.forEach((txt, i) => {
      timers.push(setTimeout(() => {
        const li = document.createElement('li');
        li.textContent = txt;
        steps.appendChild(li);
        haptic('select');
      }, 240 + i * 300));
    });
    timers.push(setTimeout(showDenied, 240 + seq.length * 300 + 160));
  };

  const closeDeny = () => {
    clearTimers();
    if (!dlg.open) return;
    dlg.classList.remove('in');
    if (can('6.1')) { try { tg.BackButton.hide(); } catch (e) {} }
    setTimeout(() => {
      if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
      dlg.classList.remove('denied');
      if (ghost) ghost.setAttribute('aria-checked', 'false');
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    }, reduce ? 0 : 300);
  };

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDeny(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDeny(); });
  ok.addEventListener('click', closeDeny);
  if (can('6.1')) { try { tg.BackButton.onClick(closeDeny); } catch (e) {} }

  document.querySelectorAll('[data-mod]').forEach((el) => {
    el.addEventListener('click', () => {
      if (el === ghost) {
        ghost.setAttribute('aria-checked', 'true');
        haptic('select');
        timers.push(setTimeout(() => openDeny(el.dataset.mod, el), reduce ? 0 : 380));
        return;
      }
      openDeny(el.dataset.mod, el);
    });
  });
})();
