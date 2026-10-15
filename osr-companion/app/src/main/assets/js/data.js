/* Rules data for OSR 5th Edition (5.5e homebrew), taken from the Class Compendium 1.5
 * and the OSR 5th Edition Character Record Sheet. Spell summaries are short paraphrases. */
(function () {
  'use strict';

  var ABILITIES = [
    { k: 'str', n: 'Strength', s: 'STR' },
    { k: 'dex', n: 'Dexterity', s: 'DEX' },
    { k: 'con', n: 'Constitution', s: 'CON' },
    { k: 'int', n: 'Intelligence', s: 'INT' },
    { k: 'wis', n: 'Wisdom', s: 'WIS' },
    { k: 'cha', n: 'Charisma', s: 'CHA' }
  ];

  // Each save = both paired ability bonuses + proficiency once per proficient ability in the pair.
  var SAVES = [
    { c: 'CI', n: 'Crushing Impact', a: ['str', 'dex'], d: 'Collapse, boulders, stomps' },
    { c: 'CD', n: 'Clutch of Death', a: ['str', 'con'], d: 'Grapples, constriction' },
    { c: 'MB', n: 'Mindbreak', a: ['str', 'int'], d: 'Psychic blows, mad visions' },
    { c: 'OF', n: 'Overwhelming Force', a: ['str', 'wis'], d: 'Shockwaves, shoves' },
    { c: 'DB', n: 'Dread Beyond', a: ['str', 'cha'], d: 'Dragon fear, dread auras' },
    { c: 'VT', n: 'Virulent Touch', a: ['dex', 'con'], d: 'Poison, venom, toxins' },
    { c: 'DA', n: 'Deadly Apparatus', a: ['dex', 'int'], d: 'Traps, blades, devices' },
    { c: 'MP', n: 'Mortal Peril', a: ['dex', 'cha'], d: 'Ambush, falls, bad footing' },
    { c: 'HC', n: 'Hexcraft', a: ['dex', 'wis'], d: 'Binding spells, snares' },
    { c: 'Cr', n: 'Creeping Doom', a: ['con', 'int'], d: 'Disease, rot, blight' },
    { c: 'NW', n: 'Nature\u2019s Wrath', a: ['con', 'wis'], d: 'Heat, cold, storms' },
    { c: 'SR', n: 'Soul Rending', a: ['con', 'cha'], d: 'Necrotic, possession' },
    { c: 'Ph', n: 'Phantasmagoria', a: ['int', 'wis'], d: 'Illusions, glamours' },
    { c: 'Bw', n: 'Bewitchment', a: ['int', 'cha'], d: 'Charms, domination' },
    { c: 'Dv', n: 'Devilry', a: ['wis', 'cha'], d: 'Curses, infernal rites' }
  ];

  var SKILLS = [
    { k: 'acrobatics', n: 'Acrobatics', a: 'dex' },
    { k: 'animal', n: 'Animal Handling', a: 'wis' },
    { k: 'arcana', n: 'Arcana', a: 'int' },
    { k: 'athletics', n: 'Athletics', a: 'str' },
    { k: 'deception', n: 'Deception', a: 'cha' },
    { k: 'history', n: 'History', a: 'int' },
    { k: 'insight', n: 'Insight', a: 'wis' },
    { k: 'intimidation', n: 'Intimidation', a: 'cha' },
    { k: 'investigation', n: 'Investigation', a: 'int' },
    { k: 'medicine', n: 'Medicine', a: 'wis' },
    { k: 'nature', n: 'Nature', a: 'int' },
    { k: 'perception', n: 'Perception', a: 'wis' },
    { k: 'performance', n: 'Performance', a: 'cha' },
    { k: 'persuasion', n: 'Persuasion', a: 'cha' },
    { k: 'religion', n: 'Religion', a: 'int' },
    { k: 'sleight', n: 'Sleight of Hand', a: 'dex' },
    { k: 'stealth', n: 'Stealth', a: 'dex' },
    { k: 'survival', n: 'Survival', a: 'wis' }
  ];

  var XP = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
    120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

  // ---- Classes (only those this character uses carry full progression data)
  var CLASSES = {
    tiefling: {
      n: 'Tiefling', race: true, hd: 8, tag: 'Tfl', ability: 'cha', list: 'warlock',
      tagline: 'Warlock/Bard Hybrid \u2014 Infernal Charmer',
      saves: ['int', 'cha'],
      asi: { int: 1, cha: 2 },
      armor: ['light'], shields: false,
      weapons: { simple: true, martial: false, list: ['hand crossbow', 'longsword', 'rapier', 'shortsword'] },
      tools: 'Three musical instruments of your choice', toolCount: 3,
      skillCount: 4,
      skillList: ['arcana', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'performance', 'persuasion', 'religion', 'sleight', 'stealth'],
      equipment: ['(a) a rapier, (b) a longsword, or (c) any simple weapon', '(a) a diplomat\u2019s pack or (b) an entertainer\u2019s pack', '(a) a lute or (b) any other musical instrument', 'Leather armor and a dagger'],
      // lvl: [cantrips, spells known, pact slots, slot level, invocations, inspiration die]
      table: [null,
        [2, 2, 1, 1, 0, 6], [2, 3, 2, 1, 1, 6], [2, 4, 2, 2, 1, 6], [3, 5, 2, 2, 1, 8], [3, 6, 2, 3, 1, 8],
        [3, 7, 2, 3, 2, 8], [3, 8, 2, 4, 2, 8], [3, 9, 2, 4, 2, 8], [3, 10, 2, 5, 2, 8], [4, 11, 2, 5, 2, 10],
        [4, 12, 3, 5, 2, 10], [4, 12, 3, 5, 3, 10], [4, 13, 3, 5, 3, 10], [4, 14, 3, 5, 3, 10], [4, 15, 3, 5, 3, 10],
        [4, 15, 3, 5, 3, 10], [4, 15, 4, 5, 3, 10], [4, 15, 4, 5, 4, 10], [4, 15, 4, 5, 4, 10], [4, 15, 4, 5, 4, 10]],
      subs: {
        pact: { n: 'Path of the Pact' },
        charmer: { n: 'Path of the Charmer' },
        hellfire: { n: 'Path of Hellfire' }
      },
      subAt: 3, subLabel: 'Infernal Heritage'
    },
    cleric: {
      n: 'Cleric', hd: 8, tag: 'Clr', ability: 'wis', list: 'cleric',
      tagline: 'Divine Agent and Healer',
      saves: ['wis', 'cha'],
      prereq: { wis: 13 },
      mcArmor: ['light', 'medium'], mcShields: true, mcWeapons: null,
      armor: ['light', 'medium'], shields: true,
      weapons: { simple: true, martial: false, list: [] },
      skillCount: 2, skillList: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
      cantrips: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      subs: {
        twilight: {
          n: 'Twilight Domain',
          bonusArmor: ['heavy'], bonusMartial: true,
          spells: { 1: ['faerie-fire', 'sleep'], 3: ['moonbeam', 'see-invisibility'], 5: ['aura-of-vitality', 'leomunds-tiny-hut'], 7: ['aura-of-life', 'greater-invisibility'], 9: ['circle-of-power', 'mislead'] }
        }
      },
      subAt: 1, subLabel: 'Divine Domain'
    }
  };

  // Full-caster spell slots by caster level (Cleric table = multiclass spellcaster table).
  var FULL_SLOTS = [null,
    [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
    [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];

  // Other compendium classes: enough to show multiclass prerequisites.
  var MC_PREREQ = {
    Barbarian: 'STR 13', Bard: 'CHA 13', Cleric: 'WIS 13', Druid: 'WIS 13', Fighter: 'STR or DEX 13', Monk: 'DEX & WIS 13',
    Paladin: 'STR & CHA 13', Ranger: 'DEX & WIS 13', Rogue: 'DEX 13', Sorcerer: 'CHA 13', Warlock: 'CHA 13', Wizard: 'INT 13'
  };

  // 2024 (5.5e) backgrounds: ability increases, an Origin feat, two skills, a tool and equipment.
  var BACKGROUNDS = {
    Acolyte: {
      abilities: ['int', 'wis', 'cha'],
      feat: 'Magic Initiate (Cleric)', featList: 'cleric',
      skills: ['insight', 'religion'],
      tool: 'Calligrapher’s Supplies',
      equipA: ['Calligrapher’s Supplies', 'Book (prayers)', 'Holy Symbol', 'Parchment (10 sheets)', 'Robe', '8 GP'],
      equipB: '50 GP',
      legacyFeature: 'Shelter of the Faithful'
    }
  };
  var MAGIC_INITIATE = 'You learn two cantrips and one level 1 spell from the Cleric list, using INT, WIS or CHA (chosen when you take the feat). The level 1 spell is always prepared; you can cast it once without a slot per long rest, and with any spell slots you have. You can swap it when you gain a level.';

  var ARMOR = {
    none: { n: 'No armor', base: 10, dex: 99, type: 'none', w: 0 },
    padded: { n: 'Padded', base: 11, dex: 99, type: 'light', w: 8, stealth: true },
    leather: { n: 'Leather', base: 11, dex: 99, type: 'light', w: 10 },
    studded: { n: 'Studded leather', base: 12, dex: 99, type: 'light', w: 13 },
    hide: { n: 'Hide', base: 12, dex: 2, type: 'medium', w: 12 },
    chainshirt: { n: 'Chain shirt', base: 13, dex: 2, type: 'medium', w: 20 },
    scale: { n: 'Scale mail', base: 14, dex: 2, type: 'medium', w: 45, stealth: true },
    breastplate: { n: 'Breastplate', base: 14, dex: 2, type: 'medium', w: 20 },
    halfplate: { n: 'Half plate', base: 15, dex: 2, type: 'medium', w: 40, stealth: true },
    ring: { n: 'Ring mail', base: 14, dex: 0, type: 'heavy', w: 40, stealth: true },
    chain: { n: 'Chain mail', base: 16, dex: 0, type: 'heavy', w: 55, str: 13, stealth: true },
    splint: { n: 'Splint', base: 17, dex: 0, type: 'heavy', w: 60, str: 15, stealth: true },
    plate: { n: 'Plate', base: 18, dex: 0, type: 'heavy', w: 65, str: 15, stealth: true }
  };

  // name: [category, damage, type, properties, mastery, weight]
  var WEAPONS = {
    'Club': ['simple', '1d4', 'bludgeoning', 'Light', 'Slow', 2],
    'Dagger': ['simple', '1d4', 'piercing', 'Finesse, Light, Thrown (20/60)', 'Nick', 1],
    'Greatclub': ['simple', '1d8', 'bludgeoning', 'Two-Handed', 'Push', 10],
    'Handaxe': ['simple', '1d6', 'slashing', 'Light, Thrown (20/60)', 'Vex', 2],
    'Javelin': ['simple', '1d6', 'piercing', 'Thrown (30/120)', 'Slow', 2],
    'Light hammer': ['simple', '1d4', 'bludgeoning', 'Light, Thrown (20/60)', 'Nick', 2],
    'Mace': ['simple', '1d6', 'bludgeoning', '', 'Sap', 4],
    'Quarterstaff': ['simple', '1d6', 'bludgeoning', 'Versatile (1d8)', 'Topple', 4],
    'Sickle': ['simple', '1d4', 'slashing', 'Light', 'Nick', 2],
    'Spear': ['simple', '1d6', 'piercing', 'Thrown (20/60), Versatile (1d8)', 'Sap', 3],
    'Light crossbow': ['simple', '1d8', 'piercing', 'Ammunition (80/320), Loading, Two-Handed', 'Slow', 5],
    'Dart': ['simple', '1d4', 'piercing', 'Finesse, Thrown (20/60)', 'Vex', 0.25],
    'Shortbow': ['simple', '1d6', 'piercing', 'Ammunition (80/320), Two-Handed', 'Vex', 2],
    'Sling': ['simple', '1d4', 'bludgeoning', 'Ammunition (30/120)', 'Slow', 0],
    'Battleaxe': ['martial', '1d8', 'slashing', 'Versatile (1d10)', 'Topple', 4],
    'Flail': ['martial', '1d8', 'bludgeoning', '', 'Sap', 2],
    'Glaive': ['martial', '1d10', 'slashing', 'Heavy, Reach, Two-Handed', 'Graze', 6],
    'Greatsword': ['martial', '2d6', 'slashing', 'Heavy, Two-Handed', 'Graze', 6],
    'Longsword': ['martial', '1d8', 'slashing', 'Versatile (1d10)', 'Sap', 3],
    'Morningstar': ['martial', '1d8', 'piercing', '', 'Sap', 4],
    'Rapier': ['martial', '1d8', 'piercing', 'Finesse', 'Vex', 2],
    'Scimitar': ['martial', '1d6', 'slashing', 'Finesse, Light', 'Nick', 3],
    'Shortsword': ['martial', '1d6', 'piercing', 'Finesse, Light', 'Vex', 2],
    'Warhammer': ['martial', '1d8', 'bludgeoning', 'Versatile (1d10)', 'Push', 5],
    'Whip': ['martial', '1d4', 'slashing', 'Finesse, Reach', 'Slow', 3],
    'Hand crossbow': ['martial', '1d6', 'piercing', 'Ammunition (30/120), Light, Loading', 'Vex', 3],
    'Heavy crossbow': ['martial', '1d10', 'piercing', 'Ammunition (100/400), Heavy, Loading, Two-Handed', 'Push', 18],
    'Longbow': ['martial', '1d8', 'piercing', 'Ammunition (150/600), Heavy, Two-Handed', 'Slow', 2]
  };

  var CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible',
    'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

  // ---- Spells. lists: which class lists offer it. save = OSR paired-save code. sc = cantrip damage scales.
  function S(id, n, lvl, lists, time, range, dur, extra, sum) {
    var o = { id: id, n: n, lvl: lvl, lists: lists, time: time, range: range, dur: dur, sum: sum };
    for (var k in extra) o[k] = extra[k];
    return o;
  }
  var SPELLS = [
    // Cantrips
    S('thaumaturgy', 'Thaumaturgy', 0, ['cleric'], '1A', '30 ft', '1 min', {}, 'A minor wonder: your voice booms, flames flicker, the ground trembles, a sound echoes, a door flies open or your eyes change. Up to three effects at once.'),
    S('eldritch-blast', 'Eldritch Blast', 0, ['warlock'], '1A', '120 ft', 'Inst.', { atk: true, dmg: '1d10', dt: 'force', beams: true }, 'A beam of crackling energy. Ranged spell attack, 1d10 force. More beams at character levels 5, 11 and 17.'),
    S('thunderclap', 'Thunderclap', 0, ['warlock'], '1A', 'Self (5 ft)', 'Inst.', { save: 'OF', dmg: '1d6', dt: 'thunder', sc: true }, 'A burst of thunder around you. Each creature within 5 ft saves or takes 1d6 thunder. The sound carries 100 ft.'),
    S('mending', 'Mending', 0, ['cleric'], '1 min', 'Touch', 'Inst.', {}, 'Repairs a single break or tear in an object, up to 1 ft in any dimension.'),
    S('spare-the-dying', 'Spare the Dying', 0, ['cleric'], '1 BA', '15 ft', 'Inst.', {}, 'A creature with 0 HP becomes stable. Range doubles at character levels 5, 11 and 17.'),
    S('toll-the-dead', 'Toll the Dead', 0, ['cleric', 'warlock'], '1A', '60 ft', 'Inst.', { save: 'SR', dmg: '1d8', dmgAlt: '1d12', dt: 'necrotic', sc: true }, 'A dolorous bell tolls. The target saves or takes 1d8 necrotic, or 1d12 if it is missing any hit points.'),
    S('guidance', 'Guidance', 0, ['cleric'], '1A', 'Touch', 'Conc. 1 min', { conc: true, dmg: '1d4', bonusDie: true }, 'Choose a skill: a willing creature adds 1d4 to ability checks using that skill until the spell ends.'),
    S('sacred-flame', 'Sacred Flame', 0, ['cleric'], '1A', '60 ft', 'Inst.', { save: 'MP', dmg: '1d8', dt: 'radiant', sc: true }, 'Flame-like radiance descends on a creature. It saves or takes 1d8 radiant; cover gives no benefit.'),
    S('light', 'Light', 0, ['cleric'], '1A', 'Touch', '1 hr', {}, 'An object sheds bright light in a 20 ft radius and dim light for another 20 ft.'),
    S('resistance', 'Resistance', 0, ['cleric'], '1A', 'Touch', 'Conc. 1 min', { conc: true, dmg: '1d4', bonusDie: true }, 'Choose a damage type: once per turn, when the creature takes that damage, it reduces it by 1d4.'),
    S('word-of-radiance', 'Word of Radiance', 0, ['cleric'], '1A', 'Self (5 ft)', 'Inst.', { save: 'NW', dmg: '1d6', dt: 'radiant', sc: true }, 'Burning radiance bursts from you. Chosen creatures within 5 ft save or take 1d6 radiant.'),
    S('chill-touch', 'Chill Touch', 0, ['warlock'], '1A', 'Touch', 'Inst.', { atk: true, dmg: '1d10', dt: 'necrotic', sc: true }, 'Melee spell attack: 1d10 necrotic, and the target can’t regain HP until the end of your next turn.'),
    S('minor-illusion', 'Minor Illusion', 0, ['warlock'], '1A', '30 ft', '1 min', { save: 'Ph' }, 'Create a sound or the image of an object no larger than a 5 ft cube.'),
    S('mage-hand', 'Mage Hand', 0, ['warlock'], '1A', '30 ft', '1 min', {}, 'A spectral hand manipulates objects up to 10 lb at range.'),
    S('prestidigitation', 'Prestidigitation', 0, ['warlock'], '1A', '10 ft', '1 hr', {}, 'Minor magical tricks: sparks, cleaning, warming, tiny marks, small illusions.'),
    S('friends', 'Friends', 0, ['warlock'], '1A', 'Self', 'Conc. 1 min', { conc: true }, 'Advantage on Charisma checks against one creature that isn\u2019t hostile; it knows afterwards.'),
    S('poison-spray', 'Poison Spray', 0, ['warlock'], '1A', '30 ft', 'Inst.', { atk: true, dmg: '1d12', dt: 'poison', sc: true }, 'A spray of toxic mist. Ranged spell attack, 1d12 poison.'),
    S('blade-ward', 'Blade Ward', 0, ['warlock'], '1A', 'Self', 'Conc. 1 min', { conc: true }, 'Attack rolls against you subtract 1d4 while the spell lasts.'),

    // 1st level
    S('faerie-fire', 'Faerie Fire', 1, ['domain'], '1A', '60 ft', 'Conc. 1 min', { conc: true, save: 'HC' }, 'Objects and creatures in a 20 ft cube are outlined in light. Those that fail their save shed dim light, can\u2019t benefit from being invisible, and attacks against them have advantage.'),
    S('sleep', 'Sleep', 1, ['domain'], '1A', '60 ft', 'Conc. 1 min', { conc: true, save: 'Bw' }, 'Creatures of your choice in a 5 ft radius sphere save or are Incapacitated until the end of their next turn, when they save again; on a second failure they fall Unconscious for the duration. Creatures that don’t sleep or are immune to exhaustion are unaffected.'),
    S('armor-of-agathys', 'Armor of Agathys', 1, ['warlock'], '1A', 'Self', '1 hr', { temp: 5, dt: 'cold' }, 'You gain 5 temporary HP (+5 per slot level above 1st). While they last, a creature that hits you in melee takes 5 cold damage (same scaling).'),
    S('protection-from-evil-and-good', 'Protection from Evil and Good', 1, ['cleric', 'warlock'], '1A', 'Touch', 'Conc. 10 min', { conc: true }, 'Aberrations, celestials, elementals, fey, fiends and undead have disadvantage to attack the target, and it can\u2019t be charmed, frightened or possessed by them.'),
    S('command', 'Command', 1, ['cleric'], '1A', '60 ft', '1 rnd', { save: 'Bw' }, 'A one-word command (approach, drop, flee, grovel, halt). On a failed save the target obeys on its next turn. +1 target per slot level above 1st.'),
    S('cure-wounds', 'Cure Wounds', 1, ['cleric'], '1A', 'Touch', 'Inst.', { heal: true, dmg: '2d8', addMod: true, up: '2d8' }, 'A creature you touch regains 2d8 + your spellcasting modifier HP. +2d8 per slot level above 1st.'),
    S('guiding-bolt', 'Guiding Bolt', 1, ['cleric'], '1A', '120 ft', '1 rnd', { atk: true, dmg: '4d6', dt: 'radiant', up: '1d6' }, 'A flash of light streaks toward a creature. Ranged spell attack, 4d6 radiant, and the next attack against it before the end of your next turn has advantage.'),
    S('healing-word', 'Healing Word', 1, ['cleric'], '1 BA', '60 ft', 'Inst.', { heal: true, dmg: '2d4', addMod: true, up: '2d4' }, 'A creature you can see regains 2d4 + your spellcasting modifier HP. +2d4 per slot level above 1st.'),
    S('bless', 'Bless', 1, ['cleric'], '1A', '30 ft', 'Conc. 1 min', { conc: true, dmg: '1d4', bonusDie: true }, 'Up to three creatures add 1d4 to attack rolls and saving throws for the duration.'),
    S('bane', 'Bane', 1, ['cleric'], '1A', '30 ft', 'Conc. 1 min', { conc: true, save: 'Dv' }, 'Up to three creatures that fail their save subtract 1d4 from attack rolls and saving throws.'),
    S('detect-magic', 'Detect Magic', 1, ['cleric'], '1A', 'Self', 'Conc. 10 min', { conc: true, rit: true }, 'Sense magic within 30 ft and see the aura and school of visible magic.'),
    S('inflict-wounds', 'Inflict Wounds', 1, ['cleric'], '1A', 'Touch', 'Inst.', { save: 'SR', dmg: '2d10', dt: 'necrotic', up: '1d10' }, 'The creature you touch takes 2d10 necrotic on a failed save, half on a success.'),
    S('sanctuary', 'Sanctuary', 1, ['cleric'], '1 BA', '30 ft', '1 min', { save: 'Bw' }, 'Anyone targeting the warded creature with an attack or harmful spell must first save or choose a new target.'),
    S('shield-of-faith', 'Shield of Faith', 1, ['cleric'], '1 BA', '60 ft', 'Conc. 10 min', { conc: true }, 'A shimmering field grants a creature +2 AC for the duration.'),
    S('hex', 'Hex', 1, ['warlock'], '1 BA', '90 ft', 'Conc. 1 hr', { conc: true, dmg: '1d6', dt: 'necrotic' }, 'Curse a creature: your hits deal +1d6 necrotic to it, and it has disadvantage on checks with one ability you choose.'),
    S('hellish-rebuke', 'Hellish Rebuke', 1, ['warlock'], '1 R', '60 ft', 'Inst.', { save: 'Dv', dmg: '2d10', dt: 'fire', up: '1d10' }, 'When damaged by a creature you can see, it is wreathed in flames: 2d10 fire, half on a successful save.'),
    S('charm-person', 'Charm Person', 1, ['warlock'], '1A', '30 ft', '1 hr', { save: 'Bw' }, 'A humanoid saves (with advantage if you are fighting it) or is charmed and regards you as a friendly acquaintance.'),
    S('witch-bolt', 'Witch Bolt', 1, ['warlock'], '1A', '60 ft', 'Conc. 1 min', { conc: true, atk: true, dmg: '2d12', dt: 'lightning', up: '1d12' }, 'Ranged spell attack, 2d12 lightning. On later turns a bonus action deals 1d12 lightning to the target automatically.'),
    S('comprehend-languages', 'Comprehend Languages', 1, ['warlock'], '1A', 'Self', '1 hr', { rit: true }, 'Understand any spoken language you hear and read any written language you touch.'),
    S('expeditious-retreat', 'Expeditious Retreat', 1, ['warlock'], '1 BA', 'Self', 'Conc. 10 min', { conc: true }, 'Dash as a bonus action on each of your turns.'),
    S('arms-of-hadar', 'Arms of Hadar', 1, ['warlock'], '1A', 'Self (10 ft)', 'Inst.', { save: 'OF', dmg: '2d6', dt: 'necrotic', up: '1d6' }, 'Dark tendrils lash out around you: 2d6 necrotic (half on a save), and those that fail can\u2019t take reactions.'),
    S('unseen-servant', 'Unseen Servant', 1, ['warlock'], '1A', '60 ft', '1 hr', { rit: true }, 'An invisible, mindless force performs simple tasks at your command.'),
    S('illusory-script', 'Illusory Script', 1, ['warlock'], '1 min', 'Touch', '10 days', { rit: true }, 'Write a message only chosen creatures can read; others see something else.'),

    // 2nd level (domain and infernal legacy, for later levels)
    S('moonbeam', 'Moonbeam', 2, ['domain'], '1A', '120 ft', 'Conc. 1 min', { conc: true, save: 'SR', dmg: '2d10', dt: 'radiant', up: '1d10' }, 'A 5 ft radius pillar of moonlight: creatures entering or starting there save or take 2d10 radiant (half on save).'),
    S('see-invisibility', 'See Invisibility', 2, ['domain'], '1A', 'Self', '1 hr', {}, 'See invisible creatures and objects and into the Ethereal Plane.'),
    S('darkness', 'Darkness', 2, ['warlock'], '1A', '60 ft', 'Conc. 10 min', { conc: true }, 'Magical darkness fills a 15 ft radius sphere. Darkvision can\u2019t see through it.')
  ];
  var SPELL_BY_ID = {};
  SPELLS.forEach(function (s) { SPELL_BY_ID[s.id] = s; });

  // ---- The values written on Zaphyre's PDF sheet, used for the sheet audit.
  var ZAPHYRE_SHEET = {
    ac: 11, hp: 25, vitality: 0, acumen: 10, prof: 2, init: 0, speed: 30, passPer: 12, passIns: 14, passInv: 16,
    mods: { str: -2, dex: 0, con: 2, int: 4, wis: 2, cha: 4 },
    saves: { CI: -2, CD: 0, MB: 4, OF: 0, DB: 4, VT: 2, DA: 6, MP: 6, HC: 2, Cr: 8, NW: 4, SR: 8, Ph: 8, Bw: 12, Dv: 8 },
    skills: { acrobatics: 0, animal: 2, arcana: 6, athletics: -2, deception: 4, history: 6, insight: 4, intimidation: 6, investigation: 6, medicine: 2, nature: 4, perception: 2, performance: 4, persuasion: 4, religion: 6, sleight: 0, stealth: 0, survival: 2 },
    rapierHit: 2, tflDC: 14, tflAtk: 6, clrDC: 12, clrAtk: 4,
    slots1: 3, pact: 1, bardic: 4, cd: 1, hitDice: 3, weight: 48, cap: [35, 70, 105, 210], prepared: 4, known: 2
  };

  // Spell lines as printed on the PDF: [time, range, duration]
  var ZAPHYRE_SPELLS = {
    thaumaturgy: ['1A', '30 ft', '1 min'], 'eldritch-blast': ['1A', '120 ft', 'Inst.'],
    mending: ['1 min', 'Touch', 'Inst.'], 'spare-the-dying': ['1A', 'Touch', 'Inst.'],
    thunderclap: ['1A', 'Self 5 ft', 'Inst.'], 'toll-the-dead': ['1A', '60 ft', 'Inst.'],
    'faerie-fire': ['1A', '60 ft', '1 min'], sleep: ['1A', '90 ft', '1 min'],
    'armor-of-agathys': ['1A', 'Self', '1 hr'], command: ['1A', '60 ft', '1 rnd'],
    'cure-wounds': ['1A', 'Touch', 'Inst.'], 'guiding-bolt': ['1A', '120 ft', '1 rnd'],
    'healing-word': ['1 BA', '60 ft', 'Inst.'], 'protection-from-evil-and-good': ['1A', 'Touch', '10 min']
  };

  // ---- Default character: Zaphyre Blight, as written on the sheet.
  var ZAPHYRE = {
    v: 1,
    id: 'zaphyre',
    name: 'Zaphyre Blight', alignment: 'Neutral Good', ancestry: 'Tiefling', background: 'Acolyte',
    xp: '', player: 'Nixxen', campaign: 'OSR', dm: 'Calvin', size: 'Medium', speed: 30,
    classes: [{ id: 'tiefling', level: 1, sub: '' }, { id: 'cleric', level: 2, sub: 'twilight' }],
    abilities: { str: 7, dex: 10, con: 15, int: 18, wis: 15, cha: 18 },
    hp: { max: 25, cur: 25, temp: 0, rolled: true },
    vit: 0, acu: 10,
    armor: 'leather', shield: false,
    saveProf: ['int', 'cha'],
    skills: { arcana: 1, history: 1, investigation: 1, intimidation: 1, insight: 1, religion: 1 },
    expertise: [],
    tools: ['Flute', 'Drums', 'Lute'],
    languages: ['Common', 'Infernal', 'Dragon'],
    invocations: [],
    weapons: [{ name: 'Rapier', quality: 'C' }],
    items: [
      { n: 'Leather armor', loc: 'Worn', w: 10 },
      { n: 'Rapier', loc: 'Carried', w: 2 },
      { n: 'Diplomat\u2019s pack', loc: 'Back', w: 36 }
    ],
    coins: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    magicItems: [],
    feats: [],
    magicInitiate: { ability: '', cantrips: [], spell: '' },
    spells: {
      tiefling: { cantrips: ['eldritch-blast', 'thunderclap'], known: ['armor-of-agathys', 'protection-from-evil-and-good'] },
      cleric: { cantrips: ['mending', 'spare-the-dying', 'toll-the-dead'], prepared: ['command', 'cure-wounds', 'guiding-bolt', 'healing-word'] }
    },
    used: { slots: {}, pact: 0, bardic: 0, cd: 0, eyes: 0, hd: 0, legacy: {}, mi: 0 },
    conditions: [], exhaustion: 0, death: { s: 0, f: 0 }, concentration: '',
    notes: { traits: '', ideals: '', bonds: '', flaws: '', backstory: '', other: '' },
    lifestyle: '', trinket: ''
  };

  window.OSR = {
    ABILITIES: ABILITIES, SAVES: SAVES, SKILLS: SKILLS, XP: XP, CLASSES: CLASSES, FULL_SLOTS: FULL_SLOTS,
    MC_PREREQ: MC_PREREQ, BACKGROUNDS: BACKGROUNDS, MAGIC_INITIATE: MAGIC_INITIATE, ZAPHYRE_SPELLS: ZAPHYRE_SPELLS, ARMOR: ARMOR, WEAPONS: WEAPONS, CONDITIONS: CONDITIONS,
    SPELLS: SPELLS, SPELL: SPELL_BY_ID, ZAPHYRE_SHEET: ZAPHYRE_SHEET, ZAPHYRE: ZAPHYRE
  };
})();
