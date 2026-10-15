/* Derived values and validation for a character. Pure functions over the saved state. */
(function () {
  'use strict';
  var D = window.OSR;

  function mod(score) { return Math.floor((score - 10) / 2); }
  function sign(n) { return (n >= 0 ? '+' : '−') + Math.abs(n); }
  function lvlOf(c, id) {
    for (var i = 0; i < c.classes.length; i++) if (c.classes[i].id === id) return c.classes[i].level | 0;
    return 0;
  }
  function subOf(c, id) {
    for (var i = 0; i < c.classes.length; i++) if (c.classes[i].id === id) return c.classes[i].sub || '';
    return '';
  }
  function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }

  function derive(c) {
    var d = {};
    var m = {};
    D.ABILITIES.forEach(function (a) { m[a.k] = mod(c.abilities[a.k] | 0); });
    d.mod = m;
    d.tfl = lvlOf(c, 'tiefling');
    d.clr = lvlOf(c, 'cleric');
    d.level = c.classes.reduce(function (s, k) { return s + (k.level | 0); }, 0) || 1;
    d.prof = 2 + Math.floor((d.level - 1) / 4);
    d.twilight = d.clr > 0 && subOf(c, 'cleric') === 'twilight';
    d.heritage = subOf(c, 'tiefling');

    // Proficiency sources
    var armor = {}, weapons = { simple: false, martial: false, list: [] };
    var first = D.CLASSES[c.classes[0].id];
    (first.armor || []).forEach(function (a) { armor[a] = 'Tiefling'; });
    if (first.shields) armor.shield = first.n;
    weapons.simple = !!first.weapons.simple; weapons.martial = !!first.weapons.martial;
    weapons.list = (first.weapons.list || []).slice();
    if (d.clr > 0 && c.classes[0].id !== 'cleric') {
      D.CLASSES.cleric.mcArmor.forEach(function (a) { if (!armor[a]) armor[a] = 'Cleric (multiclass)'; });
      if (!armor.shield) armor.shield = 'Cleric (multiclass)';
    }
    if (d.twilight) { armor.heavy = 'Twilight Domain'; weapons.martial = true; }
    d.armorProf = armor; d.weaponProf = weapons;

    // Jack of All Trades (Tiefling 2)
    d.joat = d.tfl >= 2 ? Math.floor(d.prof / 2) : 0;

    // Saves
    d.saves = {};
    D.SAVES.forEach(function (s) {
      var v = m[s.a[0]] + m[s.a[1]];
      s.a.forEach(function (a) { if (c.saveProf.indexOf(a) >= 0) v += d.prof; });
      d.saves[s.c] = v;
    });

    // Skills
    d.skills = {};
    D.SKILLS.forEach(function (s) {
      var p = c.skills[s.k] | 0;
      var ex = c.expertise.indexOf(s.k) >= 0;
      var v = m[s.a] + (ex ? 2 * d.prof : p ? d.prof : d.joat);
      d.skills[s.k] = v;
    });
    d.passive = { per: 10 + d.skills.perception, ins: 10 + d.skills.insight, inv: 10 + d.skills.investigation };
    d.init = m.dex + d.joat;

    // Armor class
    var ar = D.ARMOR[c.armor] || D.ARMOR.none;
    d.armor = ar;
    d.ac = ar.base + Math.min(m.dex, ar.dex) + (c.shield ? 2 : 0);

    // Vitality & Acumen
    d.vitMax = Math.max(0, m.str + m.dex + m.con);
    d.acuMax = Math.max(0, m.int + m.wis + m.cha);

    // HP
    var conTotal = m.con * d.level;
    d.hpAvg = 8 + m.con + (d.level - 1) * (5 + m.con);
    d.hpMin = 8 + m.con + (d.level - 1) * Math.max(1, 1 + m.con);
    d.hpMaxPossible = 8 + m.con + (d.level - 1) * (8 + m.con);
    void conTotal;

    // Hit dice
    d.hitDice = d.level;

    // Spellcasting
    var tt = d.tfl ? D.CLASSES.tiefling.table[d.tfl] : null;
    d.casters = [];
    if (d.tfl) d.casters.push({ id: 'tiefling', tag: 'Tfl', n: 'Tiefling', ab: 'cha', dc: 8 + d.prof + m.cha, atk: d.prof + m.cha });
    if (d.clr) d.casters.push({ id: 'cleric', tag: 'Clr', n: 'Cleric', ab: 'wis', dc: 8 + d.prof + m.wis, atk: d.prof + m.wis });
    d.slots = d.clr ? D.FULL_SLOTS[d.clr].slice() : [];
    d.pact = tt ? { n: tt[2], lvl: tt[3] } : null;
    d.tflCantrips = tt ? tt[0] : 0;
    d.tflKnown = tt ? tt[1] : 0;
    d.invocations = tt ? tt[4] : 0;
    d.bardic = tt ? { die: tt[5], uses: Math.max(1, m.cha), short: d.tfl >= 5 } : null;
    d.clrCantrips = d.clr ? D.CLASSES.cleric.cantrips[d.clr] : 0;
    d.clrPrepared = d.clr ? Math.max(1, m.wis + d.clr) : 0;
    d.cd = d.clr >= 18 ? 3 : d.clr >= 6 ? 2 : d.clr >= 2 ? 1 : 0;
    d.cantripDice = d.level >= 17 ? 4 : d.level >= 11 ? 3 : d.level >= 5 ? 2 : 1;
    d.maxClrSlot = d.slots.length;
    d.domainSpells = [];
    if (d.twilight) {
      var ds = D.CLASSES.cleric.subs.twilight.spells;
      Object.keys(ds).forEach(function (l) { if (d.clr >= +l) d.domainSpells = d.domainSpells.concat(ds[l]); });
    }
    d.legacy = [];
    if (d.tfl >= 3) d.legacy.push({ id: 'hellish-rebuke', at: 2, n: 'Hellish rebuke (2nd level)' });
    if (d.tfl >= 5) d.legacy.push({ id: 'darkness', at: 2, n: 'Darkness' });

    // Encumbrance (variant): STR x5 / x10 / x15, push x30
    var str = c.abilities.str | 0;
    d.cap = { enc: str * 5, heavy: str * 10, max: str * 15, push: str * 30 };
    var coins = 0;
    for (var k in c.coins) coins += +c.coins[k] || 0;
    d.weight = c.items.reduce(function (s, it) { return s + (+it.w || 0) * (+it.qty || 1); }, 0) + coins / 50;
    d.weight = Math.round(d.weight * 100) / 100;
    d.enc = d.weight > d.cap.max ? 'over' : d.weight > d.cap.heavy ? 'heavy' : d.weight > d.cap.enc ? 'enc' : 'ok';
    var pen = d.enc === 'enc' ? 10 : d.enc === 'heavy' ? 20 : 0;
    if (ar.str && str < ar.str) pen += 10;
    d.speed = Math.max(0, (c.speed || 30) - pen);
    d.speedPenalty = pen;

    // Weapons
    d.weapons = (c.weapons || []).map(function (w) {
      var row = D.WEAPONS[w.name] || ['simple', w.dmg || '1d4', w.type || '', w.props || '', '', 0];
      var props = row[3];
      var finesse = /Finesse/.test(props), ranged = /Ammunition/.test(props);
      var ab = ranged ? 'dex' : finesse ? (m.dex >= m.str ? 'dex' : 'str') : 'str';
      var low = w.name.toLowerCase();
      var prof = (row[0] === 'simple' && weapons.simple) || (row[0] === 'martial' && weapons.martial) || weapons.list.indexOf(low) >= 0;
      var qb = w.quality === 'M' ? 1 : w.quality === 'S' ? -1 : 0;
      return {
        name: w.name, cat: row[0], die: row[1], type: row[2], props: props, mastery: row[4], weight: row[5],
        ab: ab, prof: prof, hit: m[ab] + (prof ? d.prof : 0) + qb, dmgMod: m[ab] + qb, quality: w.quality || 'C',
        range: ranged ? (props.match(/\(([^)]+)\)/) || [, ''])[1] + ' ft' : /Reach/.test(props) ? 'Melee 10 ft' : 'Melee 5 ft'
      };
    });
    return d;
  }

  // ---- Features list for the Features page (text from the Class Compendium).
  function features(c, d) {
    var f = [];
    function add(src, lvl, n, text, res) { f.push({ src: src, lvl: lvl, n: n, text: text, res: res || '' }); }
    if (d.tfl >= 1) {
      add('Tiefling', 1, 'Infernal Legacy', 'You know the thaumaturgy cantrip. You also learn spells you can cast once per long rest without a slot: hellish rebuke (as 2nd level) at Tiefling 3rd level, and darkness at 5th.', d.legacy.length ? 'legacy' : '');
      add('Tiefling', 1, 'Hellish Resistance', 'You have resistance to fire damage.');
      add('Tiefling', 1, 'Bardic Inspiration (d' + d.bardic.die + ')', 'As a bonus action, choose one creature within 60 feet who can hear you. Once within the next 10 minutes, they can add your Bardic Inspiration die to one ability check, attack roll, or saving throw. Uses equal your Charisma modifier (minimum once), regained on a long rest' + (d.bardic.short ? ' or short rest (Font of Inspiration).' : '.'), 'bardic');
      add('Tiefling', 1, 'Pact Magic', 'Your infernal heritage lets you cast warlock spells. All pact slots are the same level and come back on a short or long rest. Spell save DC = 8 + proficiency + CHA; spell attack = proficiency + CHA. Tieflings cap at 5th-level spells.', 'pact');
    }
    if (d.tfl >= 2) {
      add('Tiefling', 2, 'Eldritch Invocations', 'You gain eldritch invocations from the warlock list (no Pact Boon or 6th+ level slot requirements). Known: ' + d.invocations + '.');
      add('Tiefling', 2, 'Jack of All Trades', 'Add half your proficiency bonus (rounded down) to any ability check that doesn’t already include your proficiency bonus.');
    }
    if (d.tfl >= 3) {
      add('Tiefling', 3, 'Infernal Heritage', 'Path of the Pact, the Charmer or Hellfire. Features at 3rd, 6th, 10th, 14th and 18th level.');
      add('Tiefling', 3, 'Expertise', 'Choose two proficient skills: your proficiency bonus is doubled for them. Two more at 10th level.');
    }
    if (d.tfl >= 5) add('Tiefling', 5, 'Font of Inspiration', 'You regain all expended uses of Bardic Inspiration on a short or long rest.');
    if (d.clr >= 1) {
      add('Cleric', 1, 'Spellcasting', 'Prepare WIS modifier + cleric level spells (min 1) after a long rest. Spell save DC = 8 + proficiency + WIS; spell attack = proficiency + WIS. Holy symbol focus. Ritual casting for prepared ritual spells.', 'slots');
      add('Cleric', 1, 'Divine Domain', 'Domain spells are always prepared and don’t count against your prepared spells.');
    }
    if (d.twilight) {
      add('Twilight Domain', 1, 'Bonus Proficiencies', 'Proficiency with martial weapons and heavy armor.');
      add('Twilight Domain', 1, 'Eyes of Night', 'Darkvision out to 300 feet; in that radius dim light counts as bright and darkness as dim. As an action, share it with up to ' + Math.max(1, d.mod.wis) + ' willing creature(s) within 10 ft for 1 hour. Once per long rest, or expend any spell slot to share it again.', 'eyes');
      add('Twilight Domain', 1, 'Vigilant Blessing', 'As an action, give one creature you touch (possibly yourself) advantage on its next initiative roll.');
    }
    if (d.clr >= 2) {
      add('Cleric', 2, 'Channel Divinity (' + d.cd + '/rest)', 'Channel divine energy for an effect, then finish a short or long rest to use it again. DC equals your cleric spell save DC.', 'cd');
      add('Cleric', 2, 'Channel Divinity: Turn Undead', 'As an action, each undead within 30 ft that can see or hear you makes a Devilry (Dv) save. On a failure it is turned for 1 minute or until it takes damage.', 'cd');
    }
    if (d.twilight && d.clr >= 2) add('Twilight Domain', 2, 'Channel Divinity: Twilight Sanctuary', 'As an action, a 30 ft sphere of twilight emanates from you for 1 minute. When a creature ends its turn in it, grant it 1d6 + ' + d.clr + ' temporary HP, or end one effect that charms or frightens it.', 'cd');
    if (d.clr >= 5) add('Cleric', 5, 'Destroy Undead', 'Undead of low CR that fail against Turn Undead are destroyed.');
    if (d.twilight && d.clr >= 6) add('Twilight Domain', 6, 'Steps of Night', 'Bonus action in dim light or darkness: flying speed equal to walking speed for 1 minute. ' + d.prof + ' uses per long rest.');
    if (d.twilight && d.clr >= 8) add('Twilight Domain', 8, 'Divine Strike', 'Once per turn, a weapon hit deals an extra 1d8 radiant (2d8 at 14th).');
    if (d.clr >= 10) add('Cleric', 10, 'Divine Intervention', 'Roll percentile dice; if you roll your cleric level or lower, your deity intervenes.');
    var bg = D.BACKGROUNDS[c.background];
    if (bg) add('Background · ' + c.background, 0, bg.feature, bg.text);
    return f;
  }

  // ---- Validation. Each check: { lvl: 'ok'|'warn'|'error'|'info', area, t: title, x: detail }
  function validate(c, d) {
    var out = [];
    function r(lvl, area, t, x) { out.push({ lvl: lvl, area: area, t: t, x: x || '' }); }
    var T = D.CLASSES.tiefling, C = D.CLASSES.cleric;

    // Classes & multiclassing
    if (c.classes[0].id === 'tiefling') r('ok', 'Classes', 'Starts as a Tiefling race-class', 'Race-classes must be the starting class before multiclassing.');
    else if (d.tfl) r('error', 'Classes', 'Tiefling must be the first class', 'The compendium says you must start as a Tiefling to use this class.');
    if (d.clr) {
      if (c.abilities.wis >= 13) r('ok', 'Classes', 'Cleric multiclass prerequisite met', 'Needs Wisdom 13, has ' + c.abilities.wis + '.');
      else r('error', 'Classes', 'Cleric multiclass prerequisite not met', 'Needs Wisdom 13, has ' + c.abilities.wis + '.');
      if (!subOf(c, 'cleric')) r('error', 'Classes', 'No Divine Domain chosen', 'Clerics choose a domain at 1st level.');
      else r('ok', 'Classes', 'Divine Domain: ' + C.subs[subOf(c, 'cleric')].n, 'Chosen at Cleric 1st level as required.');
    }
    if (d.tfl >= 3 && !d.heritage) r('error', 'Classes', 'Infernal Heritage missing', 'Tiefling 3rd level grants a heritage path.');
    if (d.tfl < 3 && d.heritage) r('error', 'Classes', 'Infernal Heritage chosen too early', 'Heritage is chosen at Tiefling 3rd level.');
    if (d.tfl && d.tfl < 3) r('ok', 'Classes', 'No Infernal Heritage yet', 'Correct: it arrives at Tiefling 3rd level (character is Tiefling ' + d.tfl + ').');
    if (d.level > 20) r('error', 'Classes', 'Total level above 20');

    // Abilities
    var lo = D.ABILITIES.filter(function (a) { return c.abilities[a.k] < 3 || c.abilities[a.k] > 20; });
    if (lo.length) r('error', 'Abilities', 'Ability score out of range', lo.map(function (a) { return a.s + ' ' + c.abilities[a.k]; }).join(', ') + ' (3–20 before epic features).');
    else r('ok', 'Abilities', 'Ability scores within 3–20');
    r('ok', 'Abilities', 'Bonuses use the standard table', D.ABILITIES.map(function (a) { return a.s + ' ' + c.abilities[a.k] + ' → ' + sign(d.mod[a.k]); }).join(' · '));
    if (d.tfl) r('info', 'Abilities', 'Tiefling adjustments included?', 'The race-class gives +1 INT and +2 CHA. The sheet’s INT 18 and CHA 18 are treated as final scores; with point buy or standard array that means 17 and 16 before the bonus.');
    var asiLevels = (d.tfl >= 4 ? 1 : 0) + (d.clr >= 4 ? 1 : 0);
    if (asiLevels) r('info', 'Abilities', asiLevels + ' Ability Score Improvement(s) available', 'Remember to apply them.');

    // Saves
    var sp = c.saveProf.slice().sort().join(',');
    var want = (D.CLASSES[c.classes[0].id].saves || []).slice().sort().join(',');
    if (sp === want) r('ok', 'Saves', 'Save proficiencies come from the first class', 'INT and CHA from Tiefling; multiclassing into Cleric adds none.');
    else r('error', 'Saves', 'Save proficiencies don’t match the starting class', 'Expected ' + want.toUpperCase() + ', found ' + (sp.toUpperCase() || 'none') + '.');
    r('ok', 'Saves', 'Paired saves follow the sheet formula', 'Each save = both ability bonuses + proficiency once per proficient ability in the pair. Bewitchment (INT + CHA) gets it twice: ' + sign(d.saves.Bw) + '.');

    // HP
    var hp = c.hp.max;
    if (hp < d.hpMin || hp > d.hpMaxPossible) r('error', 'Hit points', 'HP maximum outside possible range', 'Range ' + d.hpMin + '–' + d.hpMaxPossible + ' for level ' + d.level + ' with CON ' + sign(d.mod.con) + '.');
    else if (hp === d.hpAvg) r('ok', 'Hit points', 'HP maximum matches fixed average (' + d.hpAvg + ')');
    else r('warn', 'Hit points', 'HP ' + hp + ' differs from the fixed average of ' + d.hpAvg, '1st level 8 + CON (' + (8 + d.mod.con) + '), then ' + (5 + d.mod.con) + ' per level using the fixed value. ' + hp + ' is legal only if the hit dice were rolled (possible range ' + d.hpMin + '–' + d.hpMaxPossible + '). Confirm with your DM.');
    r('ok', 'Hit points', 'Hit dice: ' + d.level + 'd8', (d.tfl ? d.tfl + 'd8 Tiefling' : '') + (d.clr ? ' + ' + d.clr + 'd8 Cleric' : ''));
    r('ok', 'Hit points', 'Vitality ' + d.vitMax + ' and Acumen ' + d.acuMax, 'Vitality = STR + DEX + CON bonuses (' + [d.mod.str, d.mod.dex, d.mod.con].map(sign).join(' ') + '); Acumen = INT + WIS + CHA bonuses (' + [d.mod.int, d.mod.wis, d.mod.cha].map(sign).join(' ') + ').');

    // Skills
    var bgd = D.BACKGROUNDS[c.background];
    var bgSkills = bgd ? bgd.skills : [];
    var prof = Object.keys(c.skills).filter(function (k) { return c.skills[k]; });
    var classPicks = prof.filter(function (k) { return bgSkills.indexOf(k) < 0; });
    var firstC = D.CLASSES[c.classes[0].id];
    var bad = classPicks.filter(function (k) { return firstC.skillList.indexOf(k) < 0; });
    function sn(k) { for (var i = 0; i < D.SKILLS.length; i++) if (D.SKILLS[i].k === k) return D.SKILLS[i].n; return k; }
    if (bgd) {
      var miss = bgSkills.filter(function (k) { return !c.skills[k]; });
      if (miss.length) r('warn', 'Skills', 'Background skills missing', c.background + ' grants ' + bgSkills.map(sn).join(' and ') + '.');
      else r('ok', 'Skills', c.background + ' skills: ' + bgSkills.map(sn).join(', '));
    }
    if (bad.length) r('error', 'Skills', 'Skill not on the ' + firstC.n + ' list', bad.map(sn).join(', ') + ' can’t be picked from the class list.');
    if (classPicks.length === firstC.skillCount && !bad.length) r('ok', 'Skills', firstC.n + ' skills: ' + classPicks.map(sn).join(', '), 'Choose ' + firstC.skillCount + ' from the class list — all valid.');
    else if (classPicks.length !== firstC.skillCount) r(classPicks.length > firstC.skillCount ? 'error' : 'warn', 'Skills', classPicks.length + ' class skills chosen, ' + firstC.skillCount + ' allowed', 'Multiclassing into Cleric grants no skills.');
    if (c.expertise.length) {
      var allowed = d.tfl >= 10 ? 4 : d.tfl >= 3 ? 2 : 0;
      if (c.expertise.length > allowed) r('error', 'Skills', 'Too many Expertise skills', allowed + ' allowed at Tiefling ' + d.tfl + '.');
    }
    if (d.tfl >= 3 && c.expertise.length < (d.tfl >= 10 ? 4 : 2)) r('warn', 'Skills', 'Expertise not chosen', 'Tiefling 3rd level grants two Expertise skills.');

    // Tools & languages
    if (d.tfl) {
      if ((c.tools || []).length === T.toolCount) r('ok', 'Proficiencies', 'Three musical instruments', c.tools.join(', '));
      else r('warn', 'Proficiencies', 'Tiefling grants three musical instruments', 'Found ' + (c.tools || []).length + '.');
    }
    var langs = c.languages || [];
    if (langs.some(function (l) { return /^dragon$/i.test(l); })) r('info', 'Proficiencies', '“Dragon” is usually called Draconic', 'Just a naming nit for the sheet.');
    if (bgd && bgd.languages) r('info', 'Proficiencies', c.background + ' grants ' + bgd.languages + ' extra languages', 'The race-class doesn’t list languages, so with Common and Infernal as defaults, ' + langs.length + ' known means ' + Math.max(0, 2 + bgd.languages - langs.length) + ' language choice(s) still open.');

    // Armor & weapons
    var ar = d.armor;
    if (ar.type !== 'none' && !d.armorProf[ar.type]) r('error', 'Equipment', 'Not proficient with ' + ar.n.toLowerCase() + ' (' + ar.type + ')', 'Disadvantage on STR/DEX rolls and you can’t cast spells while wearing it.');
    else if (ar.type !== 'none') r('ok', 'Equipment', ar.n + ' armor: proficient', 'AC ' + ar.base + ' + DEX ' + sign(Math.min(d.mod.dex, ar.dex)) + (c.shield ? ' + shield 2' : '') + ' = ' + d.ac + '.');
    if (ar.str && c.abilities.str < ar.str) r('warn', 'Equipment', ar.n + ' needs STR ' + ar.str, 'Speed drops by 10 ft.');
    if (c.shield && !d.armorProf.shield) r('error', 'Equipment', 'Not proficient with shields');
    if (!c.shield && d.armorProf.shield) r('info', 'Equipment', 'Shield proficiency unused', 'Cleric multiclass grants shields: carrying one would make AC ' + (d.ac + 2) + '.');
    d.weapons.forEach(function (w) {
      if (w.prof) r('ok', 'Equipment', w.name + ': proficient', 'To hit ' + sign(w.hit) + ' (' + w.ab.toUpperCase() + ' ' + sign(d.mod[w.ab]) + ' + prof ' + d.prof + '), ' + w.die + (w.dmgMod ? sign(w.dmgMod) : '') + ' ' + w.type + '.');
      else r('error', 'Equipment', 'Not proficient with ' + w.name, 'No proficiency bonus to hit.');
      if (w.mastery) r('info', 'Equipment', w.name + ' lists the ' + w.mastery + ' mastery', 'Neither Tiefling nor Cleric grants Weapon Mastery, so the mastery property only applies if your table gives it to everyone.');
    });
    if (d.tfl) {
      var names = c.items.map(function (i) { return i.n.toLowerCase(); }).join('|');
      var missing = [];
      if (!/dagger/.test(names)) missing.push('a dagger');
      if (!/(lute|flute|drum|lyre|horn|viol|pan|bagpipe|dulcimer|shawm|instrument)/.test(names)) missing.push('a musical instrument (lute or other)');
      if (missing.length) r('warn', 'Equipment', 'Starting equipment incomplete', 'Tiefling starting gear includes leather armor and a dagger, plus a lute or other instrument. Not on the sheet: ' + missing.join(' and ') + '.');
    }
    var dp = c.items.filter(function (i) { return /diplomat/i.test(i.n); })[0];
    if (dp && +dp.w !== 39) r('warn', 'Equipment', 'Diplomat’s pack weighs 39 lb', 'The sheet records ' + dp.w + ' lb (chest 25, fine clothes 6, and so on add to 39). Corrected total: ' + (d.weight - dp.w + 39) + ' lb.');

    // Encumbrance
    if (d.enc === 'ok') r('ok', 'Burden', 'Carrying ' + d.weight + ' lb of ' + d.cap.enc + ' lb', 'Unencumbered.');
    else r(d.enc === 'over' ? 'error' : 'warn', 'Burden', (d.enc === 'enc' ? 'Encumbered' : d.enc === 'heavy' ? 'Heavily encumbered' : 'Over maximum load') + ': ' + d.weight + ' lb carried', 'STR ' + c.abilities.str + ' gives ' + d.cap.enc + ' lb before encumbrance (STR × 5). ' + (d.enc === 'enc' ? 'Speed −10 ft (' + d.speed + ' ft).' : d.enc === 'heavy' ? 'Speed −20 ft and disadvantage on STR, DEX and CON rolls.' : 'You can’t move.') + ' The sheet lists speed 30 ft.');

    // Spells
    var tfs = c.spells.tiefling || { cantrips: [], known: [] };
    var cls = c.spells.cleric || { cantrips: [], prepared: [] };
    function nm(id) { return D.SPELL[id] ? D.SPELL[id].n : id; }
    if (d.tfl) {
      var tc = tfs.cantrips.length;
      var badC = tfs.cantrips.filter(function (id) { var s = D.SPELL[id]; return !s || s.lvl !== 0 || s.lists.indexOf('warlock') < 0; });
      if (tc === d.tflCantrips && !badC.length) r('ok', 'Spells', 'Tiefling cantrips: ' + tfs.cantrips.map(nm).join(', ') + ' + Thaumaturgy', d.tflCantrips + ' warlock cantrips known, plus Thaumaturgy from Infernal Legacy.');
      else r('error', 'Spells', 'Tiefling cantrips: ' + tc + ' of ' + d.tflCantrips, badC.length ? 'Not warlock cantrips: ' + badC.map(nm).join(', ') : 'Pick from the warlock list.');
      var badK = tfs.known.filter(function (id) { var s = D.SPELL[id]; return !s || s.lists.indexOf('warlock') < 0 || s.lvl < 1 || s.lvl > d.pact.lvl; });
      if (tfs.known.length === d.tflKnown && !badK.length) r('ok', 'Spells', 'Tiefling spells known: ' + tfs.known.map(nm).join(', '), d.tflKnown + ' warlock spells of slot level ' + d.pact.lvl + ' or lower.');
      else r(tfs.known.length > d.tflKnown || badK.length ? 'error' : 'warn', 'Spells', 'Tiefling spells known: ' + tfs.known.length + ' of ' + d.tflKnown, badK.length ? 'Not allowed: ' + badK.map(nm).join(', ') + ' (warlock list, up to ' + ordinal(d.pact.lvl) + ' level).' : '');
      r('ok', 'Spells', 'Pact slots: ' + d.pact.n + ' × ' + ordinal(d.pact.lvl) + ' level', 'Recover on a short or long rest. Kept separate from Cleric slots under multiclass rules.');
      r('ok', 'Spells', 'Tiefling DC ' + d.casters[0].dc + ', attack ' + sign(d.casters[0].atk), '8 + prof ' + d.prof + ' + CHA ' + sign(d.mod.cha) + '.');
    }
    if (d.clr) {
      var cc = cls.cantrips.filter(function (id) { var s = D.SPELL[id]; return !s || s.lvl !== 0 || s.lists.indexOf('cleric') < 0; });
      if (cls.cantrips.length === d.clrCantrips && !cc.length) r('ok', 'Spells', 'Cleric cantrips: ' + cls.cantrips.map(nm).join(', '), d.clrCantrips + ' cleric cantrips at Cleric ' + d.clr + '.');
      else r('error', 'Spells', 'Cleric cantrips: ' + cls.cantrips.length + ' of ' + d.clrCantrips, cc.length ? 'Not cleric cantrips: ' + cc.map(nm).join(', ') : '');
      var bp = cls.prepared.filter(function (id) { var s = D.SPELL[id]; return !s || s.lists.indexOf('cleric') < 0 || s.lvl < 1 || s.lvl > d.maxClrSlot; });
      var dup = cls.prepared.filter(function (id) { return d.domainSpells.indexOf(id) >= 0; });
      if (cls.prepared.length <= d.clrPrepared && !bp.length) r(cls.prepared.length === d.clrPrepared ? 'ok' : 'info', 'Spells', 'Cleric prepared: ' + cls.prepared.length + ' of ' + d.clrPrepared, cls.prepared.map(nm).join(', ') + '. Limit = WIS ' + sign(d.mod.wis) + ' + Cleric level ' + d.clr + '.');
      else r('error', 'Spells', 'Cleric prepared: ' + cls.prepared.length + ' of ' + d.clrPrepared, bp.length ? 'Not allowed: ' + bp.map(nm).join(', ') : 'Too many prepared spells.');
      if (dup.length) r('warn', 'Spells', 'Domain spell also prepared', dup.map(nm).join(', ') + ' is always prepared and doesn’t need a slot in your list.');
      if (d.domainSpells.length) r('ok', 'Spells', 'Domain spells always prepared: ' + d.domainSpells.map(nm).join(', '));
      r('ok', 'Spells', 'Cleric slots: ' + d.slots.map(function (n, i) { return n + ' × ' + ordinal(i + 1); }).join(', '), 'Multiclass caster level ' + d.clr + ' (Pact Magic doesn’t count).');
      r('ok', 'Spells', 'Cleric DC ' + d.casters[d.casters.length - 1].dc + ', attack ' + sign(d.casters[d.casters.length - 1].atk), '8 + prof ' + d.prof + ' + WIS ' + sign(d.mod.wis) + '.');
    }
    if (d.tfl >= 2) {
      var inv = (c.invocations || []).length;
      if (inv !== d.invocations) r('warn', 'Spells', 'Eldritch invocations: ' + inv + ' of ' + d.invocations);
    }
    if (d.bardic) r('ok', 'Resources', 'Bardic Inspiration d' + d.bardic.die + ' × ' + d.bardic.uses, 'Uses = CHA modifier ' + sign(d.mod.cha) + '.');
    if (d.cd) r('ok', 'Resources', 'Channel Divinity × ' + d.cd + ' per short rest');

    // XP
    var need = D.XP[Math.min(19, d.level - 1)];
    if (c.xp === '' || c.xp == null) r('info', 'Progress', 'Experience points blank', 'Level ' + d.level + ' starts at ' + need.toLocaleString() + ' XP (if your table uses XP).');
    else if (+c.xp < need) r('warn', 'Progress', 'XP below level ' + d.level, need.toLocaleString() + ' XP needed.');
    return out;
  }

  // Compare the PDF sheet's recorded numbers with values computed from the rules.
  function audit(c, d) {
    var s = D.ZAPHYRE_SHEET, out = [];
    function a(label, rec, comp, note) { out.push({ label: label, rec: rec, comp: comp, ok: String(rec) === String(comp), note: note || '' }); }
    D.ABILITIES.forEach(function (x) { a(x.s + ' bonus', sign(s.mods[x.k]), sign(d.mod[x.k])); });
    a('Proficiency', sign(s.prof), sign(d.prof));
    a('Armor Class', s.ac, d.ac);
    a('Vitality', s.vitality, d.vitMax);
    a('Acumen', s.acumen, d.acuMax);
    a('Hit points', s.hp, d.hpAvg, 'Rolled HP is allowed');
    a('Initiative', sign(s.init), sign(d.init));
    a('Speed', s.speed + ' ft', d.speed + ' ft', d.speedPenalty ? 'Encumbrance' : '');
    D.SAVES.forEach(function (x) { a(x.n + ' (' + x.c + ')', sign(s.saves[x.c]), sign(d.saves[x.c])); });
    D.SKILLS.forEach(function (x) { a(x.n, sign(s.skills[x.k]), sign(d.skills[x.k])); });
    a('Passive Perception', s.passPer, d.passive.per);
    a('Passive Insight', s.passIns, d.passive.ins);
    a('Passive Investigation', s.passInv, d.passive.inv);
    var rap = d.weapons.filter(function (w) { return w.name === 'Rapier'; })[0];
    if (rap) a('Rapier to hit', sign(s.rapierHit), sign(rap.hit));
    if (d.casters[0]) { a('Tiefling spell DC', s.tflDC, d.casters[0].dc); a('Tiefling spell attack', sign(s.tflAtk), sign(d.casters[0].atk)); }
    if (d.casters[1]) { a('Cleric spell DC', s.clrDC, d.casters[1].dc); a('Cleric spell attack', sign(s.clrAtk), sign(d.casters[1].atk)); }
    a('1st-level slots', s.slots1, d.slots[0] || 0);
    a('Pact slots', s.pact, d.pact ? d.pact.n : 0);
    a('Bardic Inspiration uses', s.bardic, d.bardic ? d.bardic.uses : 0);
    a('Channel Divinity', s.cd, d.cd);
    a('Hit dice', s.hitDice + 'd8', d.hitDice + 'd8');
    a('Cleric prepared', s.prepared, d.clrPrepared);
    a('Tiefling spells known', s.known, d.tflKnown);
    a('Carrying capacity', s.cap.join(' / '), [d.cap.enc, d.cap.heavy, d.cap.max, d.cap.push].join(' / '));
    a('Weight carried', s.weight + ' lb', d.weight + ' lb');
    return out;
  }

  window.Rules = { mod: mod, sign: sign, derive: derive, features: features, validate: validate, audit: audit, ordinal: ordinal, lvlOf: lvlOf };
})();
