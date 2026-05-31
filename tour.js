/* ============================================
   adris.tech · Product tour overlay
   Spotlight + tooltip walkthrough
============================================ */

const TOUR_STEPS = [
  {
    target: null,
    title: "Welcome to adris.tech.",
    body: "India's AI operating system. Six products, one login. Built in Bengaluru for builders here. Take 30 seconds to look around — or skip and explore yourself.",
    cta: "Start tour",
  },
  {
    target: '[data-tour="modules"]',
    title: "Six products. One ecosystem.",
    body: "Each card below is a module on the adris.tech platform. Krew (agents) is live today. The other five are shipping soon — every card shows its status.",
  },
  {
    target: '[data-tour="krew-card"]',
    title: "Krew is live — try it now.",
    body: "Krew is our AI office. 43 specialist agents that work for you around the clock. Click this card to open the dashboard.",
  },
  {
    target: '[data-tour="theme"]',
    title: "Paper or Ink.",
    body: "Switch the whole site between a warm paper theme and a deep ink theme. Your choice sticks across pages.",
  },
  {
    target: '[data-tour="pricing"]',
    title: "Built for Indian budgets.",
    body: "Pricing in ₹ rupees. Free forever tier. UPI &amp; Razorpay billing. Start free, pay only when you need more.",
  },
  {
    target: '[data-tour="waitlist"]',
    title: "Join the waitlist.",
    body: "Want early access to Studio, Coder, Models, Vault and Guard? Drop your email — you'll be first in line with lifetime founder pricing.",
  },
  {
    target: null,
    title: "You're set.",
    body: "Explore on your own from here. You can replay this tour any time from the nav.",
    cta: "Got it",
    final: true,
  },
];

const TOUR_KEY = 'adris-tour-seen';

(function() {
  // Inject overlay markup once DOM is ready
  function init() {
    if (document.getElementById('tour-overlay')) return;
    const root = document.createElement('div');
    root.id = 'tour-overlay';
    root.innerHTML = `
      <div class="tour-spot" id="tour-spot"></div>
      <div class="tour-tooltip" id="tour-tooltip">
        <div class="tour-step-num" id="tour-step-num">01 / 07</div>
        <h3 id="tour-title">Welcome</h3>
        <p id="tour-body"></p>
        <div class="tour-actions">
          <button class="tour-skip" id="tour-skip">Skip tour</button>
          <div class="tour-nav">
            <button class="tour-prev" id="tour-prev">Back</button>
            <button class="tour-next" id="tour-next">Next <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h7M5 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg></button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    let idx = 0;

    function open() { document.body.classList.add('tour-open'); root.classList.add('on'); render(); }
    function close() { document.body.classList.remove('tour-open'); root.classList.remove('on'); localStorage.setItem(TOUR_KEY, '1'); }

    function getRect(sel) {
      if (!sel) return null;
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      // If the target is off-viewport, scroll it in instantly (smooth scroll
      // races the 350ms wait and the rect read returns pre-scroll coords).
      if (r.top < 80 || r.bottom > window.innerHeight - 40) {
        el.scrollIntoView({ behavior: 'auto', block: 'center' });
        // wait one frame to let layout settle, then read fresh rect
        return new Promise(res => requestAnimationFrame(() => res(el.getBoundingClientRect())));
      }
      return r;
    }

    async function render() {
      const step = TOUR_STEPS[idx];
      const total = TOUR_STEPS.length;
      document.getElementById('tour-step-num').textContent = `${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
      document.getElementById('tour-title').textContent = step.title;
      document.getElementById('tour-body').innerHTML = step.body;
      const next = document.getElementById('tour-next');
      next.innerHTML = (step.final ? (step.cta || 'Done') : (step.cta || 'Next')) + ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h7M5 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>';
      document.getElementById('tour-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';

      const spot = document.getElementById('tour-spot');
      const tip = document.getElementById('tour-tooltip');
      const rect = await getRect(step.target);

      if (!rect) {
        spot.classList.add('hide');
        tip.classList.add('center');
        tip.style.top = '50%';
        tip.style.left = '50%';
        tip.style.transform = 'translate(-50%, -50%)';
        return;
      }

      // Spotlight on target
      spot.classList.remove('hide');
      const pad = 8;
      spot.style.top = (rect.top - pad) + 'px';
      spot.style.left = (rect.left - pad) + 'px';
      spot.style.width = (rect.width + pad * 2) + 'px';
      spot.style.height = (rect.height + pad * 2) + 'px';

      // Place tooltip below or above the target
      tip.classList.remove('center');
      tip.style.transform = 'none';
      const tipWidth = 340;
      const tipHeight = tip.offsetHeight || 220;
      let top = rect.bottom + 24;
      if (top + tipHeight > window.innerHeight - 20) {
        top = rect.top - tipHeight - 24;
      }
      if (top < 20) top = 20;
      let left = rect.left + rect.width / 2 - tipWidth / 2;
      if (left < 20) left = 20;
      if (left + tipWidth > window.innerWidth - 20) left = window.innerWidth - tipWidth - 20;
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';
    }

    function next() {
      if (idx < TOUR_STEPS.length - 1) {
        idx++;
        render();
      } else {
        close();
      }
    }
    function prev() { if (idx > 0) { idx--; render(); } }

    document.getElementById('tour-next').addEventListener('click', next);
    document.getElementById('tour-prev').addEventListener('click', prev);
    document.getElementById('tour-skip').addEventListener('click', close);
    // Don't close on overlay click — too easy to dismiss accidentally.
    // Esc to close
    document.addEventListener('keydown', e => {
      if (!root.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    });
    window.addEventListener('resize', () => { if (root.classList.contains('on')) render(); });

    // Expose public API
    window.krewAiTour = {
      open: () => { idx = 0; open(); },
      close,
    };

    // Auto-start tour for first-time visitors after a brief settle
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => window.krewAiTour.open(), 900);
    }

    // Wire up any "tour" trigger buttons
    document.querySelectorAll('[data-action="tour"]').forEach(b => {
      b.addEventListener('click', e => { e.preventDefault(); window.krewAiTour.open(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

