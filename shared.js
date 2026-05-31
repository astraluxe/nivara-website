/* ============================================
   adris.tech · shared front-end logic
   Used by all pages (homepage + modules)
============================================ */

// ---- Theme toggle (Paper / Ink) — persisted to localStorage
(function() {
  const root = document.documentElement;
  const stored = localStorage.getItem('adris-theme');
  if (stored === 'ink' || stored === 'paper') {
    if (stored === 'ink') root.setAttribute('data-theme', 'ink');
    else root.removeAttribute('data-theme');
  }
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') === 'ink' ? 'ink' : 'paper';
      const next = cur === 'ink' ? 'paper' : 'ink';
      if (next === 'paper') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', next);
      localStorage.setItem('adris-theme', next);
    });
  });
})();

// ---- Reveal on scroll
document.addEventListener('DOMContentLoaded', () => {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
});

// ---- Smooth anchor scroll (only when target is on the same page)
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id && id.length > 1) {
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});

// ---- Install tabs (used on module pages)
document.addEventListener('click', e => {
  const t = e.target.closest('.install-tabs button');
  if (!t) return;
  const root = t.closest('.install');
  if (!root) return;
  root.querySelectorAll('.install-tabs button').forEach(b => b.classList.remove('on'));
  t.classList.add('on');
  const key = t.dataset.tab;
  root.querySelectorAll('.install-cmd').forEach(c => {
    c.style.display = c.dataset.tab === key ? 'flex' : 'none';
  });
});

// ---- Copy install commands
document.addEventListener('click', async e => {
  const b = e.target.closest('.install-cmd .copy');
  if (!b) return;
  const cmd = b.closest('.install-cmd').querySelector('.cmd-text');
  if (!cmd) return;
  try {
    await navigator.clipboard.writeText(cmd.textContent.trim());
    b.classList.add('ok');
    const old = b.textContent;
    b.textContent = '✓ copied';
    setTimeout(() => { b.classList.remove('ok'); b.textContent = old; }, 1400);
  } catch (_) {}
});

