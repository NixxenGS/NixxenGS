/* Glue between the bundled companion page and the Android shell (NativeBridge.kt).
 * The page already prefers window.claude.use('downloads') for exports, so we provide
 * just that capability; 'db' / 'user' resolve to null, which keeps account sync off
 * and characters in on-device localStorage. */
(function () {
  'use strict';
  var bridge = window.HHAndroid;
  if (!bridge || window.__hhNative) return;

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

  var downloads = {
    save: function (opts) {
      opts = opts || {};
      var data = typeof opts.data === 'string' ? opts.data : JSON.stringify(opts.data);
      return new Promise(function (resolve, reject) {
        var id = ++seq;
        pending[id] = { resolve: resolve, reject: reject };
        bridge.saveFile(String(opts.filename || 'export.json'), data, id);
      });
    }
  };

  window.claude = {
    use: function (name) {
      return Promise.resolve(name === 'downloads' ? downloads : null);
    }
  };

  // Route clipboard writes through Android's ClipboardManager.
  function writeText(text) {
    bridge.copyText(String(text));
    return Promise.resolve();
  }
  try {
    if (navigator.clipboard) navigator.clipboard.writeText = writeText;
    else Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeText }, configurable: true });
  } catch (e) {}

  // Hardware/gesture back: close the open dialog, step back in the generator,
  // or return from a sheet to the character list. false = nothing left to go back to.
  function back() {
    if (document.getElementById('modal')) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return true;
    }
    var btn = document.querySelector('[data-act="gPrev"]') ||
      document.querySelector('[data-act="gExit"]') ||
      document.querySelector('.topbar [data-act="home"]');
    if (btn) {
      btn.click();
      return true;
    }
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
    try {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', function () { setTimeout(reportTheme, 30); });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchTheme);
  else watchTheme();

  window.__hhNative = { settle: settle, back: back, reportTheme: reportTheme };
})();
