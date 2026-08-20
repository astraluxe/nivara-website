/* Signed-in state in the top navigation — ONE copy, used by every page.
 *
 * This block used to live inline in home.html and NIVARA.html only, so those two pages swapped
 * the Sign in link for the user's avatar and every other page — pricing, download, docs, the
 * module pages, the blog — kept showing Sign in to someone who was already signed in. The nav is
 * the same bar on every page and it has to say the same thing on every page.
 *
 * It also catches an OAuth redirect that lands on the wrong page and forwards it to /signin.
 *
 * Requires the Supabase UMD bundle to have loaded first; include both before </body>. */
(function () {
  if (window.location.hash.indexOf('access_token=') > -1 || window.location.search.indexOf('code=') > -1) {
    window.location.replace('/signin' + window.location.search + window.location.hash);
    return;
  }
  var sb = window.supabase.createClient(
    'https://xkkqcqsacgdrfwbwdqsp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra3FjcXNhY2dkcmZ3YndkcXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTU0NzQsImV4cCI6MjA4OTQ3MTQ3NH0.gD57n_392PovM1QBVRsstzL4EQM-jvVeTbu_O1f-3l0'
  );
  function updateNav(session) {
    var el = document.getElementById('navSignIn');
    if (!el || !session) return;
    var meta = session.user.user_metadata || {};
    var avatar = meta.avatar_url || meta.picture;
    var name = meta.full_name || meta.name || session.user.email;
    el.removeAttribute('onmouseover');
    el.removeAttribute('onmouseout');
    if (avatar) {
      el.style.cssText = 'padding:2px;border:2px solid var(--rule-strong,#e5e5e5);border-radius:50%;display:inline-flex;align-items:center;text-decoration:none;flex-shrink:0;';
      el.innerHTML = '<img src="' + avatar + '" alt="' + name + '" title="' + name + '" style="width:26px;height:26px;border-radius:50%;display:block;object-fit:cover;">';
    } else {
      el.style.cssText = 'width:30px;height:30px;border:2px solid var(--rule-strong,#e5e5e5);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;flex-shrink:0;font-size:12px;font-weight:600;color:var(--ink);';
      el.textContent = (name || 'U').charAt(0).toUpperCase();
    }
  }
  try {
    var stored = localStorage.getItem('sb-xkkqcqsacgdrfwbwdqsp-auth-token');
    if (stored) { var sess = JSON.parse(stored); if (sess && sess.user) updateNav(sess); }
  } catch (_) {}
  sb.auth.getSession().then(function (r) { updateNav(r.data.session); });
  sb.auth.onAuthStateChange(function (_e, s) { updateNav(s); });
})();
