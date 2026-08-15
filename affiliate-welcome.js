/* ─────────────────────────────────────────────────────────────────────────────
 * Arriving through a partner's link.
 *
 * WHY THIS EXISTS. A referral is only credited once we know who the visitor is, and that cannot
 * happen until they sign in. Someone who lands, reads, leaves, and comes back a fortnight later to
 * buy is the normal case — not the exception — and without an account tying those two visits
 * together the partner who introduced them gets nothing. That is the unfair outcome this prevents.
 *
 * WHY IT ASKS RATHER THAN BLOCKS. Putting a wall in front of the site would lose a good share of
 * those visitors outright, and a visitor who bounces is worth exactly nothing to the partner who
 * sent them — so the "stricter" version is the one that pays them less. This asks clearly, explains
 * what it is for, and gets out of the way. The referral is remembered either way, so someone who
 * signs in later is still credited; the prompt only makes that far more likely to happen.
 *
 * The message is deliberately about THEM, not us: nothing changes, no cost, no catch. Anyone who
 * feels handled at this moment simply leaves.
 * ───────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var CODE_KEY = 'aff_ref';
  var SEEN_KEY = 'aff_ref_at';
  var HIDE_KEY = 'aff_ref_prompt_hidden';
  var AUTH_KEY = 'sb-xkkqcqsacgdrfwbwdqsp-auth-token';

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // ── Capture ────────────────────────────────────────────────────────────────
  // The code is kept with the moment it arrived. The timestamp matters: the published programme
  // gives each tier a different window (30 days for Starter, up to lifetime for Elite), and without
  // knowing when the visit happened every referral would effectively last forever — crediting a
  // partner beyond what the terms actually promise. FIRST arrival wins and is never overwritten,
  // so a later link cannot take a visitor who already belongs to somebody else.
  var params = new URLSearchParams(window.location.search);
  var incoming = (params.get('ref') || '').trim();
  if (incoming && !read(CODE_KEY)) {
    store(CODE_KEY, incoming);
    store(SEEN_KEY, String(Date.now()));
  }

  var code = read(CODE_KEY);
  if (!code) return;

  // ── Already signed in? Then there is nothing to ask for ────────────────────
  // Read straight from the stored session rather than loading the Supabase library, so this stays
  // a small script that any page can include without taking on a dependency.
  try {
    var raw = read(AUTH_KEY);
    if (raw) {
      var sess = JSON.parse(raw);
      var exp = (sess && sess.expires_at) ? sess.expires_at * 1000 : 0;
      if (exp > Date.now()) return;          // signed in — signin.html claims the referral
    }
  } catch (e) { /* unreadable session — fall through and ask */ }

  if (sessionStorage.getItem(HIDE_KEY) === '1') return;   // dismissed for this visit

  // ── The prompt ─────────────────────────────────────────────────────────────
  function build() {
    if (document.getElementById('affWelcome')) return;

    var wrap = document.createElement('div');
    wrap.id = 'affWelcome';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', 'You arrived through a partner link');
    wrap.style.cssText = [
      'position:fixed', 'left:50%', 'transform:translateX(-50%)', 'bottom:20px', 'z-index:9997',
      'width:min(560px, calc(100vw - 32px))', 'box-sizing:border-box',
      'background:var(--paper, #fff)', 'color:var(--ink, #0E0E0C)',
      'border:1px solid var(--rule-strong, rgba(14,14,12,.22))', 'border-radius:14px',
      'padding:16px 18px', 'box-shadow:0 14px 44px rgba(14,14,12,.18)',
      'font-family:var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
      'display:flex', 'gap:14px', 'align-items:flex-start', 'flex-wrap:wrap',
      'opacity:0', 'transition:opacity .28s ease, transform .28s ease'
    ].join(';');

    wrap.innerHTML =
      '<div style="flex:1 1 300px;min-width:240px">'
      +   '<p style="margin:0 0 5px;font-size:14px;font-weight:600;letter-spacing:-.01em">'
      +     'Someone recommended us to you'
      +   '</p>'
      +   '<p style="margin:0;font-size:13px;line-height:1.6;color:var(--muted, rgba(14,14,12,.58))">'
      +     'You came through a partner’s link. Sign in and they get credited for the '
      +     'recommendation — including if you take your time and decide later. '
      +     '<strong style="color:var(--ink, #0E0E0C);font-weight:600">Nothing changes for you:</strong> '
      +     'same price, same product, and we don’t share your details with them.'
      +   '</p>'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;flex:0 0 auto;margin-left:auto">'
      +   '<button type="button" id="affWelcomeNo" style="padding:9px 14px;border:1px solid '
      +     'var(--rule-strong, rgba(14,14,12,.22));border-radius:9px;background:transparent;'
      +     'color:var(--muted, rgba(14,14,12,.58));font-size:13px;cursor:pointer;'
      +     'font-family:inherit">Maybe later</button>'
      +   '<a href="/signin" id="affWelcomeYes" style="padding:9px 16px;border-radius:9px;'
      +     'background:var(--accent, #7C5CFF);color:#fff;font-size:13px;font-weight:600;'
      +     'text-decoration:none;white-space:nowrap">Sign in</a>'
      + '</div>';

    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.style.opacity = '1'; });

    document.getElementById('affWelcomeNo').onclick = function () {
      // Only for this visit. Their referral is still remembered, so signing in on any later visit
      // still credits the partner — dismissing this costs them nothing.
      try { sessionStorage.setItem(HIDE_KEY, '1'); } catch (e) {}
      wrap.style.opacity = '0';
      setTimeout(function () { wrap.remove(); }, 280);
    };
  }

  // Let the page paint first. Arriving on top of a half-drawn page reads as an ad.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(build, 900); }, { once: true });
  } else {
    setTimeout(build, 900);
  }
})();
