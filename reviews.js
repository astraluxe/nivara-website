/* ─────────────────────────────────────────────────────────────────────────────
   REVIEWS CAROUSEL — one component, used by home.html and pricing.html.

   WHY IT LOOKS LIKE THIS
   Both reviews used to be hardcoded twice, once per page, which meant adding one
   was a code change in two files and removing one risked leaving an empty box
   behind. The content now lives in /reviews.json, written by the head dashboard.
   This file is the only renderer, so the two pages can never drift apart again.

   Both pages load styles.css, so the card borrows --paper-2 / --ink / --rule /
   --muted / --accent / --font-serif from there and needs no palette of its own.
   Fallbacks are still given for every token, because a page that forgets the
   stylesheet should degrade to something readable rather than to white on white.

   THE SCROLL
   Three cards at a time, advancing one card every SLIDE_MS, and it stops the
   moment a pointer or keyboard focus lands on it — a testimonial that slides
   away mid-sentence is worse than no motion at all. The loop is seamless
   because the first `visible` cards are cloned onto the end: the track advances
   into the clones and then resets to 0 with the transition switched off, which
   is the same pixel position, so nothing visibly jumps.

   It deliberately does nothing when there is nothing to do — with three or
   fewer reviews there is no second screen to scroll to, so the track sits still
   and the arrows and dots are not drawn. With none at all the whole section is
   removed from the page, so deleting the last review cannot leave a heading
   over an empty rectangle.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var SLIDE_MS = 4500;   // time one card is held before advancing
  var GLIDE_MS = 700;    // the slide itself

  // The LinkedIn glyph. Inline because the whole point of the brief is that a
  // review carries its LinkedIn mark, and a remote icon would be one network
  // request that can fail and leave the card looking unattributed.
  var LI_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
    + '<path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05'
    + 'c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06'
    + '-1.9 0-2.2 1.45-2.2 2.96V21h-4z"/></svg>';

  var CSS = ''
    + '.rvx{position:relative}'
    + '.rvx-vp{overflow:hidden}'
    + '.rvx-tr{display:flex;gap:var(--rvx-gap,20px);will-change:transform}'
    + '.rvx-card{flex:0 0 auto;box-sizing:border-box;display:flex;flex-direction:column;'
    +   'border:1px solid var(--rule,rgba(14,14,12,.12));border-radius:16px;'
    +   'background:var(--paper-2,#f5f5f5);padding:26px 24px 22px}'
    + '.rvx-mark{display:block;font-family:var(--font-serif,Georgia,serif);font-size:52px;'
    +   'line-height:.62;color:var(--accent,#7C5CFF);opacity:.3;margin-bottom:12px}'
    + '.rvx-q{font-size:15px;line-height:1.62;letter-spacing:-.012em;color:var(--ink,#0E0E0C);'
    +   'margin:0;flex:1 1 auto}'
    /* A long testimonial must not make one card twice the height of its neighbours,
       so the text is clamped and the full thing stays available on hover/expand. */
    + '.rvx-q.clamp{display:-webkit-box;-webkit-line-clamp:8;-webkit-box-orient:vertical;overflow:hidden}'
    + '.rvx-more{align-self:flex-start;margin-top:8px;background:none;border:0;padding:0;cursor:pointer;'
    +   'font:inherit;font-size:12.5px;color:var(--accent,#7C5CFF);text-decoration:underline}'
    + '.rvx-cite{display:flex;align-items:center;gap:12px;margin-top:20px;padding-top:18px;'
    +   'border-top:1px solid var(--rule,rgba(14,14,12,.12))}'
    + '.rvx-av{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:var(--accent,#7C5CFF);'
    +   'color:#fff;display:grid;place-items:center;font-size:13px;font-weight:600;letter-spacing:-.02em}'
    + '.rvx-who{display:flex;flex-direction:column;gap:2px;min-width:0}'
    + '.rvx-nm{font-size:14px;font-weight:600;color:var(--ink,#0E0E0C);white-space:nowrap;'
    +   'overflow:hidden;text-overflow:ellipsis}'
    + '.rvx-rl{font-size:12px;color:var(--muted,rgba(14,14,12,.58));white-space:nowrap;'
    +   'overflow:hidden;text-overflow:ellipsis}'
    + '.rvx-li{margin-left:auto;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;'
    +   'width:32px;height:32px;border:1px solid var(--rule,rgba(14,14,12,.12));border-radius:8px;'
    +   'color:var(--muted,rgba(14,14,12,.58));transition:color .18s,border-color .18s}'
    + '.rvx-li svg{width:14px;height:14px}'
    + '.rvx-li:hover{color:#0A66C2;border-color:#0A66C2}'
    + '.rvx-dots{display:flex;justify-content:center;gap:7px;margin-top:22px}'
    + '.rvx-dot{width:7px;height:7px;padding:0;border:0;border-radius:50%;cursor:pointer;'
    +   'background:var(--rule-strong,rgba(14,14,12,.22));transition:background .2s,width .2s}'
    + '.rvx-dot.on{width:20px;border-radius:999px;background:var(--accent,#7C5CFF)}'
    + '.rvx-hint{text-align:center;margin:10px 0 0;font-size:11.5px;'
    +   'color:var(--muted-2,rgba(14,14,12,.4))}'
    + '@media(max-width:900px){.rvx-q.clamp{-webkit-line-clamp:10}}'
    + '@media(prefers-reduced-motion:reduce){.rvx-tr{transition:none!important}}';

  function injectCss() {
    if (document.getElementById('rvx-css')) return;
    var st = document.createElement('style');
    st.id = 'rvx-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Initials for the avatar. Reviews arrive from a form, so a single-word name or
  // a stray double space must not produce "undefined" in a circle.
  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Only http(s) links are rendered. The href comes from a form field, so a
  // javascript: URL would otherwise become a click-to-run script on the homepage.
  function safeUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) return '';
    return s;
  }

  // NOT PRINTED ON THE CARD any more. The section heading already frames these as
  // first impressions shared with permission, so the card was saying it a second time
  // right above the quote mark. The field is still recorded per review in the
  // dashboard — whether someone has actually used the product is worth knowing before
  // quoting them — so it can be shown again without re-entering it for every review.
  var CONTEXT_LABEL = {
    saw:  'Saw a demo',
    used: 'Has used adris.tech',
  };

  function cardHtml(r) {
    var url = safeUrl(r.linkedin);
    return '<figure class="rvx-card">'
      + '<span class="rvx-mark" aria-hidden="true">&ldquo;</span>'
      + '<blockquote class="rvx-q clamp">' + esc(r.quote) + '</blockquote>'
      + '<figcaption class="rvx-cite">'
      +   '<span class="rvx-av" aria-hidden="true">' + esc(initials(r.name)) + '</span>'
      +   '<span class="rvx-who">'
      +     '<span class="rvx-nm">' + esc(r.name) + '</span>'
      +     '<span class="rvx-rl">' + esc(r.role) + '</span>'
      +   '</span>'
      +   (url
            ? '<a class="rvx-li" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"'
              + ' aria-label="' + esc(r.name) + ' on LinkedIn" title="View on LinkedIn">' + LI_SVG + '</a>'
            : '')
      + '</figcaption>'
      + '</figure>';
  }

  function visibleCount() {
    var w = window.innerWidth;
    if (w < 720) return 1;
    if (w < 1080) return 2;
    return 3;
  }

  function mount(host, reviews) {
    // Nothing to show: take the whole section away rather than leave a heading
    // standing over an empty box.
    if (!reviews.length) {
      var sec = host.closest('[data-reviews-section]') || host;
      sec.remove();
      return;
    }

    injectCss();

    var vis = visibleCount();
    var loop = reviews.length > vis;
    // Clones make the wrap-around seamless; without a loop they would just be
    // duplicate cards sitting in the DOM for no reason.
    var items = loop ? reviews.concat(reviews.slice(0, vis)) : reviews;

    host.className = 'rvx';
    host.innerHTML =
      '<div class="rvx-vp"><div class="rvx-tr">' + items.map(cardHtml).join('') + '</div></div>'
      + (loop ? '<div class="rvx-dots"></div><p class="rvx-hint">Hover to pause</p>' : '');

    var vp    = host.querySelector('.rvx-vp');
    var track = host.querySelector('.rvx-tr');
    var dotsEl = host.querySelector('.rvx-dots');
    var i = 0, timer = null, paused = false;

    function gap() {
      var g = parseFloat(getComputedStyle(track).gap);
      return isNaN(g) ? 20 : g;
    }

    function layout() {
      var g = gap();
      var w = (vp.clientWidth - g * (vis - 1)) / vis;
      Array.prototype.forEach.call(track.children, function (c) { c.style.width = w + 'px'; });
      return w + g;
    }

    var step = layout();

    function place(animate) {
      track.style.transition = animate ? 'transform ' + GLIDE_MS + 'ms cubic-bezier(.22,1,.36,1)' : 'none';
      track.style.transform = 'translateX(' + (-i * step) + 'px)';
    }

    function dots() {
      if (!dotsEl) return;
      if (!dotsEl.children.length) {
        dotsEl.innerHTML = reviews.map(function (_, n) {
          return '<button class="rvx-dot" type="button" aria-label="Review ' + (n + 1) + '"></button>';
        }).join('');
        Array.prototype.forEach.call(dotsEl.children, function (d, n) {
          d.addEventListener('click', function () { i = n; place(true); dots(); restart(); });
        });
      }
      var active = i % reviews.length;
      Array.prototype.forEach.call(dotsEl.children, function (d, n) {
        d.classList.toggle('on', n === active);
      });
    }

    function advance() {
      if (!loop || paused) return;
      i++;
      place(true);
      dots();
      if (i >= reviews.length) {
        // We are now standing on the clones, which look identical to the start.
        // Jump back with the transition off — same pixels, so nothing flickers.
        setTimeout(function () {
          if (i < reviews.length) return;   // a dot click moved us in the meantime
          i = 0;
          place(false);
          track.offsetHeight;               // force reflow before animating again
          dots();
        }, GLIDE_MS + 20);
      }
    }

    function restart() { stop(); if (loop) timer = setInterval(advance, SLIDE_MS); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    // Hovering, or tabbing into a card, means someone is reading it.
    ['mouseenter', 'focusin'].forEach(function (e) {
      host.addEventListener(e, function () { paused = true; });
    });
    ['mouseleave', 'focusout'].forEach(function (e) {
      host.addEventListener(e, function () { paused = false; });
    });
    // A carousel advancing in a background tab is just wasted work.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else restart();
    });

    // "Read more" expands one card in place instead of sending anyone away.
    host.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.rvx-more');
      if (!b) return;
      var q = b.previousElementSibling;
      if (q) q.classList.toggle('clamp');
      b.textContent = q && q.classList.contains('clamp') ? 'Read more' : 'Read less';
    });

    // Only offer "Read more" where the text is actually cut off.
    Array.prototype.forEach.call(track.querySelectorAll('.rvx-q'), function (q) {
      if (q.scrollHeight - q.clientHeight > 4) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rvx-more';
        b.textContent = 'Read more';
        q.parentNode.insertBefore(b, q.nextSibling);
      }
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var nv = visibleCount();
        if (nv !== vis) { stop(); mount(host, reviews); return; }  // rebuild: clone count changed
        step = layout();
        place(false);
      }, 150);
    });

    place(false);
    dots();
    restart();
  }

  function boot() {
    var hosts = document.querySelectorAll('[data-adris-reviews]');
    if (!hosts.length) return;

    fetch('/reviews.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var list = (data && Array.isArray(data.reviews) ? data.reviews : [])
          .filter(function (r) { return r && r.quote && r.name; });
        Array.prototype.forEach.call(hosts, function (h) { mount(h, list); });
      })
      .catch(function () {
        // Offline or a bad deploy: remove the section rather than leave a spinner
        // or an empty frame where a testimonial is supposed to be.
        Array.prototype.forEach.call(hosts, function (h) {
          var sec = h.closest('[data-reviews-section]') || h;
          sec.remove();
        });
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
