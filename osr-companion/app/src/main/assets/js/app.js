/* OSR Companion: single-page character app. Home dashboard + pages pushed from a launcher. */
(function () {
  'use strict';
  var D = window.OSR, R = window.Rules, sign = R.sign, ord = R.ordinal;
  var KEY = 'osr.char.v1', SKEY = 'osr.settings.v1', LKEY = 'osr.log.v1';

  // ---------------------------------------------------------------- state
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function fetchKey(k) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function normalize(c) {
    var base = clone(D.ZAPHYRE);
    for (var k in base) if (c[k] === undefined) c[k] = base[k];
    ['used', 'hp', 'death', 'notes', 'coins', 'spells'].forEach(function (k) { for (var j in base[k]) if (c[k][j] === undefined) c[k][j] = base[k][j]; });
    if (!c.used.slots) c.used.slots = {};
    if (!c.used.legacy) c.used.legacy = {};
    return c;
  }
  var C = normalize(fetchKey(KEY) || clone(D.ZAPHYRE));
  var ST = Object.assign({ theme: 'system', palette: 'twilight', sound: true, haptics: true, dice3d: true }, fetchKey(SKEY) || {});
  var LOG = fetchKey(LKEY) || [];
  var mode = '';  // '', 'adv', 'dis' (one-shot for the next d20)
  var nav = [];   // stack of page names above home
  var Dv;         // derived values, refreshed on every render
  window.DiceSettings = ST;

  function save() { store(KEY, C); }
  function commit() { save(); render(); }

  // ---------------------------------------------------------------- helpers
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  var ICONS = {
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    sword: '<path d="M14.5 4H20v5.5L9 20.5 3.5 15z"/><path d="M6.5 13.5l4 4M3 21l2.5-2.5"/>',
    star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5z"/><path d="M5 19.5A1.5 1.5 0 006.5 21H19v-3"/><path d="M9 7h6"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/>',
    die: '<path d="M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9z"/><path d="M12 2.5 7.5 15h9z M3.5 7.5 7.5 15 M20.5 7.5 16.5 15 M12 21.5 7.5 15 M12 21.5l4.5-6.5"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v4.5H19M9 12h6M9 16h6"/>',
    bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5"/><circle cx="7" cy="11" r="1.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    skull: '<path d="M12 3a7 7 0 00-7 7c0 2.4 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.6 2.5-5a7 7 0 00-7-7z"/><circle cx="9.3" cy="10.5" r="1.4"/><circle cx="14.7" cy="10.5" r="1.4"/><path d="M10 18v3M14 18v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    flame: '<path d="M12 21c-4 0-6.5-2.8-6.5-6.2 0-3.6 2.8-5.6 3.8-8.8 1.6 1.4 2.2 3 2.2 4.5 1-1 1.6-2.4 1.6-4 2.5 1.8 5.4 5 5.4 8.4C18.5 18.3 16 21 12 21z"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>'
  };
  function ic(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24">' + (ICONS[n] || '') + '</svg>'; }
  var toastT;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, 2400);
  }
  function haptic(s) { if (!ST.haptics) return; if (window.osrHost) window.osrHost.haptic(s || 0); else if (navigator.vibrate) navigator.vibrate(s >= 2 ? 30 : 10); }
  function abilName(k) { for (var i = 0; i < D.ABILITIES.length; i++) if (D.ABILITIES[i].k === k) return D.ABILITIES[i]; return { s: k }; }
  function skillOf(k) { for (var i = 0; i < D.SKILLS.length; i++) if (D.SKILLS[i].k === k) return D.SKILLS[i]; return null; }
  function saveOf(c) { for (var i = 0; i < D.SAVES.length; i++) if (D.SAVES[i].c === c) return D.SAVES[i]; return null; }
  function classLine() {
    return C.classes.filter(function (k) { return k.level > 0; }).map(function (k) {
      var cl = D.CLASSES[k.id], sub = k.sub && cl.subs[k.sub] ? ' (' + cl.subs[k.sub].n.replace(' Domain', '').replace('Path of the ', '').replace('Path of ', '') + ')' : '';
      return cl.n + ' ' + k.level + sub;
    }).join(' · ');
  }

  function applyTheme() {
    if (ST.theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', ST.theme);
  }

  // ---------------------------------------------------------------- dice parsing & rolling
  function parseDice(expr) {
    // "2d6+1d4+3" → { groups:[{n,s}], mod }
    var out = { groups: [], mod: 0 };
    String(expr).replace(/\s+/g, '').replace(/([+-]?)(\d*)d(\d+|%)|([+-]?)(\d+)/gi, function (m, sg, n, s, sg2, k) {
      if (s) {
        var sides = s === '%' ? 100 : +s;
        out.groups.push({ n: (+n || 1) * (sg === '-' ? -1 : 1), s: sides });
      } else if (k) out.mod += (sg2 === '-' ? -1 : 1) * +k;
      return '';
    });
    return out;
  }
  function diceText(groups, mod) {
    var t = groups.map(function (g) { return g.n + 'd' + g.s; }).join('+');
    if (mod) t += (mod > 0 ? '+' : '−') + Math.abs(mod);
    return t || String(mod || 0);
  }
  function addDice(expr, extra, times) {
    var a = parseDice(expr);
    if (extra && times > 0) {
      var b = parseDice(extra);
      b.groups.forEach(function (g) {
        var hit = a.groups.filter(function (x) { return x.s === g.s; })[0];
        if (hit) hit.n += g.n * times; else a.groups.push({ n: g.n * times, s: g.s });
      });
    }
    return diceText(a.groups, a.mod);
  }

  /* spec: { label, sub, type:'test'|'dmg'|'heal'|'temp'|'free', expr, mod, adv, crit, next, onResult(total, info) } */
  function roll(spec) {
    var parts = [], total = 0, natural = null;
    if (spec.type === 'test') {
      var m = spec.adv !== undefined ? spec.adv : mode;
      if (spec.adv === undefined && mode) { mode = ''; render(); }
      var a = Dice3D.rollDie(20), b = m ? Dice3D.rollDie(20) : null;
      var useB = b !== null && ((m === 'adv' && b > a) || (m === 'dis' && b < a));
      parts.push({ kind: 'd20', label: String(a), value: a, s: 20, drop: useB });
      if (b !== null) parts.push({ kind: 'd20', label: String(b), value: b, s: 20, drop: !useB });
      var keep = useB ? b : a;
      natural = keep;
      total = keep + (spec.mod || 0);
      spec.modeUsed = m;
    } else {
      var p = parseDice(spec.expr || '');
      p.groups.forEach(function (g) {
        var n = Math.abs(g.n) * (spec.crit ? 2 : 1), neg = g.n < 0;
        for (var i = 0; i < n; i++) {
          if (g.s === 100) {
            var tens = Dice3D.rollDie(10) - 1, units = Dice3D.rollDie(10) - 1, v = tens * 10 + units || 100;
            parts.push({ kind: 'd100', label: tens === 0 ? '00' : String(tens * 10), value: v, s: 100, pair: true });
            parts.push({ kind: 'd10u', label: String(units), value: 0, s: 10, hidden: true });
            total += neg ? -v : v;
          } else {
            var r = Dice3D.rollDie(g.s);
            parts.push({ kind: 'd' + g.s, label: String(r), value: r, s: g.s, neg: neg });
            total += neg ? -r : r;
          }
        }
      });
      total += (p.mod || 0) + (spec.mod || 0);
      if (spec.type === 'dmg' || spec.type === 'heal' || spec.type === 'temp') total = Math.max(spec.type === 'dmg' ? 1 : 0, total);
    }
    var info = { parts: parts, natural: natural };
    LOG.unshift({ t: Date.now(), label: spec.label, sub: spec.sub || '', total: total, nat: natural, dice: parts.filter(function (x) { return !x.hidden; }).map(function (x) { return (x.drop ? '~' : '') + x.value; }).join(' ') });
    if (LOG.length > 60) LOG.length = 60;
    store(LKEY, LOG);
    showRoll(spec, info, total);
  }

  var layerBusy = false, lastSpec = null;
  function showRoll(spec, info, total) {
    var layer = $('#dice-layer'), card = $('#result');
    layer.classList.add('on');
    card.classList.remove('show');
    card.innerHTML = '';
    layerBusy = true;
    lastSpec = spec;
    var use3d = ST.dice3d && Dice3D.supported() && Dice3D.init($('#dice-canvas'));
    var done = function () { layerBusy = false; resultCard(spec, info, total); haptic(info.natural === 20 ? 2 : 1); };
    if (use3d) {
      $('#dice-canvas').style.display = 'block';
      var shown = info.parts.slice(0, 14).map(function (p) { return { kind: p.kind, label: p.label, palette: ST.palette, dim: p.drop }; });
      Dice3D.throwDice(shown, { fast: info.parts.length > 8 }).then(done);
    } else {
      $('#dice-canvas').style.display = 'none';
      setTimeout(done, 120);
    }
  }

  function resultCard(spec, info, total) {
    var card = $('#result');
    var nat = info.natural;
    var flag = '';
    if (spec.type === 'test' && nat === 20) flag = '<span class="flag crit">NATURAL 20</span>';
    else if (spec.type === 'test' && nat === 1) flag = '<span class="flag fumble">NATURAL 1</span>';
    else if (spec.crit) flag = '<span class="flag crit">CRITICAL</span>';
    if (spec.dc && spec.type === 'test') flag += total >= spec.dc ? ' <span class="flag okf">SUCCESS</span>' : ' <span class="flag fumble">FAIL</span>';
    var chips = info.parts.filter(function (p) { return !p.hidden; }).map(function (p) {
      var cls = p.drop ? ' drop' : p.value === p.s ? ' max' : p.value === 1 ? ' min' : '';
      return '<span class="die-chip' + cls + '">' + (p.neg ? '−' : '') + p.value + '<small>d' + (p.s === 100 ? '%' : p.s) + '</small></span>';
    }).join('');
    var modv = spec.type === 'test' ? (spec.mod || 0) : (parseDice(spec.expr || '').mod + (spec.mod || 0));
    if (modv) chips += '<span>' + (modv > 0 ? '+ ' : '− ') + Math.abs(modv) + '</span>';
    var sub = [spec.sub, spec.modeUsed === 'adv' ? 'Advantage' : spec.modeUsed === 'dis' ? 'Disadvantage' : ''].filter(Boolean).join(' · ');
    var acts = [];
    if (spec.next) acts.push('<button class="btn red" data-a="rnext">' + ic('sword') + (nat === 20 ? 'Crit damage' : 'Roll damage') + '</button>');
    if (spec.type === 'heal' && !spec.auto) acts.push('<button class="btn green" data-a="rheal" data-v="' + total + '">' + ic('heart') + 'Heal me +' + total + '</button>');
    if (spec.type === 'temp') acts.push('<button class="btn soft" data-a="rtemp" data-v="' + total + '">' + ic('shield') + 'Gain ' + total + ' temp HP</button>');
    if (spec.type === 'test' && C.acu > 0 && !spec.noHeroic) acts.push('<button class="btn soft" data-a="rheroic">' + ic('star') + 'Reroll · 1 Acumen</button>');
    acts.push('<button class="btn" data-a="ragain">' + ic('refresh') + 'Again</button>');
    acts.push('<button class="btn accent" data-a="rclose">Done</button>');
    card.innerHTML = '<div class="lbl">' + ic(spec.icon || 'die') + '<span>' + esc(spec.label) + '</span><small>' + esc(sub) + '</small></div>' +
      '<div class="total"><b id="rtotal">' + total + '</b>' + flag + '</div>' +
      '<div class="bd">' + chips + '</div>' +
      (spec.note ? '<p class="note" style="margin:-4px 0 12px">' + esc(spec.note) + '</p>' : '') +
      '<div class="acts">' + acts.join('') + '</div>';
    requestAnimationFrame(function () { card.classList.add('show'); });
    countUp($('#rtotal'), total);
    if (spec.onResult) spec.onResult(total, info);
    card._ctx = { spec: spec, info: info, total: total };
  }
  function countUp(el, to) {
    var from = Math.max(0, to - 12), t0 = performance.now();
    (function tick(now) {
      var k = Math.min(1, (now - t0) / 380);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function closeDice() {
    var layer = $('#dice-layer');
    if (!layer.classList.contains('on')) return false;
    $('#result').classList.remove('show');
    Dice3D.fadeOut();
    layer.classList.remove('on');
    render();
    return true;
  }

  // ---------------------------------------------------------------- game actions
  function damage(n) {
    var left = n, msg = [];
    var t = Math.min(C.hp.temp, left); C.hp.temp -= t; left -= t; if (t) msg.push(t + ' temp');
    var v = Math.min(C.vit, left); C.vit -= v; left -= v; if (v) msg.push(v + ' Vitality');
    var h = Math.min(C.hp.cur, left); C.hp.cur -= h; if (h) msg.push(h + ' HP');
    var over = left - h;
    commit();
    var s = 'Took ' + n + (msg.length ? ' (' + msg.join(', ') + ')' : '');
    if (C.hp.cur === 0 && over >= C.hp.max) s += ' — massive damage: instant death!';
    else if (C.hp.cur === 0) s += ' — down! Make death saves.';
    if (C.concentration && C.hp.cur > 0) s += ' Concentration DC ' + Math.max(10, Math.floor(n / 2)) + '.';
    toast(s);
    haptic(2);
  }
  function heal(n) {
    if (C.hp.cur === 0) C.death = { s: 0, f: 0 };
    var before = C.hp.cur;
    C.hp.cur = Math.min(C.hp.max, C.hp.cur + n);
    commit();
    toast('Healed ' + (C.hp.cur - before) + ' HP');
  }
  function addTemp(n) {
    if (n > C.hp.temp) { C.hp.temp = n; commit(); toast(n + ' temporary HP'); }
    else toast('Temp HP don’t stack — kept ' + C.hp.temp);
  }
  function longRest() {
    Dv = R.derive(C);
    C.hp.cur = C.hp.max; C.hp.temp = 0; C.vit = Dv.vitMax; C.acu = Dv.acuMax;
    var regain = Math.max(1, Math.floor(Dv.level / 2));
    C.used = { slots: {}, pact: 0, bardic: 0, cd: 0, eyes: 0, hd: Math.max(0, (C.used.hd || 0) - regain), legacy: {} };
    C.death = { s: 0, f: 0 };
    C.exhaustion = Math.max(0, (C.exhaustion || 0) - 1);
    C.concentration = '';
    commit();
    toast('Long rest: HP, Vitality, Acumen, slots and features restored');
  }
  function shortRest() {
    Dv = R.derive(C);
    C.used.pact = 0; C.used.cd = 0;
    if (Dv.bardic && Dv.bardic.short) C.used.bardic = 0;
    commit();
    toast('Short rest: pact slots' + (Dv.cd ? ' and Channel Divinity' : '') + ' recovered');
  }
  function testRoll(label, mod, extra) {
    var s = { label: label, type: 'test', mod: mod };
    for (var k in extra || {}) s[k] = extra[k];
    roll(s);
  }

  // spells helpers
  function casterFor(src) { for (var i = 0; i < Dv.casters.length; i++) if (Dv.casters[i].id === src) return Dv.casters[i]; return null; }
  function spellEntries() {
    var out = [];
    if (Dv.tfl) {
      out.push({ s: D.SPELL.thaumaturgy, src: 'tiefling', free: 'Infernal Legacy' });
      C.spells.tiefling.cantrips.forEach(function (id) { if (D.SPELL[id]) out.push({ s: D.SPELL[id], src: 'tiefling' }); });
      C.spells.tiefling.known.forEach(function (id) { if (D.SPELL[id]) out.push({ s: D.SPELL[id], src: 'tiefling' }); });
      Dv.legacy.forEach(function (l) { out.push({ s: D.SPELL[l.id], src: 'tiefling', free: 'Infernal Legacy', legacy: l }); });
    }
    if (Dv.clr) {
      C.spells.cleric.cantrips.forEach(function (id) { if (D.SPELL[id]) out.push({ s: D.SPELL[id], src: 'cleric' }); });
      Dv.domainSpells.forEach(function (id) { if (D.SPELL[id]) out.push({ s: D.SPELL[id], src: 'cleric', free: 'Domain' }); });
      C.spells.cleric.prepared.forEach(function (id) { if (D.SPELL[id] && Dv.domainSpells.indexOf(id) < 0) out.push({ s: D.SPELL[id], src: 'cleric' }); });
    }
    return out;
  }
  function spellDamage(s, src, slotLvl) {
    if (!s.dmg) return '';
    var base = s.dmg;
    if (s.sc && s.lvl === 0) { var p = parseDice(base); p.groups[0].n *= Dv.cantripDice; base = diceText(p.groups, 0); }
    if (s.up && slotLvl > s.lvl) base = addDice(base, s.up, slotLvl - s.lvl);
    if (s.addMod) { var ca = casterFor(src); base += (Dv.mod[ca.ab] >= 0 ? '+' : '') + Dv.mod[ca.ab]; }
    return base;
  }
  function slotOptions(e) {
    var s = e.s, opts = [];
    if (e.legacy) {
      var used = C.used.legacy[s.id];
      opts.push({ key: 'legacy', n: 'Infernal Legacy · free', sub: used ? 'Used — recovers on a long rest' : 'Once per long rest, as ' + ord(e.legacy.at) + ' level', lvl: e.legacy.at, left: used ? 0 : 1 });
      return opts;
    }
    Dv.slots.forEach(function (n, i) {
      var lvl = i + 1;
      if (lvl < s.lvl) return;
      var left = n - (C.used.slots[lvl] || 0);
      opts.push({ key: 'slot' + lvl, n: 'Spell slot · ' + ord(lvl), sub: left + ' of ' + n + ' left · long rest', lvl: lvl, left: left });
    });
    if (Dv.pact && Dv.pact.lvl >= s.lvl) {
      var pl = Dv.pact.n - (C.used.pact || 0);
      opts.push({ key: 'pact', n: 'Pact slot · ' + ord(Dv.pact.lvl), sub: pl + ' of ' + Dv.pact.n + ' left · short rest', lvl: Dv.pact.lvl, left: pl });
    }
    if (s.rit) opts.push({ key: 'ritual', n: 'As a ritual', sub: '+10 minutes, no slot', lvl: s.lvl, left: 1 });
    // pact-magic spells prefer pact slots: put them first
    if (e.src === 'tiefling') opts.sort(function (a, b) { return (b.key === 'pact') - (a.key === 'pact'); });
    return opts;
  }
  function castSpell(e, key) {
    var s = e.s, o = slotOptions(e).filter(function (x) { return x.key === key; })[0];
    if (!o || o.left <= 0) { toast('No slot left'); return; }
    if (key === 'pact') C.used.pact = (C.used.pact || 0) + 1;
    else if (key === 'legacy') C.used.legacy[s.id] = 1;
    else if (key.indexOf('slot') === 0) C.used.slots[o.lvl] = (C.used.slots[o.lvl] || 0) + 1;
    if (s.conc) C.concentration = s.id;
    commit();
    closeSheet();
    toast('Cast ' + s.n + (key === 'ritual' ? ' as a ritual' : ' at ' + ord(o.lvl) + ' level') + (s.conc ? ' — concentrating' : ''));
    var ca = casterFor(e.src);
    if (s.temp) addTemp(s.temp * o.lvl);
    else if (s.heal) setTimeout(function () { roll({ label: s.n, sub: ord(o.lvl) + ' level', type: 'heal', expr: spellDamage(s, e.src, o.lvl), icon: 'heart' }); }, 260);
    else if (s.atk) setTimeout(function () { testRoll(s.n + ' · spell attack', ca.atk, { icon: 'spark', next: { label: s.n + ' · damage', type: 'dmg', expr: spellDamage(s, e.src, o.lvl), sub: s.dt, icon: 'spark' } }); }, 260);
    else if (s.dmg && !s.bonusDie) setTimeout(function () { roll({ label: s.n, sub: (s.save ? 'DC ' + ca.dc + ' ' + s.save + ' · ' : '') + (s.dt || ''), type: 'dmg', expr: spellDamage(s, e.src, o.lvl), icon: 'spark' }); }, 260);
  }

  // ---------------------------------------------------------------- sheets
  var sheetEl = null, scrimEl = null, sheetCtx = null;
  function openSheet(html, ctx) {
    closeSheet(true);
    scrimEl = document.createElement('div');
    scrimEl.className = 'scrim';
    scrimEl.addEventListener('click', function () { closeSheet(); });
    sheetEl = document.createElement('div');
    sheetEl.className = 'sheet';
    sheetEl.setAttribute('role', 'dialog');
    sheetEl.innerHTML = '<div class="grab"></div>' + html;
    document.body.appendChild(scrimEl);
    document.body.appendChild(sheetEl);
    sheetCtx = ctx || {};
    if (sheetCtx.mount) sheetCtx.mount(sheetEl);
  }
  function closeSheet(instant) {
    if (!sheetEl) return false;
    var s = sheetEl, k = scrimEl;
    sheetEl = scrimEl = null; sheetCtx = null;
    if (instant) { s.remove(); k.remove(); return true; }
    s.classList.add('out'); k.classList.add('out');
    setTimeout(function () { s.remove(); k.remove(); }, 220);
    return true;
  }
  function refreshSheet(html) { if (sheetEl) sheetEl.innerHTML = '<div class="grab"></div>' + html; }

  // HP keypad
  var pad = '';
  function hpSheetHtml(kind) {
    var n = +pad || 0;
    var preview = '';
    if (kind === 'dmg' && n) {
      var t = Math.min(C.hp.temp, n), v = Math.min(C.vit, n - t), h = Math.min(C.hp.cur, n - t - v);
      preview = [t ? t + ' temp' : '', v ? v + ' Vitality' : '', h ? h + ' HP' : ''].filter(Boolean).join(' → ') || 'No effect';
    } else if (kind === 'heal' && n) preview = 'HP ' + C.hp.cur + ' → ' + Math.min(C.hp.max, C.hp.cur + n);
    else if (kind === 'temp' && n) preview = n > C.hp.temp ? 'Replaces ' + C.hp.temp + ' temp HP' : 'Lower than current ' + C.hp.temp + ' temp HP';
    var keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map(function (k) { return '<button data-a="pad" data-k="' + k + '">' + k + '</button>'; }).join('');
    return '<h3>' + (kind === 'dmg' ? 'Take damage' : kind === 'heal' ? 'Heal' : 'Temporary HP') + '</h3>' +
      '<p class="lead">' + (kind === 'dmg' ? 'Damage comes off temporary HP first, then Vitality, then hit points.' : kind === 'heal' ? 'Restores hit points up to your maximum of ' + C.hp.max + '.' : 'Temporary HP don’t stack; the higher value wins.') + '</p>' +
      '<div class="seg" style="margin-bottom:8px">' + ['dmg', 'heal', 'temp'].map(function (k) { return '<button data-a="hpkind" data-k="' + k + '" class="' + (k === kind ? 'on' : '') + '">' + (k === 'dmg' ? 'Damage' : k === 'heal' ? 'Heal' : 'Temp HP') + '</button>'; }).join('') + '</div>' +
      '<div class="amount">' + (n || 0) + '</div><div class="amount-note">' + esc(preview) + '</div>' +
      '<div class="keypad">' + keys + '</div>' +
      '<button class="btn block ' + (kind === 'dmg' ? 'red' : kind === 'heal' ? 'green' : 'soft') + '" data-a="hpapply" data-k="' + kind + '" ' + (n ? '' : 'disabled') + '>' + (kind === 'dmg' ? 'Apply ' + n + ' damage' : kind === 'heal' ? 'Heal ' + n : 'Set ' + n + ' temp HP') + '</button>';
  }
  function openHp(kind) { pad = ''; openSheet(hpSheetHtml(kind), { kind: kind }); }

  function restSheetHtml() {
    Dv = R.derive(C);
    var left = Dv.hitDice - (C.used.hd || 0);
    return '<h3>Rest</h3><p class="lead">Short rests spend hit dice and refresh pact magic' + (Dv.cd ? ' and Channel Divinity' : '') + '. A long rest restores everything.</p>' +
      '<div class="card" style="background:var(--surface-2);box-shadow:none">' +
      '<div class="frow"><div class="grow"><b>Hit dice</b><small>' + left + ' of ' + Dv.hitDice + 'd8 left · each heals 1d8 ' + sign(Dv.mod.con) + '</small></div>' +
      '<button class="btn green" data-a="spendhd" ' + (left > 0 && C.hp.cur < C.hp.max ? '' : 'disabled') + '>' + ic('heart') + 'Spend 1</button></div></div>' +
      '<div class="two"><button class="btn soft" data-a="short">' + ic('moon') + 'Short rest</button><button class="btn accent" data-a="long">' + ic('bed') + 'Long rest</button></div>' +
      '<p class="note">Long rest: full HP, Vitality ' + Dv.vitMax + ', Acumen ' + Dv.acuMax + ', all slots, Bardic Inspiration, Eyes of Night, Infernal Legacy, ' + Math.max(1, Math.floor(Dv.level / 2)) + ' hit die back, −1 exhaustion.</p>';
  }

  // dice tray
  var pool = {}, poolMod = 0;
  function traySheetHtml() {
    var kinds = [4, 6, 8, 10, 12, 20, 100];
    var btns = kinds.map(function (s) {
      var n = pool[s] || 0;
      return '<button class="dbtn" data-a="pooladd" data-s="' + s + '">' + (n ? '<span class="cnt">' + n + '</span>' : '') + ic('die') + 'd' + (s === 100 ? '%' : s) + '</button>';
    }).join('') + '<button class="dbtn" data-a="poolclear">' + ic('x') + 'Clear</button>';
    var expr = diceText(Object.keys(pool).filter(function (k) { return pool[k]; }).map(function (k) { return { n: pool[k], s: +k }; }), poolMod);
    var any = Object.keys(pool).some(function (k) { return pool[k]; });
    return '<h3>Dice tray</h3><p class="lead">Tap dice to build a pool, or tap a single die and roll straight away.</p>' +
      '<div class="tray">' + btns + '</div>' +
      '<div class="frow"><div class="grow"><b>Modifier</b></div><div class="stepper"><button data-a="poolmod" data-d="-1">−</button><output>' + sign(poolMod) + '</output><button data-a="poolmod" data-d="1">+</button></div></div>' +
      '<div class="two" style="margin-top:10px"><button class="btn soft" data-a="go" data-p="dice">' + ic('grid') + 'Dice lab</button>' +
      '<button class="btn accent" data-a="poolroll" ' + (any ? '' : 'disabled') + '>' + ic('die') + 'Roll ' + (any ? esc(expr) : '') + '</button></div>';
  }

  // ---------------------------------------------------------------- pages
  var PAGES = {
    saves: { t: 'Saving Throws', ic: 'shield', c: 'gold' },
    skills: { t: 'Skills', ic: 'star', c: '' },
    combat: { t: 'Combat', ic: 'sword', c: 'red' },
    spells: { t: 'Spellbook', ic: 'spark', c: '' },
    features: { t: 'Features & Traits', ic: 'flame', c: 'red' },
    gear: { t: 'Inventory', ic: 'bag', c: 'gold' },
    check: { t: 'Rules Check', ic: 'check', c: 'green' },
    notes: { t: 'Journal', ic: 'note', c: 'blue' },
    dice: { t: 'Dice Lab', ic: 'die', c: '' },
    edit: { t: 'Edit Character', ic: 'pen', c: 'blue' },
    settings: { t: 'Settings', ic: 'gear', c: '' }
  };
  function tint(c) {
    return c === 'gold' ? 'background:var(--gold-soft);color:var(--gold)' : c === 'red' ? 'background:var(--red-soft);color:var(--red)' : c === 'green' ? 'background:var(--green-soft);color:var(--green)' : c === 'blue' ? 'background:var(--blue-soft);color:var(--blue)' : 'background:var(--accent-soft);color:var(--accent)';
  }

  function validationCounts() {
    var v = R.validate(C, Dv), n = { error: 0, warn: 0, info: 0, ok: 0 };
    v.forEach(function (x) { n[x.lvl]++; });
    return n;
  }

  function sigil() {
    return '<svg viewBox="0 0 48 48" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M30 12a13 13 0 1 0 8 21.5A11 11 0 0 1 30 12z" fill="rgba(255,255,255,.16)" stroke="#f6d27a" stroke-width="2"/>' +
      '<path d="M15 16c-4-3-5-7-3-11 1 4 4 6 7 8" stroke="#ffd9f1" stroke-width="2.2"/>' +
      '<path d="M33 16c4-3 5-7 3-11-1 4-4 6-7 8" stroke="#ffd9f1" stroke-width="2.2"/>' +
      '<circle cx="34" cy="20" r="1.3" fill="#fff"/><circle cx="38" cy="27" r=".9" fill="#fff"/></svg>';
  }

  function homeHtml() {
    var d = Dv, vc = validationCounts();
    var pct = C.hp.max ? C.hp.cur / C.hp.max : 0;
    var circ = 2 * Math.PI * 52;
    var hpColor = pct > 0.5 ? 'var(--green)' : pct > 0.25 ? 'var(--amber)' : 'var(--red)';
    var tpct = C.hp.max ? Math.min(1, C.hp.temp / C.hp.max) : 0;
    var vdot = vc.error ? ['var(--red)', 'x'] : vc.warn ? ['var(--amber)', 'warn'] : ['var(--green)', 'check'];
    var h = '';
    h += '<div class="bar" data-bar><button class="ibtn" data-a="launch" aria-label="Open menu">' + ic('grid') + '</button>' +
      '<div class="title-sm">' + esc(C.name) + '</div>' +
      '<button class="mode ' + mode + '" data-a="mode"><b></b>' + (mode === 'adv' ? 'Advantage' : mode === 'dis' ? 'Disadvantage' : 'Normal') + '</button>' +
      '<button class="ibtn" data-a="rest" aria-label="Rest">' + ic('moon') + '</button></div>';
    h += '<div class="wrap">';
    // hero
    h += '<section class="hero"><div class="hero-top"><div class="sigil">' + sigil() + '</div><div style="min-width:0"><h1>' + esc(C.name) + '</h1><p class="cls">' + esc(classLine()) + ' · Level ' + d.level + '</p></div></div>' +
      '<div class="chips"><span class="chip">' + esc(C.alignment) + '</span><span class="chip">' + esc(C.ancestry) + '</span><span class="chip">' + esc(C.background) + '</span><span class="chip">' + esc(C.size) + '</span>' + (C.player ? '<span class="chip">Player: ' + esc(C.player) + '</span>' : '') + '</div>' +
      '<button class="vbadge" data-a="go" data-p="check"><span class="dot" style="background:' + vdot[0] + '">' + ic(vdot[1]) + '</span><span class="grow"><b>Rules check</b><small>' + vc.error + ' errors · ' + vc.warn + ' warnings · ' + vc.ok + ' passed</small></span>' + ic('chev') + '</button></section>';
    // vitals
    h += '<section class="card"><div class="vitals"><div class="ring" data-a="hp" data-k="dmg"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="52" fill="none" stroke-width="11"/>' +
      '<circle class="val" cx="60" cy="60" r="52" fill="none" stroke-width="11" stroke-linecap="round" style="stroke:' + hpColor + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + circ * (1 - pct) + '"/>' +
      (tpct ? '<circle class="tmp" cx="60" cy="60" r="40" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + 2 * Math.PI * 40 + '" stroke-dashoffset="' + 2 * Math.PI * 40 * (1 - tpct) + '"/>' : '') +
      '</svg><div class="ctr"><b>' + C.hp.cur + '</b><span>of ' + C.hp.max + ' HP</span>' + (C.hp.temp ? '<em>+' + C.hp.temp + ' temp</em>' : '') + '</div></div>' +
      '<div class="meters"><div><div class="meter-h"><span>Vitality</span><b>' + C.vit + ' / ' + d.vitMax + '</b></div><div class="meter vit"><i style="width:' + (d.vitMax ? 100 * C.vit / d.vitMax : 0) + '%"></i></div>' + (d.vitMax ? '' : '<div class="meter-note">STR + DEX + CON bonuses = 0</div>') + '</div>' +
      '<div><div class="meter-h"><span>Acumen</span><b>' + C.acu + ' / ' + d.acuMax + '</b></div><div class="meter acu"><i style="width:' + (d.acuMax ? 100 * C.acu / d.acuMax : 0) + '%"></i></div><div class="meter-note">Spend as Heroic Inspiration</div></div>' +
      '<div class="two"><button class="mini" data-a="acu" data-d="-1">' + ic('star') + 'Spend</button><button class="mini" data-a="acu" data-d="1">' + ic('plus') + 'Regain</button></div></div></div>' +
      '<div class="btnrow"><button class="btn red" data-a="hp" data-k="dmg">' + ic('sword') + 'Damage</button><button class="btn green" data-a="hp" data-k="heal">' + ic('heart') + 'Heal</button><button class="btn" data-a="rest">' + ic('moon') + 'Rest</button></div>';
    if (C.concentration && D.SPELL[C.concentration]) h += '<div class="banner conc">' + ic('eye') + '<span class="grow">Concentrating on <b>' + esc(D.SPELL[C.concentration].n) + '</b></span><button data-a="concroll">Check</button><button data-a="concend">' + ic('x') + '</button></div>';
    if (C.hp.cur === 0) h += '<div class="banner down">' + ic('skull') + '<span class="grow">At 0 HP — ' + C.death.s + ' successes, ' + C.death.f + ' failures</span><button data-a="deathroll">Death save</button></div>';
    h += '</section>';
    // stats
    h += '<div class="stats"><div class="stat ac"><b>' + d.ac + '</b><span>AC</span></div>' +
      '<button class="stat roll" data-a="init"><b>' + sign(d.init) + '</b><span>Init</span></button>' +
      '<div class="stat"><b>' + d.speed + (d.speedPenalty ? '<span class="warnmark" style="display:inline;font-size:14px">*</span>' : '') + '</b><span>Speed</span></div>' +
      '<div class="stat"><b>' + sign(d.prof) + '</b><span>Prof</span></div>' +
      '<div class="stat"><b>' + d.passive.per + '</b><span>Passive</span></div></div>';
    if (d.speedPenalty) h += '<p class="note" style="margin:-8px 4px 14px">* Speed ' + (C.speed || 30) + ' ft reduced by ' + d.speedPenalty + ' ft: carrying ' + d.weight + ' lb (encumbered over ' + d.cap.enc + ' lb).</p>';
    // resources
    h += '<section class="card"><div class="card-h"><h3>Resources</h3><button class="link" data-a="go" data-p="spells">Spellbook</button></div>' + resourcesHtml() + '</section>';
    // abilities
    h += '<section class="card"><div class="card-h"><h3>Ability checks</h3><button class="link" data-a="go" data-p="saves">Saves</button></div><div class="abil">' +
      D.ABILITIES.map(function (a) {
        return '<button class="ab" data-a="check" data-k="' + a.k + '">' + (C.saveProf.indexOf(a.k) >= 0 ? '<i class="pf" title="Save proficiency"></i>' : '') + '<div class="k">' + a.s + '</div><div class="m">' + sign(d.mod[a.k]) + '</div><span class="s">' + C.abilities[a.k] + '</span></button>';
      }).join('') + '</div></section>';
    // actions
    h += '<section class="card"><div class="card-h"><h3>Actions</h3><button class="link" data-a="go" data-p="combat">Combat</button></div><div class="rows">' + actionsHtml() + '</div></section>';
    // top saves preview
    var best = D.SAVES.slice().sort(function (a, b) { return d.saves[b.c] - d.saves[a.c]; });
    h += '<section class="card"><div class="card-h"><h3>Key saves</h3><button class="link" data-a="go" data-p="saves">All 15</button></div><div class="rows">' +
      best.slice(0, 3).concat(best.slice(-2)).map(saveRow).join('') + '</div></section>';
    // explore
    h += '<div class="sec-title">Explore</div><div class="grid2">' + exploreTiles() + '</div>';
    h += '<p class="note" style="text-align:center;margin:22px 0 0">OSR 5th Edition · 5.5e homebrew · Campaign ' + esc(C.campaign) + ' · DM ' + esc(C.dm) + '</p>';
    h += '</div>';
    return h;
  }

  function pipRow(total, used, act, extra) {
    var s = '';
    for (var i = 0; i < total; i++) s += '<button class="pip' + (extra || '') + (i >= total - used ? ' used' : '') + '" data-a="' + act + '" data-i="' + i + '" aria-label="toggle"></button>';
    return '<div class="pips">' + s + '</div>';
  }
  function resourcesHtml() {
    var d = Dv, h = '';
    d.slots.forEach(function (n, i) {
      var l = i + 1;
      h += '<div class="res"><div class="nm"><b>Spell slots · ' + ord(l) + '</b><small>Cleric · long rest</small></div>' + pipRow(n, C.used.slots[l] || 0, 'pipslot" data-l="' + l) + '</div>';
    });
    if (d.pact) h += '<div class="res"><div class="nm"><b>Pact slot · ' + ord(d.pact.lvl) + '</b><small>Tiefling · short rest</small></div>' + pipRow(d.pact.n, C.used.pact || 0, 'pippact', ' dia') + '</div>';
    if (d.bardic) h += '<div class="res"><div class="nm"><b>Bardic Inspiration</b><small>d' + d.bardic.die + ' · ' + (d.bardic.short ? 'short' : 'long') + ' rest</small></div><button class="mini gold" data-a="bardic">' + ic('music') + 'd' + d.bardic.die + '</button>' + pipRow(d.bardic.uses, C.used.bardic || 0, 'pipbardic', ' gold') + '</div>';
    if (d.cd) h += '<div class="res"><div class="nm"><b>Channel Divinity</b><small>Turn Undead · ' + (d.twilight ? 'Twilight Sanctuary' : '') + '</small></div>' + (d.twilight ? '<button class="mini" data-a="sanctuary">' + ic('moon') + 'Sanctuary</button>' : '') + pipRow(d.cd, C.used.cd || 0, 'pipcd', ' gold') + '</div>';
    if (d.twilight) h += '<div class="res"><div class="nm"><b>Eyes of Night · share</b><small>Darkvision 300 ft · ' + Math.max(1, d.mod.wis) + ' creatures</small></div>' + pipRow(1, C.used.eyes || 0, 'pipeyes') + '</div>';
    d.legacy.forEach(function (l) {
      h += '<div class="res"><div class="nm"><b>' + esc(l.n) + '</b><small>Infernal Legacy · long rest</small></div>' + pipRow(1, C.used.legacy[l.id] ? 1 : 0, 'piplegacy" data-id="' + l.id) + '</div>';
    });
    return h || '<p class="empty">No limited resources.</p>';
  }

  function actionsHtml() {
    var d = Dv, h = '';
    d.weapons.forEach(function (w, i) {
      h += '<div class="row"><span class="ic red">' + ic('sword') + '</span><span class="tx"><b>' + esc(w.name) + '</b><small>' + esc(w.range + ' · ' + w.type + (w.props ? ' · ' + w.props : '')) + '</small></span>' +
        '<button class="pill" data-a="watk" data-i="' + i + '">' + sign(w.hit) + '</button><button class="pill dmg" data-a="wdmg" data-i="' + i + '">' + w.die + (w.dmgMod ? sign(w.dmgMod) : '') + '</button></div>';
    });
    spellEntries().forEach(function (e, idx) {
      var s = e.s;
      if (s.lvl !== 0 || !s.dmg || s.bonusDie) return;
      var ca = casterFor(e.src), dm = spellDamage(s, e.src, 0);
      h += '<div class="row"><span class="ic ' + (e.src === 'tiefling' ? 'red' : 'gold') + '">' + ic('spark') + '</span><span class="tx"><b>' + esc(s.n) + ' <span class="tag ' + (e.src === 'tiefling' ? 'tfl' : 'clr') + '">' + ca.tag + '</span></b><small>' + esc(s.range + ' · ' + s.dt + (s.beams && d.cantripDice > 1 ? ' · ' + d.cantripDice + ' beams' : '')) + '</small></span>' +
        (s.atk ? '<button class="pill" data-a="satk" data-x="' + idx + '">' + sign(ca.atk) + '</button>' : '<span class="pill save">' + s.save + ' ' + ca.dc + '</span>') +
        '<button class="pill dmg" data-a="sdmg" data-x="' + idx + '">' + (s.beams ? '1d10' : dm) + '</button></div>';
    });
    h += '<button class="row" data-a="go" data-p="spells"><span class="ic">' + ic('book') + '</span><span class="tx"><b>Cast a spell</b><small>Slots, prepared spells and rituals</small></span>' + ic('chev') + '</button>';
    return h;
  }

  function saveRow(s) {
    var v = Dv.saves[s.c], pf = s.a.filter(function (a) { return C.saveProf.indexOf(a) >= 0; }).length;
    return '<button class="row" data-a="save" data-k="' + s.c + '"><span class="ic gold" style="font-weight:800;font-size:13px">' + s.c + '</span><span class="tx"><b>' + esc(s.n) + (pf ? ' <span class="tag clr">' + (pf === 2 ? 'PROF ×2' : 'PROF') + '</span>' : '') + '</b><small>' + s.a.map(function (a) { return abilName(a).s; }).join(' + ') + ' · ' + esc(s.d) + '</small></span><span class="val">' + sign(v) + '</span></button>';
  }

  function exploreTiles() {
    var d = Dv, vc = validationCounts();
    var slotsLeft = d.slots.reduce(function (s, n, i) { return s + n - (C.used.slots[i + 1] || 0); }, 0) + (d.pact ? d.pact.n - (C.used.pact || 0) : 0);
    var sum = {
      saves: (function () { var b = D.SAVES.slice().sort(function (x, y) { return d.saves[y.c] - d.saves[x.c]; })[0]; return 'Best: ' + b.n + ' ' + sign(d.saves[b.c]); })(),
      skills: Object.keys(C.skills).filter(function (k) { return C.skills[k]; }).length + ' proficient · Passive ' + d.passive.per,
      combat: (C.conditions.length ? C.conditions.join(', ') : 'No conditions') + (C.exhaustion ? ' · Exh ' + C.exhaustion : ''),
      spells: slotsLeft + ' slots ready · DC ' + d.casters.map(function (c) { return c.dc; }).join('/'),
      features: R.features(C, d).length + ' features',
      gear: d.weight + ' lb · ' + (d.enc === 'ok' ? 'Unencumbered' : d.enc === 'enc' ? 'Encumbered' : 'Heavily loaded'),
      check: vc.error + ' errors · ' + vc.warn + ' warnings',
      notes: 'Traits, ideals, bonds',
      dice: LOG.length ? 'Last: ' + LOG[0].total + ' · ' + LOG[0].label : 'Pool builder & history',
      edit: 'Scores, levels, gear',
      settings: 'Theme, dice, backup'
    };
    return Object.keys(PAGES).map(function (k) {
      var p = PAGES[k];
      return '<button class="tile" data-a="go" data-p="' + k + '"><span class="ic" style="' + tint(p.c) + '">' + ic(p.ic) + '</span><span><b>' + p.t + '</b><small>' + esc(sum[k] || '') + '</small></span></button>';
    }).join('');
  }

  function pageBar(name) {
    return '<div class="bar" data-bar><button class="ibtn" data-a="back" aria-label="Back">' + ic('back') + '</button><h2>' + PAGES[name].t + '</h2>' +
      (name !== 'dice' && name !== 'settings' && name !== 'edit' ? '<button class="mode ' + mode + '" data-a="mode"><b></b>' + (mode === 'adv' ? 'Adv' : mode === 'dis' ? 'Dis' : 'Normal') + '</button>' : '') +
      '<button class="ibtn" data-a="launch" aria-label="Menu">' + ic('grid') + '</button></div>';
  }

  var skillEdit = false, spellManage = false;
  var PAGE_HTML = {
    saves: function () {
      var h = '<div class="card"><p class="note" style="margin:0 0 6px">Each save adds both paired ability bonuses, plus your proficiency bonus (' + sign(Dv.prof) + ') once for each proficient ability in the pair. Proficient: <b>' + C.saveProf.map(function (a) { return abilName(a).s; }).join(', ') + '</b>.</p></div>';
      ['str', 'dex', 'con', 'int', 'wis'].forEach(function (first) {
        var group = D.SAVES.filter(function (s) { return s.a[0] === first; });
        if (!group.length) return;
        h += '<div class="sec-title">' + abilName(first).n + ' pairs</div><div class="card"><div class="rows">' + group.map(saveRow).join('') + '</div></div>';
      });
      return h;
    },
    skills: function () {
      var d = Dv;
      var h = '<div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><b>' + d.passive.per + '</b><span>Perception</span></div><div class="stat"><b>' + d.passive.ins + '</b><span>Insight</span></div><div class="stat"><b>' + d.passive.inv + '</b><span>Investigation</span></div></div>';
      h += '<div class="card"><div class="card-h"><h3>' + (skillEdit ? 'Tap to cycle: none → proficient → expertise' : 'Tap a skill to roll') + '</h3><button class="link" data-a="skilledit">' + (skillEdit ? 'Done' : 'Edit') + '</button></div><div class="rows">';
      D.SKILLS.forEach(function (s) {
        var p = C.skills[s.k] ? 1 : 0, ex = C.expertise.indexOf(s.k) >= 0;
        var mark = ex ? '<span class="tag free">E</span>' : p ? '<span class="tag clr">P</span>' : d.joat ? '<span class="tag">½P</span>' : '';
        h += '<button class="row" data-a="' + (skillEdit ? 'skillcycle' : 'skill') + '" data-k="' + s.k + '"><span class="ic' + (ex ? '' : p ? ' gold' : ' blue') + '" style="font-size:11px;font-weight:800">' + abilName(s.a).s + '</span><span class="tx"><b>' + s.n + ' ' + mark + '</b><small>' + (p || ex ? sourceOfSkill(s.k) : 'Not proficient') + '</small></span><span class="val">' + sign(d.skills[s.k]) + '</span></button>';
      });
      h += '</div></div>';
      return h;
    },
    combat: function () {
      var d = Dv, h = '';
      h += '<div class="stats" style="grid-template-columns:repeat(4,1fr)"><div class="stat"><b>' + d.ac + '</b><span>AC</span></div><button class="stat roll" data-a="init"><b>' + sign(d.init) + '</b><span>Init</span></button><div class="stat"><b>' + d.speed + '</b><span>Speed</span></div><div class="stat"><b>1</b><span>Attacks</span></div></div>';
      h += '<div class="card"><div class="card-h"><h3>Weapons & attacks</h3><button class="link" data-a="addweapon">+ Add</button></div><div class="rows">';
      d.weapons.forEach(function (w, i) {
        h += '<details class="x"><summary><span class="ic red" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--red-soft);color:var(--red)">' + ic('sword') + '</span><span class="tx" style="flex:1;min-width:0"><b>' + esc(w.name) + (w.prof ? '' : ' <span class="tag tfl">NOT PROF</span>') + '</b><small class="muted">' + sign(w.hit) + ' to hit · ' + w.die + (w.dmgMod ? sign(w.dmgMod) : '') + ' ' + w.type + '</small></span>' + ic('chev', 'chev') + '</summary><div class="body">' +
          '<p>' + esc(w.range) + (w.props ? ' · ' + esc(w.props) : '') + ' · ' + w.cat + ' · ' + w.weight + ' lb<br>Mastery: ' + esc(w.mastery || '—') + ' · Quality: ' + ({ S: 'Shoddy (−1)', C: 'Common', M: 'Masterwork (+1)' })[w.quality] + '</p>' +
          '<div class="acts"><button class="pill" data-a="watk" data-i="' + i + '">Attack ' + sign(w.hit) + '</button><button class="pill dmg" data-a="wdmg" data-i="' + i + '">Damage</button><button class="pill plain" data-a="wqual" data-i="' + i + '">Quality</button><button class="pill plain" data-a="wdel" data-i="' + i + '">' + ic('trash') + '</button></div></div></details>';
      });
      if (!d.weapons.length) h += '<p class="empty">No weapons.</p>';
      h += '</div><p class="note">Proficient: ' + (d.weaponProf.simple ? 'simple' : '') + (d.weaponProf.martial ? ', martial' : '') + (d.weaponProf.list.length && !d.weaponProf.martial ? ', ' + d.weaponProf.list.join(', ') : '') + ' weapons. Armor: ' + ['light', 'medium', 'heavy', 'shield'].filter(function (a) { return d.armorProf[a]; }).join(', ') + '.</p></div>';
      // conditions
      h += '<div class="card"><div class="card-h"><h3>Conditions</h3></div><div class="chipset">' + D.CONDITIONS.map(function (c) {
        return '<button class="chipbtn ' + (C.conditions.indexOf(c) >= 0 ? 'on' : '') + '" data-a="cond" data-k="' + c + '">' + c + '</button>';
      }).join('') + '</div>';
      h += '<div class="frow" style="margin-top:10px"><div class="grow"><b>Exhaustion</b><small>' + ['None', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6 — death'][C.exhaustion || 0] + '</small></div><div class="stepper"><button data-a="exh" data-d="-1">−</button><output>' + (C.exhaustion || 0) + '</output><button data-a="exh" data-d="1">+</button></div></div></div>';
      // death saves
      h += '<div class="card"><div class="card-h"><h3>Death saves</h3><button class="link" data-a="deathreset">Reset</button></div>' +
        '<div class="frow"><div class="grow"><b>Successes</b></div><div class="dsave">' + [0, 1, 2].map(function (i) { return '<button class="pip s ' + (i < C.death.s ? '' : 'used') + '" data-a="dset" data-k="s" data-i="' + i + '"></button>'; }).join('') + '</div></div>' +
        '<div class="frow"><div class="grow"><b>Failures</b></div><div class="dsave">' + [0, 1, 2].map(function (i) { return '<button class="pip f ' + (i < C.death.f ? '' : 'used') + '" data-a="dset" data-k="f" data-i="' + i + '"></button>'; }).join('') + '</div></div>' +
        '<button class="btn block soft" style="margin-top:8px" data-a="deathroll">' + ic('skull') + 'Roll death save</button></div>';
      // recovery
      h += '<div class="card"><div class="card-h"><h3>Recovery</h3></div><div class="frow"><div class="grow"><b>Hit dice</b><small>' + (d.hitDice - (C.used.hd || 0)) + ' of ' + d.hitDice + 'd8 · ' + (d.tfl ? d.tfl + 'd8 Tiefling' : '') + (d.clr ? ' + ' + d.clr + 'd8 Cleric' : '') + '</small></div><button class="btn" data-a="rest">' + ic('moon') + 'Rest</button></div>' +
        '<div class="frow"><div class="grow"><b>Resistances</b><small>' + (d.tfl ? 'Fire (Hellish Resistance)' : 'None') + '</small></div></div>' +
        '<div class="frow"><div class="grow"><b>Senses</b><small>' + (d.twilight ? 'Darkvision 300 ft (Eyes of Night)' : '—') + '</small></div></div></div>';
      return h;
    },
    spells: function () {
      var d = Dv, h = '';
      h += '<div class="two" style="margin-bottom:14px">' + d.casters.map(function (c) {
        return '<div class="card" style="margin:0"><div class="card-h"><h3>' + c.n + '</h3><span class="tag ' + (c.id === 'tiefling' ? 'tfl' : 'clr') + '">' + c.ab.toUpperCase() + '</span></div><div style="display:flex;gap:8px"><div style="flex:1"><div style="font:750 26px var(--ui)">' + c.dc + '</div><div class="note" style="margin:0">Save DC</div></div><button class="pill" style="height:44px" data-a="catk" data-k="' + c.id + '">' + sign(c.atk) + '</button></div></div>';
      }).join('') + '</div>';
      h += '<div class="card"><div class="card-h"><h3>Slots</h3><button class="link" data-a="rest">Rest</button></div>' + resourcesHtml() + '</div>';
      h += '<div class="card"><div class="card-h"><h3>' + (spellManage ? 'Choose spells' : 'Spells') + '</h3><button class="link" data-a="spellmanage">' + (spellManage ? 'Done' : 'Manage') + '</button></div>';
      if (spellManage) h += manageSpellsHtml();
      else {
        var entries = spellEntries();
        var levels = {};
        entries.forEach(function (e, i) { (levels[e.s.lvl] = levels[e.s.lvl] || []).push([e, i]); });
        Object.keys(levels).sort().forEach(function (l) {
          h += '<div class="sec-title" style="margin-top:8px">' + (l === '0' ? 'Cantrips' : ord(+l) + ' level') + '</div>';
          levels[l].forEach(function (pair) { h += spellRow(pair[0], pair[1]); });
        });
        h += '<p class="note">† always prepared or granted free (domain, racial). Saves use OSR paired-save codes: ' + D.SAVES.map(function (s) { return s.c; }).join(' ') + '.</p>';
      }
      h += '</div>';
      return h;
    },
    features: function () {
      var d = Dv, f = R.features(C, d), groups = {};
      f.forEach(function (x) { (groups[x.src] = groups[x.src] || []).push(x); });
      var h = '';
      h += '<div class="card"><div class="card-h"><h3>Ancestry</h3></div><p class="note" style="margin:0">Tiefling race-class: +1 INT, +2 CHA · Medium · speed 30 ft · resistance to fire' + (d.twilight ? ' · darkvision 300 ft (Eyes of Night)' : '') + '.</p></div>';
      Object.keys(groups).forEach(function (g) {
        h += '<div class="sec-title">' + esc(g) + '</div><div class="card"><div class="rows">';
        groups[g].forEach(function (x) {
          h += '<details class="x"><summary><span class="ic ' + (/Tiefling/.test(g) ? 'red' : /Background/.test(g) ? 'blue' : 'gold') + '" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-size:12px;font-weight:800;background:var(--surface-2)">' + (x.lvl || '•') + '</span><span class="tx" style="flex:1;min-width:0"><b>' + esc(x.n) + '</b>' + (x.lvl ? '<small class="muted">Level ' + x.lvl + '</small>' : '') + '</span>' + ic('chev', 'chev') + '</summary><div class="body"><p>' + esc(x.text) + '</p>' + featureActions(x) + '</div></details>';
        });
        h += '</div></div>';
      });
      h += '<div class="card"><div class="card-h"><h3>Feats</h3></div><p class="empty">' + (C.feats.length ? esc(C.feats.join(', ')) : 'None') + '</p></div>';
      return h;
    },
    gear: function () {
      var d = Dv, h = '';
      var pct = function (x) { return Math.min(100, 100 * x / d.cap.max); };
      h += '<div class="card"><div class="card-h"><h3>Burden</h3><span style="font-weight:750">' + d.weight + ' lb</span></div>' +
        '<div class="loadbar ' + d.enc + '"><i style="width:' + pct(d.weight) + '%"></i>' +
        '<span class="tick" style="left:' + pct(d.cap.enc) + '%"><span>' + d.cap.enc + ' enc.</span></span><span class="tick" style="left:' + pct(d.cap.heavy) + '%"><span>' + d.cap.heavy + ' heavy</span></span><span class="tick" style="left:99%"><span>' + d.cap.max + '</span></span></div>' +
        '<p class="note" style="margin:0">' + (d.enc === 'ok' ? 'Unencumbered.' : d.enc === 'enc' ? 'Encumbered: speed −10 ft.' : d.enc === 'heavy' ? 'Heavily encumbered: speed −20 ft, disadvantage on STR/DEX/CON rolls.' : 'Over maximum load.') + ' Push, drag or lift up to ' + d.cap.push + ' lb. 50 coins weigh 1 lb.</p></div>';
      h += '<div class="card"><div class="card-h"><h3>Armor</h3></div><div class="frow"><div class="grow"><select class="input" data-f="armor">' + Object.keys(D.ARMOR).map(function (k) {
        var a = D.ARMOR[k];
        return '<option value="' + k + '"' + (C.armor === k ? ' selected' : '') + '>' + a.n + (a.type !== 'none' ? ' (' + a.type + ', AC ' + a.base + ')' : '') + '</option>';
      }).join('') + '</select></div></div><div class="frow"><div class="grow"><b>Shield</b><small>+2 AC' + (d.armorProf.shield ? ' \u00b7 proficient (' + esc(d.armorProf.shield) + ')' : ' \u00b7 not proficient') + '</small></div><button class="switch ' + (C.shield ? 'on' : '') + '" data-a="shield" aria-label="Shield"></button></div><p class="note" style="margin:0">Armor Class ' + d.ac + '.</p></div>';
      h += '<div class="card"><div class="card-h"><h3>Possessions</h3><button class="link" data-a="additem">+ Add</button></div><div class="item" style="border:0;padding-bottom:0"><span class="flabel">Item</span><span class="flabel">Location</span><span class="flabel">Wgt</span><span></span></div>';
      C.items.forEach(function (it, i) {
        h += '<div class="item"><input value="' + esc(it.n) + '" data-f="items.' + i + '.n" aria-label="Item"><input value="' + esc(it.loc) + '" data-f="items.' + i + '.loc" aria-label="Location"><input inputmode="decimal" value="' + esc(it.w) + '" data-f="items.' + i + '.w" data-num aria-label="Weight"><button class="del" data-a="delitem" data-i="' + i + '">' + ic('trash') + '</button></div>';
      });
      if (!C.items.length) h += '<p class="empty">Nothing carried.</p>';
      h += '</div>';
      h += '<div class="card"><div class="card-h"><h3>Coins</h3></div><div class="coins">' + ['pp', 'gp', 'ep', 'sp', 'cp'].map(function (k) {
        return '<label class="coin"><div class="face c-' + k + '">' + k.toUpperCase() + '</div><input inputmode="numeric" value="' + (C.coins[k] || 0) + '" data-f="coins.' + k + '" data-num></label>';
      }).join('') + '</div></div>';
      h += '<div class="card"><div class="card-h"><h3>Magic items & attunement</h3></div>' + [0, 1, 2].map(function (i) {
        return '<div class="field"><label>Attuned ' + ['I', 'II', 'III'][i] + '</label><input class="input" value="' + esc(C.magicItems[i] || '') + '" data-f="magicItems.' + i + '" placeholder="Empty"></div>';
      }).join('') + '<div class="two"><div class="field"><label>Lifestyle</label><input class="input" value="' + esc(C.lifestyle) + '" data-f="lifestyle"></div><div class="field"><label>Trinket</label><input class="input" value="' + esc(C.trinket) + '" data-f="trinket"></div></div></div>';
      return h;
    },
    check: function () {
      var d = Dv, v = R.validate(C, d), vc = validationCounts();
      var h = '<div class="vsum"><div style="background:var(--red-soft);color:var(--red)"><b>' + vc.error + '</b><span>Errors</span></div><div style="background:var(--amber-soft);color:var(--amber)"><b>' + vc.warn + '</b><span>Warnings</span></div><div style="background:var(--green-soft);color:var(--green)"><b>' + vc.ok + '</b><span>Passed</span></div></div>';
      h += '<p class="note" style="margin:-4px 4px 14px">Checks your choices against the Class Compendium and the OSR record sheet rules. They update live as you edit.</p>';
      var lv = [['error', 'Errors', 'x'], ['warn', 'Warnings', 'warn'], ['info', 'Notes', 'info'], ['ok', 'Passed', 'check']];
      lv.forEach(function (L) {
        var items = v.filter(function (x) { return x.lvl === L[0]; });
        if (!items.length) return;
        h += '<div class="sec-title">' + L[1] + ' · ' + items.length + '</div><div class="card">';
        items.forEach(function (x) {
          h += '<div class="vi lv-' + x.lvl + '"><span class="dot">' + ic(L[2]) + '</span><div><span class="area">' + esc(x.area) + '</span><b>' + esc(x.t) + '</b>' + (x.x ? '<p>' + esc(x.x) + '</p>' : '') + '</div></div>';
        });
        h += '</div>';
      });
      if (C.id === 'zaphyre') {
        var au = R.audit(C, d), mism = au.filter(function (a) { return !a.ok; }).length;
        h += '<div class="sec-title">Sheet audit · ' + (au.length - mism) + ' of ' + au.length + ' match</div><div class="card"><p class="note" style="margin:0 0 10px">Numbers written on the PDF compared with the app’s calculation.</p><table class="audit"><thead><tr><th>Value</th><th>Sheet</th><th>Rules</th><th></th></tr></thead><tbody>' +
          au.map(function (a) { return '<tr><td>' + esc(a.label) + (a.note && !a.ok ? '<small>' + esc(a.note) + '</small>' : '') + '</td><td>' + esc(a.rec) + '</td><td>' + esc(a.comp) + '</td><td class="' + (a.ok ? 'ok' : 'no') + '">' + (a.ok ? '✓' : '≠') + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      return h;
    },
    notes: function () {
      var f = [['traits', 'Personality traits'], ['ideals', 'Ideals'], ['bonds', 'Bonds'], ['flaws', 'Flaws'], ['backstory', 'Backstory'], ['other', 'Session notes']];
      return '<div class="card">' + f.map(function (x) {
        return '<div class="field"><label>' + x[1] + '</label><textarea class="input" data-t="notes.' + x[0] + '" placeholder="Write here…">' + esc(C.notes[x[0]]) + '</textarea></div>';
      }).join('') + '<p class="note">Saved automatically.</p></div>';
    },
    dice: function () {
      var h = '<div class="card"><div class="card-h"><h3>Quick roll</h3></div><div class="tray">' + [4, 6, 8, 10, 12, 20, 100].map(function (s) {
        return '<button class="dbtn" data-a="quick" data-s="' + s + '">' + ic('die') + 'd' + (s === 100 ? '%' : s) + '</button>';
      }).join('') + '<button class="dbtn" data-a="tray">' + ic('plus') + 'Pool</button></div>' +
        '<div class="field"><label>Expression</label><div style="display:flex;gap:8px"><input class="input" id="expr" placeholder="e.g. 2d6+3, 4d8, 1d20+6"><button class="btn accent" data-a="exprroll">Roll</button></div></div></div>';
      h += '<div class="card"><div class="card-h"><h3>Dice colour</h3></div><div class="palette">' + Object.keys(Dice3D.palettes).map(function (k) {
        var p = Dice3D.palettes[k];
        return '<button class="' + (ST.palette === k ? 'on' : '') + '" data-a="palette" data-k="' + k + '" style="background:linear-gradient(145deg,' + p.face2 + ',' + p.face + ')" aria-label="' + k + '"></button>';
      }).join('') + '</div></div>';
      h += '<div class="card log"><div class="card-h"><h3>History</h3>' + (LOG.length ? '<button class="link" data-a="clearlog">Clear</button>' : '') + '</div><div class="rows">' +
        (LOG.length ? LOG.slice(0, 40).map(function (l) {
          var tm = new Date(l.t);
          return '<div class="row"><span class="ic' + (l.nat === 20 ? ' gold' : l.nat === 1 ? ' red' : '') + '">' + ic('die') + '</span><span class="tx"><b>' + esc(l.label) + '</b><small>' + esc((l.dice ? '[' + l.dice.replace(/~(\d+)/g, '($1)') + '] ' : '') + (l.sub ? l.sub + ' · ' : '') + tm.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) + '</small></span><span class="val">' + l.total + '</span></div>';
        }).join('') : '<p class="empty">No rolls yet.</p>') + '</div></div>';
      return h;
    },
    edit: function () {
      var d = Dv, h = '';
      function inp(label, f, val, extra) { return '<div class="field"><label>' + label + '</label><input class="input" data-f="' + f + '" value="' + esc(val) + '"' + (extra || '') + '></div>'; }
      h += '<div class="card"><div class="card-h"><h3>Identity</h3></div>' + inp('Character name', 'name', C.name) +
        '<div class="two">' + inp('Alignment', 'alignment', C.alignment) + inp('Experience points', 'xp', C.xp, ' inputmode="numeric"') + '</div>' +
        '<div class="two">' + inp('Player', 'player', C.player) + inp('Campaign', 'campaign', C.campaign) + '</div>' +
        '<div class="two">' + inp('Dungeon Master', 'dm', C.dm) + inp('Base speed (ft)', 'speed', C.speed, ' inputmode="numeric" data-num') + '</div></div>';
      h += '<div class="card"><div class="card-h"><h3>Ability scores</h3></div>' + D.ABILITIES.map(function (a) {
        return '<div class="frow"><div class="grow"><b>' + a.n + '</b><small>Bonus ' + sign(d.mod[a.k]) + (C.saveProf.indexOf(a.k) >= 0 ? ' · save proficiency' : '') + '</small></div><div class="stepper"><button data-a="abil" data-k="' + a.k + '" data-d="-1">−</button><output>' + C.abilities[a.k] + '</output><button data-a="abil" data-k="' + a.k + '" data-d="1">+</button></div></div>';
      }).join('') + '</div>';
      h += '<div class="card"><div class="card-h"><h3>Classes</h3></div>' + C.classes.map(function (k, i) {
        var cl = D.CLASSES[k.id];
        var subs = Object.keys(cl.subs);
        var canSub = k.level >= cl.subAt;
        return '<div class="frow"><div class="grow"><b>' + cl.n + (cl.race ? ' <span class="tag tfl">RACE-CLASS</span>' : '') + '</b><small>' + esc(cl.tagline) + ' · d' + cl.hd + '</small></div><div class="stepper"><button data-a="clvl" data-i="' + i + '" data-d="-1">−</button><output>' + k.level + '</output><button data-a="clvl" data-i="' + i + '" data-d="1">+</button></div></div>' +
          '<div class="field" style="margin-top:2px"><label>' + cl.subLabel + (canSub ? '' : ' (from level ' + cl.subAt + ')') + '</label><select class="input" data-f="classes.' + i + '.sub"' + (canSub || k.sub ? '' : ' disabled') + '><option value="">— None —</option>' + subs.map(function (s) { return '<option value="' + s + '"' + (k.sub === s ? ' selected' : '') + '>' + cl.subs[s].n + '</option>'; }).join('') + '</select></div>';
      }).join('') + '<p class="note">Rules data covers Tiefling and Cleric (Twilight Domain). Multiclass prerequisites for other compendium classes: ' + Object.keys(D.MC_PREREQ).map(function (k) { return k + ' ' + D.MC_PREREQ[k]; }).join(' · ') + '.</p></div>';
      h += '<div class="card"><div class="card-h"><h3>Hit points</h3></div><div class="frow"><div class="grow"><b>Maximum HP</b><small>Fixed average ' + d.hpAvg + ' · possible ' + d.hpMin + '–' + d.hpMaxPossible + '</small></div><div class="stepper"><button data-a="hpmax" data-d="-1">−</button><output>' + C.hp.max + '</output><button data-a="hpmax" data-d="1">+</button></div></div>' +
        '<button class="btn block ghost" data-a="hpavg">Use fixed average (' + d.hpAvg + ')</button></div>';
      h += '<div class="card"><div class="card-h"><h3>Save proficiencies</h3></div><div class="chipset">' + D.ABILITIES.map(function (a) {
        return '<button class="chipbtn ' + (C.saveProf.indexOf(a.k) >= 0 ? 'on' : '') + '" data-a="saveprof" data-k="' + a.k + '">' + a.s + '</button>';
      }).join('') + '</div><p class="note">Your first class sets these (Tiefling: INT, CHA).</p></div>';
      h += '<div class="card"><div class="card-h"><h3>Proficiencies & languages</h3></div>' +
        '<div class="field"><label>Tools (comma separated)</label><input class="input" data-list="tools" value="' + esc(C.tools.join(', ')) + '"></div>' +
        '<div class="field"><label>Languages</label><input class="input" data-list="languages" value="' + esc(C.languages.join(', ')) + '"></div>' +
        '<div class="field"><label>Eldritch invocations</label><input class="input" data-list="invocations" value="' + esc(C.invocations.join(', ')) + '" placeholder="From Tiefling 2nd level"></div>' +
        '<div class="field"><label>Feats</label><input class="input" data-list="feats" value="' + esc(C.feats.join(', ')) + '"></div>' +
        '<button class="btn block ghost" data-a="go" data-p="skills">Edit skill proficiencies →</button></div>';
      return h;
    },
    settings: function () {
      var h = '<div class="card"><div class="card-h"><h3>Appearance</h3></div><div class="seg">' + ['system', 'light', 'dark'].map(function (t) {
        return '<button class="' + (ST.theme === t ? 'on' : '') + '" data-a="theme" data-k="' + t + '">' + t[0].toUpperCase() + t.slice(1) + '</button>';
      }).join('') + '</div></div>';
      h += '<div class="card"><div class="card-h"><h3>Dice</h3></div>' +
        '<div class="frow"><div class="grow"><b>3D dice</b><small>' + (Dice3D.supported() ? 'Physics toss with three.js' : 'WebGL unavailable — using quick results') + '</small></div><button class="switch ' + (ST.dice3d ? 'on' : '') + '" data-a="set" data-k="dice3d"></button></div>' +
        '<div class="frow"><div class="grow"><b>Sound</b><small>Clatter when dice land</small></div><button class="switch ' + (ST.sound ? 'on' : '') + '" data-a="set" data-k="sound"></button></div>' +
        '<div class="frow"><div class="grow"><b>Haptics</b><small>Vibrate on landing and damage</small></div><button class="switch ' + (ST.haptics ? 'on' : '') + '" data-a="set" data-k="haptics"></button></div>' +
        '<div class="flabel" style="margin:10px 0 8px">Colour</div><div class="palette">' + Object.keys(Dice3D.palettes).map(function (k) {
          var p = Dice3D.palettes[k];
          return '<button class="' + (ST.palette === k ? 'on' : '') + '" data-a="palette" data-k="' + k + '" style="background:linear-gradient(145deg,' + p.face2 + ',' + p.face + ')" aria-label="' + k + '"></button>';
        }).join('') + '</div></div>';
      h += '<div class="card"><div class="card-h"><h3>Backup</h3></div><div class="two"><button class="btn" data-a="export">' + ic('download') + 'Export</button><button class="btn" data-a="copyjson">' + ic('copy') + 'Copy JSON</button></div>' +
        '<label class="btn block ghost" style="margin-top:8px">' + ic('upload') + 'Import .json<input type="file" accept=".json,application/json,text/plain" data-a-change="import" class="sr"></label>' +
        '<button class="btn block red" style="margin-top:8px" data-a="reset">' + ic('refresh') + 'Reset to Zaphyre (default)</button></div>';
      h += '<p class="note" style="text-align:center">OSR Companion · OSR 5th Edition (5.5e homebrew) · Class Compendium 1.5<br>Works offline. Data stays on this device.</p>';
      return h;
    }
  };

  function sourceOfSkill(k) {
    var src = [];
    var bg = D.BACKGROUNDS[C.background];
    if (bg && bg.skills.indexOf(k) >= 0) src.push(C.background);
    else if (D.CLASSES[C.classes[0].id].skillList.indexOf(k) >= 0) src.push(D.CLASSES[C.classes[0].id].n);
    else src.push('No valid source');
    if (C.expertise.indexOf(k) >= 0) src.push('Expertise');
    return src.join(' · ');
  }

  function spellRow(e, idx) {
    var s = e.s, ca = casterFor(e.src);
    var meta = [s.time, s.range, s.dur].join(' · ');
    var acts = '';
    if (s.lvl > 0 || e.legacy) acts += '<button class="pill" data-a="cast" data-x="' + idx + '">' + ic('spark') + 'Cast</button>';
    else if (s.conc) acts += '<button class="pill" data-a="concset" data-x="' + idx + '">Concentrate</button>';
    if (s.atk) acts += '<button class="pill" data-a="satk" data-x="' + idx + '">Attack ' + sign(ca.atk) + '</button>';
    if (s.save) acts += '<span class="pill save">DC ' + ca.dc + ' · ' + esc(saveOf(s.save) ? saveOf(s.save).n : s.save) + '</span>';
    if (s.dmg) acts += '<button class="pill ' + (s.heal ? 'heal' : s.bonusDie ? 'plain' : 'dmg') + '" data-a="sdmg" data-x="' + idx + '">' + (s.beams ? '1d10 ×' + Dv.cantripDice : spellDamage(s, e.src, s.lvl)) + '</button>';
    if (s.dmgAlt) acts += '<button class="pill dmg" data-a="sdmgalt" data-x="' + idx + '">' + s.dmgAlt.replace(/^1/, Dv.cantripDice) + ' (hurt)</button>';
    if (s.temp) acts += '<span class="pill heal">+' + s.temp + ' temp HP</span>';
    var conc = C.concentration === s.id;
    return '<details class="x"><summary><span class="ic" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;' + (e.src === 'tiefling' ? 'background:var(--red-soft);color:var(--red)' : 'background:var(--gold-soft);color:var(--gold)') + '">' + ic(s.heal ? 'heart' : s.dmg ? 'spark' : 'book') + '</span><span class="tx" style="flex:1;min-width:0"><b>' + esc(s.n) + (e.free ? ' †' : '') + ' <span class="tag ' + (e.src === 'tiefling' ? 'tfl' : 'clr') + '">' + ca.tag + '</span>' + (s.conc ? ' <span class="tag c">C</span>' : '') + (s.rit ? ' <span class="tag">R</span>' : '') + (conc ? ' <span class="tag free">ACTIVE</span>' : '') + '</b><small class="muted">' + esc(meta + (s.save ? ' · ' + s.save : s.atk ? ' · atk' : '')) + '</small></span>' + ic('chev', 'chev') + '</summary>' +
      '<div class="body"><p>' + esc(s.sum) + '</p>' + (e.free ? '<p class="muted">† ' + esc(e.free) + (e.legacy ? ' — cast once per long rest without a slot.' : ' — always prepared.') + '</p>' : '') + '<div class="acts">' + acts + '</div></div></details>';
  }

  function manageSpellsHtml() {
    var d = Dv, h = '';
    function block(title, src, key, filter, limit, note) {
      var chosen = C.spells[src][key];
      var opts = D.SPELLS.filter(filter);
      var over = chosen.length > limit;
      h += '<div class="sec-title" style="margin-top:8px">' + title + ' · <span style="color:' + (over ? 'var(--red)' : chosen.length === limit ? 'var(--green)' : 'var(--amber)') + '">' + chosen.length + ' / ' + limit + '</span></div>' +
        '<div class="chipset">' + opts.map(function (s) {
          var on = chosen.indexOf(s.id) >= 0;
          return '<button class="chipbtn ' + (on ? 'on' : '') + '" data-a="spelltoggle" data-src="' + src + '" data-key="' + key + '" data-id="' + s.id + '">' + esc(s.n) + (s.lvl ? '<span class="ct">' + s.lvl + '</span>' : '') + '</button>';
        }).join('') + '</div>' + (note ? '<p class="note">' + note + '</p>' : '');
    }
    if (d.tfl) {
      block('Tiefling cantrips (warlock list)', 'tiefling', 'cantrips', function (s) { return s.lvl === 0 && s.lists.indexOf('warlock') >= 0; }, d.tflCantrips, 'Thaumaturgy is granted by Infernal Legacy and doesn’t count.');
      block('Tiefling spells known (warlock list)', 'tiefling', 'known', function (s) { return s.lvl > 0 && s.lvl <= d.pact.lvl && s.lists.indexOf('warlock') >= 0; }, d.tflKnown, 'Up to ' + ord(d.pact.lvl) + ' level. Swap one when you gain a Tiefling level.');
    }
    if (d.clr) {
      block('Cleric cantrips', 'cleric', 'cantrips', function (s) { return s.lvl === 0 && s.lists.indexOf('cleric') >= 0; }, d.clrCantrips);
      block('Cleric prepared', 'cleric', 'prepared', function (s) { return s.lvl > 0 && s.lvl <= d.maxClrSlot && s.lists.indexOf('cleric') >= 0; }, d.clrPrepared, 'WIS ' + sign(d.mod.wis) + ' + Cleric level ' + d.clr + '. Domain spells (' + d.domainSpells.map(function (id) { return D.SPELL[id].n; }).join(', ') + ') are always prepared. Change after a long rest.');
    }
    return h;
  }

  function featureActions(x) {
    var d = Dv;
    if (x.res === 'bardic') return '<div class="acts"><button class="pill" data-a="bardic">Roll d' + d.bardic.die + '</button><span class="pill plain">' + (d.bardic.uses - (C.used.bardic || 0)) + ' / ' + d.bardic.uses + ' left</span></div>';
    if (x.res === 'cd' && /Sanctuary/.test(x.n)) return '<div class="acts"><button class="pill" data-a="sanctuary">Use · 1d6+' + d.clr + ' temp HP</button></div>';
    if (x.res === 'cd') return '<div class="acts"><span class="pill plain">' + (d.cd - (C.used.cd || 0)) + ' / ' + d.cd + ' left</span></div>';
    if (x.res === 'eyes') return '<div class="acts"><button class="pill" data-a="pipeyes" data-i="0">' + (C.used.eyes ? 'Shared (restore)' : 'Share darkvision') + '</button></div>';
    return '';
  }

  // ---------------------------------------------------------------- render
  function render() {
    Dv = R.derive(C);
    if (C.vit > Dv.vitMax) C.vit = Dv.vitMax;
    if (C.acu > Dv.acuMax) C.acu = Dv.acuMax;
    if (C.hp.cur > C.hp.max) C.hp.cur = C.hp.max;
    var stack = $('#stack');
    var home = $('#page-home');
    if (!home) {
      home = document.createElement('div');
      home.id = 'page-home';
      home.className = 'page';
      stack.appendChild(home);
      home.addEventListener('scroll', onScroll, { passive: true });
    }
    home.innerHTML = homeHtml();
    home.classList.toggle('under', nav.length > 0);
    var pages = stack.querySelectorAll('.page.sub:not(.out)');
    pages.forEach(function (p, i) {
      var name = p.dataset.page;
      p.classList.toggle('under', i < pages.length - 1);
      if (i === pages.length - 1) p.innerHTML = pageBar(name) + '<div class="wrap" style="padding-top:6px">' + PAGE_HTML[name]() + '</div>';
    });
    syncBars();
  }
  function onScroll(e) {
    var bar = e.target.querySelector('[data-bar]');
    if (bar) bar.classList.toggle('scrolled', e.target.scrollTop > 40);
  }
  function syncBars() {
    document.querySelectorAll('.page').forEach(function (p) {
      var bar = p.querySelector('[data-bar]');
      if (bar) bar.classList.toggle('scrolled', p.scrollTop > 40);
    });
  }
  function go(name) {
    closeSheet(true);
    if (nav[nav.length - 1] === name) return;
    var idx = nav.indexOf(name);
    if (idx >= 0) {
      // already open below: drop everything above it
      var subs = $('#stack').querySelectorAll('.page.sub');
      for (var i = subs.length - 1; i > idx; i--) subs[i].remove();
      nav.length = idx + 1;
      render();
      return;
    }
    skillEdit = false; spellManage = false;
    nav.push(name);
    var p = document.createElement('div');
    p.className = 'page sub';
    p.dataset.page = name;
    p.addEventListener('scroll', onScroll, { passive: true });
    $('#stack').appendChild(p);
    render();
  }
  function back() {
    if (closeSheet()) return true;
    if ($('#dice-layer').classList.contains('on')) { if (!layerBusy) closeDice(); return true; }
    if (!nav.length) return false;
    nav.pop();
    var subs = $('#stack').querySelectorAll('.page.sub:not(.out)');
    var top = subs[subs.length - 1];
    if (top) {
      top.classList.add('out');
      if (subs.length > 1) subs[subs.length - 2].classList.remove('under');
      else $('#page-home').classList.remove('under');
      setTimeout(function () { top.remove(); render(); }, 230);
    }
    return true;
  }

  function launcherHtml() {
    return '<h3>' + esc(C.name) + '</h3><p class="lead">' + esc(classLine()) + '</p><div class="launch">' +
      Object.keys(PAGES).map(function (k) {
        var p = PAGES[k];
        return '<button data-a="go" data-p="' + k + '"><span class="ic" style="' + tint(p.c) + '">' + ic(p.ic) + '</span>' + p.t.replace(' & Traits', '').replace('Edit Character', 'Character') + '</button>';
      }).join('') +
      '<button data-a="rest"><span class="ic" style="' + tint('blue') + '">' + ic('moon') + '</span>Rest</button></div>' +
      (nav.length ? '<button class="btn block ghost" style="margin-top:12px" data-a="home">' + ic('back') + 'Back to dashboard</button>' : '');
  }

  // ---------------------------------------------------------------- events
  function setPath(obj, path, val) {
    var ks = path.split('.'), o = obj;
    for (var i = 0; i < ks.length - 1; i++) {
      if (o[ks[i]] === undefined) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      o = o[ks[i]];
    }
    o[ks[ks.length - 1]] = val;
  }
  function entryAt(x) { return spellEntries()[+x]; }

  var A = {
    launch: function () { openSheet(launcherHtml()); },
    go: function (el) { go(el.dataset.p); },
    home: function () { closeSheet(true); while (nav.length) { nav.pop(); } $('#stack').querySelectorAll('.page.sub').forEach(function (p) { p.remove(); }); render(); },
    back: function () { back(); },
    mode: function () { mode = mode === '' ? 'adv' : mode === 'adv' ? 'dis' : ''; haptic(0); render(); toast(mode ? (mode === 'adv' ? 'Advantage' : 'Disadvantage') + ' on the next d20' : 'Normal rolls'); },
    rest: function () { openSheet(restSheetHtml()); },
    short: function () { closeSheet(); shortRest(); },
    long: function () { closeSheet(); longRest(); },
    spendhd: function () {
      closeSheet(true);
      roll({ label: 'Hit die', sub: 'Short rest', type: 'heal', auto: true, expr: '1d8' + (Dv.mod.con >= 0 ? '+' : '') + Dv.mod.con, icon: 'heart', onResult: function (t) { C.used.hd = (C.used.hd || 0) + 1; heal(t); } });
    },
    hp: function (el) { openHp(el.dataset.k); },
    hpkind: function (el) { sheetCtx.kind = el.dataset.k; refreshSheet(hpSheetHtml(el.dataset.k)); },
    pad: function (el) {
      var k = el.dataset.k;
      if (k === 'C') pad = ''; else if (k === '⌫') pad = pad.slice(0, -1); else if (pad.length < 4) pad = (pad + k).replace(/^0+/, '');
      haptic(0);
      refreshSheet(hpSheetHtml(sheetCtx.kind));
    },
    hpapply: function (el) {
      var n = +pad || 0, k = el.dataset.k;
      closeSheet();
      if (!n) return;
      if (k === 'dmg') damage(n); else if (k === 'heal') heal(n); else { C.hp.temp = n; commit(); toast(n + ' temporary HP'); }
    },
    acu: function (el) {
      var dd = +el.dataset.d;
      if (dd < 0 && C.acu <= 0) { toast('No Acumen left — recovers on a long rest'); return; }
      C.acu = Math.max(0, Math.min(Dv.acuMax, C.acu + dd));
      commit();
      if (dd < 0) toast('Heroic Inspiration spent — ' + C.acu + ' Acumen left');
    },
    init: function () { testRoll('Initiative', Dv.init, { sub: 'DEX' + (Dv.joat ? ' + Jack of All Trades' : ''), icon: 'sword' }); },
    check: function (el) {
      var k = el.dataset.k, a = abilName(k);
      testRoll(a.n + ' check', Dv.mod[k] + Dv.joat, { sub: Dv.joat ? 'incl. Jack of All Trades' : a.s, icon: 'star' });
    },
    save: function (el) { var s = saveOf(el.dataset.k); testRoll(s.n + ' save', Dv.saves[s.c], { sub: s.c + ' · ' + s.a.map(function (a) { return abilName(a).s; }).join(' + '), icon: 'shield' }); },
    skill: function (el) { var s = skillOf(el.dataset.k); testRoll(s.n, Dv.skills[s.k], { sub: abilName(s.a).s, icon: 'star' }); },
    skilledit: function () { skillEdit = !skillEdit; render(); },
    skillcycle: function (el) {
      var k = el.dataset.k, p = C.skills[k] ? 1 : 0, ex = C.expertise.indexOf(k) >= 0;
      if (ex) { C.expertise.splice(C.expertise.indexOf(k), 1); delete C.skills[k]; }
      else if (p) { C.expertise.push(k); }
      else C.skills[k] = 1;
      commit();
    },
    watk: function (el) {
      var w = Dv.weapons[+el.dataset.i];
      testRoll(w.name + ' · attack', w.hit, { icon: 'sword', next: { label: w.name + ' · damage', type: 'dmg', expr: w.die + (w.dmgMod ? (w.dmgMod > 0 ? '+' : '') + w.dmgMod : ''), sub: w.type, icon: 'sword' } });
    },
    wdmg: function (el) {
      var w = Dv.weapons[+el.dataset.i];
      roll({ label: w.name + ' · damage', type: 'dmg', expr: w.die + (w.dmgMod ? (w.dmgMod > 0 ? '+' : '') + w.dmgMod : ''), sub: w.type, icon: 'sword' });
    },
    wqual: function (el) { var w = C.weapons[+el.dataset.i]; w.quality = w.quality === 'C' ? 'M' : w.quality === 'M' ? 'S' : 'C'; commit(); },
    wdel: function (el) { C.weapons.splice(+el.dataset.i, 1); commit(); },
    addweapon: function () {
      openSheet('<h3>Add weapon</h3><p class="lead">Proficiency is checked against your classes.</p><div class="chipset">' + Object.keys(D.WEAPONS).map(function (n) {
        var row = D.WEAPONS[n], ok = (row[0] === 'simple' && Dv.weaponProf.simple) || (row[0] === 'martial' && Dv.weaponProf.martial) || Dv.weaponProf.list.indexOf(n.toLowerCase()) >= 0;
        return '<button class="chipbtn ' + (ok ? '' : 'bad') + '" data-a="addweaponpick" data-k="' + esc(n) + '">' + esc(n) + '<span class="ct">' + row[1] + '</span></button>';
      }).join('') + '</div><p class="note">Red: not proficient.</p>');
    },
    addweaponpick: function (el) {
      var n = el.dataset.k;
      C.weapons.push({ name: n, quality: 'C' });
      if (!C.items.some(function (i) { return i.n.toLowerCase() === n.toLowerCase(); })) C.items.push({ n: n, loc: 'Carried', w: D.WEAPONS[n][5] });
      closeSheet(); commit(); toast(n + ' added to weapons and inventory');
    },
    satk: function (el) {
      var e = entryAt(el.dataset.x), s = e.s, ca = casterFor(e.src);
      testRoll(s.n + ' · spell attack', ca.atk, { icon: 'spark', next: { label: s.n + ' · damage', type: 'dmg', expr: s.beams ? '1d10' : spellDamage(s, e.src, s.lvl), sub: s.dt, icon: 'spark' }, note: s.beams && Dv.cantripDice > 1 ? 'Roll once per beam (' + Dv.cantripDice + ').' : '' });
    },
    sdmg: function (el) {
      var e = entryAt(el.dataset.x), s = e.s, ca = casterFor(e.src);
      roll({ label: s.n, sub: s.heal ? 'Healing' : s.bonusDie ? 'Bonus die' : (s.save ? 'DC ' + ca.dc + ' ' + s.save + ' · ' : '') + (s.dt || ''), type: s.heal ? 'heal' : s.bonusDie ? 'free' : 'dmg', expr: s.beams ? '1d10' : spellDamage(s, e.src, s.lvl), icon: s.heal ? 'heart' : 'spark' });
    },
    sdmgalt: function (el) {
      var e = entryAt(el.dataset.x), s = e.s, ca = casterFor(e.src);
      roll({ label: s.n + ' (target hurt)', sub: 'DC ' + ca.dc + ' ' + s.save + ' · ' + s.dt, type: 'dmg', expr: s.dmgAlt.replace(/^1/, Dv.cantripDice), icon: 'spark' });
    },
    catk: function (el) { var ca = casterFor(el.dataset.k); testRoll(ca.n + ' spell attack', ca.atk, { icon: 'spark' }); },
    cast: function (el) {
      var idx = el.dataset.x, e = entryAt(idx), opts = slotOptions(e);
      openSheet('<h3>Cast ' + esc(e.s.n) + '</h3><p class="lead">' + esc(e.s.sum) + '</p><div class="rows">' + opts.map(function (o) {
        return '<button class="row" data-a="castwith" data-x="' + idx + '" data-k="' + o.key + '" ' + (o.left > 0 ? '' : 'disabled style="opacity:.45"') + '><span class="ic' + (o.key === 'pact' ? ' red' : o.key === 'legacy' ? ' red' : ' gold') + '">' + ic(o.key === 'ritual' ? 'book' : 'spark') + '</span><span class="tx"><b>' + esc(o.n) + '</b><small>' + esc(o.sub) + '</small></span>' + ic('chev') + '</button>';
      }).join('') + '</div>' + (opts.length ? '' : '<p class="empty">No slot of a high enough level.</p>') + (e.s.conc && C.concentration && C.concentration !== e.s.id ? '<p class="note">Casting this ends your concentration on ' + esc(D.SPELL[C.concentration].n) + '.</p>' : ''));
    },
    castwith: function (el) { castSpell(entryAt(el.dataset.x), el.dataset.k); },
    concset: function (el) { var e = entryAt(el.dataset.x); C.concentration = e.s.id; commit(); toast('Concentrating on ' + e.s.n); },
    concend: function () { C.concentration = ''; commit(); toast('Concentration ended'); },
    concroll: function () { testRoll('Concentration (CON)', Dv.mod.con, { sub: 'DC 10 or half damage', icon: 'eye' }); },
    spellmanage: function () { spellManage = !spellManage; render(); },
    spelltoggle: function (el) {
      var arr = C.spells[el.dataset.src][el.dataset.key], id = el.dataset.id, i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      commit();
    },
    pipslot: function (el) { var l = +el.dataset.l, n = Dv.slots[l - 1], used = C.used.slots[l] || 0; C.used.slots[l] = +el.dataset.i >= n - used ? used - 1 : used + 1; haptic(0); commit(); },
    pippact: function (el) { var n = Dv.pact.n, u = C.used.pact || 0; C.used.pact = +el.dataset.i >= n - u ? u - 1 : u + 1; haptic(0); commit(); },
    pipbardic: function (el) { var n = Dv.bardic.uses, u = C.used.bardic || 0; C.used.bardic = +el.dataset.i >= n - u ? u - 1 : u + 1; haptic(0); commit(); },
    pipcd: function (el) { var n = Dv.cd, u = C.used.cd || 0; C.used.cd = +el.dataset.i >= n - u ? u - 1 : u + 1; haptic(0); commit(); },
    pipeyes: function () { C.used.eyes = C.used.eyes ? 0 : 1; haptic(0); commit(); },
    piplegacy: function (el) { var id = el.dataset.id; C.used.legacy[id] = C.used.legacy[id] ? 0 : 1; haptic(0); commit(); },
    bardic: function () {
      var b = Dv.bardic;
      if ((C.used.bardic || 0) >= b.uses) { toast('No Bardic Inspiration left'); return; }
      C.used.bardic = (C.used.bardic || 0) + 1;
      save();
      roll({ label: 'Bardic Inspiration', sub: (b.uses - C.used.bardic) + ' uses left', type: 'free', expr: '1d' + b.die, icon: 'music' });
    },
    sanctuary: function () {
      if ((C.used.cd || 0) >= Dv.cd) { toast('Channel Divinity used — recovers on a short rest'); return; }
      C.used.cd = (C.used.cd || 0) + 1;
      save();
      roll({ label: 'Twilight Sanctuary', sub: 'Temp HP for a creature ending its turn in the sphere', type: 'temp', expr: '1d6+' + Dv.clr, icon: 'moon' });
    },
    rnext: function () {
      var ctx = $('#result')._ctx, nx = Object.assign({}, ctx.spec.next);
      if (ctx.info.natural === 20) nx.crit = true;
      roll(nx);
    },
    rheal: function (el) { heal(+el.dataset.v); closeDice(); },
    rtemp: function (el) { addTemp(+el.dataset.v); closeDice(); },
    rheroic: function () {
      var ctx = $('#result')._ctx;
      if (C.acu <= 0) return;
      C.acu -= 1;
      save();
      var s = Object.assign({}, ctx.spec, { sub: 'Heroic Inspiration reroll', adv: ctx.spec.modeUsed || '' });
      roll(s);
    },
    ragain: function () {
      var s = Object.assign({}, $('#result')._ctx.spec);
      if (s.onResult && s.label === 'Hit die') { closeDice(); return; }
      delete s.onResult;
      if (s.type === 'test') s.adv = s.modeUsed || '';
      roll(s);
    },
    rclose: function () { closeDice(); },
    deathroll: function () {
      roll({ label: 'Death save', type: 'test', mod: 0, adv: '', noHeroic: true, icon: 'skull', onResult: function (t, info) {
        var n = info.natural;
        if (n === 20) { C.death = { s: 0, f: 0 }; C.hp.cur = 1; toast('Natural 20 — back on your feet with 1 HP!'); }
        else if (n === 1) { C.death.f = Math.min(3, C.death.f + 2); toast('Natural 1 — two failures'); }
        else if (t >= 10) { C.death.s = Math.min(3, C.death.s + 1); if (C.death.s === 3) toast('Stable!'); }
        else { C.death.f = Math.min(3, C.death.f + 1); if (C.death.f === 3) toast('Three failures…'); }
        save();
      } });
    },
    deathreset: function () { C.death = { s: 0, f: 0 }; commit(); },
    dset: function (el) { var k = el.dataset.k, i = +el.dataset.i; C.death[k] = C.death[k] === i + 1 ? i : i + 1; commit(); },
    cond: function (el) { var k = el.dataset.k, i = C.conditions.indexOf(k); if (i >= 0) C.conditions.splice(i, 1); else C.conditions.push(k); commit(); },
    exh: function (el) { C.exhaustion = Math.max(0, Math.min(6, (C.exhaustion || 0) + +el.dataset.d)); commit(); },
    shield: function () { C.shield = !C.shield; commit(); },
    additem: function () { C.items.push({ n: '', loc: 'Pack', w: 0 }); commit(); var ins = document.querySelectorAll('.item input'); if (ins.length) ins[ins.length - 3].focus(); },
    delitem: function (el) { C.items.splice(+el.dataset.i, 1); commit(); },
    tray: function () { openSheet(traySheetHtml()); },
    pooladd: function (el) { var s = el.dataset.s; pool[s] = (pool[s] || 0) + 1; haptic(0); refreshSheet(traySheetHtml()); },
    poolclear: function () { pool = {}; poolMod = 0; refreshSheet(traySheetHtml()); },
    poolmod: function (el) { poolMod += +el.dataset.d; refreshSheet(traySheetHtml()); },
    poolroll: function () {
      var groups = Object.keys(pool).filter(function (k) { return pool[k]; }).map(function (k) { return { n: pool[k], s: +k }; });
      var expr = diceText(groups, poolMod);
      closeSheet(true);
      roll({ label: expr, type: 'free', expr: expr });
    },
    quick: function (el) {
      var s = +el.dataset.s;
      if (s === 20) testRoll('d20', 0, { noHeroic: true });
      else roll({ label: 'd' + (s === 100 ? '%' : s), type: 'free', expr: '1d' + s });
    },
    exprroll: function () {
      var v = ($('#expr') || {}).value || '';
      var p = parseDice(v);
      if (!p.groups.length) { toast('Try something like 2d6+3'); return; }
      if (p.groups.reduce(function (s, g) { return s + Math.abs(g.n); }, 0) > 40) { toast('Up to 40 dice at once'); return; }
      roll({ label: v.replace(/\s+/g, ''), type: 'free', expr: v });
    },
    clearlog: function () { LOG = []; store(LKEY, LOG); render(); },
    palette: function (el) { ST.palette = el.dataset.k; store(SKEY, ST); render(); },
    theme: function (el) { ST.theme = el.dataset.k; store(SKEY, ST); applyTheme(); render(); },
    set: function (el) { var k = el.dataset.k; ST[k] = !ST[k]; store(SKEY, ST); render(); },
    abil: function (el) { var k = el.dataset.k; C.abilities[k] = Math.max(1, Math.min(30, C.abilities[k] + +el.dataset.d)); commit(); },
    clvl: function (el) {
      var k = C.classes[+el.dataset.i], total = Dv.level + +el.dataset.d;
      var nl = k.level + +el.dataset.d;
      if (nl < (+el.dataset.i === 0 ? 1 : 0) || total > 20 || nl > 20) return;
      k.level = nl;
      commit();
    },
    hpmax: function (el) { C.hp.max = Math.max(1, C.hp.max + +el.dataset.d); C.hp.cur = Math.min(C.hp.cur, C.hp.max); commit(); },
    hpavg: function () { C.hp.max = Dv.hpAvg; C.hp.cur = Math.min(C.hp.cur, C.hp.max); C.hp.rolled = false; commit(); toast('HP maximum set to ' + Dv.hpAvg); },
    saveprof: function (el) { var k = el.dataset.k, i = C.saveProf.indexOf(k); if (i >= 0) C.saveProf.splice(i, 1); else C.saveProf.push(k); commit(); },
    export: function () {
      var text = JSON.stringify(C, null, 2), fn = (C.name || 'character').replace(/[^\w-]+/g, '_') + '.json';
      if (window.osrHost && window.osrHost.saveFile) {
        window.osrHost.saveFile(fn, text).then(function () { toast('Saved ' + fn); }, function (e) { if (e && e.code !== 'declined') toast('Couldn’t save'); });
        return;
      }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = fn;
      document.body.appendChild(a); a.click(); a.remove();
      toast('Downloaded ' + fn);
    },
    copyjson: function () {
      var text = JSON.stringify(C);
      var p = window.osrHost ? window.osrHost.copyText(text) : navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject();
      p.then(function () { toast('Character JSON copied'); }, function () { toast('Clipboard unavailable'); });
    },
    reset: function () {
      openSheet('<h3>Reset to Zaphyre?</h3><p class="lead">This replaces the current character with Zaphyre Blight exactly as on the PDF sheet. Export first if you want to keep your changes.</p><div class="two"><button class="btn" data-a="closesheet">Cancel</button><button class="btn red" data-a="resetyes">Reset</button></div>');
    },
    resetyes: function () { C = normalize(clone(D.ZAPHYRE)); closeSheet(); commit(); toast('Zaphyre restored'); },
    closesheet: function () { closeSheet(); }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    if (el.closest('#dice-layer') && layerBusy) return;
    var fn = A[el.dataset.a];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  // tap the dice layer backdrop to dismiss once settled
  document.getElementById('dice-layer').addEventListener('click', function (e) {
    if (layerBusy || e.target.closest('.result')) return;
    closeDice();
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.aChange === 'import') {
      var f = el.files && el.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result);
          if (!obj || !obj.abilities || !obj.classes) throw new Error('shape');
          C = normalize(obj);
          commit();
          toast('Imported ' + (C.name || 'character'));
        } catch (err) { toast('That file isn’t a character export'); }
      };
      rd.readAsText(f);
      return;
    }
    if (el.dataset.f) {
      var v = el.value;
      if (el.hasAttribute('data-num')) v = +String(v).replace(',', '.') || 0;
      setPath(C, el.dataset.f, v);
      save();
      // Re-rendering while the user hops to the next field would drop the keyboard,
      // so wait until focus leaves the form fields.
      if (el.tagName === 'SELECT') render();
      else setTimeout(function () { if (isField(document.activeElement)) pendingRender = true; else render(); }, 0);
    } else if (el.dataset.list) {
      C[el.dataset.list] = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      commit();
    }
  });
  var pendingRender = false;
  function isField(el) { return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== 'file'; }
  document.addEventListener('focusout', function () {
    setTimeout(function () { if (pendingRender && !isField(document.activeElement)) { pendingRender = false; render(); } }, 0);
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.dataset.t) { setPath(C, el.dataset.t, el.value); save(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') back();
    if (e.key === 'Enter' && e.target.id === 'expr') A.exprroll();
  });

  window.App = { back: back };
  applyTheme();
  render();
})();
