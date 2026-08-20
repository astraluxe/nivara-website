/* "On this page" — keep the highlight on the section you are actually reading.
 *
 * The sidebar ships with class="active" on the first link, which is right when the page loads and
 * wrong the moment you scroll: the purple marker sat on item 01 while you were reading item 04.
 * The module pages have carried this logic inline for a while; the landing pages were built from
 * the same markup without it, which is where the stuck marker came from.
 *
 * WHY THIS IS A SCROLL CALCULATION AND NOT AN IntersectionObserver.
 * The obvious version observes each section inside a narrow band near the top of the screen. It
 * works while you are in the middle of the page and fails at both ends: scroll back to the top and
 * NO section is inside the band, so nothing fires and the marker keeps pointing at whatever you
 * last read. Scroll to the very bottom and the final short section may never fill the band either.
 *
 * Asking "which section have I scrolled past?" has an answer at every scroll position, including
 * the two ends, so that is what this does.
 */
(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll('.hiw-section[id]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.hiw-nav a'));
  if (!sections.length || !links.length) return;

  function mark(id) {
    var hit = null;
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute('href') || '') === '#' + id) { hit = links[i]; break; }
    }
    if (!hit || hit.classList.contains('active')) return;
    links.forEach(function (a) { a.classList.remove('active'); });
    hit.classList.add('active');
  }

  function current() {
    // The reading line: a section becomes "current" once its heading reaches the upper third,
    // which is roughly where the eye sits — not when it first peeks in at the bottom.
    var line = window.innerHeight * 0.3;
    var cur = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) cur = sections[i];
      else break;
    }
    // At the very bottom the last section can be too short to cross the line, so the marker would
    // stop one early on every page whose final section is small.
    if (window.innerY !== undefined) { /* no-op, keeps older engines quiet */ }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      cur = sections[sections.length - 1];
    }
    return cur.id;
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; mark(current()); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Clicking a link moves the marker at once rather than waiting for the scroll to settle.
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      var id = (a.getAttribute('href') || '').replace('#', '');
      if (id) setTimeout(function () { mark(id); }, 0);
    });
  });

  // Landing on /page#section should highlight that section, not the first one.
  if (location.hash.length > 1) mark(location.hash.slice(1));
  else mark(current());
})();
