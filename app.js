(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const $ = (s) => document.querySelector(s);
  const tg = window.Telegram && window.Telegram.WebApp;
  const can = (v) => {
    try { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); } catch (e) { return false; }
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BG = '#000000';

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
    // на время перебора держим высоту, чтобы случайные широкие буквы не двигали экран
    el.style.height = el.offsetHeight + 'px';
    el.style.overflow = 'hidden';
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / ms);
      const fixed = Math.floor(p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) {
        out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = final; el.style.height = ''; el.style.overflow = ''; }
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
  const linkNode = $('#linkNode');
  setInterval(() => {
    if (document.hidden) return;
    const ms = (17 + Math.floor(Math.random() * 24)) + ' мс';
    if (ping) ping.textContent = ms;
    if (linkNode) linkNode.textContent = 'ru-07 · ' + ms;
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
  document.querySelectorAll('.card, .chip, .item, .btn, .probe-go').forEach((el) => {
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

  // Режим администратора: только для одного Telegram ID (в коде лежит его хеш, а не сам ID)
  const ADMIN_HASH = 'e9a2b2551cd6398421740c418dc51a345affb6ba2832770ad5ec60403690d7ab';
  let admin = false;
  const lvl = $('.lvl');
  const setAdmin = (on) => {
    admin = on;
    document.body.classList.toggle('admin', on);
    if (lvl) lvl.textContent = on ? 'ROOT' : 'GUEST';
  };
  if (u && window.crypto && crypto.subtle && window.TextEncoder) {
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(u.id))).then((buf) => {
      const hex = Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, '0')).join('');
      if (hex === ADMIN_HASH) setAdmin(true);
    }).catch(() => {});
  }
  // Запасной вход для записи видео: 5 быстрых нажатий на эмблему в шапке
  const embBtn = $('.top .emb');
  let taps = [];
  if (embBtn) {
    embBtn.addEventListener('click', () => {
      const now = Date.now();
      taps = taps.filter((t) => now - t < 2000);
      taps.push(now);
      if (taps.length >= 5) { taps = []; setAdmin(!admin); haptic('notify', admin ? 'success' : 'warning'); }
    });
  }

  // Что показывает каждый модуль администратору
  const L = (a) => ({ v: 'log', l: a });
  const RES = {
    'Снести аккаунт Telegram': { t: 'Аккаунт удалён', m: 'Аккаунт заблокирован и удалён из Telegram', ...L(['жалобы приняты: 1 240', 'статус: удалён', 'время: 02:41']) },
    'Снести аккаунт WhatsApp': { t: 'Номер отключён', m: 'WhatsApp на этом номере больше не работает', ...L(['номер заблокирован', 'резервные копии стёрты', 'время: 03:17']) },
    'Доступ к галерее через iCloud': { t: 'Галерея открыта', m: 'Фото: 2 418 · Видео: 312', v: 'gallery' },
    'Пробить по ID-номеру': { t: 'Человек найден', m: 'Профиль собран по ID', v: 'profile' },
    'Пробив цели': { t: 'Цель найдена', m: 'Профиль собран по открытым базам', v: 'profile' },
    'Накрутка соцсетей': { t: 'Накрутка запущена', m: 'Подписчики уже идут на аккаунт', v: 'counter', n: 10000, cap: 'подписчиков' },
    'База данных': { t: 'База подключена', m: 'Поиск по всем слитым базам', v: 'counter', n: 1284, cap: 'записей найдено' },
    'Сканер устройств рядом': { t: 'Подключено', m: 'Соединение с устройством установлено', ...L(['iPhone 15 Pro · −48 dBm', 'сопряжение: ok', 'файлы: доступны']) },
    'Режим призрака': { t: 'Режим призрака включён', m: 'Твой IP скрыт, следы входа стёрты', ...L(['VPN-цепочка: 3 узла', 'IP: скрыт', 'логи: очищены']) },
    'Перехват SMS и кодов': { t: 'Код перехвачен', m: 'Последнее SMS с кодом входа', ...L(['от: Telegram', 'код: 4•8•1', 'получено 12 сек назад']) },
    'Геолокация по номеру': { t: 'Телефон найден', m: 'Точность до 12 метров', v: 'geo' },
    'Удалённый доступ к телефону': { t: 'Телефон под контролем', m: 'Камера, микрофон и файлы доступны', ...L(['камера: on', 'микрофон: on', 'файлы: 14,2 ГБ']) },
    'Обход двухфакторной защиты': { t: '2FA отключена', m: 'Вход без второго кода выполнен', ...L(['сессия: открыта', 'уведомление: скрыто', 'устройство: доверенное']) },
    'DDoS-атака': { t: 'Атака запущена', m: 'Сайт перестал отвечать', v: 'counter', n: 40000, cap: 'ботов в атаке' },
    'Деанон по фото': { t: 'Человек найден', m: 'Совпадение лица 97%', v: 'profile' },
    'Взлом Wi-Fi': { t: 'Пароль подобран', m: 'Подключение к сети выполнено', ...L(['сеть: Home_5G', 'пароль: ••••••••••', 'подключено']) },
    'Подмена номера': { t: 'Номер подменён', m: 'Звонок и SMS пойдут с выбранного номера', ...L(['номер: +7 7•• ••• ••-00', 'статус: активен']) },
    'Чтение переписки': { t: 'Переписка открыта', m: 'Чаты загружены без входа в аккаунт', v: 'chat' },
    'Прослушка звонков': { t: 'Прослушка включена', m: 'Разговоры записываются в архив', ...L(['линия: подключена', 'запись: идёт', 'архив: 0 мин']) },
    'Восстановление удалённого': { t: 'Восстановлено', m: 'Стёртые данные вернулись', v: 'counter', n: 342, cap: 'сообщений и фото' },
    'Отслеживание онлайна': { t: 'Слежка включена', m: 'Пришлём уведомление, когда человек зайдёт в сеть', ...L(['последний раз: 4 мин назад', 'уведомления: on']) },
    'Клон SIM-карты': { t: 'SIM склонирована', m: 'Номер работает на твоём телефоне', ...L(['IMSI: скопирован', 'сеть: зарегистрирована', 'SMS: приходят тебе']) },
    'Камеры наблюдения': { t: 'Камеры подключены', m: 'Найдено 9 камер рядом', v: 'gallery' },
    'Скрытые фото с камеры': { t: 'Снимок сделан', m: 'Фото с фронтальной камеры загружено', v: 'gallery' }
  };
  const resultFor = (name) => {
    if (RES[name]) return RES[name];
    if (name.indexOf('Взлом ') === 0) {
      return { t: 'Доступ получен', m: 'Ты вошёл в аккаунт ' + name.slice(6) + '. Сессия открыта', v: 'chat' };
    }
    return { t: 'Готово', m: 'Модуль выполнен', ...L(['сессия: открыта', 'следы: стёрты']) };
  };

  const okTitle = $('#okTitle');
  const okMsg = $('#okMsg');
  const okVis = $('#okVis');
  const okBtn = $('#okBtn');
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Цены услуг (рубли). Минимум 4000. Показываются под каждой кнопкой и в окне покупки.
  const PRICE = {
    'Снести аккаунт Telegram': 12000, 'Снести аккаунт WhatsApp': 12000,
    'Взлом Telegram': 15000, 'Взлом WhatsApp': 15000, 'Взлом Likee': 9000, 'Взлом TikTok': 12000, 'Взлом Instagram': 15000, 'Взлом ВКонтакте': 13000,
    'Доступ к галерее через iCloud': 18000, 'Пробить по ID-номеру': 6500, 'Пробив цели': 6500,
    'Накрутка соцсетей': 4500, 'База данных': 9000,
    'Сканер устройств рядом': 4000, 'Режим призрака': 5000,
    'Перехват SMS и кодов': 20000, 'Геолокация по номеру': 8000, 'Удалённый доступ к телефону': 25000,
    'Обход двухфакторной защиты': 15000, 'DDoS-атака': 30000, 'Деанон по фото': 9500, 'Взлом Wi-Fi': 7000, 'Подмена номера': 6000,
    'Чтение переписки': 14000, 'Прослушка звонков': 22000, 'Восстановление удалённого': 5500, 'Отслеживание онлайна': 4000,
    'Клон SIM-карты': 16000, 'Камеры наблюдения': 11000, 'Скрытые фото с камеры': 13000
  };
  const priceStr = (name) => {
    let p = PRICE[name];
    if (!p && name.indexOf('Взлом ') === 0) p = 15000;
    return p ? fmt(p) + ' ₽' : '';
  };
  // Проставляю цену под каждой услугой
  document.querySelectorAll('[data-mod]').forEach((el2) => {
    const s = priceStr(el2.dataset.mod);
    if (!s || el2.classList.contains('chip')) return;
    const tag = el('span', 'price', s);
    const host = el2.querySelector('.row-txt, .item-txt, .radar-txt') || el2;
    host.appendChild(tag);
  });
  const buildVis = (r, extra) => {
    okVis.textContent = '';
    if (r.v === 'gallery') {
      const g = el('div', 'gal');
      for (let i = 0; i < 12; i++) g.appendChild(el('i'));
      okVis.appendChild(g);
    } else if (r.v === 'profile') {
      const p = el('dl', 'prof');
      const rows = [['Цель', extra || '@' + ['user', 'id'][rnd(0, 1)] + rnd(1000, 9999)], ['Имя', 'А•••••• К••••••'], ['Телефон', '+7 7•• ••• ••-' + rnd(10, 99)],
        ['Город', '••••••'], ['Соцсети', rnd(3, 6) + ' найдено'], ['Последний вход', rnd(2, 40) + ' мин назад']];
      rows.forEach(([k, v]) => { const d = el('div'); d.append(el('dt', '', k), el('dd', '', v)); p.appendChild(d); });
      okVis.appendChild(p);
    } else if (r.v === 'counter') {
      const big = el('p', 'cnt-big', '0');
      okVis.append(big, el('p', 'cap', r.cap || ''));
      const t0 = performance.now(); const dur = reduce ? 1 : 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        big.textContent = '+' + fmt(Math.round(r.n * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } else if (r.v === 'chat') {
      const c = el('div', 'chat');
      ['a', 'b', 'a', 'a', 'b'].forEach((side, i) => { const b = el('i', side === 'b' ? 'me' : ''); b.classList.add('w' + (i % 4)); c.appendChild(b); });
      okVis.appendChild(c);
    } else if (r.v === 'geo') {
      const g = el('div', 'geo');
      g.append(el('i', 'pin'), el('span', 'geo-cap', '43.2•••, 76.9••• · ±12 м'));
      okVis.appendChild(g);
    } else {
      const ul = el('ul', 'oklog');
      (r.l || []).forEach((line) => ul.appendChild(el('li', '', line)));
      okVis.appendChild(ul);
    }
  };

  const denyPrice = $('#denyPrice');
  const buyBtn = $('#buyBtn');
  const buyNote = $('#buyNote');
  const curName = { v: '' };
  const showDenied = () => {
    const s = priceStr(curName.v);
    buyNote.hidden = true;
    if (s) {
      denyPrice.hidden = false;
      denyPrice.querySelector('b').textContent = s;
      buyBtn.hidden = false;
      buyBtn.textContent = 'Купить доступ за ' + s;
    } else {
      denyPrice.hidden = true;
      buyBtn.hidden = true;
    }
    dlg.classList.add('denied');
    dlg.setAttribute('aria-labelledby', 'denyTitle');
    haptic('notify', 'error');
    (buyBtn.hidden ? ok : buyBtn).focus({ preventScroll: true });
  };
  const showGranted = (name, extra) => {
    const r = resultFor(name);
    okTitle.textContent = r.t;
    okMsg.textContent = r.m || '';
    buildVis(r, extra);
    dlg.classList.add('granted');
    dlg.setAttribute('aria-labelledby', 'okTitle');
    haptic('notify', 'success');
    okBtn.focus({ preventScroll: true });
  };

  const openDeny = (name, from, extra) => {
    clearTimers();
    opener = from || null;
    curName.v = name;
    const grant = admin;
    haptic('impact', 'medium');
    mod.textContent = 'Модуль · ' + name;
    steps.textContent = '';
    dlg.classList.remove('denied', 'granted', 'in');
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('in')));
    if (can('6.1')) { try { tg.BackButton.show(); } catch (e) {} }

    const finish = () => (grant ? showGranted(name, extra) : showDenied());
    if (reduce) { finish(); return; }
    const seq = grant
      ? ['запрос к модулю', 'проверка ключа', 'уровень доступа: ROOT', 'выполнение…']
      : ['запрос к модулю', 'проверка ключа', 'уровень доступа: GUEST'];
    seq.forEach((txt, i) => {
      timers.push(setTimeout(() => {
        const li = document.createElement('li');
        li.textContent = txt;
        steps.appendChild(li);
        haptic('select');
      }, 240 + i * 300));
    });
    timers.push(setTimeout(finish, 240 + seq.length * 300 + (grant ? 500 : 160)));
  };

  const closeDeny = () => {
    clearTimers();
    if (!dlg.open) return;
    const wasGrant = dlg.classList.contains('granted');
    dlg.classList.remove('in');
    if (can('6.1')) { try { tg.BackButton.hide(); } catch (e) {} }
    setTimeout(() => {
      if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
      dlg.classList.remove('denied', 'granted');
      if (ghost && !(wasGrant && opener === ghost)) ghost.setAttribute('aria-checked', 'false');
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    }, reduce ? 0 : 300);
  };

  buyBtn.addEventListener('click', () => {
    buyNote.hidden = false;
    denyPrice.hidden = true;
    buyBtn.hidden = true;
    haptic('impact', 'light');
    ok.textContent = 'Понятно';
    ok.focus({ preventScroll: true });
    buyNote.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  });

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDeny(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) closeDeny(); });
  ok.addEventListener('click', closeDeny);
  okBtn.addEventListener('click', closeDeny);
  if (can('6.1')) { try { tg.BackButton.onClick(closeDeny); } catch (e) {} }

  // Поиск цели: введённое никуда не отправляется, только показывается на экране
  const form = $('#probe');
  if (form) {
    const input = $('#target');
    const hint = $('#probeHint');
    const run = $('#probeRun');
    const plog = $('#probeLog');
    const bar = $('#probeBar');
    const pct = $('#probePct');
    const ptarget = $('#probeTarget');
    const go = form.querySelector('.probe-go');
    let probing = false;
    input.addEventListener('input', () => {
      if (input.hasAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); hint.textContent = ''; }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (probing) return;
      const v = input.value.trim();
      if (v.length < 3) {
        input.setAttribute('aria-invalid', 'true');
        hint.textContent = 'Введите ник, номер телефона или ID';
        haptic('notify', 'warning');
        input.focus();
        return;
      }
      probing = true;
      go.disabled = true;
      input.blur();
      run.hidden = false;
      run.classList.remove('fail');
      plog.textContent = '';
      ptarget.textContent = 'цель: ' + v;
      bar.style.transform = 'scaleX(0)';
      pct.textContent = '0%';
      const stages = [
        [8, 'подключение к узлу ru-07', ''],
        [21, 'поиск по открытым базам', ''],
        [37, 'совпадений найдено: ' + rnd(3, 9), 'ok'],
        [52, 'сверка номера и ника', ''],
        [66, 'связанных аккаунтов: ' + rnd(2, 6), 'ok'],
        [78, 'геоданные последней сессии…', ''],
        [83, 'ключ администратора не найден', 'err']
      ];
      const stepMs = reduce ? 120 : 520;
      stages.forEach(([p, txt, cls], i) => {
        setTimeout(() => {
          bar.style.transform = 'scaleX(' + (p / 100) + ')';
          pct.textContent = p + '%';
          const li = document.createElement('li');
          if (cls) li.className = cls;
          li.textContent = txt;
          plog.appendChild(li);
          haptic('select');
          if (i === stages.length - 1) {
            run.classList.add('fail');
            setTimeout(() => { probing = false; go.disabled = false; openDeny('Пробив цели', go, v); }, 450);
          }
        }, 300 + i * stepMs);
      });
    });
  }

  // Радар: устройства рядом
  const rNow = $('#radarNow');
  const rCount = $('#radarCount');
  const devs = ['iPhone 15 Pro · −48 dBm', 'Galaxy S24 · −61 dBm', 'AirPods Pro · −52 dBm', 'Redmi Note 13 · −70 dBm',
    'Wi-Fi «Home_5G» · −58 dBm', 'Apple Watch · −74 dBm', 'Smart TV · −66 dBm', 'iPhone 13 · −55 dBm'];
  let di = 0;
  setInterval(() => {
    if (document.hidden || !rNow) return;
    di = (di + 1) % devs.length;
    rNow.textContent = devs[di];
    if (rCount) rCount.textContent = String(rnd(6, 9));
  }, 1600);

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
