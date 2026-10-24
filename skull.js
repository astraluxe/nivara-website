/* skull - the blog list on /skull and one post on /skull/blog/<slug> (24 Oct 2026). Posts come from
   /skull-feed.json, which skull's agents publish after the office council (or the owner) approves them. */
(function () {
  "use strict";
  var NAMES = { article: "tool review", report: "report", update: "update", guide: "guide", project: "project",
                release: "release", notice: "notice" };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safe(u) { return typeof u === "string" && /^https:\/\/[^\s<>"']+$/.test(u) ? u : ""; }
  function day(d) { var x = new Date((d || "") + "T00:00:00"); return isNaN(x) ? "" : x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  function load() { return fetch("/skull-feed.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : { posts: [] }; }).catch(function () { return { posts: [] }; }); }
  var LONG = { article: 1, guide: 1, report: 1 };

  // ---------------------------------------------------------------- the list (/skull)
  var feed = document.getElementById("skFeed");
  if (feed) {
    var posts = [], kind = "all";
    var draw = function () {
      feed.textContent = "";
      var shown = posts.filter(function (p) { return kind === "all" || p.kind === kind; });
      if (!shown.length) { feed.appendChild(el("p", "sk-muted", "Nothing here yet - the first ones are on their way.")); return; }
      shown.forEach(function (p, i) {
        var c = el("article", "sk-card sk-px" + (i === 0 && kind === "all" && LONG[p.kind] ? " featured" : ""));
        var meta = el("div", "sk-meta");
        meta.appendChild(el("span", "k", NAMES[p.kind] || "post"));
        if (p.date) meta.appendChild(el("span", "", day(p.date)));
        c.appendChild(meta);
        var h = el("h3");
        var slug = p.slug || "";
        if (LONG[p.kind] && slug) { var a = el("a", "", p.title); a.href = "/skull/blog/" + slug; h.appendChild(a); }
        else h.textContent = p.title;
        c.appendChild(h);
        c.appendChild(el("p", "", LONG[p.kind] ? (p.excerpt || "") : (p.body || "")));
        var links = el("div", "sk-links");
        if (LONG[p.kind] && slug) { var r = el("a", "sk-read", "Read it →"); r.href = "/skull/blog/" + slug; links.appendChild(r); }
        if (safe(p.repo)) { var g = el("a", "", "Code on GitHub ↗"); g.href = p.repo; g.target = "_blank"; g.rel = "noopener"; links.appendChild(g); }
        if (safe(p.download)) { var d = el("a", "", "Download ↓"); d.href = p.download; d.rel = "noopener"; links.appendChild(d); }
        if (links.childNodes.length) c.appendChild(links);
        feed.appendChild(c);
      });
    };
    document.querySelectorAll(".sk-filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-kind");
        document.querySelectorAll(".sk-filters button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        draw();
      });
    });
    load().then(function (d) { posts = (d && d.posts) || []; draw(); if (location.pathname.indexOf("/skull/blog") === 0) { var s = document.getElementById("blog"); if (s) s.scrollIntoView(); } });
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
      meta.appendChild(el("span", "k", NAMES[p.kind] || "post"));
      if (p.date) meta.appendChild(el("span", "", day(p.date)));
      art.appendChild(meta);
      art.appendChild(el("h1", "", p.title));
      if (safe(p.repo)) { var g = el("a", "sk-btn ghost sk-px sk-repo", "Code on GitHub ↗"); g.href = p.repo; g.target = "_blank"; g.rel = "noopener"; art.appendChild(g); }
      var body = el("div", "sk-body");
      body.innerHTML = window.skMd(p.body);       // skMd escapes everything first
      art.appendChild(body);
    });
  }
})();
