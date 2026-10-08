/* =========================================================
   Mumal Tour & Travels — interactions & animation
   ========================================================= */
(() => {
  'use strict';

  const D = window.MUMAL;
  const C = D.config;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGSAP && !reduceMotion;

  const icon = (id) => `<svg><use href="#i-${id}"/></svg>`;
  const vehicleById = (id) => D.vehicles.find((v) => v.id === id);
  const occasionById = (id) => BOOKING_OCCASIONS.find((o) => o.id === id);
  const waLink = (msg) => `https://wa.me/${C.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  const todayISO = (() => { const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); })();
  const fmtDate = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' }); };

  const QUICK = {
    coach: [['seat', 'Push-back'], ['tv', 'LED TV'], ['luggage', '40+ bags']],
    minibus: [['seat', 'Push-back'], ['music', 'Music'], ['luggage', 'Roof carrier']],
    urbania: [['seat', 'Recliners'], ['zap', 'USB per seat'], ['snow', 'Indiv. vents']],
    suv: [['seat', 'Captain seats'], ['luggage', '4 bags'], ['snow', 'Rear AC']],
    sedan: [['luggage', '3 bags'], ['gps', 'GPS tracked'], ['shield', 'Verified']],
  };
  const BOOKING_OCCASIONS = [
    ...D.occasions.map((o) => ({ id: o.id, title: o.title, icon: o.icon })),
    { id: 'family', title: 'Family function', icon: 'users' },
    { id: 'other', title: 'Other', icon: 'sparkle' },
  ];

  /* ---------------------------------------------------------
     Contact wiring
     --------------------------------------------------------- */
  $$('[data-tel]').forEach((a) => (a.href = 'tel:' + C.phone));
  $$('[data-wa]').forEach((a) => (a.href = waLink(`Hi ${C.brand}! I'd like to enquire about booking a vehicle.`)));
  $$('[data-mail]').forEach((a) => (a.href = 'mailto:' + C.email));
  $$('[data-phone-text]').forEach((e) => (e.textContent = C.phoneDisplay));
  $$('[data-mail-text]').forEach((e) => (e.textContent = C.email));
  $$('[data-address]').forEach((e) => (e.textContent = C.address));
  $$('[data-hours]').forEach((e) => (e.textContent = C.hours));
  $('#year').textContent = new Date().getFullYear();
  $('#footerMap').src = `https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&output=embed`;

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  }

  /* ---------------------------------------------------------
     Render: stats, fleet, occasions, footer, FAQ, reviews
     --------------------------------------------------------- */
  $('#stats').innerHTML = D.stats.map((s) => `
    <div class="stat"><strong data-count="${s.value}" data-suffix="${s.suffix}">${s.value.toLocaleString('en-IN')}${s.suffix}</strong><span>${s.label}</span></div>`).join('');

  const fleetGrid = $('#fleetGrid');
  fleetGrid.innerHTML = D.vehicles.map((v, i) => `
    <article class="v-card${i === 0 ? ' is-featured' : ''}" data-cat="${v.category}" data-id="${v.id}" data-tilt data-cursor="View">
      <div class="v-media">
        <img src="${v.img}" alt="${v.name}" loading="lazy" ${v.imgPos ? `style="object-position:${v.imgPos}"` : ''} />
        <div class="v-badges"><span class="v-chip">${icon('snow')}Full AC</span><span class="v-chip dark">${icon('users')}${v.seats} seats</span></div>
        ${i === 0 ? `<span class="v-ribbon">${icon('star')}Most booked</span>` : ''}
      </div>
      <div class="v-body">
        <p class="v-tag">${v.tag}</p>
        <h3>${v.name}</h3>
        ${i === 0 ? `<p class="v-blurb">${v.blurb}</p>` : ''}
        <ul class="v-feats">${(QUICK[v.id] || []).map(([i, t]) => `<li>${icon(i)}${t}</li>`).join('')}</ul>
        <div class="v-foot">
          <div class="v-ideal"><small>Ideal for</small><strong>${v.ideal.slice(0, 2).join(' · ')}</strong></div>
          <div class="v-actions">
            <button class="v-btn ghost" data-details="${v.id}">Details</button>
            <button class="v-btn solid" data-book="${v.id}">Book</button>
          </div>
        </div>
      </div>
      <span class="v-glare" aria-hidden="true"></span>
    </article>`).join('');

  const occTrack = $('#occTrack');
  occTrack.insertAdjacentHTML('beforeend', D.occasions.map((o, i) => `
    <article class="occ-panel">
      <div class="occ-img"><img src="${o.img}" alt="${o.title}" loading="lazy" /></div>
      <div class="occ-content">
        <span class="occ-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="occ-icon">${icon(o.icon)}</span>
        <p class="occ-kicker">${o.kicker}</p>
        <h3>${o.title}</h3>
        <p>${o.text}</p>
        <div class="occ-rec">${o.vehicles.map((id) => `<span>${vehicleById(id).name}</span>`).join('')}</div>
        <button class="btn btn-gold btn-sm" data-occasion="${o.id}">Plan this ${icon('arrow')}</button>
      </div>
    </article>`).join(''));

  $('#footerFleet').innerHTML = D.vehicles.map((v) => `<li><a href="#fleet" data-details="${v.id}">${v.name}</a></li>`).join('');
  $('#footerOcc').innerHTML = D.occasions.map((o) => `<li><a href="#book" data-occasion="${o.id}">${o.title}</a></li>`).join('');

  $('#faqList').innerHTML = D.faqs.map((f, i) => `
    <div class="faq-item${i === 0 ? ' is-open' : ''}">
      <button class="faq-q" aria-expanded="${i === 0}" aria-controls="faq-${i}" id="faq-q-${i}">${f.q}<span class="pm" aria-hidden="true"></span></button>
      <div class="faq-a" id="faq-${i}" role="region" aria-labelledby="faq-q-${i}"><div><p>${f.a}</p></div></div>
    </div>`).join('');
  $('#faqList').addEventListener('click', (e) => {
    const q = e.target.closest('.faq-q');
    if (!q) return;
    const item = q.parentElement;
    const open = !item.classList.contains('is-open');
    $$('.faq-item', $('#faqList')).forEach((it) => { it.classList.remove('is-open'); $('.faq-q', it).setAttribute('aria-expanded', 'false'); });
    if (open) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
    setTimeout(() => hasGSAP && ScrollTrigger.refresh(), 600);
  });

  /* ---------------------------------------------------------
     Decorative skyline (palace silhouettes)
     --------------------------------------------------------- */
  function skylineSVG({ w = 1600, h = 320, fill = '#120b0d', seed = 7, windows = true } = {}) {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const parts = [];
    const lights = [];
    let x = -10;
    while (x < w + 10) {
      const bw = 50 + rnd() * 120;
      const bh = h * (0.22 + rnd() * 0.42);
      const top = h - bh;
      parts.push(`<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${(bw + 1).toFixed(1)}" height="${bh.toFixed(1)}"/>`);
      // crenellations
      if (rnd() > 0.55) for (let cx = x + 4; cx < x + bw - 8; cx += 12) parts.push(`<rect x="${cx.toFixed(1)}" y="${(top - 6).toFixed(1)}" width="6" height="6"/>`);
      const domes = rnd() > 0.3 ? (bw > 110 ? 2 : 1) : 0;
      for (let k = 0; k < domes; k++) {
        const cx = x + bw * (domes === 1 ? 0.5 : k ? 0.76 : 0.24);
        const r = Math.min(bw * 0.17, 20) + rnd() * 6;
        const base = top - r * 0.95;
        parts.push(`<rect x="${(cx - r * 1.15).toFixed(1)}" y="${base.toFixed(1)}" width="${(r * 2.3).toFixed(1)}" height="${(r * 0.95).toFixed(1)}"/>`);
        parts.push(`<rect x="${(cx - r * 1.3).toFixed(1)}" y="${(base - 3).toFixed(1)}" width="${(r * 2.6).toFixed(1)}" height="3"/>`);
        parts.push(`<path d="M${(cx - r).toFixed(1)} ${(base - 3).toFixed(1)} C${(cx - r * 1.05).toFixed(1)} ${(base - r * 1.3).toFixed(1)} ${(cx - r * 0.2).toFixed(1)} ${(base - r * 1.25).toFixed(1)} ${cx.toFixed(1)} ${(base - r * 1.95).toFixed(1)} C${(cx + r * 0.2).toFixed(1)} ${(base - r * 1.25).toFixed(1)} ${(cx + r * 1.05).toFixed(1)} ${(base - r * 1.3).toFixed(1)} ${(cx + r).toFixed(1)} ${(base - 3).toFixed(1)}Z"/>`);
        parts.push(`<rect x="${(cx - 0.9).toFixed(1)}" y="${(base - r * 1.95 - 9).toFixed(1)}" width="1.8" height="9"/>`);
      }
      if (windows) {
        const rows = Math.floor(bh / 34);
        for (let r = 1; r < rows; r++) {
          for (let wx = x + 12; wx < x + bw - 14; wx += 22) {
            if (rnd() > 0.55) lights.push(`<path d="M${wx.toFixed(1)} ${(top + r * 30 + 14).toFixed(1)}v-8a4 4 0 0 1 8 0v8z"/>`);
          }
        }
      }
      x += bw;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMax slice"><g fill="${fill}">${parts.join('')}</g><g fill="#f3d68e" opacity=".32">${lights.join('')}</g></svg>`;
  }
  $('#pbSkyline').innerHTML = skylineSVG({ fill: '#120b0d', seed: 11 });
  $('#footerSkyline').innerHTML = skylineSVG({ h: 140, fill: '#120b0d', seed: 29, windows: false });

  /* ---------------------------------------------------------
     Fleet filters + card interactions
     --------------------------------------------------------- */
  const filterWrap = $('.fleet-filters');
  const glider = $('.chip-glider');
  function moveGlider() {
    const active = $('.chip.is-active', filterWrap);
    if (!active) return;
    glider.style.width = active.offsetWidth + 'px';
    glider.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  filterWrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b || b.classList.contains('is-active')) return;
    $$('[data-filter]', filterWrap).forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', String(x === b)); });
    moveGlider();
    const f = b.dataset.filter;
    const cards = $$('.v-card', fleetGrid);
    const apply = () => cards.forEach((c) => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
    if (animate) {
      gsap.to(cards, {
        opacity: 0, y: 16, duration: 0.22, stagger: 0.02, ease: 'power2.in',
        onComplete() {
          apply();
          const vis = cards.filter((c) => !c.classList.contains('is-hidden'));
          gsap.fromTo(vis, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'transform' });
          ScrollTrigger.refresh();
        },
      });
    } else apply();
  });

  document.addEventListener('click', (e) => {
    const det = e.target.closest('[data-details]');
    if (det) { e.preventDefault(); openModal(det.dataset.details); return; }
    const book = e.target.closest('[data-book]');
    if (book) { e.preventDefault(); startBooking({ vehicle: book.dataset.book }); return; }
    const occ = e.target.closest('[data-occasion]');
    if (occ) {
      e.preventDefault();
      const o = D.occasions.find((x) => x.id === occ.dataset.occasion);
      startBooking({ occasion: o.id, vehicle: o.vehicles[0], step: 1 });
      return;
    }
    const card = e.target.closest('.v-card');
    if (card) openModal(card.dataset.id);
  });

  /* ---------------------------------------------------------
     3D tilt
     --------------------------------------------------------- */
  function initTilt(el, max = 7) {
    if (!finePointer || reduceMotion) return;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.classList.add('is-tilting');
      el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }
  $$('[data-tilt]').forEach((el) => initTilt(el));

  /* ---------------------------------------------------------
     Smooth scroll (Lenis) + anchor links
     --------------------------------------------------------- */
  let lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis && animate) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  ['#vehicleModal .modal-panel', '#mobileMenu'].forEach((s) => $(s)?.setAttribute('data-lenis-prevent', ''));

  function scrollToEl(target, offset = -70) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.5 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-details') || a.hasAttribute('data-occasion')) return;
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    const t = $(id);
    if (!t) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(t, id === '#home' ? 0 : -70);
  });

  /* ---------------------------------------------------------
     Header, progress, back-to-top
     --------------------------------------------------------- */
  const header = $('#siteHeader');
  const progressBar = $('.scroll-progress span');
  const toTop = $('#toTop');
  const ttCircle = $('.tt-ring circle');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > 700 && !menuOpen);
    lastY = y;
    progressBar.style.transform = `scaleX(${p})`;
    toTop.classList.toggle('is-visible', y > innerHeight);
    ttCircle.style.strokeDashoffset = String(132 - 132 * p);
  }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => scrollToEl($('#home'), 0));

  // Mobile menu
  const menu = $('#mobileMenu');
  const menuBtn = $('#menuToggle');
  let menuOpen = false;
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = icon('menu');
    lenis?.start();
  }
  menuBtn.addEventListener('click', () => {
    if (menuOpen) return closeMenu();
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.innerHTML = icon('x');
    header.classList.remove('is-hidden');
    lenis?.stop();
  });

  /* ---------------------------------------------------------
     Custom cursor + magnetic buttons
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add('has-cursor');
    const cur = $('.cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    const label = $('.cursor-text');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px)`; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, label, select, input, .rm-node, .hotspot');
      if (lab && !hov) { label.textContent = lab.dataset.cursor; cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else { cur.classList.remove('is-label'); cur.classList.toggle('is-hover', !!hov); }
    });
    document.addEventListener('pointerleave', () => { cur.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { cur.style.opacity = '1'; });
  }
  if (finePointer && animate) {
    $$('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }
  $('#srCanvas').setAttribute('data-cursor', 'Drag');
  $('#ringStage').setAttribute('data-cursor', 'Drag');

  /* ---------------------------------------------------------
     Hero particles + mouse parallax
     --------------------------------------------------------- */
  (function heroParticles() {
    const c = $('#heroParticles');
    if (!c || reduceMotion) return;
    const ctx = c.getContext('2d');
    let w, h, running = true;
    const N = innerWidth < 700 ? 26 : 60;
    const parts = Array.from({ length: N }, () => ({}));
    const spawn = (p, init) => {
      p.x = Math.random() * w; p.y = init ? Math.random() * h : h + 10;
      p.r = Math.random() * 1.8 + 0.4; p.vy = -(Math.random() * 0.35 + 0.08); p.vx = (Math.random() - 0.5) * 0.18;
      p.a = Math.random() * 0.55 + 0.2; p.t = Math.random() * 6.28;
    };
    function resize() {
      const dpr = Math.min(devicePixelRatio, 2);
      w = c.offsetWidth; h = c.offsetHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    parts.forEach((p) => spawn(p, true));
    window.addEventListener('resize', resize);
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) draw(); }).observe(c);
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.t += 0.02;
        if (p.y < -10) spawn(p, false);
        const a = p.a * (0.55 + 0.45 * Math.sin(p.t));
        if (p.r > 1.5) { ctx.fillStyle = `rgba(243,214,142,${a * 0.18})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill(); }
        ctx.fillStyle = `rgba(255,230,170,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  if (finePointer && animate) {
    const hero = $('.hero');
    const floats = $$('.float-card').map((el) => ({ el, d: +el.dataset.depth, x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3.out' }) }));
    const mediaX = gsap.quickTo('.hero-img', 'x', { duration: 1.4, ease: 'power3.out' });
    const mediaY = gsap.quickTo('.hero-img', 'y', { duration: 1.4, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      floats.forEach((f) => { f.x(nx * f.d * 1.4); f.y(ny * f.d); });
      mediaX(nx * -24); mediaY(ny * -14);
    });
  }

  /* ---------------------------------------------------------
     Quick-book (hero)
     --------------------------------------------------------- */
  $('#qbVehicle').innerHTML = `<option value="">Any — suggest for me</option>` + D.vehicles.map((v) => `<option value="${v.id}">${v.name}</option>`).join('');
  $('#qbOccasion').innerHTML = BOOKING_OCCASIONS.map((o) => `<option value="${o.id}">${o.title}</option>`).join('');
  $('#qbDate').min = todayISO;
  $('#quickBook').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#qbVehicle').value;
    startBooking({ vehicle: v || 'suggest', occasion: $('#qbOccasion').value, date: $('#qbDate').value, guests: $('#qbGuests').value, step: 2 });
  });

  /* ---------------------------------------------------------
     Vehicle modal
     --------------------------------------------------------- */
  const modal = $('#vehicleModal');
  let lastFocus = null;
  function openModal(id) {
    const v = vehicleById(id);
    if (!v) return;
    lastFocus = document.activeElement;
    $('#mdTag').textContent = v.tag;
    $('#mdName').textContent = v.name;
    $('#mdBlurb').textContent = v.blurb;
    $('#mdIdeal').innerHTML = v.ideal.map((t) => `<span>${t}</span>`).join('');
    $('#mdSpecs').innerHTML = Object.entries(v.specs).map(([k, val]) => `<div><dt>${k}</dt><dd>${val}</dd></div>`).join('');
    $('#mdFeats').innerHTML = v.features.map((f) => `<li>${icon('check')}${f}</li>`).join('');
    $('#mdIncluded').innerHTML = `<p>Included with every booking</p>
      <div>${[['driver', 'Trained driver'], ['snow', 'Full-time AC'], ['gps', 'GPS tracked'], ['support', '24×7 support']].map(([i, t]) => `<span>${icon(i)}${t}</span>`).join('')}</div>`;
    const img = $('#mdImg');
    const setImg = (src, pos) => { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; img.src = src; img.alt = v.name; img.style.objectPosition = pos || ''; };
    setImg(v.gallery[0], v.imgPos);
    $('#mdThumbs').innerHTML = v.gallery.map((g, i) => `<button class="${i === 0 ? 'is-active' : ''}" data-i="${i}" aria-label="Show photo ${i + 1}"><img src="${g}" alt="" loading="lazy" ${i === 0 && v.imgPos ? `style="object-position:${v.imgPos}"` : ''}/></button>`).join('');
    $('#mdThumbs').onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      $$('button', $('#mdThumbs')).forEach((x) => x.classList.toggle('is-active', x === b));
      setImg(v.gallery[+b.dataset.i], +b.dataset.i === 0 ? v.imgPos : '');
    };
    $('#mdBook').onclick = () => { closeModal(); startBooking({ vehicle: v.id }); };
    $('#mdWa').href = waLink(`Hi ${C.brand}! I'd like a quote for the ${v.name} (${v.tag}).`);
    $('.md-info', modal).scrollTop = 0;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenis?.stop();
    setTimeout(() => $('.modal-close', modal).focus(), 60);
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lenis?.start();
    lastFocus?.focus?.({ preventScroll: true });
  }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeMenu(); }
    if (e.key === 'Tab' && modal.classList.contains('is-open')) {
      const f = $$('button, a[href], input, select, textarea', modal).filter((x) => x.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------------------------------------------------
     3D showroom panel (scene lives in showroom3d.js)
     --------------------------------------------------------- */
  let srCurrent = 'coach';
  function renderShowroomInfo(id) {
    const v = vehicleById(id);
    const info = $('#srInfo');
    $('#srTag').textContent = v.tag;
    $('#srName').textContent = v.name;
    $('#srBlurb').textContent = v.blurb;
    $('#srQuick').innerHTML = `
      <div><strong>${v.seats}</strong><span>Seats</span></div>
      <div><strong>GPS</strong><span>Tracked</span></div>
      <div><strong>100%</strong><span>AC cabin</span></div>`;
    $('#srFeats').innerHTML = v.features.slice(0, 4).map((f) => `<li>${icon('check')}${f}</li>`).join('');
    $('#srIdeal').innerHTML = v.ideal.map((t) => `<span>${t}</span>`).join('');
    info.classList.remove('is-swapping');
    void info.offsetWidth;
    info.classList.add('is-swapping');
  }
  renderShowroomInfo(srCurrent);
  $('.sr-tabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-model]');
    if (!t || t.dataset.model === srCurrent) return;
    srCurrent = t.dataset.model;
    $$('.sr-tab').forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', String(x === t)); });
    renderShowroomInfo(srCurrent);
    window.MumalShowroom?.show(srCurrent);
  });
  $('.sr-controls').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sr]');
    if (!b) return;
    const on = !b.classList.contains('is-on');
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
    if (b.dataset.sr === 'lights') $('#srStage').classList.toggle('is-night', on);
    window.MumalShowroom?.set(b.dataset.sr, on);
  });
  $('#srBook').addEventListener('click', () => startBooking({ vehicle: srCurrent }));
  $('#srDetails').addEventListener('click', () => openModal(srCurrent));

  /* ---------------------------------------------------------
     Routes map
     --------------------------------------------------------- */
  const HOME = { x: 241.5, y: 366.7 };
  const map = $('#routeMap');
  const mapCard = $('#mapCard');
  const routes = D.routes.outstation;
  (function buildMap() {
    const routePaths = routes.map((r, i) => {
      const mx = (HOME.x + r.x) / 2, my = (HOME.y + r.y) / 2;
      const dx = r.x - HOME.x, dy = r.y - HOME.y;
      const k = (i % 2 ? 1 : -1) * 0.18;
      const cx = mx - dy * k, cy = my + dx * k;
      const d = `M${HOME.x} ${HOME.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${r.x} ${r.y}`;
      return `<path class="rm-route" data-route="${r.id}" d="${d}"/><path class="rm-flow" data-flow="${r.id}" d="${d}"/>`;
    }).join('');
    const nodes = routes.map((r) => `
      <g class="rm-node" data-route="${r.id}" tabindex="0" role="button" aria-label="${r.name}, ${r.km} km from Udaipur">
        <circle class="halo" cx="${r.x}" cy="${r.y}" r="16"/>
        <circle class="core" cx="${r.x}" cy="${r.y}" r="6"/>
        <text x="${r.x + r.lx}" y="${r.y + r.ly}" text-anchor="${r.anchor || 'start'}">${r.name}</text>
        <text class="km" x="${r.x + r.lx}" y="${r.y + r.ly + 14}" text-anchor="${r.anchor || 'start'}">${r.km} km</text>
      </g>`).join('');
    map.innerHTML = `
      <defs>
        <pattern id="rmDots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" class="rm-dot"/></pattern>
        <radialGradient id="rmFade" cx="45%" cy="55%" r="60%"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
        <mask id="rmMask"><rect width="620" height="640" fill="url(#rmFade)"/></mask>
        <path id="ridgePath" d="M60 470 C150 380 200 290 290 230 S440 130 540 80"/>
      </defs>
      <rect width="620" height="640" fill="url(#rmDots)" mask="url(#rmMask)"/>
      <use href="#ridgePath" class="rm-ridge"/>
      <text class="rm-ridge-label" dy="-14"><textPath href="#ridgePath" startOffset="42%">ARAVALLI RANGE</textPath></text>
      <text x="330" y="215" class="rm-ridge-label" style="font-size:24px;letter-spacing:.32em;opacity:.5">RAJASTHAN</text>
      <text x="60" y="520" class="rm-ridge-label" style="font-size:20px;letter-spacing:.35em;opacity:.5">GUJARAT</text>
      <g transform="translate(570 590)"><circle r="20" fill="none" stroke="rgba(42,29,33,.2)"/><path d="M0 -15 L5 2 L0 -2 L-5 2Z" fill="#6d1426"/><text class="rm-compass" y="-24" text-anchor="middle">N</text></g>
      <g class="rm-routes">${routePaths}</g>
      <g class="rm-nodes">${nodes}</g>
      <g class="rm-home">
        <circle class="pulse" cx="${HOME.x}" cy="${HOME.y}" r="12"/>
        <circle class="pulse" cx="${HOME.x}" cy="${HOME.y}" r="12"/>
        <circle class="core" cx="${HOME.x}" cy="${HOME.y}" r="10"/>
        <text x="${HOME.x + 4}" y="${HOME.y + 36}" text-anchor="middle">Udaipur</text>
      </g>`;
  })();

  let activeRoute = null;
  function setRoute(id) {
    activeRoute = id;
    $$('.rm-route, .rm-node', map).forEach((el) => el.classList.toggle('is-active', el.dataset.route === id));
    $$('.rm-flow', map).forEach((el) => el.classList.toggle('is-active', el.dataset.flow === id));
    $$('.route-item').forEach((el) => el.classList.toggle('is-active', el.dataset.route === id));
    const r = routes.find((x) => x.id === id);
    if (!r) { mapCard.classList.remove('is-visible'); return; }
    mapCard.innerHTML = `<small>${r.note}</small><strong>Udaipur → ${r.name}</strong><div class="mc-row"><span><b>${r.km} km</b> one way</span><span><b>${r.time}</b> drive</span></div>`;
    const box = map.getBoundingClientRect();
    const host = map.parentElement.getBoundingClientRect();
    const sc = box.width / 620;
    let left = box.left - host.left + r.x * sc + 18;
    let top = box.top - host.top + r.y * sc - 30;
    mapCard.classList.add('is-visible');
    const cw = mapCard.offsetWidth, ch = mapCard.offsetHeight;
    if (left + cw > host.width - 10) left = box.left - host.left + r.x * sc - cw - 18;
    left = Math.max(10, Math.min(left, host.width - cw - 10));
    top = Math.max(10, Math.min(top - ch / 2, host.height - ch - 10));
    mapCard.style.left = left + 'px';
    mapCard.style.top = top + 'px';
  }
  map.addEventListener('pointerover', (e) => { const n = e.target.closest('.rm-node'); if (n) setRoute(n.dataset.route); });
  map.addEventListener('pointerleave', () => setRoute(null));
  map.addEventListener('click', (e) => {
    const n = e.target.closest('.rm-node');
    if (!n) return;
    const r = routes.find((x) => x.id === n.dataset.route);
    startBooking({ drop: r.name, tripType: 'Outstation', step: 1 });
  });
  map.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.closest('.rm-node')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  map.addEventListener('focusin', (e) => { const n = e.target.closest('.rm-node'); if (n) setRoute(n.dataset.route); });

  const routeList = $('#routeList');
  function renderRouteList(kind) {
    const list = D.routes[kind];
    routeList.innerHTML = list.map((r) => kind === 'outstation'
      ? `<li><button class="route-item" data-route="${r.id}" data-dest="${r.name}" data-kind="outstation"><div><strong>${r.name}</strong><small>${r.note}</small></div><span class="rk">${r.km} km</span><span class="rt">${r.time}</span>${icon('arrow')}</button></li>`
      : `<li><button class="route-item" data-dest="${r.name}" data-kind="local"><div><strong>${r.name}</strong></div><span class="rk">${r.km}</span><span class="rt">${r.time}</span>${icon('arrow')}</button></li>`).join('');
    if (animate) gsap.from($$('li', routeList), { opacity: 0, x: -20, duration: 0.5, stagger: 0.04, ease: 'power2.out' });
  }
  renderRouteList('outstation');
  $('.route-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-routes]');
    if (!b || b.classList.contains('is-active')) return;
    $$('[data-routes]').forEach((x) => x.classList.toggle('is-active', x === b));
    renderRouteList(b.dataset.routes);
    setRoute(null);
  });
  routeList.addEventListener('pointerover', (e) => { const b = e.target.closest('.route-item[data-route]'); if (b) setRoute(b.dataset.route); });
  routeList.addEventListener('pointerleave', () => setRoute(null));
  routeList.addEventListener('click', (e) => {
    const b = e.target.closest('.route-item');
    if (!b) return;
    startBooking({ drop: b.dataset.dest, tripType: b.dataset.kind === 'local' ? 'Local (within Udaipur)' : 'Outstation', step: 1 });
  });

  /* ---------------------------------------------------------
     Vehicle finder — recommends a vehicle (and how many) for a group
     --------------------------------------------------------- */
  const fd = { guests: 20, trip: 'Local (within Udaipur)', comfort: 'classic', pick: null };
  const countFor = (v, g) => Math.max(1, Math.ceil(g / v.seats));
  function recommend(g, trip, comfort) {
    const premium = comfort === 'premium';
    if (g <= 4) return premium || trip === 'Outstation' ? 'suv' : 'sedan';
    if (g <= 7) return 'suv';
    if (g <= 17) return 'urbania';
    if (g <= 26) return premium ? 'urbania' : 'minibus';
    return 'coach';
  }
  function renderFinder(animateIn = true) {
    const g = fd.guests;
    const auto = recommend(g, fd.trip, fd.comfort);
    const v = vehicleById(fd.pick || auto);
    const n = countFor(v, g);
    const alts = D.vehicles
      .filter((x) => x.id !== v.id && countFor(x, g) <= 3 && x.seats <= Math.max(g * 3, 10))
      .sort((p, q) => countFor(p, g) - countFor(q, g) || q.seats - p.seats)
      .slice(0, 3);
    const tripNote = { 'Outstation': 'comfortable for long highway drives', 'Airport / Railway transfer': 'with room for everyone’s luggage' }[fd.trip] || 'easy around Udaipur’s lanes and lakes';
    $('#fdResult').innerHTML = `
      <div class="fd-media">
        <img src="${v.img}" alt="${v.name}" ${v.imgPos ? `style="object-position:${v.imgPos}"` : ''} />
        ${n > 1 ? `<span class="fd-count">× ${n}</span>` : ''}
      </div>
      <div class="fd-info">
        <small>${fd.pick && fd.pick !== auto ? 'Your choice' : 'Recommended for you'}</small>
        <h3>${v.name}${n > 1 ? ` <em>× ${n}</em>` : ''}</h3>
        <p>${n > 1 ? `${n} vehicles seat your ${g} guests` : `Seats your group of ${g} comfortably`} — ${tripNote}.</p>
        ${alts.length ? `<div class="fd-alt"><span>Also works:</span>${alts.map((x) => `<button type="button" data-fd-pick="${x.id}">${x.name}${countFor(x, g) > 1 ? ` × ${countFor(x, g)}` : ''}</button>`).join('')}${fd.pick && fd.pick !== auto ? `<button type="button" data-fd-pick="">↺ Best match</button>` : ''}</div>` : ''}
        <div class="fd-actions">
          <button type="button" class="btn btn-gold btn-sm" data-fd-book>Book this ride ${icon('arrow')}</button>
          <button type="button" class="btn btn-ghost btn-sm" data-details="${v.id}">Details</button>
        </div>
      </div>`;
    if (animate && animateIn) gsap.fromTo($$('#fdResult .fd-media, #fdResult .fd-info > *'), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' });
  }
  function paintRange(input) { input.style.setProperty('--p', ((input.value - input.min) / (input.max - input.min)) * 100 + '%'); }
  const fdGuests = $('#fdGuests');
  let lastRec = null;
  fdGuests.addEventListener('input', () => {
    fd.guests = +fdGuests.value;
    $('#fdGuestsVal').textContent = fd.guests + (fd.guests === 1 ? ' guest' : ' guests');
    paintRange(fdGuests);
    const rec = recommend(fd.guests, fd.trip, fd.comfort) + countFor(vehicleById(fd.pick || recommend(fd.guests, fd.trip, fd.comfort)), fd.guests);
    renderFinder(rec !== lastRec);
    lastRec = rec;
  });
  const segPick = (sel, key) => $(sel).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$(sel + ' button').forEach((x) => x.classList.toggle('is-active', x === b));
    fd[key] = b.dataset[key];
    fd.pick = null;
    renderFinder();
  });
  segPick('#fdTrip', 'trip');
  segPick('#fdComfort', 'comfort');
  $('#fdResult').addEventListener('click', (e) => {
    const p = e.target.closest('[data-fd-pick]');
    if (p) { fd.pick = p.dataset.fdPick || null; renderFinder(); return; }
    if (e.target.closest('[data-fd-book]')) {
      startBooking({ vehicle: fd.pick || recommend(fd.guests, fd.trip, fd.comfort), guests: fd.guests, tripType: fd.trip, step: 2 });
    }
  });
  paintRange(fdGuests);
  renderFinder(false);

  /* ---------------------------------------------------------
     Booking wizard
     --------------------------------------------------------- */
  const form = $('#bookingForm');
  const fld = (n) => form.elements.namedItem(n);
  let step = 1;
  let tripType = 'Local (within Udaipur)';

  $('#bfVehicles').innerHTML = D.vehicles.map((v) => `
    <label class="bf-v"><input type="radio" name="vehicle" value="${v.id}"/>
      <img src="${v.img}" alt="" loading="lazy" ${v.imgPos ? `style="object-position:${v.imgPos}"` : ''}/>
      <div><strong>${v.name}</strong><small>${v.tag}</small></div>
      <span class="tick">${icon('check')}</span>
    </label>`).join('') + `
    <label class="bf-v"><input type="radio" name="vehicle" value="suggest"/>
      <span class="bf-v-icon">${icon('sparkle')}</span>
      <div><strong>Not sure?</strong><small>Suggest the best fit for my group</small></div>
      <span class="tick">${icon('check')}</span>
    </label>`;
  $('#bfOccasions').innerHTML = BOOKING_OCCASIONS.map((o) => `<label class="bf-chip"><input type="radio" name="occasion" value="${o.id}"/><span>${icon(o.icon)}${o.title}</span></label>`).join('');
  $('#bfAddons').innerHTML = D.addons.map((a) => `<label class="toggle"><input type="checkbox" name="addons" value="${a.id}"/><span class="tk">${icon('check')}</span>${a.label}</label>`).join('');
  fld('date').min = todayISO;
  fld('returnDate').min = todayISO;

  function setTripType(t) {
    tripType = t;
    $$('#bfTripType button').forEach((b) => b.classList.toggle('is-active', b.dataset.trip === t));
    $('.bf-return').hidden = t !== 'Outstation';
  }
  $('#bfTripType').addEventListener('click', (e) => { const b = e.target.closest('[data-trip]'); if (b) setTripType(b.dataset.trip); });
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step-btn]');
    if (!b) return;
    const g = fld('guests');
    g.value = Math.max(1, Math.min(500, (+g.value || 0) + +b.dataset.stepBtn * (e.shiftKey ? 10 : 1)));
  });
  fld('date').addEventListener('change', () => { fld('returnDate').min = fld('date').value || todayISO; });

  function goStep(n) {
    step = n;
    $$('.bf-step', form).forEach((s) => s.classList.toggle('is-active', +s.dataset.step === n));
    $$('[data-step-ind]', form).forEach((li) => {
      const i = +li.dataset.stepInd;
      li.classList.toggle('is-active', i === n);
      li.classList.toggle('is-done', i < n);
      $('span', li).innerHTML = i < n ? icon('check') : String(i);
    });
    $('#bfBar').style.width = (n / 4) * 100 + '%';
    $('#bfBack').disabled = n === 1;
    $('#bfNext').hidden = n === 4;
    $('#bfSendError').hidden = true;
    if (n === 4) { if (!bookingRef) bookingRef = newRef(); renderSummary(); }
    hasGSAP && ScrollTrigger.refresh();
  }

  function invalid(name, bad) { fld(name)?.closest('.field')?.classList.toggle('is-invalid', bad); return bad; }
  function validate(n) {
    if (n === 1) {
      const ok = !!form.querySelector('input[name="vehicle"]:checked');
      $('[data-error="vehicle"]').classList.toggle('is-visible', !ok);
      return ok;
    }
    if (n === 2) {
      const bad = [invalid('pickup', !fld('pickup').value.trim()), invalid('date', !fld('date').value || fld('date').value < todayISO), !(+fld('guests').value > 0)];
      if (bad.some(Boolean)) { toast('Please add a pickup location and a valid travel date.'); return false; }
      return true;
    }
    if (n === 3) {
      const phoneDigits = fld('phone').value.replace(/\D/g, '');
      const bad = [invalid('name', fld('name').value.trim().length < 2), invalid('phone', phoneDigits.length < 10)];
      if (bad.some(Boolean)) { toast('Please enter your name and a valid mobile number.'); return false; }
      return true;
    }
    return true;
  }
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));
  form.addEventListener('change', (e) => { if (e.target.name === 'vehicle') $('[data-error="vehicle"]').classList.remove('is-visible'); });

  function scrollFormIntoView() {
    const r = form.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.5) scrollToEl(form, -100);
  }
  $('#bfNext').addEventListener('click', () => { if (validate(step)) { goStep(step + 1); scrollFormIntoView(); } });
  $('#bfBack').addEventListener('click', () => { goStep(Math.max(1, step - 1)); scrollFormIntoView(); });

  function collect() {
    const vId = form.querySelector('input[name="vehicle"]:checked')?.value;
    const oId = form.querySelector('input[name="occasion"]:checked')?.value || 'other';
    const v = vehicleById(vId);
    const addons = $$('input[name="addons"]:checked', form).map((x) => x.value);
    const guests = +fld('guests').value || 1;
    const vehicles = v ? Math.max(1, Math.ceil(guests / v.seats)) : 1;
    const date = fld('date').value;
    const ret = fld('returnDate').value;
    return {
      vehicle: v ? `${v.name} (${v.tag})` : 'Please suggest the best vehicle',
      vehicleObj: v, vehicles,
      occasion: occasionById(oId)?.title || 'Other',
      trip: tripType,
      pickup: fld('pickup').value.trim(),
      drop: fld('drop').value.trim() || '—',
      date: fmtDate(date) + (fld('time').value ? ', ' + fld('time').value : ''),
      ret: tripType === 'Outstation' && ret ? fmtDate(ret) : '',
      guests,
      addons: addons.map((id) => D.addons.find((a) => a.id === id).label),
      name: fld('name').value.trim(),
      phone: fld('phone').value.trim(),
      email: fld('email').value.trim(),
      notes: fld('notes').value.trim(),
    };
  }

  function renderSummary() {
    const d = collect();
    const rows = [
      ['Reference', bookingRef],
      ['Vehicle', d.vehicle + (d.vehicles > 1 ? ` × ${d.vehicles}` : '')],
      ['Occasion', d.occasion], ['Trip', d.trip], ['Pickup', d.pickup], ['Destination', d.drop],
      ['Date', d.date], ...(d.ret ? [['Return', d.ret]] : []), ['Guests', d.guests],
      ['Add-ons', d.addons.join(', ') || 'None'], ['Name', d.name], ['Mobile', d.phone],
      ...(d.email ? [['Email', d.email]] : []), ...(d.notes ? [['Notes', d.notes]] : []),
    ];
    $('#bfSummary').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd></dd>`).join('');
    $$('#bfSummary dd').forEach((dd, i) => (dd.textContent = String(rows[i][1])));
  }

  /* ----- Sending: WhatsApp (pre-filled chat) + Email (delivered directly) ----- */
  let bookingRef = null;
  let sending = false;
  const sentVia = new Set();
  const newRef = () => 'MTT-' + Date.now().toString(36).slice(-5).toUpperCase();
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function buildMessage(d, ref) {
    const L = [
      `*New booking enquiry — ${C.brand}*`, `Ref: ${ref}`, '',
      `🚌 Vehicle: ${d.vehicle}${d.vehicles > 1 ? ` × ${d.vehicles}` : ''}`,
      `🎉 Occasion: ${d.occasion}`, `🧭 Trip: ${d.trip}`,
      `📍 Pickup: ${d.pickup}`, `🏁 Destination: ${d.drop}`,
      `📅 Date: ${d.date}`, ...(d.ret ? [`↩️ Return: ${d.ret}`] : []),
      `👥 Guests: ${d.guests}`, `✨ Add-ons: ${d.addons.join(', ') || 'None'}`, '',
      `👤 Name: ${d.name}`, `📞 Mobile: ${d.phone}`, ...(d.email ? [`✉️ Email: ${d.email}`] : []), ...(d.notes ? [`📝 Notes: ${d.notes}`] : []),
      '', '_Sent from the Mumal Tour & Travels website_',
    ];
    return L.join('\n');
  }

  // Sends the enquiry to our own email function (api/send-booking.js), which emails the
  // trip desk directly through the business mailbox — no third-party form service.
  async function sendEmail(d, ref) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(C.emailEndpoint || '/api/send-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ref, name: d.name, phone: d.phone, email: d.email,
          vehicle: d.vehicleObj ? d.vehicleObj.name : 'Vehicle to suggest', vehicles: d.vehicles,
          occasion: d.occasion, trip: d.trip, pickup: d.pickup, drop: d.drop,
          date: d.date, ret: d.ret, guests: d.guests, addons: d.addons, notes: d.notes,
          _gotcha: fld('_gotcha').value,
        }),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        const err = new Error(json.error || `HTTP ${res.status}`);
        err.code = json.error || `http_${res.status}`;
        throw err;
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  function sendWhatsApp() {
    if (!bookingRef) bookingRef = newRef();
    const url = waLink(buildMessage(collect(), bookingRef));
    window.open(url, '_blank', 'noopener');
    showSuccess('wa', { url });
  }

  async function onSendEmail() {
    if (sending) return;
    if (!bookingRef) bookingRef = newRef();
    const btn = $('#bfSendMail');
    const errBox = $('#bfSendError');
    errBox.hidden = true;
    if (fld('_gotcha').value) { showSuccess('mail', {}); return; } // spam bot
    const d = collect();
    sending = true;
    btn.classList.add('is-loading');
    btn.disabled = true;
    $('strong', btn).textContent = 'Sending…';
    try {
      const result = await sendEmail(d, bookingRef);
      showSuccess('mail', { email: result.confirmation ? d.email : '', phone: d.phone });
    } catch (err) {
      const hints = {
        not_configured: 'Booking email is not set up yet: add SMTP_USER and SMTP_PASS (see README → "Booking email setup").',
        auth_failed: 'The mailbox rejected the login: check SMTP_USER and the App Password in SMTP_PASS.',
        http_404: 'The email function was not found. Run the site with "npm run dev" locally, or deploy it to Vercel.',
        http_501: 'This local server cannot run the email function. Use "npm run dev" instead of python http.server.',
      };
      console.warn('[Mumal] Email send failed:', err.code || err.message, hints[err.code] || '');
      const mailto = `mailto:${C.email}?subject=${encodeURIComponent(`Booking enquiry ${bookingRef}`)}&body=${encodeURIComponent(buildMessage(d, bookingRef).replace(/[*_]/g, ''))}`;
      const busy = err.code === 'rate_limited';
      errBox.innerHTML = `<strong>${busy ? 'Too many requests from this device — please wait a few minutes.' : "We couldn't send the email just now."}</strong>
        <span>Please send it on WhatsApp instead — it reaches the same trip desk instantly — or <a href="${mailto}">open it in your email app</a>.</span>
        <button type="button" class="btn btn-gold btn-sm" data-retry-wa>${icon('wa')}Send on WhatsApp</button>`;
      errBox.hidden = false;
      toast('Email could not be sent — try WhatsApp instead.');
    } finally {
      sending = false;
      btn.classList.remove('is-loading');
      btn.disabled = false;
      $('strong', btn).textContent = 'Send by Email';
    }
  }

  function showSuccess(channel, info = {}) {
    sentVia.add(channel);
    const succ = $('#bfSuccess');
    const ref = `<strong>${esc(bookingRef)}</strong>`;
    $('#bfChannel').innerHTML = channel === 'wa' ? `${icon('wa')}Sent via WhatsApp` : `${icon('mail')}Sent via Email`;
    $('#bfChannel').className = 'bf-channel ' + (channel === 'wa' ? 'is-wa' : 'is-mail');
    if (channel === 'wa') {
      $('#bfSuccessTitle').textContent = 'Almost done — tap send!';
      $('#bfSuccessText').innerHTML = `WhatsApp has opened with your complete booking request (ref ${ref}). Just tap <b>Send</b> in WhatsApp and our trip desk will reply with a quote shortly.`;
      $('#bfWaAgain').href = info.url;
    } else {
      $('#bfSuccessTitle').textContent = 'Enquiry emailed!';
      $('#bfSuccessText').innerHTML = `Your request ${ref} has been delivered to our trip desk. We'll call or WhatsApp you${info.phone ? ` on <b>${esc(info.phone)}</b>` : ''} within 30 minutes${info.email ? `, and a confirmation is on its way to <b>${esc(info.email)}</b>` : ''}.`;
    }
    $('#bfWaAgain').hidden = channel !== 'wa';
    const other = channel === 'wa' ? 'mail' : 'wa';
    const alt = $('#bfAlt');
    alt.hidden = sentVia.has(other);
    alt.dataset.channel = other;
    alt.innerHTML = other === 'mail' ? `${icon('mail')}Also send by email` : `${icon('wa')}Also send on WhatsApp`;
    alt.className = 'btn ' + (channel === 'wa' ? 'btn-ghost' : 'btn-gold');
    succ.hidden = false;
    succ.querySelectorAll('.bf-check circle, .bf-check path').forEach((p) => { p.style.animation = 'none'; void p.getBoundingClientRect(); p.style.animation = ''; });
    confetti(succ);
    scrollFormIntoView();
  }

  function confetti(host) {
    const box = document.createElement('div');
    box.className = 'confetti';
    const colors = ['#f3d68e', '#d6a548', '#8c1c33', '#ffffff', '#25d366'];
    box.innerHTML = Array.from({ length: 60 }, () => {
      const l = Math.random() * 100, dx = (Math.random() - 0.5) * 300, rot = Math.random() * 720 - 360, dl = Math.random() * 0.5;
      return `<i style="left:${l}%;background:${colors[(Math.random() * colors.length) | 0]};--dx:${dx}px;--rot:${rot}deg;animation-delay:${dl}s"></i>`;
    }).join('');
    host.appendChild(box);
    setTimeout(() => box.remove(), 3400);
  }

  $('#bfSendWa').addEventListener('click', sendWhatsApp);
  $('#bfSendMail').addEventListener('click', onSendEmail);
  $('#bfSendError').addEventListener('click', (e) => { if (e.target.closest('[data-retry-wa]')) sendWhatsApp(); });
  $('#bfAlt').addEventListener('click', (e) => {
    const ch = e.currentTarget.dataset.channel;
    if (ch === 'wa') { sendWhatsApp(); return; }
    $('#bfSuccess').hidden = true;
    onSendEmail();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); if (step < 4) $('#bfNext').click(); });
  function resetBooking() {
    form.reset();
    sentVia.clear();
    bookingRef = null;
    setTripType('Local (within Udaipur)');
    $('#bfSuccess').hidden = true;
  }
  $('#bfNew').addEventListener('click', () => { resetBooking(); goStep(1); scrollFormIntoView(); });

  function startBooking(o = {}) {
    if (sentVia.size) { sentVia.clear(); bookingRef = null; }
    $('#bfSuccess').hidden = true;
    if (o.vehicle) { const r = form.querySelector(`input[name="vehicle"][value="${o.vehicle}"]`); if (r) r.checked = true; }
    if (o.occasion) { const r = form.querySelector(`input[name="occasion"][value="${o.occasion}"]`); if (r) r.checked = true; }
    if (o.date) fld('date').value = o.date;
    if (o.guests) fld('guests').value = o.guests;
    if (o.drop) fld('drop').value = o.drop;
    if (o.tripType) setTripType(o.tripType);
    if (o.addons) $$('input[name="addons"]', form).forEach((cb) => (cb.checked = o.addons.includes(cb.value)));
    const hasVehicle = !!form.querySelector('input[name="vehicle"]:checked');
    goStep(o.step && (o.step === 1 || hasVehicle) ? o.step : hasVehicle ? 2 : 1);
    closeModal();
    scrollToEl('#book', -20);
    const v = vehicleById(o.vehicle);
    if (v) toast(`${v.name} selected — just add your trip details.`);
  }
  goStep(1);

  /* ---------------------------------------------------------
     Reviews — 3D ring carousel
     --------------------------------------------------------- */
  (function reviewsRing() {
    const ring = $('#ring');
    const stage = $('#ringStage');
    const n = D.reviews.length;
    const step = 360 / n;
    ring.innerHTML = D.reviews.map((r) => `
      <article class="review-card">
        <span class="q">${icon('quote')}</span>
        <p></p>
        <footer>
          <span class="av">${r.name.replace(/^The /, '').charAt(0)}</span>
          <div><strong></strong><small></small></div>
          <span class="stars" aria-label="${r.rating} out of 5">${icon('star').repeat(r.rating)}</span>
        </footer>
      </article>`).join('');
    const cards = $$('.review-card', ring);
    cards.forEach((c, i) => { $('p', c).textContent = `“${D.reviews[i].text}”`; $('strong', c).textContent = D.reviews[i].name; $('small', c).textContent = D.reviews[i].event; });
    const st = { rot: 0 };
    let radius = 400, target = 0, dragging = false, startX = 0, startRot = 0, hover = false, inView = false;
    function render() {
      ring.style.transform = `translateZ(${-radius}px) rotateY(${st.rot}deg)`;
      cards.forEach((c, i) => {
        let a = (((i * step + st.rot) % 360) + 360) % 360;
        if (a > 180) a -= 360;
        c.style.opacity = Math.max(0.12, 1 - Math.abs(a) / 140).toFixed(2);
      });
    }
    function layout() {
      radius = Math.round(ring.offsetWidth / 2 / Math.tan(Math.PI / n)) + (innerWidth < 640 ? 40 : 70);
      cards.forEach((c, i) => (c.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`));
      render();
    }
    function go(to) {
      target = to;
      if (animate) gsap.to(st, { rot: target, duration: 1.1, ease: 'power3.out', onUpdate: render, overwrite: true });
      else { st.rot = target; render(); }
    }
    layout();
    window.addEventListener('resize', layout);
    $('#ringNext').addEventListener('click', () => go(Math.round(target / step) * step - step));
    $('#ringPrev').addEventListener('click', () => go(Math.round(target / step) * step + step));
    stage.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; startRot = st.rot; stage.setPointerCapture(e.pointerId); if (animate) gsap.killTweensOf(st); });
    stage.addEventListener('pointermove', (e) => { if (!dragging) return; st.rot = startRot + (e.clientX - startX) * 0.25; target = st.rot; render(); });
    const end = () => { if (!dragging) return; dragging = false; go(Math.round(st.rot / step) * step); };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerenter', () => (hover = true));
    stage.addEventListener('pointerleave', () => (hover = false));
    new IntersectionObserver(([en]) => (inView = en.isIntersecting)).observe(stage);
    if (!reduceMotion) setInterval(() => { if (inView && !hover && !dragging && !document.hidden) go(Math.round(target / step) * step - step); }, 4200);
  })();

  /* ---------------------------------------------------------
     Split text helper
     --------------------------------------------------------- */
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
      });
    };
    walk(el);
    return $$('.wi', el);
  }

  /* ---------------------------------------------------------
     Scroll animations
     --------------------------------------------------------- */
  function initScrollAnimations() {
    if (!animate) return;

    // Split headings
    $$('[data-split]:not([data-split="hero"])').forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 115, rotate: 3 });
      ScrollTrigger.create({
        trigger: el, start: 'top 86%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.15, ease: 'power4.out', stagger: 0.045 }),
      });
    });

    // Reveal
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 }),
    });
    $$('[data-reveal-stagger]').forEach((wrap) => {
      ScrollTrigger.create({
        trigger: wrap, start: 'top 88%', once: true,
        onEnter: () => gsap.to(wrap.children, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
      });
    });

    // Fleet cards
    gsap.set('.v-card', { opacity: 0, y: 60 });
    ScrollTrigger.batch('.v-card', {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, clearProps: 'transform' }),
    });

    // Hero scroll parallax
    gsap.to('#heroMedia', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-inner', { y: -110, opacity: 0.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.quick-book', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });

    // Generic data-speed parallax
    $$('[data-speed]').forEach((el) => {
      const s = +el.dataset.speed;
      gsap.fromTo(el, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
      const img = $('img', el);
      if (img) gsap.fromTo(img, { scale: 1.22 }, { scale: 1.04, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Counters
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '';
      const o = { v: 0 };
      el.textContent = '0' + suf;
      ScrollTrigger.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-IN') + suf) }),
      });
    });

    // Occasions: horizontal scroll on desktop
    const mm = gsap.matchMedia();
    mm.add('(min-width: 961px)', () => {
      const track = $('#occTrack');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '#occasions', pin: true, start: 'top top', end: () => '+=' + dist(), scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set('#occProgress', { scaleX: self.progress }),
        },
      });
      $$('.occ-panel', track).forEach((panel) => {
        gsap.fromTo($('.occ-img img', panel), { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        gsap.from($$('.occ-content > *', panel), { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 70%', once: true } });
      });
    });
    mm.add('(max-width: 960px)', () => {
      $$('.occ-panel').forEach((panel) => gsap.from(panel, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: panel, start: 'top 88%', once: true } }));
    });

    // Parallax banner layers
    const pbST = { trigger: '#lakes', start: 'top bottom', end: 'bottom top', scrub: true };
    gsap.fromTo('#pbBg', { yPercent: -12 }, { yPercent: 12, ease: 'none', scrollTrigger: pbST });
    gsap.fromTo('#pbSun', { yPercent: 40, scale: 0.8 }, { yPercent: -30, scale: 1.15, ease: 'none', scrollTrigger: pbST });
    gsap.fromTo('#pbBirds', { x: -120, y: 60 }, { x: 220, y: -40, ease: 'none', scrollTrigger: pbST });
    gsap.fromTo('#pbSkyline', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: pbST });
    gsap.fromTo('.pb-content', { y: 80 }, { y: -60, ease: 'none', scrollTrigger: pbST });

    // Route lines draw-in
    const lines = $$('.rm-route', map);
    lines.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.set('.rm-node', { opacity: 0, scale: 0.4, transformOrigin: 'center', transformBox: 'fill-box' });
    ScrollTrigger.create({
      trigger: map, start: 'top 75%', once: true,
      onEnter: () => {
        gsap.to(lines, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.12, onComplete: () => lines.forEach((p) => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }) });
        gsap.to('.rm-node', { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.12, delay: 0.6 });
      },
    });

    // Process road + bus
    const road = $('.pt-road');
    const pST = { trigger: '#processTrack', start: 'top 75%', end: 'bottom 55%', scrub: 0.8 };
    gsap.to('#ptFill', { scaleX: 1, ease: 'none', scrollTrigger: pST });
    gsap.to('#ptBus', { x: () => road.offsetWidth, ease: 'none', scrollTrigger: { ...pST, invalidateOnRefresh: true } });
    gsap.from('.step', { y: 60, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#processTrack', start: 'top 80%', once: true } });

    // Why cards
    gsap.from('.why-icon', { rotateY: 180, duration: 1.2, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.why-grid', start: 'top 80%', once: true } });

    // Showroom stage zoom-in
    gsap.fromTo('.sr-stage', { scale: 0.92, borderRadius: 60 }, { scale: 1, borderRadius: 30, ease: 'none', scrollTrigger: { trigger: '.showroom-wrap', start: 'top bottom', end: 'top 30%', scrub: true } });

    // CTA band text
    gsap.fromTo('.cta-pattern', { backgroundPositionX: '0px' }, { backgroundPositionX: '240px', ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Active nav link
    $$('.main-nav a').forEach((a) => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (self) => a.classList.toggle('is-active', self.isActive) });
    });
  }

  /* ---------------------------------------------------------
     Preloader → hero intro
     --------------------------------------------------------- */
  if (animate) document.documentElement.classList.add('js-anim');
  const heroWords = animate ? splitWords($('.hero-title')) : [];
  if (animate) gsap.set(heroWords, { yPercent: 115 });
  initScrollAnimations();

  (function preloader() {
    const pl = $('#preloader');
    const fill = $('#plFill'), bus = $('#plBus'), count = $('#plCount');
    const assets = ['assets/img/hero.webp', 'assets/img/coach.webp', 'assets/img/coach-interior.webp'];
    let loaded = 0;
    const total = assets.length + 1;
    assets.forEach((src) => { const im = new Image(); im.onload = im.onerror = () => loaded++; im.src = src; });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => loaded++);
    const t0 = performance.now();
    const minTime = reduceMotion ? 200 : 1500;
    let done = false, poll = 0;
    // Time-based (not frame-based) so throttled tabs still finish on schedule
    function tick() {
      if (done) return;
      const now = performance.now();
      const forced = now - t0 > 6000;
      const timeP = Math.min((now - t0) / minTime, 1);
      const p = forced ? 1 : Math.min(1 - Math.pow(1 - timeP, 3), (loaded + 0.6 * timeP) / total, 1);
      const pct = Math.round(p * 100);
      count.textContent = pct;
      fill.style.width = pct + '%';
      bus.style.left = pct + '%';
      if (p >= 1 || (timeP >= 1 && loaded >= total)) {
        done = true;
        clearInterval(poll);
        count.textContent = 100; fill.style.width = '100%'; bus.style.left = '100%';
        finish();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    poll = setInterval(tick, 120);

    function finish() {
      document.body.classList.remove('is-loading');
      moveGlider();
      if (!animate) { pl.remove(); return; }
      const tl = gsap.timeline({ onComplete: () => { pl.remove(); lenis?.start(); ScrollTrigger.refresh(); } });
      tl.to('.pl-inner', { y: -30, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to('.pl-main', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.1')
        .to('.pl-gold', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.85')
        .fromTo('.hero-img', { scale: 1.35 }, { scale: 1.12, duration: 2.2, ease: 'expo.out' }, '-=0.8')
        .to(heroWords, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: 0.06 }, '-=2')
        .to('.hero-anim', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.1 }, '-=1.4')
        .fromTo('.float-card', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.6)', stagger: 0.15 }, '-=1')
        .fromTo('.site-header', { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=1.2');
    }
  })();

  window.addEventListener('load', () => { moveGlider(); hasGSAP && ScrollTrigger.refresh(); });
  window.addEventListener('resize', moveGlider);

  window.MumalUI = { startBooking, openModal, toast, lenis };
})();
