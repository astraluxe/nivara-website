/* ============================================
   adris.tech · Module page tours
   Spotlight walkthrough for each product page.
   Auto-detects the current page and injects
   a "Show me around" button into the nav.
============================================ */

const MODULE_TOURS = {

  krew: [
    {
      target: null,
      title: "Welcome to Krew.",
      body: "Your AI office, staffed by agents. Let me walk you through this page — or skip and explore on your own.",
      cta: "Start tour",
    },
    {
      target: '.crumb',
      title: "How to navigate back.",
      body: "This breadcrumb shows where you are. Click <strong>Modules</strong> to return to the adris.tech homepage and see all six products side by side.",
    },
    {
      target: '.nav-links',
      title: "Jump anywhere on adris.tech.",
      body: "These nav links take you to any section — Platform overview, all Modules, Pricing and the Waitlist. Always accessible from the top.",
    },
    {
      target: '.mhero',
      title: "Krew is live right now.",
      body: "Krew is the only adris.tech product running in production today. Hit <em>Open Krew</em> in the top-right to go straight to the live dashboard.",
    },
    {
      target: 'section[data-screen-label="02 Agent grid"]',
      title: "43 agents, ready to deploy.",
      body: "Browse the full catalogue here. Filter by role — Writing, Research, Code, Support — and click any card to configure an agent for your account.",
    },
    {
      target: 'section[data-screen-label="03 Approvals"]',
      title: "You're always in control.",
      body: "Before taking important actions, Krew pauses and asks for your approval. Approve or reject — nothing goes out without your say.",
    },
    {
      target: '.callout',
      title: "Ready to start?",
      body: "Click here to jump into the live dashboard. Or scroll to the footer to explore the other five adris.tech modules.",
    },
    {
      target: null,
      title: "That's Krew.",
      body: "Use the <strong>breadcrumb</strong> at the top to go back to all modules, or scroll to the <strong>footer</strong> to navigate to the next module — Studio. Replay this tour any time from the <em>Show me around</em> button in the nav.",
      final: true,
      cta: "Got it",
    },
  ],

  automation: [
    {
      target: null,
      title: "Welcome to Studio.",
      body: "adris.tech's no-code workflow builder. Connect agents to triggers, schedules and external tools — no code needed.",
      cta: "Start tour",
    },
    {
      target: '.crumb',
      title: "How to navigate back.",
      body: "Click <strong>Modules</strong> in this breadcrumb to return to the adris.tech homepage and see all six products together.",
    },
    {
      target: '.nav-links',
      title: "Jump anywhere on adris.tech.",
      body: "Platform, Modules, Pricing, Waitlist — all one click away from the top nav.",
    },
    {
      target: '.mhero',
      title: "Studio lands in Q2 2026.",
      body: "Not live yet — but you can get early access by joining the waitlist. Studio is where your Krew agents connect to the outside world.",
    },
    {
      target: 'section[data-screen-label="02 Canvas"]',
      title: "The drag-and-drop canvas.",
      body: "Drag nodes onto this canvas to build your workflow. Triggers on the left, agents in the middle, outputs on the right.",
    },
    {
      target: 'section[data-screen-label="03 Templates"]',
      title: "Start from a template.",
      body: "Don't start from scratch. Pick a ready-made template for your use case and customise it in minutes.",
    },
    {
      target: 'section[data-screen-label="04 Human-in-the-loop"]',
      title: "Pause for your approval.",
      body: "Drop a pause node anywhere in your workflow. The run halts, sends you a notification, and waits for your green light before continuing.",
    },
    {
      target: '.callout',
      title: "Get early access.",
      body: "Studio is in closed beta. Drop your email on the waitlist to be first in line when it opens.",
    },
    {
      target: null,
      title: "That's Studio.",
      body: "Use the <strong>breadcrumb</strong> to go back to all modules, or scroll to the <strong>footer</strong> to navigate to the next module — Coder. Replay this tour any time from the nav.",
      final: true,
      cta: "Got it",
    },
  ],

  coder: [
    {
      target: null,
      title: "Welcome to Coder.",
      body: "An AI coding environment with one original trick: merge RAM across a friend group to run models no single laptop could handle alone.",
      cta: "Start tour",
    },
    {
      target: '.crumb',
      title: "How to navigate back.",
      body: "This breadcrumb shows where you are. Click <strong>Modules</strong> to return to the adris.tech homepage.",
    },
    {
      target: '.nav-links',
      title: "Jump anywhere on adris.tech.",
      body: "Use the top nav to jump between Platform, Modules, Pricing or the Waitlist from any page.",
    },
    {
      target: '.mhero',
      title: "Coder ships in Q3 2026.",
      body: "Not live yet — join the waitlist to get early access and help shape the developer experience.",
    },
    {
      target: 'section[data-screen-label="02 Model selector"]',
      title: "Pick any open model.",
      body: "Llama, Mistral, Phi, Gemma — choose a model and Coder sets it up in one command. Runs locally, no cloud required.",
    },
    {
      target: 'section[data-screen-label="03 Review"]',
      title: "Repo-aware code review.",
      body: "Coder understands your entire codebase — not just the current file. Ask it to review, refactor or explain any block of code.",
    },
    {
      target: 'section[data-screen-label="05 Docs & Tests"]',
      title: "Docs and tests, automated.",
      body: "Coder generates documentation and test cases from your existing code — always in sync, one command.",
    },
    {
      target: '.callout',
      title: "Get early access.",
      body: "Coder is in closed beta. Get on the list and you'll be notified as soon as it opens.",
    },
    {
      target: null,
      title: "That's Coder.",
      body: "Use the <strong>breadcrumb</strong> to go back to all modules, or scroll to the <strong>footer</strong> to navigate to the next module — Models. Replay this tour any time from the nav.",
      final: true,
      cta: "Got it",
    },
  ],

  models: [
    {
      target: null,
      title: "Welcome to Models.",
      body: "Every open-source AI model in one place. Browse, compare and download Llama, Mistral, Phi and more — all for free.",
      cta: "Start tour",
    },
    {
      target: '.crumb',
      title: "How to navigate back.",
      body: "Click <strong>Modules</strong> in this breadcrumb to return to the adris.tech homepage and see all six products.",
    },
    {
      target: '.nav-links',
      title: "Jump anywhere on adris.tech.",
      body: "Platform, Modules, Pricing, Waitlist — all accessible from the top nav on every page.",
    },
    {
      target: '.mhero',
      title: "Models is free, forever.",
      body: "No paywall, no sign-up needed to browse. The developer acquisition engine for adris.tech — bring in builders for free.",
    },
    {
      target: 'section[data-screen-label="02 One command"]',
      title: "One-command install.",
      body: "<code>adris models install &lt;name&gt;</code> — that's all. Coder picks it up automatically and you're running locally in minutes.",
    },
    {
      target: 'section[data-screen-label="03 Compare"]',
      title: "Compare models side by side.",
      body: "Run the same prompt through two models and compare output quality, speed and size at a glance.",
    },
    {
      target: 'section[data-screen-label="05 Collections"]',
      title: "Curated collections.",
      body: "Not sure where to start? Collections group models by use case — coding, writing, reasoning, multilingual and more.",
    },
    {
      target: '.callout',
      title: "Start downloading.",
      body: "Models is completely free. No waitlist, no credit card. Just install and run.",
    },
    {
      target: null,
      title: "That's Models.",
      body: "Use the <strong>breadcrumb</strong> to go back to all modules, or scroll to the <strong>footer</strong> to navigate to the next module — Vault. Replay this tour any time from the nav.",
      final: true,
      cta: "Got it",
    },
  ],

  vault: [
    {
      target: null,
      title: "Welcome to Vault.",
      body: "A WireGuard VPN included with every adris.tech account — completely free, even on the Explore tier.",
      cta: "Start tour",
    },
    {
      target: '.crumb',
      title: "How to navigate back.",
      body: "Use this breadcrumb to return to the adris.tech modules page at any time.",
    },
    {
      target: '.nav-links',
      title: "Jump anywhere on adris.tech.",
      body: "Platform, Modules, Pricing, Waitlist — always one click from the top of every page.",
    },
    {
      target: '.mhero',
      title: "Always on, even when you're not.",
      body: "Unlike most VPNs, Vault runs in the background automatically — keeping adris.tech present on your device every day, not just when you're actively using AI.",
    },
    {
      target: 'section[data-screen-label="02 One click"]',
      title: "One-click connect.",
      body: "Tap once to connect. No config files, no manual setup. Vault picks the fastest server for you automatically.",
    },
    {
      target: 'section[data-screen-label="03 Servers"]',
      title: "India-first server network.",
      body: "Mumbai, Bengaluru, Singapore and Frankfurt. India nodes mean low latency — important for real-time agent and API calls.",
    },
    {
      target: 'section[data-screen-label="04 Zero-log"]',
      title: "No logs. Ever.",
      body: "Vault operates a verified no-log policy. Your traffic is not recorded, not analysed, not sold. Guaranteed.",
    },
    {
      target: '.callout',
      title: "Get Vault free.",
      body: "Join the waitlist and Vault comes with your adris.tech account at no extra cost — on every plan including the free Explore tier.",
    },
    {
      target: null,
      title: "That's Vault.",
      body: "Use the <strong>breadcrumb</strong> to go back to all modules, or scroll to the <strong>footer</strong> to navigate to the final module — Guard. Replay this tour any time from the nav.",
      final: true,
      cta: "Got it",
    },
  ],

  guard: [
    {
      target: null,
      title: "Welcome to Guard.",
      body: "Enterprise-grade cybersecurity for small businesses — without needing a dedicated IT team.",
      cta: "Start tour",
    },
    {
      target: '.crumb',
      title: "How to navigate back.",
      body: "Use this breadcrumb to return to the adris.tech homepage and see all six modules together.",
    },
    {
      target: '.nav-links',
      title: "Jump anywhere on adris.tech.",
      body: "Platform, Modules, Pricing, Waitlist — always accessible from the top nav.",
    },
    {
      target: '.mhero',
      title: "Guard ships in H2 2026.",
      body: "The last module to ship — and the highest price-tolerance product on the platform.",
    },
    {
      target: 'section[data-screen-label="02 Contract Scanner"]',
      title: "AI contract scanning.",
      body: "Upload any contract and Guard flags risky clauses, GDPR/DPDP violations and hidden liabilities — in seconds.",
    },
    {
      target: 'section[data-screen-label="03 Phishing"]',
      title: "Phishing protection.",
      body: "Guard monitors your email and Slack for phishing attempts, suspicious links and impersonation attacks in real time.",
    },
    {
      target: 'section[data-screen-label="05 Compliance"]',
      title: "Compliance monitoring.",
      body: "SOC 2, GDPR and India's DPDP — Guard tracks your compliance posture and maintains a full audit trail automatically.",
    },
    {
      target: '.callout',
      title: "Get early access.",
      body: "Guard is in pre-launch. Join the waitlist to be notified when it opens — and to lock in founder pricing.",
    },
    {
      target: null,
      title: "You've seen all six modules.",
      body: "Use the <strong>breadcrumb</strong> to go back to the full overview, or join the waitlist from the nav. You can replay this tour any time from the <em>Show me around</em> button.",
      final: true,
      cta: "Got it",
    },
  ],
};

