(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const $ = (s) => document.querySelector(s);
  let tg;
  const can = (v) => {
    try { return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast(v)); } catch (e) { return false; }
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BG = '#000000';

  const haptic = (kind, style) => {
    if (!can('6.1')) return;
    try {
      const h = tg.HapticFeedback;
      if (kind === 'impact') h.impactOccurred(style || 'medium');
      else if (kind === 'notify') h.notificationOccurred(style || 'error');
      else h.selectionChanged();
    } catch (e) {}
  };

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

  // Заставка при входе и появление экрана. Telegram SDK грузится отдельно и её не задерживает
  const boot = $('#boot');
  let shown = false;
  const show = () => {
    if (shown) return;
    shown = true;
    document.body.classList.add('shown');
    scramble($('#h1'), 750);
  };
  const hideBoot = () => {
    if (!boot || !boot.isConnected) { show(); return; }
    boot.classList.add('out');
    show();
    setTimeout(() => boot.remove(), 320);
  };
  // Время считаем от начала загрузки страницы: если страница грузилась долго,
  // часть заставки уже прошла на CSS-анимации
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
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; };
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

  // Окно модуля
  const dlg = $('#deny');
  const ok = $('#denyOk');
  const ghost = $('#ghost');
  let opener = null;

  // Режим администратора: только для одного Telegram ID (в коде лежит его хеш, а не сам ID)
  const ADMIN_HASH = 'e9a2b2551cd6398421740c418dc51a345affb6ba2832770ad5ec60403690d7ab';
  let admin = false;
  const studioButton = $('#studioBtn');
  const studioAccess = $('#studioAccess');
  const studioAccessState = $('#studioAccessState');
  const studioRetry = $('#studioRetry');
  const studioDialog = $('#studioDialog');
  const studioConfig = $('meta[name="studio-config"]');
  let studio;

  function studioAccessError(message, canRetry = true) {
    studioAccessState.textContent = message;
    studioRetry.hidden = !canRetry;
  }

  async function authorizeStudio(user, initData) {
    if (!user || studio || !studioConfig || !window.crypto?.subtle) return;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(user.id)));
    const ownerHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    if (ownerHash !== ADMIN_HASH) return;

    studioAccess.hidden = false;
    studioRetry.hidden = true;
    if (!initData) {
      studioAccessError('Telegram не передал данные входа. Открой Panel заново в чате с ботом.', false);
      return;
    }
    studioAccessState.textContent = 'Подключаем студию…';
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 10000);
    try {
      const response = await fetch(studioConfig.content, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: initData,
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        signal: abort.signal
      });
      if (response.status === 403) {
        studioAccessError('Telegram не подтвердил этот сеанс. Закрой окно и открой Panel заново.', false);
        return;
      }
      if (!response.ok) throw new Error('Studio request failed');
      const { scenes } = await response.json();
      if (!Array.isArray(scenes) || scenes.length !== 4) throw new Error('Invalid studio data');
      const { mountStudio } = await import(studioConfig.dataset.module);
      studio = mountStudio({
        button: studioButton,
        dialog: studioDialog,
        scenes,
        onVisibilityChange(isOpen) {
          if (!can('6.1')) return;
          try { if (isOpen) tg.BackButton.show(); else tg.BackButton.hide(); } catch (e) {}
        }
      });
      admin = true;
      document.body.classList.add('admin');
      $('#lvl').textContent = 'ROOT';
      studioButton.hidden = false;
      studioAccess.hidden = true;
    } catch {
      studioAccessError('Связь со студией прервалась.');
    } finally {
      clearTimeout(timeout);
    }
  }

  studioRetry.addEventListener('click', () => {
    studioRetry.hidden = true;
    authorizeStudio(tg?.initDataUnsafe?.user, tg?.initData).catch(() => studioAccessError('Связь со студией прервалась.'));
  });

  const demoScenes = {
    profile: new Set(['Пробив цели', 'Пробить по ID-номеру', 'Деанон по фото', 'Чтение переписки', 'Отслеживание онлайна']),
    network: new Set(['Сканер устройств рядом', 'Взлом Wi-Fi', 'Геолокация по номеру', 'Режим призрака', 'Подмена номера']),
    gallery: new Set(['Доступ к галерее через iCloud', 'Камеры наблюдения', 'Скрытые фото с камеры', 'Восстановление удалённого'])
  };
  const demoScene = (name) => Object.keys(demoScenes).find((kind) => demoScenes[kind].has(name))
    || (name.startsWith('Взлом ') ? 'profile' : 'report');

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const prices = {
    'Снести аккаунт Telegram': 12000,
    'Снести аккаунт WhatsApp': 12000,
    'Взлом Telegram': 15000,
    'Взлом WhatsApp': 15000,
    'Взлом Likee': 9000,
    'Взлом TikTok': 12000,
    'Взлом Instagram': 15000,
    'Взлом ВКонтакте': 13000,
    'Доступ к галерее через iCloud': 18000,
    'Пробить по ID-номеру': 6500,
    'Пробив цели': 6500,
    'Накрутка соцсетей': 5000,
    'База данных': 9000,
    'Сканер устройств рядом': 5000,
    'Режим призрака': 5000,
    'Перехват SMS и кодов': 20000,
    'Геолокация по номеру': 8000,
    'Удалённый доступ к телефону': 20000,
    'Обход двухфакторной защиты': 15000,
    'DDoS-атака': 20000,
    'Деанон по фото': 9500,
    'Взлом Wi-Fi': 7000,
    'Подмена номера': 6000,
    'Чтение переписки': 14000,
    'Прослушка звонков': 20000,
    'Восстановление удалённого': 5500,
    'Отслеживание онлайна': 5000,
    'Клон SIM-карты': 16000,
    'Камеры наблюдения': 11000,
    'Скрытые фото с камеры': 13000
  };
  const priceTag = (amount) => el('span', 'price', fmt(amount) + ' ₽');
  const modules = document.querySelectorAll('[data-mod]');
  modules.forEach((button) => {
    const host = button.querySelector('.row-txt, .item-txt, .radar-txt') || button;
    host.appendChild(priceTag(prices[button.dataset.mod]));
  });
  $('#h-probe').appendChild(priceTag(prices['Пробив цели']));

  const showDenied = () => {
    dlg.classList.add('denied');
    dlg.setAttribute('aria-labelledby', 'denyTitle');
    dlg.setAttribute('aria-describedby', 'denyMsg');
    haptic('notify', 'error');
  };
  const openModule = (name, from) => {
    haptic('impact', 'medium');
    if (admin && studio) {
      studio.open({ kind: demoScene(name), label: name, from });
      return;
    }
    opener = from || null;
    dlg.classList.remove('denied', 'in');
    showDenied();
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
    ok.focus({ preventScroll: true });
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('in')));
    if (can('6.1')) { try { tg.BackButton.show(); } catch (e) {} }
  };

  const closeDeny = () => {
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
    // Только живой юзернейм: латиница, цифры и _, без пробелов и эмодзи
    const clean = (s) => s.replace(/[^a-zA-Z0-9_@]/g, '').replace(/@(?=.)/g, (m, i) => i === 0 ? '@' : '').replace(/(?!^)@/g, '');
    // Правила юзернейма Telegram: 5–32 знака, начинается с буквы, не кончается на _, без двойных _
    const validFormat = (u) => /^[a-zA-Z][a-zA-Z0-9_]{3,30}[a-zA-Z0-9]$/.test(u) && u.indexOf('__') === -1;
    // Похоже ли на живой ник, а не на случайный набор букв и цифр
    const KBD = ['qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop', 'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl', 'zxc', 'xcv', 'cvb', 'vbn', 'bnm', 'poiu', 'lkjh', 'mnbv'];
    const DIGITS = ['1234', '2345', '3456', '4567', '5678', '6789', '7890', '0123', '9876', '8765', '7654', '6543', '5432', '4321', '3210'];
    const looksReal = (u) => {
      u = u.toLowerCase();
      const letters = u.replace(/[^a-z]/g, '');
      if (/^[0-9_]+$/.test(u)) return false;                       // только цифры и подчёркивания
      if (u.replace(/[^0-9]/g, '').length / u.length > 0.5) return false; // больше половины цифр
      if (/(.)\1\1/.test(u)) return false;                         // три одинаковых знака подряд
      if (DIGITS.some((k) => u.indexOf(k) !== -1)) return false;   // ряды цифр (1234)
      if (KBD.some((k) => letters.indexOf(k) !== -1)) return false; // клавиатурные ряды (qwe, asd, zxc)
      if (!/[aeiouy]/.test(letters) && letters.length > 5) return false; // длинные буквы без гласных — набор
      return true;
    };
    // true — можно пробивать; иначе возвращает текст ошибки
    const checkUser = (s) => {
      const u = s.replace(/^@/, '');
      if (!s) return 'Введите юзернейм цели, например @durov';
      if (!validFormat(u)) return 'Введите корректный юзернейм, например @durov';
      if (!looksReal(u)) return 'Это не похоже на юзернейм. Введите корректный юз';
      return true;
    };
    input.addEventListener('input', () => {
      const c = clean(input.value);
      if (c !== input.value) input.value = c;
      if (input.hasAttribute('aria-invalid')) { input.removeAttribute('aria-invalid'); hint.textContent = ''; }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (probing) return;
      if (admin && studio) {
        openModule('Пробив цели', go);
        return;
      }
      const v = input.value.trim();
      const check = checkUser(v);
      if (check !== true) {
        input.setAttribute('aria-invalid', 'true');
        hint.textContent = check;
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
      // Каждый запуск — свой набор строк, узлов и чисел
      const node = ['ru-07', 'nl-02', 'de-04', 'fi-03', 'sg-01', 'tr-06', 'kz-05'][rnd(0, 6)];
      const base = rnd(1200, 9800);
      const hit = rnd(2, 14);
      const linked = rnd(1, 9);
      const leaks = rnd(1, 6);
      const mid = [
        'поиск по открытым базам',
        'сверка номера и ника',
        'обход защиты базы ' + base,
        'анализ ' + rnd(3, 8) + ' источников',
        'geoip: запрос координат',
        'сопоставление аватаров'
      ];
      shuffle(mid);
      const okLines = [
        'совпадений найдено: ' + hit,
        'связанных аккаунтов: ' + linked,
        'утечек в базах: ' + leaks,
        'номеров телефона: ' + rnd(1, 3)
      ];
      shuffle(okLines);
      const stages = [
        [rnd(5, 11), 'подключение к узлу ' + node, ''],
        [rnd(16, 24), mid[0], ''],
        [rnd(30, 42), okLines[0], 'ok'],
        [rnd(48, 56), mid[1], ''],
        [rnd(60, 70), okLines[1], 'ok'],
        [rnd(74, 82), mid[2], ''],
        [rnd(84, 89), 'ключ администратора не найден', 'err']
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
            setTimeout(() => { probing = false; go.disabled = false; openModule('Пробив цели', go); }, 450);
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

  modules.forEach((button) => {
    button.addEventListener('click', () => {
      if (button === ghost) ghost.setAttribute('aria-checked', 'true');
      openModule(button.dataset.mod, button);
    });
  });

  // Баланс и пополнение
  let bal = 0;
  const balEls = [$('#balance'), $('#balance2')];
  const renderBalance = () => balEls.forEach((e) => { if (e) e.innerHTML = fmt(bal) + '&nbsp;₽'; });
  const walletBtn = $('#walletBtn');
  const wdlg = $('#wallet-dlg');
  let closeWalletFromBack;
  if (walletBtn && wdlg) {
    const depForm = $('#depForm');
    const depDone = $('#depDone');
    const depBtn = $('#depBtn');
    const depHint = $('#depHint');
    const amount = $('#amount');
    const pays = $('#pays');
    const sums = $('#sums');
    let wo = null;

    const openWallet = () => {
      wo = document.activeElement;
      depForm.hidden = false;
      depDone.hidden = true;
      depHint.textContent = '';
      amount.removeAttribute('aria-invalid');
      haptic('impact', 'light');
      if (typeof wdlg.showModal === 'function') { if (!wdlg.open) wdlg.showModal(); } else wdlg.setAttribute('open', '');
      requestAnimationFrame(() => requestAnimationFrame(() => wdlg.classList.add('in')));
      if (can('6.1')) { try { tg.BackButton.show(); } catch (e) {} }
    };
    const closeWallet = () => {
      if (!wdlg.open) return;
      wdlg.classList.remove('in');
      if (can('6.1')) { try { tg.BackButton.hide(); } catch (e) {} }
      setTimeout(() => {
        if (typeof wdlg.close === 'function') wdlg.close(); else wdlg.removeAttribute('open');
        if (wo && wo.isConnected) wo.focus({ preventScroll: true });
      }, reduce ? 0 : 300);
    };

    walletBtn.addEventListener('click', openWallet);
    wdlg.addEventListener('cancel', (e) => { e.preventDefault(); closeWallet(); });
    wdlg.addEventListener('click', (e) => { if (e.target === wdlg) closeWallet(); });
    closeWalletFromBack = closeWallet;
    $('#depClose').addEventListener('click', closeWallet);

    // Выбор способа оплаты
    pays.addEventListener('click', (e) => {
      const b = e.target.closest('.pay');
      if (!b) return;
      pays.querySelectorAll('.pay').forEach((p) => p.setAttribute('aria-checked', String(p === b)));
      haptic('select');
    });
    // Быстрые суммы
    sums.addEventListener('click', (e) => {
      const b = e.target.closest('.sum');
      if (!b) return;
      amount.value = b.dataset.sum;
      sums.querySelectorAll('.sum').forEach((s) => s.classList.toggle('on', s === b));
      amount.removeAttribute('aria-invalid');
      depHint.textContent = '';
      haptic('select');
    });
    amount.addEventListener('input', () => {
      const c = amount.value.replace(/[^0-9]/g, '').slice(0, 7);
      if (c !== amount.value) amount.value = c;
      sums.querySelectorAll('.sum').forEach((s) => s.classList.toggle('on', s.dataset.sum === c));
      if (amount.hasAttribute('aria-invalid')) { amount.removeAttribute('aria-invalid'); depHint.textContent = ''; }
    });

    depForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const sum = parseInt(amount.value, 10);
      if (!sum || sum < 100) {
        amount.setAttribute('aria-invalid', 'true');
        depHint.textContent = 'Введите сумму от 100 ₽';
        haptic('notify', 'warning');
        amount.focus();
        return;
      }
      const pay = (pays.querySelector('.pay[aria-checked="true"]') || {}).dataset || { pay: 'СБП' };
      depBtn.disabled = true;
      depBtn.textContent = 'Соединение с ' + (pay.pay || 'банком') + '…';
      haptic('impact', 'medium');
      setTimeout(() => {
        depBtn.disabled = false;
        depBtn.textContent = 'Пополнить';
        if (admin) {
          // Только на моём аккаунте баланс реально растёт (для записи видео)
          bal += sum;
          renderBalance();
          closeWallet();
          haptic('notify', 'success');
        } else {
          depForm.hidden = true;
          depDone.hidden = false;
          haptic('notify', 'error');
          $('#depClose').focus({ preventScroll: true });
        }
      }, reduce ? 0 : 1500);
    });
  }

  const initTelegram = () => {
    tg = window.Telegram && window.Telegram.WebApp;
    if (!tg) return;
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) {}
      if (can('6.1')) { try { tg.setHeaderColor(BG); tg.setBackgroundColor(BG); } catch (e) {} }
      if (can('7.10')) { try { tg.setBottomBarColor(BG); } catch (e) {} }
      if (can('7.7')) { try { tg.disableVerticalSwipes(); } catch (e) {} }
    }

    const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (u) {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
      $('#meName').textContent = name || (u.username ? '@' + u.username : 'Гость');
      $('#meId').textContent = 'ID ' + u.id + (u.username ? ' · @' + u.username : '');
      $('#ava').textContent = (name || u.username || 'X').charAt(0).toUpperCase();
    }

    authorizeStudio(u, tg.initData).catch(() => {});
    if (can('6.1')) {
      try {
        tg.BackButton.onClick(() => {
          if (studio && studio.close()) return;
          if (wdlg.open && closeWalletFromBack) closeWalletFromBack();
          else closeDeny();
        });
        if (dlg.open || wdlg.open) tg.BackButton.show();
      } catch (e) {}
    }
  };
  $('.app').removeAttribute('inert');
  if (window.Telegram && window.Telegram.WebApp) initTelegram();
  else $('#telegram-sdk').addEventListener('load', initTelegram, { once: true });
})();
