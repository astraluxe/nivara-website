/* adris-motion.js — the dot field, the pixel mark, the typed caption, the nav state and reveals (23 Oct 2026).
   Plain JS, no dependencies. Every effect is decorative: content never depends on it, and it stops for reduced
   motion and touch screens. Numbers marked (measured) come from the reference page via the MIMIC skill. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('ad-js');
  document.body.classList.add('ad-site');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var PITCH = 74, REACH = 150, BANDS = 4;                 // (measured) grid pitch, pointer reach, lit colour bands
  var APPEAR_MAX = 400, MUTE_FROM = 470, MUTE_SPREAD = 220; // (measured) pop-in delay range, then the step to grey

  /* ------------------------------------------------------------ the dot field */
  function buildField(host) {
    var field = document.createElement('div');
    field.className = 'ad-field';
    field.setAttribute('aria-hidden', 'true');
    host.appendChild(field);
    document.body.classList.add('ad-has-field');
    var dots = [];

    function layout() {
      field.textContent = '';
      dots = [];
      var w = field.clientWidth, h = field.clientHeight;
      var cols = Math.floor(w / PITCH), rows = Math.floor(h / PITCH);
      var ox = (w - (cols - 1) * PITCH) / 2, oy = PITCH * 0.5;
      var frag = document.createDocumentFragment();
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var d = document.createElement('span');
          d.className = 'ad-dot';
          var x = ox + c * PITCH, y = oy + r * PITCH;
          d.style.left = x + 'px';
          d.style.top = y + 'px';
          if (!reduce) {
            d.style.animationDelay = Math.round(Math.random() * APPEAR_MAX) + 'ms';
            d.style.transitionDelay = Math.round(MUTE_FROM + Math.random() * MUTE_SPREAD) + 'ms';
          }
          frag.appendChild(d);
          dots.push({ el: d, x: x, y: y, lit: false, band: -1 });
        }
      }
      field.appendChild(frag);
      // a beat after the pop-in, the colour steps down to the resting grey (dot by dot, by its own delay)
      field.removeAttribute('data-muted');
      setTimeout(function () { field.setAttribute('data-muted', 'true'); }, reduce ? 0 : 60);
    }

    var px = -9999, py = -9999, queued = false, top = 0;
    function paint() {
      queued = false;
      top = field.getBoundingClientRect().top;
      for (var i = 0; i < dots.length; i++) {
        var o = dots[i];
        var dist = Math.hypot(o.x - px, o.y + top - py);
        var lit = dist < REACH;
        var band = lit ? Math.min(BANDS - 1, Math.floor(dist / (REACH / BANDS))) : -1;  // (inferred) band by distance
        if (lit !== o.lit || band !== o.band) {
          o.lit = lit; o.band = band;
          o.el.setAttribute('data-lit', lit ? 'true' : 'false');
          if (lit) o.el.setAttribute('data-band', String(band)); else o.el.removeAttribute('data-band');
        }
      }
    }
    function onMove(e) {
      px = e.clientX; py = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }

    layout();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 180); }, { passive: true });
    if (finePointer && !reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', function () { px = py = -9999; paint(); });
    }
    // where scroll-driven animations are missing, fade the field from the script (110 → 351px, measured)
    if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
      var fq = false;
      window.addEventListener('scroll', function () {
        if (fq) return; fq = true;
        requestAnimationFrame(function () {
          fq = false;
          var p = (window.scrollY - 110) / (351 - 110);
          field.style.opacity = String(Math.max(0, Math.min(1, 1 - p * 2)));
        });
      }, { passive: true });
    }
  }

  /* ------------------------------------------------------------ the pixel ADRIS mark (the real logo, rasterised) */
  function buildMark(host) {
    var LOGO = ['M2 4 L9 4 L15 12 L9 20 L2 20 L8 12 Z', 'M12 4 L19 4 L25 12 L19 20 L12 20 L18 12 Z']; // the site's own mark
    var probe = document.createElement('canvas').getContext('2d');
    var paths = LOGO.map(function (d) { return new Path2D(d); });
    var STEP = 1, CELL = 10, GAP = 1.5, cells = [];
    for (var y = 3.5; y < 21; y += STEP) {
      for (var x = 1.5; x < 26; x += STEP) {
        var inside = paths.some(function (p) { return probe.isPointInPath(p, x, y); });
        if (inside) cells.push([x, y]);
      }
    }
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    var minX = 1.5, minY = 3.5;
    var W = (25 - minX + 1) * CELL, H = (21 - minY) * CELL;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'adris.tech');
    var rects = [];
    cells.forEach(function (c, i) {
      var r = document.createElementNS(ns, 'rect');
      var rx = (c[0] - minX) * CELL, ry = (c[1] - minY) * CELL;
      r.setAttribute('x', rx + GAP / 2); r.setAttribute('y', ry + GAP / 2);
      r.setAttribute('width', CELL - GAP); r.setAttribute('height', CELL - GAP);
      if ((i * 7919) % 23 === 0) r.setAttribute('class', 'acc');       // a few purple pixels, the same every load
      svg.appendChild(r);
      rects.push({ el: r, x: rx + CELL / 2, y: ry + CELL / 2, lit: false });
    });
    host.insertBefore(svg, host.firstChild);
    if (!finePointer || reduce) return;
    var q = false, mx = 0, my = 0;
    svg.addEventListener('pointermove', function (e) {
      var b = svg.getBoundingClientRect(), k = W / b.width;
      mx = (e.clientX - b.left) * k; my = (e.clientY - b.top) * k;
      if (q) return; q = true;
      requestAnimationFrame(function () {
        q = false;
        rects.forEach(function (o) {
          var lit = Math.hypot(o.x - mx, o.y - my) < 34;
          if (lit !== o.lit) { o.lit = lit; o.el.setAttribute('data-lit', lit ? 'true' : 'false'); }
        });
      });
    });
    svg.addEventListener('pointerleave', function () {
      rects.forEach(function (o) { if (o.lit) { o.lit = false; o.el.setAttribute('data-lit', 'false'); } });
    });
  }

  /* ------------------------------------------------------------ the typed caption */
  function typeIn(el) {
    var text = el.getAttribute('data-type') || '';
    if (reduce) { el.textContent = text; return; }
    el.textContent = '';
    var i = 0;
    (function next() {
      if (i > text.length) return;
      el.textContent = text.slice(0, i++);
      setTimeout(next, i < 2 ? 500 : 55);
    })();
  }

  /* ------------------------------------------------------------ nav state + reveals */
  function navState() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var q = false;
    function upd() { q = false; nav.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', function () { if (!q) { q = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }
  function reveals() {
    var els = document.querySelectorAll('.ad-rv');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  function init() {
    var host = document.querySelector('[data-ad-field]');
    if (host) buildField(document.body);
    document.querySelectorAll('[data-ad-mark]').forEach(buildMark);
    document.querySelectorAll('[data-type]').forEach(typeIn);
    navState();
    reveals();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
