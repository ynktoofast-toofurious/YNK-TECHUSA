// Temporary while the AWS order API is offline: explain paused checkout and skip the failing order save.
(function () {
  'use strict';

  var CSS = '' +
    '.ynk-sn-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,9,18,.72);backdrop-filter:blur(6px);font-family:Inter,system-ui,sans-serif}' +
    '.ynk-sn-card{position:relative;max-width:440px;width:100%;padding:34px 28px 26px;border-radius:24px;text-align:center;color:#f1f5f9;background:radial-gradient(ellipse 70% 60% at 50% 0%,rgba(41,181,232,.18),transparent 70%),#0c1324;border:1px solid rgba(41,181,232,.3);box-shadow:0 30px 80px rgba(0,0,0,.55)}' +
    '.ynk-sn-card h2{margin:14px 0 8px;font-size:1.3rem;font-weight:700}' +
    '.ynk-sn-card p{margin:0 0 10px;font-size:.95rem;line-height:1.6;color:#94a3b8}' +
    '.ynk-sn-icon{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:16px;color:#29B5E8;background:rgba(41,181,232,.12);border:1px solid rgba(41,181,232,.3)}' +
    '.ynk-sn-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px}' +
    '.ynk-sn-actions a,.ynk-sn-actions button{padding:11px 20px;border-radius:999px;font:600 .9rem Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}' +
    '.ynk-sn-ok{background:transparent;color:#f1f5f9;border:1px solid rgba(255,255,255,.18)}' +
    '.ynk-sn-cta{color:#fff;border:0;background:linear-gradient(135deg,#29B5E8,#06b6d4)}';

  var ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>';

  function showNotice() {
    if (document.querySelector('.ynk-sn-overlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'ynk-sn-overlay';
    overlay.innerHTML =
      '<div class="ynk-sn-card" role="alertdialog" aria-modal="true" aria-labelledby="ynk-sn-title">' +
        '<span class="ynk-sn-icon">' + ICON + '</span>' +
        '<h2 id="ynk-sn-title">We\u2019re making a few improvements</h2>' +
        '<p>Online checkout is temporarily paused while we upgrade our systems. It will be back up soon.</p>' +
        '<p>Want your order now? Send us a quick project brief and we\u2019ll prepare it personally.</p>' +
        '<div class="ynk-sn-actions">' +
          '<button type="button" class="ynk-sn-ok">Got it</button>' +
          '<a class="ynk-sn-cta" href="/start-project?category=branding">Start a Project</a>' +
        '</div>' +
      '</div>';
    function close() { overlay.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.ynk-sn-ok').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    overlay.querySelector('.ynk-sn-ok').focus();
  }

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.cart-checkout-btn')) {
      e.preventDefault();
      showNotice();
    }
  }, true);

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/\/api\/orders$/.test(url)) {
      return Promise.resolve(new Response(JSON.stringify({ paused: true }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
    }
    return nativeFetch(input, init);
  };
})();
