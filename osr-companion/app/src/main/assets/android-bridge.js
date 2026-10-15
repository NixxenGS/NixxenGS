/* Glue between the bundled companion page and the Android shell (NativeBridge.kt).
 * The page looks for window.osrHost and falls back to browser APIs without it,
 * so index.html also runs as-is in a normal browser. */
(function () {
  'use strict';
  var bridge = window.OSRAndroid;
  if (!bridge || window.__osrNative) return;

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

  window.osrHost = {
    native: true,
    saveFile: function (filename, text) {
      return new Promise(function (resolve, reject) {
        var id = ++seq;
        pending[id] = { resolve: resolve, reject: reject };
        bridge.saveFile(String(filename || 'export.json'), String(text), id);
      });
    },
    copyText: function (text) {
      bridge.copyText(String(text));
      return Promise.resolve();
    },
    haptic: function (strength) {
      try { bridge.haptic(strength | 0); } catch (e) {}
    }
  };

  // Hardware/gesture back: the page closes the top sheet or page first.
  // false = nothing left to go back to, so Android leaves the app.
  function back() {
    return !!(window.App && window.App.back && window.App.back());
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

  window.__osrNative = { settle: settle, back: back, reportTheme: reportTheme };
})();