const TOUR_PREFIX = 'adris-module-tour-';

(function () {

  function getPageKey() {
    const path = window.location.pathname;
    const match = path.match(/([^/\\]+)\.html$/);
    if (!match) return null;
    const name = match[1];
    return MODULE_TOURS[name] ? name : null;
  }

  function injectTourBtn() {
    if (document.querySelector('.nav-tour-btn')) return;
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    const btn = document.createElement('button');
    btn.className = 'nav-tour-btn';
    btn.setAttribute('data-action', 'tour');
    btn.setAttribute('title', 'Take a tour of this page');
    btn.innerHTML = '<span class="pulse"></span>Show me around';
    navRight.insertBefore(btn, navRight.firstChild);
  }

  function buildOverlay() {
    if (document.getElementById('tour-overlay')) return null;
    const root = document.createElement('div');
    root.id = 'tour-overlay';
    root.innerHTML = `
      <div class="tour-spot" id="tour-spot"></div>
      <div class="tour-tooltip" id="tour-tooltip">
        <div class="tour-step-num" id="tour-step-num"></div>
        <h3 id="tour-title"></h3>
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
    return root;
  }

  function initTour(pageKey) {
    const steps = MODULE_TOURS[pageKey];
    const seenKey = TOUR_PREFIX + pageKey;

    injectTourBtn();
    const root = buildOverlay();
    if (!root) return;

    let idx = 0;

    function open() {
      document.body.classList.add('tour-open');
      root.classList.add('on');
      render();
    }

    function close() {
      document.body.classList.remove('tour-open');
      root.classList.remove('on');
      localStorage.setItem(seenKey, '1');
    }

    function getRect(sel) {
      if (!sel) return null;
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.top < 80 || r.bottom > window.innerHeight - 40) {
        el.scrollIntoView({ behavior: 'auto', block: 'center' });
        return new Promise(res => requestAnimationFrame(() => res(el.getBoundingClientRect())));
      }
      return r;
    }

    async function render() {
      const step = steps[idx];
      const total = steps.length;

      document.getElementById('tour-step-num').textContent =
        String(idx + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      document.getElementById('tour-title').textContent = step.title;
      document.getElementById('tour-body').innerHTML = step.body;

      const nextBtn = document.getElementById('tour-next');
      nextBtn.innerHTML =
        (step.final ? (step.cta || 'Done') : (step.cta || 'Next')) +
        ' <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h7M5 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>';

      document.getElementById('tour-prev').style.visibility = idx === 0 ? 'hidden' : 'visible';
      document.getElementById('tour-skip').textContent = step.final ? 'Close' : 'Skip tour';

      const spot = document.getElementById('tour-spot');
      const tip  = document.getElementById('tour-tooltip');
      const rect = await getRect(step.target);

      if (!rect) {
        spot.classList.add('hide');
        tip.classList.add('center');
        tip.style.top       = '50%';
        tip.style.left      = '50%';
        tip.style.transform = 'translate(-50%, -50%)';
        return;
      }

      spot.classList.remove('hide');
      tip.classList.remove('center');
      tip.style.transform = 'none';

      const pad = 8;
      spot.style.top    = (rect.top  - pad) + 'px';
      spot.style.left   = (rect.left - pad) + 'px';
      spot.style.width  = (rect.width  + pad * 2) + 'px';
      spot.style.height = (rect.height + pad * 2) + 'px';

      const tipWidth  = 340;
      const tipHeight = tip.offsetHeight || 220;
      let top  = rect.bottom + 24;
      if (top + tipHeight > window.innerHeight - 20) top = rect.top - tipHeight - 24;
      if (top < 20) top = 20;
      let left = rect.left + rect.width / 2 - tipWidth / 2;
      if (left < 20) left = 20;
      if (left + tipWidth > window.innerWidth - 20) left = window.innerWidth - tipWidth - 20;
      tip.style.top  = top  + 'px';
      tip.style.left = left + 'px';
    }

    function next() {
      if (idx < steps.length - 1) { idx++; render(); } else { close(); }
    }
    function prev() { if (idx > 0) { idx--; render(); } }

    document.getElementById('tour-next').addEventListener('click', next);
    document.getElementById('tour-prev').addEventListener('click', prev);
    document.getElementById('tour-skip').addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (!root.classList.contains('on')) return;
      if (e.key === 'Escape')   close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    });

    window.addEventListener('resize', () => {
      if (root.classList.contains('on')) render();
    });

    window.krewAiTour = { open: () => { idx = 0; open(); }, close };

    // Wire up all trigger buttons (including the injected one)
    document.querySelectorAll('[data-action="tour"]').forEach(b => {
      b.addEventListener('click', e => { e.preventDefault(); window.krewAiTour.open(); });
    });

    // Auto-show on first visit to this page
    if (!localStorage.getItem(seenKey)) {
      setTimeout(() => window.krewAiTour.open(), 900);
    }
  }

  function init() {
    const key = getPageKey();
    if (!key) return;
    initTour(key);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

