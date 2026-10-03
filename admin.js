(function () {
  'use strict';

  const D = window.DEFAULT_CONTENT, merge = window.mergeContent;
  const $ = (s, c = document) => c.querySelector(s);
  const KEY = 'kate_admin_token';
  let token = localStorage.getItem(KEY) || '';
  let S = null, dirty = false, section = 'site', frameReady = false, pendingHash = null;
  const OPEN = new WeakSet();

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e[k] = v;
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    kids.flat(9).forEach((c) => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }
  const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
  const uid = () => 'x' + Math.random().toString(36).slice(2, 8);
  const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '');

  let toastT;
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'on' + (err ? ' err' : '');
    clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, err ? 6000 : 2500);
  }

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
    let j = {}; try { j = await r.json(); } catch (e) { /* not json */ }
    if (!r.ok) {
      const err = new Error(j.error || (r.status === 404 ? 'API недоступно: запустите локальный сервер командой npm start' : 'Ошибка ' + r.status));
      err.status = r.status; throw err;
    }
    return j;
  }

  /* ---------- login ---------- */
  function showLogin(msg) {
    $('#app').classList.remove('on'); $('#login').style.display = 'grid';
    $('#lerr').textContent = msg || ''; $('#pw').focus();
  }
  $('#lf').onsubmit = async (e) => {
    e.preventDefault(); $('#lerr').textContent = '';
    try {
      const r = await api('/api/login', { method: 'POST', body: JSON.stringify({ password: $('#pw').value }) });
      token = r.token; localStorage.setItem(KEY, token); $('#pw').value = ''; boot();
    } catch (err) { $('#lerr').textContent = err.message; }
  };
  $('#btnOut').onclick = () => {
    if (dirty && !confirm('Есть неопубликованные изменения. Выйти без сохранения?')) return;
    localStorage.removeItem(KEY); token = ''; dirty = false; showLogin();
  };

  async function boot() {
    try { await api('/api/login'); } catch (e) { return showLogin(e.status === 401 || !token ? '' : e.message); }
    let stored = null;
    try { const r = await fetch('/api/content', { cache: 'no-store' }); const j = await r.json(); if (j && !j.empty) stored = j; } catch (e) { /* use defaults */ }
    S = merge(D, stored);
    S.home = S.home || {};
    for (const k of ['heroEnabled','heroImageEnabled','projectsEnabled','aboutEnabled']) if (S.home[k] == null) S.home[k] = true;
    $('#login').style.display = 'none'; $('#app').classList.add('on');
    setStatus(); renderSide(); render(); pushPreview.flush();
  }

  /* ---------- save ---------- */
  function setStatus(msg) {
    const el = $('#status');
    el.textContent = msg || (dirty ? 'Есть неопубликованные изменения' : 'Всё опубликовано');
    el.className = dirty && !msg ? 'dirty' : '';
  }
  const changed = () => { dirty = true; setStatus(); pushPreview(); };
  $('#btnSave').onclick = async () => {
    const b = $('#btnSave'); b.disabled = true; b.textContent = 'Публикую…';
    try {
      await api('/api/save', { method: 'POST', body: JSON.stringify({ content: S }) });
      dirty = false; setStatus('Опубликовано ✓ ' + new Date().toLocaleTimeString().slice(0, 5)); toast('Сайт обновлён');
    } catch (e) {
      if (e.status === 401) { showLogin('Сессия закончилась, войдите снова'); } else toast(e.message, true);
    } finally { b.disabled = false; b.textContent = 'Опубликовать'; }
  };
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- live preview ---------- */
  const frame = $('#frame');
  function post(msg) { try { frame.contentWindow.postMessage(msg, location.origin); } catch (e) { /* ignore */ } }
  const pushPreview = (() => {
    const f = () => { if (S && frameReady) post({ type: 'content', content: S }); };
    const d = debounce(f, 160); d.flush = f; return d;
  })();
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'ready') return;
    frameReady = true; pushPreview.flush();
    if (pendingHash) { post({ type: 'goto', hash: pendingHash }); }
  });
  function goPreview(hash) { pendingHash = hash; if (frameReady) setTimeout(() => post({ type: 'goto', hash }), 60); }
  document.querySelectorAll('.pvbar [data-d]').forEach((b) => b.onclick = () => {
    document.querySelectorAll('.pvbar [data-d]').forEach((x) => x.classList.toggle('on', x === b));
    $('#pvwrap').classList.toggle('phone', b.dataset.d === 'phone');
  });
  $('#btnPv').onclick = () => { document.body.classList.add('showpv'); };
  $('#btnPvClose').onclick = () => { document.body.classList.remove('showpv'); };

  /* ---------- form components ---------- */
  function field(label, obj, key, o = {}) {
    const inp = o.area ? h('textarea', { rows: o.rows || 3 }) : h('input', { type: o.type || 'text' });
    inp.value = obj[key] == null ? '' : obj[key];
    if (o.ph) inp.placeholder = o.ph;
    inp.oninput = () => { obj[key] = o.num ? +inp.value : inp.value; if (o.on) o.on(inp.value); changed(); };
    return h('label', { class: 'f' }, h('span', {}, label), inp, o.hint ? h('small', {}, o.hint) : null);
  }
  function linesField(label, obj, key, o = {}) {
    const ta = h('textarea', { rows: o.rows || 5 });
    ta.value = (obj[key] || []).join('\n');
    ta.oninput = () => { obj[key] = ta.value.split('\n').map((x) => x.trim()).filter(Boolean); changed(); };
    return h('label', { class: 'f' }, h('span', {}, label), ta, h('small', {}, 'Каждый пункт с новой строки'));
  }
  function select(label, obj, key, opts) {
    const s = h('select', {}, opts.map(([v, t]) => h('option', { value: v }, t)));
    s.value = obj[key] == null ? opts[0][0] : obj[key];
    s.onchange = () => { obj[key] = s.value; changed(); };
    return h('label', { class: 'f' }, h('span', {}, label), s);
  }
  function check(label, obj, key, o = {}) {
    const c = h('input', { type: 'checkbox' }); c.checked = !!obj[key];
    c.onchange = () => { obj[key] = c.checked; changed(); if (o.rerender) render(); };
    return h('label', { class: 'f', style: 'display:flex;gap:.5rem;align-items:center' }, c, h('span', { style: 'margin:0;color:inherit;font-size:14px' }, label));
  }
  function colorField(label, obj, key) {
    const c = h('input', { type: 'color' }); c.value = obj[key] || '#000000';
    c.oninput = () => { obj[key] = c.value; changed(); };
    return h('label', { class: 'f' }, h('span', {}, label), c);
  }
  const btn = (t, f, cls = '') => h('button', { class: 'btn sm ' + cls, type: 'button', onclick: (e) => { e.preventDefault(); e.stopPropagation(); f(e); } }, t);

  /* ---------- images ---------- */
  function compress(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader(); fr.onerror = () => rej(new Error('Не удалось прочитать файл'));
      fr.onload = () => {
        const im = new Image();
        im.onerror = () => rej(new Error('Не получилось открыть «' + file.name + '». Используйте JPG, PNG или WebP.'));
        im.onload = () => {
          let k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight)), q = 0.88;
          const c = document.createElement('canvas');
          const draw = () => {
            c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
            const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
            return c.toDataURL('image/jpeg', q);
          };
          let d = draw();
          while (d.length > 3.3e6 && (q > 0.5 || k > 0.4)) { if (q > 0.55) q -= 0.08; else k *= 0.85; d = draw(); }
          res(d);
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  async function uploadFile(file) {
    toast('Загружаю ' + file.name + '…');
    const data = await compress(file);
    const r = await api('/api/upload', { method: 'POST', body: JSON.stringify({ name: file.name, data }) });
    return r.url;
  }
  function pickFiles(multiple, cb) {
    const i = h('input', { type: 'file', accept: 'image/*', multiple: !!multiple });
    i.onchange = () => { const f = [...i.files]; if (f.length) cb(f); };
    i.click();
  }
  function imageField(label, obj, key, o = {}) {
    const th = h('div', { class: 'thumb' });
    const url = h('input', { type: 'text', placeholder: 'assets/photo.jpg или ссылка' });
    const msg = h('small', { class: 'msg' });
    const draw = () => { th.style.backgroundImage = obj[key] ? `url("${String(obj[key]).replace(/"/g, '%22')}")` : ''; th.classList.toggle('none', !obj[key]); url.value = obj[key] || ''; };
    url.oninput = () => { obj[key] = url.value.trim(); th.style.backgroundImage = obj[key] ? `url("${obj[key].replace(/"/g, '%22')}")` : ''; th.classList.toggle('none', !obj[key]); changed(); };
    draw();
    const up = btn('Загрузить фото', () => pickFiles(false, async (fs) => {
      msg.textContent = '';
      try { obj[key] = await uploadFile(fs[0]); draw(); changed(); toast('Фото загружено'); if (o.rerender) render(); }
      catch (e) { msg.textContent = e.message; toast(e.message, true); }
    }));
    const rm = btn('Убрать', () => { obj[key] = ''; draw(); changed(); if (o.rerender) render(); });
    return h('div', { class: 'imgf' }, th, h('div', { class: 'r' }, h('span', { style: 'font-size:12px;color:#7d786b' }, label), h('div', { class: 'row', style: 'gap:.4rem' }, up, rm), url, msg));
  }

  /* ---------- generic list with reorder ---------- */
  function keepScroll(fn) { const p = $('#panel'), y = p.scrollTop; fn(); p.scrollTop = y; }
  function list(arr, o) {
    const wrap = h('div', { class: 'list' });
    const re = () => keepScroll(render);
    arr.forEach((it, i) => {
      const d = h('details', { class: 'item' });
      d.open = OPEN.has(it) || !!o.alwaysOpen;
      d.addEventListener('toggle', () => { if (d.open) { OPEN.add(it); o.onOpen && o.onOpen(it, i); } else OPEN.delete(it); });
      const ops = h('span', { class: 'ops' },
        i > 0 ? btn('↑', () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; changed(); re(); }) : null,
        i < arr.length - 1 ? btn('↓', () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; changed(); re(); }) : null,
        o.noDelete ? null : btn('✕', () => { if (!o.confirm || confirm(o.confirm(it))) { const [gone] = arr.splice(i, 1); o.onDelete && o.onDelete(gone); changed(); re(); } }, 'danger'));
      d.append(h('summary', {}, h('span', { class: 'ttl' }, o.title(it, i) || '(без названия)'), ops), h('div', { class: 'ibody' }, o.body(it, i)));
      wrap.append(d);
    });
    if (o.make) wrap.append(h('div', {}, btn(o.addLabel || '+ Добавить', () => { const n = o.make(); arr.push(n); OPEN.add(n); changed(); re(); }, '')));
    return wrap;
  }

  /* ---------- sections ---------- */
  const SECTIONS = [
    ['site', 'Основное'], ['home', 'Главная'], ['about', 'Обо мне'], ['tools', 'Программы'], ['projects', 'Проекты и фото'],
    ['services', 'Услуги'], ['contact', 'Контакты'], ['pages', 'Новые вкладки'], ['menu', 'Меню'], ['ui', 'Подписи'], ['backup', 'Копия / сброс'],
  ];
  const PREVIEW_HASH = { site: '#/', home: '#/', about: '#/about', tools: '#/about', projects: '#/work', services: '#/services', contact: '#/contact', menu: '#/', ui: '#/work', backup: '#/', pages: null };

  function renderSide() {
    const s = $('#side'); s.innerHTML = '';
    SECTIONS.forEach(([id, t]) => s.append(h('button', { type: 'button', class: id === section ? 'on' : '', onclick: () => { section = id; renderSide(); render(); $('#panel').scrollTop = 0; const hs = PREVIEW_HASH[id]; if (hs) goPreview(hs); } }, t)));
  }

  const head = (t, lead) => [h('h2', {}, t), lead ? h('p', { class: 'lead' }, lead) : null];
  const rt = 'Подсказка: *слово* в звёздочках — курсив, новая строка — перенос.';

  const V = {
    site: () => [
      ...head('Основное', 'Название, логотип и подпись, которые видны на всех страницах.'),
      field('Логотип (текст в шапке)', S.site, 'logo'), field('Подпись под логотипом (подвал)', S.site, 'tagline'),
      field('Заголовок вкладки браузера', S.site, 'title'), field('Описание для Google', S.site, 'description', { area: 1 }), field('Год в подвале', S.site, 'year'),
      field('Подпись рядом с логотипом', S.site, 'headerSub'),
      field('Подпись / кредит внизу сайта', S.site, 'footerCredit'),
    ],
    home: () => [
      ...head('Главная страница', 'Здесь можно самостоятельно включать и выключать отдельные блоки главной страницы. После изменений нажмите «Опубликовать».'),
      h('h3', {}, 'Видимость блоков'),
      check('Показывать весь блок Hero', S.home, 'showHero', { rerender: true }),
      check('Показывать фото Hero', S.home, 'showHeroImage', { rerender: true }),
      check('Показывать блок проектов', S.home, 'showProjects', { rerender: true }),
      check('Показывать блок «Обо мне» на главной', S.home, 'showAbout', { rerender: true }),
      field('Надпись над заголовком', S.home, 'kicker'), field('Большой заголовок', S.home, 'title', { area: 1, rows: 4, hint: rt }),
      field('Подзаголовок', S.home, 'sub', { area: 1 }),
      h('h3', {}, 'Подписи Hero'),
      field('Кнопка «View work»', S.home, 'cta'), field('Кнопка «Get in touch»', S.home, 'cta2'),
      h('h3', {}, 'Блок проектов на главной'),
      field('Левая подпись («Scroll to explore»)', S.home, 'scrollLabel'),
      field('Правая подпись («Selected Work»)', S.home, 'featured'),
      h('h3', {}, 'Фото'), imageField('Фото справа на главной', S.home, 'heroImg'),
      imageField('Фото, которое «проявляется» под курсором (на компьютере)', S.home, 'revealImg'),
    ],
    about: () => [
      ...head('Обо мне', 'Вкладка About: ваше фото, рассказ о себе и список программ.'),
      imageField('Ваше фото', S.about, 'photo'),
      field('Заголовок вкладки', S.about, 'heading'), field('Маленькая подпись справа', S.about, 'tag'),
      field('Главная фраза о себе', S.about, 'statement', { area: 1, hint: rt }),
      field('Рассказ о себе', S.about, 'text', { area: 1, rows: 9, hint: 'Пустая строка между абзацами делит текст на абзацы.' }),
      field('Кнопка на главной («Больше обо мне»)', S.about, 'more'),
      h('h3', {}, 'Направления'), field('Заголовок списка', S.about, 'disciplinesTitle'), linesField('Список', S.about, 'disciplines'),
      h('h3', {}, 'Блок «Программы»'), field('Заголовок', S.about, 'toolsTitle'), field('Подпись справа', S.about, 'toolsTag'),
      h('p', { class: 'lead' }, 'Сами программы редактируются в разделе «Программы».'),
    ],
    tools: () => [
      ...head('Программы', 'Показываются на вкладке About плитками. Уровень 0 — полоска уровня скрыта.'),
      list(S.tools, {
        title: (t) => t.name, addLabel: '+ Добавить программу', confirm: (t) => `Удалить «${t.name}»?`,
        make: () => ({ name: 'Новая программа', mark: 'Np', bg: '#222222', fg: '#ffffff', level: 4 }),
        body: (t) => [
          field('Название', t, 'name'), field('Значок (1–2 буквы)', t, 'mark'),
          h('div', { class: 'row' }, colorField('Цвет плитки значка', t, 'bg'), colorField('Цвет букв', t, 'fg')),
          select('Уровень владения', t, 'level', [[0, 'Не показывать'], [1, '1 из 5'], [2, '2 из 5'], [3, '3 из 5'], [4, '4 из 5'], [5, '5 из 5']]),
        ],
      }),
    ],
    projects: () => [
      ...head('Проекты и фото', 'Каждый проект — карточка на сайте и отдельная страница с фото. Все фото проектов автоматически попадают в общую галерею «All works».'),
      list(S.projects, {
        title: (p, i) => `${String(i + 1).padStart(2, '0')} · ${p.t}`, addLabel: '+ Новый проект', confirm: (p) => `Удалить проект «${p.t}» вместе со списком фото?`,
        onOpen: (p) => goPreview('#/work/' + encodeURIComponent(p.id)),
        make: () => ({ id: uid(), t: 'NEW PROJECT', cat: 'Category', d: 'Description', theme: { bg: '#1a1a1a', fg: '#f2efe8', ac: '#c9c4b8', shape: 'rect', font: 'serif', atmosphere: 'plain' }, cover: '', images: [] }),
        body: (p) => {
          p.theme = p.theme || { bg: '#1a1a1a', fg: '#f2efe8', ac: '#c9c4b8', shape: 'rect', font: 'serif', atmosphere: 'plain' }; p.images = p.images || [];
          return [
            field('Номер проекта', p, 'num', { hint: 'Например: 01. Оставьте пустым — номер будет создан автоматически.' }),
            field('Название', p, 't'), field('Категория', p, 'cat'), field('Описание', p, 'd', { area: 1 }),
            imageField('Обложка (карточка проекта)', p, 'cover'),
            h('h3', {}, 'Оформление страницы проекта'),
            h('div', { class: 'row' }, colorField('Фон', p.theme, 'bg'), colorField('Текст', p.theme, 'fg'), colorField('Акцент', p.theme, 'ac')),
            h('div', { class: 'row' },
              select('Форма фото', p.theme, 'shape', [['rect', 'Прямоугольник'], ['arch', 'Арка'], ['oval', 'Овал'], ['soft', 'Мягкие углы'], ['flower', 'Цветок / scalloped']]),
              select('Шрифт заголовка', p.theme, 'font', [['serif', 'Serif'], ['italic', 'Serif курсив'], ['caps', 'Sans, разрядка']]),
              select('Атмосфера фона', p.theme, 'atmosphere', [['plain', 'Чистый цвет'], ['grain', 'Плёнка / зерно'], ['haze', 'Мягкая дымка'], ['dunes', 'Линии / дюны']])),
            h('h3', {}, `Фото проекта (${p.images.length})`),
            h('div', { class: 'row', style: 'margin-bottom:.6rem' }, btn('+ Загрузить сразу много фото', () => pickFiles(true, async (files) => {
              let n = 0;
              for (const f of files) {
                try { const u = await uploadFile(f); p.images.push({ src: u, alt: '', ty: 'full' }); if (!p.cover) p.cover = u; n++; changed(); }
                catch (e) { toast(e.message, true); break; }
              }
              if (n) { toast('Загружено фото: ' + n); keepScroll(render); }
            }))),
            list(p.images, {
              title: (im, i) => `${i + 1}. ${im.alt || (im.src || '').split('/').pop().slice(0, 30) || 'фото'}`, addLabel: '+ Добавить фото по ссылке / пустое', confirm: () => 'Удалить это фото из проекта?',
              make: () => ({ src: '', alt: '', ty: 'full' }),
              body: (im) => [
                imageField('Фото', im, 'src'),
                select('Как показывать', im, 'ty', [['full', 'Во всю ширину'], ['center', 'По центру, меньше'], ['row', 'Рядом с подписью']]),
                field('Описание фото (для поиска и подписи)', im, 'alt'),
                h('div', {}, field('Заголовок заметки (для «Рядом с подписью»)', im, 'nt'), field('Текст заметки', im, 'nd', { area: 1 }), check('Заметку показать справа', im, 'rev')),
              ],
            }),
          ];
        },
      }),
    ],
    services: () => [
      ...head('Услуги'), field('Заголовок', S.services, 'heading'), field('Подпись справа', S.services, 'tag'),
      list(S.services.items, {
        title: (s) => s.t, addLabel: '+ Добавить услугу', confirm: (s) => `Удалить «${s.t}»?`, make: () => ({ t: 'Новая услуга', d: 'Описание' }),
        body: (s) => [field('Название', s, 't'), field('Описание', s, 'd', { area: 1 })],
      }),
    ],
    contact: () => [
      ...head('Контакты'), field('Заголовок вкладки', S.contact, 'heading'), field('Подпись справа', S.contact, 'tag'),
      field('Большая фраза', S.contact, 'big', { area: 1, rows: 3, hint: rt }),
      h('h3', {}, 'Ссылки'), h('p', { class: 'lead' }, 'Почта: mailto:you@mail.com · Телефон: tel:+7… · Telegram: https://t.me/имя · Behance, Instagram и т.д.'),
      list(S.contact.links, {
        title: (l) => l.label, addLabel: '+ Добавить ссылку', confirm: (l) => `Удалить «${l.label}»?`, make: () => ({ label: 'Telegram', url: 'https://t.me/' }),
        body: (l) => [field('Текст', l, 'label'), field('Ссылка', l, 'url')],
      }),
    ],
    pages: () => [
      ...head('Новые вкладки', 'Создавайте любые дополнительные страницы (например, «Процесс», «Шоп», «Пресса»). Вкладка сразу появляется в меню.'),
      list(S.pages, {
        title: (p) => p.title, addLabel: '+ Новая вкладка', confirm: (p) => `Удалить вкладку «${p.title}»?`,
        onOpen: (p) => goPreview('#/page/' + encodeURIComponent(p.slug || p.id)),
        make: () => { const id = uid(); const p = { id, title: 'Новая вкладка', slug: id, tag: '', blocks: [{ type: 'text', text: 'Текст страницы' }] }; S.nav.push({ id: 'p:' + id, label: p.title, visible: true }); return p; },
        onDelete: (p) => { S.nav = S.nav.filter((n) => n.id !== 'p:' + p.id); },
        body: (p) => [
          field('Название', p, 'title', { on: (v) => { const n = S.nav.find((x) => x.id === 'p:' + p.id); if (n && (n.label === p._last || n.label === 'Новая вкладка' || !n.label)) n.label = v; p._last = v; } }),
          field('Адрес (латиницей)', p, 'slug', { hint: 'Например: process → сайт/#/page/process', on: (v) => { p.slug = slugify(v) || p.id; } }),
          field('Подпись справа от заголовка', p, 'tag'),
          h('h3', {}, 'Блоки страницы'),
          list(p.blocks, {
            title: (b) => ({ heading: 'Заголовок', text: 'Текст', image: 'Фото', gallery: 'Галерея', button: 'Кнопка' }[b.type] || b.type) + ': ' + String(b.text || b.label || b.caption || '').slice(0, 30),
            addLabel: '+ Добавить блок', make: () => ({ type: 'text', text: '' }),
            body: (b) => {
              const box = h('div');
              const draw = () => {
                box.innerHTML = '';
                box.append(select('Тип блока', b, 'type', [['heading', 'Заголовок'], ['text', 'Текст'], ['image', 'Одно фото'], ['gallery', 'Галерея фото'], ['button', 'Кнопка-ссылка']]));
                box.querySelector('select').addEventListener('change', () => { draw(); });
                if (b.type === 'heading') box.append(field('Текст заголовка', b, 'text'));
                else if (b.type === 'text') box.append(field('Текст', b, 'text', { area: 1, rows: 7 }));
                else if (b.type === 'image') box.append(imageField('Фото', b, 'src'), field('Подпись', b, 'caption'), field('Описание (alt)', b, 'alt'), select('Размер', b, 'width', [['full', 'Во всю ширину'], ['center', 'По центру']]));
                else if (b.type === 'gallery') {
                  b.images = b.images || [];
                  box.append(select('Колонок', b, 'cols', [[2, '2'], [3, '3']]),
                    h('div', { class: 'row', style: 'margin:.6rem 0' }, btn('+ Загрузить фото', () => pickFiles(true, async (files) => {
                      for (const f of files) { try { b.images.push({ src: await uploadFile(f), alt: '' }); changed(); } catch (e) { toast(e.message, true); break; } }
                      draw();
                    }))),
                    h('div', { class: 'gridimgs' }, b.images.map((im, i) => h('div', { class: 'thumb', style: `background-image:url("${String(im.src).replace(/"/g, '%22')}")` }, h('button', { class: 'btn sm danger', style: 'position:absolute;top:2px;right:2px;padding:0 .35rem', type: 'button', onclick: () => { b.images.splice(i, 1); changed(); draw(); } }, '✕')))));
                } else if (b.type === 'button') box.append(field('Текст кнопки', b, 'label'), field('Ссылка', b, 'url'));
              };
              draw(); return box;
            },
          }),
        ],
      }),
    ],
    menu: () => [
      ...head('Меню', 'Порядок и названия вкладок в шапке. Можно скрыть любую вкладку.'),
      list(S.nav, {
        alwaysOpen: true, noDelete: true, title: (n) => n.label + (n.visible === false ? ' (скрыта)' : ''),
        body: (n) => [field('Название в меню', n, 'label'), check('Показывать в меню', n, 'visible', { rerender: true })].map((x) => x),
      }),
    ],
    ui: () => [
      ...head('Все подписи сайта', 'Здесь собраны короткие надписи, которые используются в кнопках, навигации и блоках. Меняйте их без редактирования кода.'),
      h('h3', {}, 'Главная'),
      field('VIEW WORK / кнопка 1', S.home, 'cta'),
      field('GET IN TOUCH / кнопка 2', S.home, 'cta2'),
      field('SCROLL TO EXPLORE', S.home, 'scrollLabel'),
      field('SELECTED WORK', S.home, 'featured'),
      h('h3', {}, 'Шапка и подвал'),
      field('Логотип', S.site, 'logo'),
      field('DESIGN BY KATELY / подпись', S.site, 'headerSub'),
      field('Подпись в подвале', S.site, 'footerCredit'),
      h('h3', {}, 'Проекты'),
      field('VIEW CASE', S.ui, 'viewCase'),
      field('BACK TO WORK', S.ui, 'back'),
      field('NEXT PROJECT', S.ui, 'next'),
      h('h3', {}, 'Work'),
      field('Заголовок Work', S.work, 'heading'), field('Подпись справа', S.work, 'tag'), field('Заголовок галереи всех фото', S.work, 'allHeading'),
      field('Подпись галереи', S.work, 'allTag'), field('Кнопка «Все проекты»', S.work, 'allBtn'),
      h('h3', {}, 'Прочее'),
      field('Фильтр «Все»', S.ui, 'all'), field('Кнопка «Наверх»', S.ui, 'top'),
    ],
    backup: () => [
      ...head('Резервная копия и сброс'),
      h('div', { class: 'note' }, 'Публикация сохраняет сайт на локальном сервере. Копия — это файл на вашем компьютере: скачайте его перед большими правками.'),
      h('div', { class: 'row', style: 'flex-direction:column;align-items:flex-start' },
        btn('⬇ Скачать копию (JSON)', () => { const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' })), download: 'site-backup-' + new Date().toISOString().slice(0, 10) + '.json' }); document.body.append(a); a.click(); a.remove(); }),
        btn('⬆ Загрузить копию из файла', () => { const i = h('input', { type: 'file', accept: 'application/json' }); i.onchange = async () => { try { S = merge(D, JSON.parse(await i.files[0].text())); changed(); render(); toast('Копия загружена — нажмите «Опубликовать»'); } catch (e) { toast('Не удалось прочитать файл', true); } }; i.click(); }),
        btn('Сбросить всё к исходному виду', () => { if (confirm('Вернуть исходный контент? (после этого нужно нажать «Опубликовать»)')) { S = merge(D, {}); changed(); render(); } }, 'danger')),
      h('h3', {}, 'Пароль'), h('p', { class: 'lead' }, 'Пароль задаётся при запуске сервера через переменную ADMIN_PASSWORD. Например: ADMIN_PASSWORD="ваш-пароль" npm start.'),
    ],
  };

  function render() {
    const p = $('#panel'); p.innerHTML = '';
    p.append(...V[section]());
  }

  boot();
})();
