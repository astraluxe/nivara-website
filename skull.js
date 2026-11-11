/* skull - the research list on /skull, one post on /skull/blog/<slug>, and the GitHub star counter (11 Nov 2026).
   Posts come from /skull-feed.json, which skull's agents publish after the office council (or the owner) approves them.
   Every state is drawn: loading (skeletons), empty, error with a retry - never an endless "loading". */
(function () {
  "use strict";
  var REPO = "astraluxe/skull-locker";           // the open-source repo whose stars are shown
  var NAMES = { article: "Tool review", report: "Report", update: "Update", guide: "Guide", project: "Project",
                release: "Release", notice: "Notice" };
  var LONG = { article: 1, guide: 1, report: 1 };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safe(u) { return typeof u === "string" && /^https:\/\/[^\s<>"']+$/.test(u) ? u : ""; }
  function day(d) { var x = new Date((d || "") + "T00:00:00"); return isNaN(x) ? "" : x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  function minutes(p) { var w = String(p.body || p.excerpt || "").split(/\s+/).length; return Math.max(1, Math.round(w / 220)); }
  function load() {
    return fetch("/skull-feed.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  // ---------------------------------------------------------------- the list (/skull)
  var feed = document.getElementById("skFeed");
  if (feed) {
    var posts = [], kind = "all", query = "";
    var state = function (title, text, retry) {
      feed.textContent = "";
      var box = el("div", "sk-state");
      box.appendChild(el("b", "", title));
      box.appendChild(document.createTextNode(text));
      if (retry) { var b = el("button", "sk-btn2", "Try again"); b.type = "button"; b.style.marginTop = "16px"; b.onclick = start; box.appendChild(el("br")); box.appendChild(b); }
      feed.appendChild(box);
    };
    var draw = function () {
      feed.textContent = "";
      var q = query.trim().toLowerCase();
      var shown = posts.filter(function (p) {
        return (kind === "all" || p.kind === kind) &&
               (!q || (p.title + " " + (p.excerpt || "") + " " + (p.body || "")).toLowerCase().indexOf(q) >= 0);
      });
      if (!shown.length) {
        state(q ? "Nothing matches that search." : "Nothing here yet.", q ? " Try another word, or clear the search." : " The first posts of this kind are on their way.");
        return;
      }
      shown.forEach(function (p, i) {
        var featured = i === 0 && kind === "all" && !q && LONG[p.kind];
        var c = el("article", "sk-post2" + (featured ? " featured" : ""));
        var meta = el("div", "sk-meta2");
        meta.appendChild(el("span", "k", NAMES[p.kind] || "Post"));
        if (p.date) meta.appendChild(el("span", "", day(p.date)));
        if (LONG[p.kind]) meta.appendChild(el("span", "", minutes(p) + " min read"));
        c.appendChild(meta);
        var h = el("h3");
        if (LONG[p.kind] && p.slug) { var a = el("a", "", p.title); a.href = "/skull/blog/" + p.slug; h.appendChild(a); }
        else h.textContent = p.title;
        c.appendChild(h);
        c.appendChild(el("p", "", LONG[p.kind] ? (p.excerpt || "") : (p.body || "")));
        var links = el("div", "sk-links2");
        if (LONG[p.kind] && p.slug) { var r = el("a", "", "Read it →"); r.href = "/skull/blog/" + p.slug; links.appendChild(r); }
        if (safe(p.repo)) { var g = el("a", "", "Code on GitHub ↗"); g.href = p.repo; g.target = "_blank"; g.rel = "noopener"; links.appendChild(g); }
        if (safe(p.download)) { var d = el("a", "", "Download ↓"); d.href = p.download; d.rel = "noopener"; links.appendChild(d); }
        if (links.childNodes.length) c.appendChild(links);
        feed.appendChild(c);
      });
    };
    var start = function () {
      feed.innerHTML = '<div class="sk-skel big"></div><div class="sk-skel"></div><div class="sk-skel"></div>';
      var timer = setTimeout(function () { state("The research is taking long to load.", " Check your connection, or try again.", true); }, 12000);
      load().then(function (d) {
        clearTimeout(timer);
        posts = ((d && d.posts) || []).slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
        draw();
      }).catch(function () { clearTimeout(timer); state("The research could not be loaded.", " Please try again in a moment.", true); });
    };
    document.querySelectorAll(".sk-filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-kind");
        document.querySelectorAll(".sk-filters button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        draw();
      });
    });
    var search = document.getElementById("skSearch");
    if (search) search.addEventListener("input", function () { query = search.value; draw(); });
    start();
  }

  // ---------------------------------------------------------------- the GitHub star counter (like Supabase's)
  // Shows the real star count of the repo; until the repo is public (or if GitHub does not answer) it shows
  // "Star on GitHub" with no number, so no made-up figure is ever displayed.
  var starEls = document.querySelectorAll("[data-gh-stars]");
  if (starEls.length) {
    var paint = function (n, ok) {
      starEls.forEach(function (a) {
        a.href = "https://github.com/" + REPO;
        a.querySelector(".sk-star-n").textContent = ok ? Number(n).toLocaleString("en-IN") : "";
        a.querySelector(".sk-star-t").textContent = ok ? "Star" : "Star on GitHub";
        a.hidden = false;
      });
      var link = document.getElementById("skRepoLink");
      if (ok && link) { link.textContent = "Code on GitHub ↗"; }
    };
    fetch("https://api.github.com/repos/" + REPO, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { paint(d ? d.stargazers_count : 0, !!d); })
      .catch(function () { paint(0, false); });
  }

  // ---------------------------------------------------------------- one post (/skull/blog/<slug>)
  var art = document.getElementById("skArticle");
  if (art) {
    var slug = decodeURIComponent(location.pathname.replace(/\/+$/, "").split("/").pop() || "");
    load().then(function (d) {
      var p = ((d && d.posts) || []).filter(function (x) { return x.slug === slug; })[0];
      art.textContent = "";
      if (!p) { art.appendChild(el("h1", "", "Not found")); art.appendChild(el("p", "sk-muted", "This post is not on the skull blog (yet).")); return; }
      document.title = p.title + " | skull | adris.tech";
      var m = document.querySelector('meta[name="description"]'); if (m && p.excerpt) m.setAttribute("content", p.excerpt);
      var meta = el("div", "sk-meta");
      meta.appendChild(el("span", "k", NAMES[p.kind] || "Post"));
      if (p.date) meta.appendChild(el("span", "", day(p.date)));
      if (LONG[p.kind]) meta.appendChild(el("span", "", minutes(p) + " min read"));
      art.appendChild(meta);
      art.appendChild(el("h1", "", p.title));
      if (safe(p.repo)) { var g = el("a", "sk-btn ghost sk-px sk-repo", "Code on GitHub ↗"); g.href = p.repo; g.target = "_blank"; g.rel = "noopener"; art.appendChild(g); }
      var body = el("div", "sk-body");
      body.innerHTML = window.skMd(p.body);       // skMd escapes everything first
      art.appendChild(body);
    }).catch(function () {
      art.textContent = "";
      art.appendChild(el("h1", "", "Could not load this post"));
      art.appendChild(el("p", "sk-muted", "Please try again in a moment."));
    });
  }
})();
