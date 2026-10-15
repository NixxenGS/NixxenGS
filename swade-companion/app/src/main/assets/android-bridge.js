/* Glue between the bundled companion page and the Android shell (NativeBridge.kt).
 * The page saves exports through a Blob link with a download attribute, which a
 * WebView ignores, so we catch those clicks and hand the text to Android's save
 * dialog. Clipboard, print and the back button are routed to native code too. */
(function () {
  'use strict';
  var bridge = window.SWAndroid;
  if (!bridge || window.__swNative) return;

  var seq = 0;
  var pending = {};

  function settle(id, ok, code) {
    var p = pending[id];
    if (!p) return;
    delete pending[id];
    if (ok) {
      p.resolve();
    } else {
      var err = new Error(code || 'error');
      err.code = code || 'error';
      p.reject(err);
    }
  }

  function saveText(name, text) {
    return new Promise(function (resolve, reject) {
      var id = ++seq;
      pending[id] = { resolve: resolve, reject: reject };
      bridge.saveFile(String(name || 'export.json'), String(text), id);
    });
  }

  // Remember the Blobs behind object URLs so a download link can be read back.
  var blobs = {};
  var createObjectURL = URL.createObjectURL;
  var revokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = function (obj) {
    var url = createObjectURL.apply(URL, arguments);
    if (obj instanceof Blob) blobs[url] = obj;
    return url;
  };
  // The page revokes right after clicking; keep the Blob until we've read it.
  URL.revokeObjectURL = function (url) {
    if (!blobs[url]) revokeObjectURL.apply(URL, arguments);
  };

  function readBlob(url) {
    var blob = blobs[url];
    if (blob) return blob.text().finally(function () { delete blobs[url]; revokeObjectURL.call(URL, url); });
    return fetch(url).then(function (r) { return r.text(); });
  }

  // Covers both a.click() on a detached-then-appended link and real taps.
  window.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('blob:') !== 0 && href.indexOf('data:') !== 0) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    readBlob(href)
      .then(function (text) { return saveText(a.getAttribute('download'), text); })
      .catch(function () {});
  }, true);

  // Route clipboard writes through Android's ClipboardManager.
  function writeText(text) {
    bridge.copyText(String(text));
    return Promise.resolve();
  }
  try {
    if (navigator.clipboard) navigator.clipboard.writeText = writeText;
    else Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeText }, configurable: true });
  } catch (e) {}

  // The sheet's Print button opens Android's print dialog (which can save a PDF).
  window.print = function () { bridge.print(document.title || 'Savage Worlds'); };

  // getClientRects, not offsetParent: the roll panel is position: fixed.
  function visible(el) { return !!(el && el.getClientRects().length); }
  function clickFirst(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && !el.disabled) { el.click(); return true; }
    }
    return false;
  }

  // Hardware/gesture back: close the open dialog, hide the roll result, step back
  // through the builder, then return to the Roster. false = let Android exit.
  function back() {
    if (document.querySelector('#modal-root .modal')) {
      if (!clickFirst(['#modal-root [data-a="rbClose"]', '#modal-root .modal-h [data-a="closeModal"]'])) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
      return true;
    }
    var bar = document.querySelector('.rollbar:not([hidden])');
    if (visible(bar) && clickFirst(['.rollbar:not([hidden]) [data-a="barClose"]'])) return true;

    var step = document.querySelector('.stepbtn[aria-current="step"]');
    var prev = step && step.previousElementSibling;
    if (prev && prev.classList.contains('stepbtn')) { prev.click(); return true; }

    var onRoster = document.querySelector('.tab[data-tab="roster"][aria-current="page"]');
    if (!onRoster && clickFirst(['.tab[data-tab="roster"]'])) return true;
    return false;
  }

  // Keep the system bars the same colour as the page, including theme switches.
  var lastBg = '';
  function reportTheme() {
    try {
      var bg = getComputedStyle(document.body || document.documentElement).backgroundColor;
      if (bg && bg !== lastBg) {
        lastBg = bg;
        bridge.setPageColor(bg);
      }
    } catch (e) {}
  }
  function watchTheme() {
    reportTheme();
    new MutationObserver(function () { setTimeout(reportTheme, 30); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchTheme);
  else watchTheme();

  window.__swNative = { settle: settle, back: back, reportTheme: reportTheme };
})();
