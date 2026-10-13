// Hero model and the rules engine. This is a TypeScript port of the Origin Story web
// builder's engine, and the saved hero shape is identical so JSON moves between them.
import {
  ARCHETYPES, BACKGROUNDS, DIVIDED, FORM_CHANGER, HEALTH_TABLE, MODULAR, PERSONALITIES,
  POWER_CATS, POWER_SOURCES, PRINCIPLES, QUALITY_CATS, RED_ABILITIES, RETCONS,
} from '../data/rules';
import type { ArchReq, ArchetypeDef, BackgroundDef, PersonalityDef, PowerSourceDef, PrincipleRow, RawAbility } from '../data/types';

export const DIE_SIZES = [4, 6, 8, 10, 12];
export const upDie = (d: number, n = 1) => DIE_SIZES[Math.min(4, Math.max(0, DIE_SIZES.indexOf(d) + n))];
export const norm = (s: unknown) => String(s || '').trim().toLowerCase();
export const uid = () => Math.random().toString(36).slice(2, 10);
export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const rollDie = (d: number) => 1 + Math.floor(Math.random() * d);

export type Kind = 'power' | 'quality';
export type Slot = { kind: Kind; base: string; label: string } | null;
export type Trait = { key: string; kind: Kind; base: string; label: string; cat: string; die: number; srcs: string[] };
export type Zone = 'green' | 'yellow' | 'red';
export const ZONES: Zone[] = ['green', 'yellow', 'red'];
export type StepKey = 'bg' | 'ps' | 'arch' | 'pers' | 'red' | 'retcon' | 'health' | 'finish';

export type Mod = { id: string; label: string; value: number; persistent: boolean; exclusive: boolean };
export type PlayState = {
  health: number | null;
  heroPoints: number;
  mods: Mod[];
  sceneZone: Zone;
  form: string;
  used: Record<string, boolean>;
  notes: string;
};

export type Hero = {
  id: string; v: number; created: number; updated: number;
  method: 'guided' | 'constructed'; bend: boolean;
  info: Record<'name' | 'alias' | 'player' | 'gender' | 'age' | 'height' | 'eyes' | 'hair' | 'skin' | 'build' | 'costume' | 'notes' | 'heroPoints' | 'backIssues' | 'collections' | 'portrait', string>;
  rolls: Record<string, { vals?: (number | null)[]; dice?: number[]; rerolled?: boolean; ignore?: boolean }>;
  bg: { n: number | null; slots: Slot[] };
  ps: { n: number | null; slots: Slot[]; extra: { slot?: Slot; upKey?: string; downKey?: string } };
  arch: {
    n: number | null; baseN: number | null; slots: Slot[];
    extra: { training?: Slot; robot?: Slot }; transition: string | null; extraPowers: Slot[];
    powerless: boolean; minionQuality: string; minionForms: string[]; dividedNotes?: string;
  };
  pers: { n: number | null; n2: number | null; custom: string; upgradeKey: string };
  retcon: { id: string | null; a: string; b: string; add: Slot; slot: 'bg' | 'arch'; principle: string; note: string };
  health: { mode: 'four' | 'roll'; rolled: number | null; traitKey: string };
  sel: Record<string, string[]>;
  abil: Record<string, { name?: string; fills?: string[] }>;
  forms: Record<string, { name?: string; rows?: { label: string; die: number }[] }>;
  modes: Record<string, { rows?: { label: string; die: number }[] }>;
  play: PlayState;
};

export function newPlay(): PlayState {
  return { health: null, heroPoints: 0, mods: [], sceneZone: 'green', form: '', used: {}, notes: '' };
}

export function newHero(): Hero {
  return {
    id: uid(), v: 1, created: Date.now(), updated: Date.now(),
    method: 'guided', bend: false,
    info: { name: '', alias: '', player: '', gender: '', age: '', height: '', eyes: '', hair: '', skin: '', build: '', costume: '', notes: '', heroPoints: '', backIssues: '', collections: '', portrait: '' },
    rolls: {},
    bg: { n: null, slots: [] },
    ps: { n: null, slots: [], extra: {} },
    arch: { n: null, baseN: null, slots: [], extra: {}, transition: null, extraPowers: [], powerless: false, minionQuality: '', minionForms: [] },
    pers: { n: null, n2: null, custom: '', upgradeKey: '' },
    retcon: { id: null, a: '', b: '', add: null, slot: 'bg', principle: '', note: '' },
    health: { mode: 'four', rolled: null, traitKey: '' },
    sel: {}, abil: {}, forms: {}, modes: {},
    play: newPlay(),
  };
}

function deepFill(target: any, def: any) {
  for (const k of Object.keys(def)) {
    if (target[k] === undefined) target[k] = clone(def[k]);
    else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && target[k] && typeof target[k] === 'object') deepFill(target[k], def[k]);
  }
  return target;
}
// Fill in any fields a saved or imported hero is missing.
export function migrate(h: any): Hero {
  const id = h.id;
  deepFill(h, newHero());
  h.id = id || uid();
  return h as Hero;
}

// ---------- catalog helpers ----------
export const P_CAT: Record<string, string> = {};
export const Q_CAT: Record<string, string> = {};
for (const [c, v] of Object.entries(POWER_CATS)) for (const k of Object.keys(v.items)) P_CAT[k] = c;
for (const [c, v] of Object.entries(QUALITY_CATS)) for (const k of Object.keys(v.items)) Q_CAT[k] = c;
export const ELEMENTS = Object.keys(POWER_CATS['Elemental/Energy'].items);
export const PRINCIPLE_BY_NAME: Record<string, PrincipleRow> = Object.fromEntries(PRINCIPLES.map((p) => [p[0], p]));
export const PRINCIPLE_CATS = ['Esoteric', 'Expertise', 'Ideals', 'Identity', 'Responsibility'];

export function catOf(kind: Kind, base: string) {
  return kind === 'power' ? P_CAT[base] || 'Hallmark' : Q_CAT[base] || 'Special';
}
export function describeTrait(kind: Kind, base: string) {
  const src = kind === 'power' ? POWER_CATS : QUALITY_CATS;
  return src[catOf(kind, base)]?.items[base] ?? '';
}

export type OptionGroup = { label: string; kind: Kind; items: string[] };

export function expandList(list: string[] | undefined, kind: Kind): { label: string; items: string[] }[] {
  const groups: { label: string; items: string[] }[] = [];
  const named: string[] = [];
  for (const x of list || []) {
    if (x.startsWith('@')) {
      const c = x.slice(1);
      const src = kind === 'power' ? POWER_CATS : QUALITY_CATS;
      if (src[c]) groups.push({ label: 'Any ' + c + (kind === 'power' ? ' power' : ' quality'), items: Object.keys(src[c].items) });
    } else named.push(x);
  }
  if (named.length) groups.unshift({ label: 'Listed', items: named });
  return groups;
}
export function allOfKind(kind: Kind): OptionGroup[] {
  const src = kind === 'power' ? POWER_CATS : QUALITY_CATS;
  return Object.entries(src).map(([c, v]) => ({ label: c, kind, items: Object.keys(v.items) }));
}
export function listHas(list: string[], kind: Kind, base: string) {
  for (const x of list || []) {
    if (x === base) return true;
    if (x.startsWith('@') && catOf(kind, base) === x.slice(1)) return true;
  }
  return false;
}
export const listText = (l: string[] | undefined) => (l || []).map((x) => (x.startsWith('@') ? 'any ' + x.slice(1) : x)).join(', ');

// Reachable table results from a roll: single dice or sums of any two.
export function reachable(vals: (number | null | undefined)[]) {
  const s = new Set<number>();
  const v2 = vals.filter((v): v is number => !!v);
  v2.forEach((v, i) => {
    if (v >= 1 && v <= 20) s.add(v);
    v2.forEach((w, j) => {
      if (j > i && v + w <= 20) s.add(v + w);
    });
  });
  return s;
}

export const entry = <T extends { n: number },>(arr: T[], n: number | null | undefined): T | null => arr.find((e) => e.n === n) || null;

// ---------- trait engine ----------
export const traitKey = (kind: Kind, label: string) => kind + ':' + norm(label);
type Traits = Map<string, Trait>;
type AddResult = { extra: number | null; existed: boolean; key: string; newDie?: number };

function addTrait(traits: Traits, slot: NonNullable<Slot>, die: number, src: string): AddResult {
  const label = (slot.label && slot.label.trim()) || slot.base;
  const key = traitKey(slot.kind, label);
  const t = traits.get(key);
  if (t) {
    const extra = Math.min(t.die, die);
    t.die = Math.max(t.die, die);
    t.srcs.push(src);
    return { extra, existed: true, key, newDie: t.die };
  }
  traits.set(key, { key, kind: slot.kind, base: slot.base, label, cat: catOf(slot.kind, slot.base), die, srcs: [src] });
  return { extra: null, existed: false, key };
}

export type SlotRun = { pool: number[]; res: ({ die: number } & Partial<AddResult>)[] };
// Assign dice to slots. Picking a trait you already have keeps the bigger die and
// hands the smaller one back as an extra die at the end of the pool.
function runSlots(traits: Traits, baseDice: number[], slots: Slot[], src: string): SlotRun {
  const pool = [...baseDice];
  const res: SlotRun['res'] = [];
  for (let i = 0; i < pool.length && i < 40; i++) {
    const s = slots[i];
    if (!s || !s.base) {
      res.push({ die: pool[i] });
      continue;
    }
    const r = addTrait(traits, s, pool[i], src);
    res.push({ die: pool[i], ...r });
    if (r.extra) pool.push(r.extra);
  }
  return { pool, res };
}
const traitList = (traits: Traits, kind: Kind) => [...traits.values()].filter((t) => t.kind === kind);
const snap = (traits: Traits): Traits => new Map([...traits].map(([k, v]) => [k, { ...v, srcs: [...v.srcs] }]));
export const sortTraits = (a: Trait, b: Trait) => b.die - a.die || a.label.localeCompare(b.label);
const pickedOne = (h: Hero, gid: string) => (h.sel[gid] || []).length > 0;
export const an = (w: string | null | undefined) => (/^[AEIOU]/i.test(w || '') ? 'an ' : 'a ') + w;

export function effArch(h: Hero) {
  const a = entry(ARCHETYPES, h.arch.n);
  if (a && (a.divided || a.modular)) return entry(ARCHETYPES, h.arch.baseN);
  return a;
}

// ---------- abilities ----------
export type AbilityItem = {
  id: string; name: string; type: string; text: string; need?: string;
  zone?: Zone; mode?: string; rule?: string; cat?: string; ckind?: Kind | 'arch'; principle?: PrincipleRow;
};
export type AbilityGroup = {
  id: string; step: StepKey; zone: Zone | 'out'; title: string; note?: string; count: number;
  items: AbilityItem[]; fixed?: boolean; kind?: 'principle'; form?: string; modes?: boolean;
};
export type AbilityRec = {
  gid: string; id: string; base: string; name: string; type: string; text: string; raw: string;
  complete: boolean; mode?: string; form?: string; cat?: string;
};

export type Derived = {
  issues: Record<StepKey, string[]>;
  done: Record<StepKey, boolean>;
  bg: BackgroundDef | null; ps: PowerSourceDef | null; archTop: ArchetypeDef | null; arch: ArchetypeDef | null; pers: PersonalityDef | null;
  snap: Partial<Record<'bg' | 'ps' | 'arch' | 'pers', Traits>>;
  bgRun?: SlotRun; psRun?: SlotRun; archRun?: SlotRun;
  psCtx?: Trait[];
  status: number[] | null;
  retcon: { id: string; text: string } | undefined;
  traits: Traits; powers: Trait[]; qualities: Trait[];
  principles: { slot: 'bg' | 'arch'; p: PrincipleRow; gid: string }[];
  prCat: { bg: string | null; arch: string | null };
  redCount: number;
  health: HealthCalc;
  groups: AbilityGroup[];
  abilities: { green: AbilityRec[]; yellow: AbilityRec[]; red: AbilityRec[]; principles: AbilityRec[]; out: AbilityRec | null };
};

export function derive(h: Hero): Derived {
  const issues: Record<StepKey, string[]> = { bg: [], ps: [], arch: [], pers: [], red: [], retcon: [], health: [], finish: [] };
  const D = { issues, done: {}, snap: {} } as Derived;
  const traits: Traits = new Map();
  const bg = (D.bg = entry(BACKGROUNDS, h.bg.n));
  const ps = (D.ps = entry(POWER_SOURCES, h.ps.n));
  const archTop = (D.archTop = entry(ARCHETYPES, h.arch.n));
  const arch = (D.arch = effArch(h));
  const pers = (D.pers = entry(PERSONALITIES, h.pers.n));

  // Step 1: Background
  if (bg) {
    D.bgRun = runSlots(traits, bg.assign, h.bg.slots, 'Background');
    const assigned = D.bgRun.res.filter((r) => r.key).length;
    if (assigned < D.bgRun.pool.length) issues.bg.push(`Assign all ${D.bgRun.pool.length} dice (${assigned} assigned).`);
    if (bg.required && !h.bg.slots.some((s) => s && s.base === bg.required)) issues.bg.push(`One die must go to ${bg.required}.`);
    if (!pickedOne(h, 'pr-bg')) issues.bg.push(`Choose ${an(bg.principle)} principle.`);
  } else issues.bg.push('Select a background.');
  D.snap.bg = snap(traits);

  // Step 2: Power Source
  if (ps) {
    const dice = bg ? bg.roll : [];
    D.psRun = runSlots(traits, dice, h.ps.slots, 'Power Source');
    const assigned = D.psRun.res.filter((r) => r.key).length;
    if (!bg) issues.ps.push('Pick a background first — it supplies the dice.');
    else if (assigned < D.psRun.pool.length) issues.ps.push(`Assign all ${D.psRun.pool.length} dice (${assigned} assigned).`);
    if (ps.required && !h.ps.slots.some((s) => s && s.base === ps.required)) issues.ps.push(`One die must go to ${ps.required}.`);
    applyPsExtra(h, D, traits, ps);
  } else issues.ps.push('Select a power source.');
  D.snap.ps = snap(traits);

  // Step 3: Archetype
  if (archTop) {
    if ((archTop.divided || archTop.modular) && !arch) issues.arch.push(`Choose a base archetype for ${archTop.name}.`);
    if (arch) {
      const dice = ps ? ps.roll : [];
      D.archRun = runSlots(traits, dice, h.arch.slots, 'Archetype');
      const assigned = D.archRun.res.filter((r) => r.key).length;
      if (!ps) issues.arch.push('Pick a power source first — it supplies the dice.');
      else if (assigned < D.archRun.pool.length) issues.arch.push(`Assign all ${D.archRun.pool.length} dice (${assigned} assigned).`);
      archRules(h, D, traits, arch);
      if (ps && ps.extra && ps.extra.type === 'archetypeQuality') {
        const s = h.arch.extra.training;
        if (s && s.base) addTrait(traits, s, 8, 'Training');
        else issues.arch.push('Training: pick an extra quality from this archetype’s list at d8.');
      }
      if (arch.extra && arch.extra.type === 'newPowerCat') {
        const s = h.arch.extra.robot;
        if (s && s.base) {
          const k = traitKey('power', s.label || s.base);
          if (traits.has(k)) issues.arch.push(`${arch.extra.text} (You already have ${s.label || s.base}.)`);
          addTrait(traits, s, 10, 'Archetype');
        } else issues.arch.push(arch.extra.text);
      }
      if (archTop.modular) {
        (h.arch.extraPowers || []).forEach((s) => {
          if (s && s.base) addTrait(traits, s, 6, 'Modular');
        });
        const pc = traitList(traits, 'power').length;
        if (pc < 4) issues.arch.push(`Modular: you have ${pc} powers — add d6 powers until you have four.`);
      }
    }
  } else issues.arch.push('Select an archetype.');
  D.snap.arch = snap(traits);

  // Step 4: Personality
  D.status = null;
  if (pers) {
    D.status = [...pers.status];
    if (h.pers.custom.trim()) addTrait(traits, { kind: 'quality', base: '__special', label: h.pers.custom.trim() }, 8, 'Personality');
    else issues.pers.push('Make up a roleplaying quality (d8) based on your backstory.');
    if (pers.extra && pers.extra.type === 'upgradeAny') {
      const t = traits.get(h.pers.upgradeKey);
      if (t) t.die = upDie(t.die);
      else issues.pers.push('Impulsive: upgrade one power or quality die by one step.');
    }
  } else issues.pers.push('Select a personality.');
  for (const t of traits.values()) if (t.base === '__special') t.cat = 'Special';
  D.snap.pers = snap(traits);

  // Step 6: Retcon
  const rc = RETCONS.find((r) => r.id === h.retcon.id);
  D.retcon = rc;
  if (!rc) issues.retcon.push('Choose one retcon.');
  else if (rc.id === 'swapPowers' || rc.id === 'swapQualities') {
    const a = traits.get(h.retcon.a), b = traits.get(h.retcon.b);
    if (a && b && a !== b) {
      const t = a.die;
      a.die = b.die;
      b.die = t;
    } else issues.retcon.push('Pick two different traits to swap.');
  } else if (rc.id === 'addD6') {
    const s = h.retcon.add;
    if (s && s.base) addTrait(traits, s, 6, 'Retcon');
    else issues.retcon.push('Pick a d6 power or quality to add.');
  } else if (rc.id === 'redUp') {
    if (D.status) D.status[2] = upDie(D.status[2]);
  } else if (rc.id === 'swapPrinciple' && !h.retcon.principle) issues.retcon.push('Pick the replacement principle.');

  D.traits = traits;
  D.powers = traitList(traits, 'power').sort(sortTraits);
  D.qualities = traitList(traits, 'quality').sort(sortTraits);

  // Principles
  D.principles = [];
  const prCatArch = archTop ? (archTop.divided ? 'Responsibility' : archTop.modular ? (arch ? arch.principle : null) : archTop.principle) : null;
  D.prCat = { bg: bg ? bg.principle : null, arch: prCatArch };
  for (const slot of ['bg', 'arch'] as const) {
    let name = (h.sel['pr-' + slot] || [])[0];
    if (rc && rc.id === 'swapPrinciple' && h.retcon.slot === slot && h.retcon.principle) name = h.retcon.principle;
    const p = PRINCIPLE_BY_NAME[name];
    if (p) D.principles.push({ slot, p, gid: 'pr-' + slot });
  }
  if (archTop && !pickedOne(h, 'pr-arch')) issues.arch.push(prCatArch ? `Choose ${an(prCatArch)} principle.` : 'Choose a principle.');

  // Red abilities
  D.redCount = 2 + (rc && rc.id === 'extraRed' ? 1 : 0);
  const redSel = (h.sel['red'] || []).length;
  if (redSel < D.redCount) issues.red.push(`Choose ${D.redCount} Red abilities (${redSel} chosen).`);
  if (redSel > D.redCount) issues.red.push(`Too many Red abilities (${redSel}/${D.redCount}).`);

  // Health
  D.health = calcHealth(h, D);
  if (!D.status) issues.health.push('Needs a personality (Red status die).');
  if (h.health.mode === 'roll' && !h.health.rolled) issues.health.push('Roll the d8 (or take 4).');

  if (!h.info.name.trim()) issues.finish.push('Give your hero a name.');

  D.groups = abilityGroups(h, D);
  groupIssues(h, D);
  D.abilities = collectAbilities(h, D);
  for (const k of Object.keys(issues) as StepKey[]) D.done[k] = issues[k].length === 0;
  return D;
}

function applyPsExtra(h: Hero, D: Derived, traits: Traits, ps: PowerSourceDef) {
  const ex = ps.extra;
  if (!ex) return;
  D.psCtx = [...traits.values()].map((t) => ({ ...t }));
  const e = h.ps.extra || {};
  if (ex.type === 'quality' || ex.type === 'power' || ex.type === 'powerNotOnList') {
    const s = e.slot;
    if (s && s.base) {
      if (ex.type === 'powerNotOnList' && listHas(ps.p, 'power', s.base)) D.issues.ps.push(`Supernatural: ${s.base} is on the list — pick a power not on it.`);
      addTrait(traits, s, ex.die || 6, 'Power Source');
    } else D.issues.ps.push(ex.text);
  } else if (ex.type === 'upgradeD6') {
    const d6 = [...traits.values()].filter((t) => t.die === 6);
    if (d6.length) {
      const t = traits.get(e.upKey || '');
      if (t && t.die === 6) t.die = 8;
      else D.issues.ps.push('Alien: upgrade one d6 power or quality to d8.');
    } else {
      const s = e.slot;
      if (s && s.base) addTrait(traits, s, 6, 'Power Source');
      else D.issues.ps.push('Alien: you have no d6 traits — add a new power from the list at d6.');
    }
  } else if (ex.type === 'cosmosShift') {
    const dn = traits.get(e.downKey || ''), up = traits.get(e.upKey || '');
    if (dn && dn.kind === 'power' && dn.die >= 8 && up && up.kind === 'power' && up.die <= 10 && dn !== up) {
      const dd = dn.die, ud = up.die;
      dn.die = upDie(dd, -1);
      up.die = upDie(ud, 1);
    } else D.issues.ps.push('Cosmos: downgrade one d8+ power and upgrade a different d10-or-lower power.');
  }
}

export function reqText(rq: ArchReq) {
  if (rq.kind === 'power') return rq.opts.join(' or ') + ' power';
  if (rq.kind === 'quality') return rq.opts.join(' or ') + ' quality';
  if (rq.kind === 'powerCat') return 'a die on an ' + rq.opts[0] + ' power';
  return 'a die on Signature Vehicle or a Mobility power';
}

function archRules(h: Hero, D: Derived, traits: Traits, arch: ArchetypeDef) {
  const slots = h.arch.slots;
  const res = D.archRun!.res;
  const assignedSlots = res.map((r, i) => ({ r, s: slots[i]! })).filter((x) => x.r.key);
  const all = [...traits.values()];
  if (arch.req) {
    const rq = arch.req;
    let ok = false;
    if (rq.kind === 'power' || rq.kind === 'quality') ok = rq.opts.some((o) => all.some((t) => t.kind === rq.kind && t.base === o));
    else if (rq.kind === 'powerCat') ok = all.some((t) => t.kind === 'power' && rq.opts.includes(t.cat));
    else if (rq.kind === 'powerOrCat') ok = all.some((t) => t.kind === 'power' && (t.base === 'Signature Vehicle' || t.cat === 'Mobility'));
    if (!ok) D.issues.arch.push('Required: ' + reqText(rq) + '.');
  }
  const rq = arch.req;
  const reqMatch = (s: NonNullable<Slot>) =>
    !!rq &&
    (rq.kind === 'power' || rq.kind === 'quality'
      ? s.kind === rq.kind && rq.opts.includes(s.base)
      : rq.kind === 'powerCat'
        ? s.kind === 'power' && rq.opts.includes(catOf('power', s.base))
        : s.kind === 'power' && (s.base === 'Signature Vehicle' || catOf('power', s.base) === 'Mobility'));
  let reqUsed = false;
  const nonReq = assignedSlots.filter((x) => {
    if (!reqUsed && reqMatch(x.s)) {
      reqUsed = true;
      return false;
    }
    return true;
  });
  const powerCount = nonReq.filter((x) => x.s.kind === 'power').length;
  if (arch.pRule === 'one' && powerCount !== 1 && D.archRun!.pool.length > 1) D.issues.arch.push('Assign exactly one remaining die to a power from the list; the rest go to qualities.');
  if (arch.pRule === 'oneOrMore' && powerCount < 1) D.issues.arch.push('Assign at least one die to a power from the list.');
  if (arch.psychicRule) {
    const n = all.filter((t) => t.kind === 'power' && t.cat === 'Psychic').length;
    if (n < 2) D.issues.arch.push(`Psychic: you need at least two Psychic powers (have ${n}).`);
  }
}

export type HealthCalc = {
  candidates: Trait[]; trait: Trait | null; traitDie: number; red: number | null; d8: number | null;
  altCats: string[]; any: boolean; max?: number; ranges?: Record<Zone, [number, number]>;
};
function calcHealth(h: Hero, D: Derived): HealthCalc {
  const alt = new Set(['Athletic', 'Mental']);
  [D.archTop, D.arch].forEach((a) => (a?.healthAlt || []).forEach((c) => alt.add(c)));
  const any = !!D.pers?.healthAny;
  const candidates = [...D.traits.values()].filter((t) => any || alt.has(t.cat)).sort(sortTraits);
  const chosen = D.traits.get(h.health.traitKey);
  const trait = chosen && candidates.includes(chosen) ? chosen : candidates[0] || null;
  const out: HealthCalc = {
    candidates, trait, traitDie: trait ? trait.die : 4, red: D.status ? D.status[2] : null,
    d8: h.health.mode === 'four' ? 4 : h.health.rolled || null, altCats: [...alt], any,
  };
  if (out.red && out.d8) {
    const max = (out.max = 8 + out.red + out.traitDie + out.d8);
    const row = HEALTH_TABLE[max];
    if (row) out.ranges = { green: [max, row[0]], yellow: [row[0] - 1, row[1]], red: [row[1] - 1, 1] };
    else {
      const g = Math.round(max * 0.75), y = Math.round(max * 0.38);
      out.ranges = { green: [max, g], yellow: [g - 1, y], red: [y - 1, 1] };
    }
  }
  return out;
}

const mk = (list: RawAbility[], extra: Partial<AbilityItem> = {}): AbilityItem[] =>
  list.map((a) => ({ id: a[0], name: a[0], type: a[1], text: a[2], need: a[3], ...extra }));
export const principleItem = (p: PrincipleRow): AbilityItem => ({ id: p[0], name: p[0], type: p[6] || 'A', text: p[5], principle: p });

function abilityGroups(h: Hero, D: Derived): AbilityGroup[] {
  const G: AbilityGroup[] = [];
  const { ps, archTop, arch, pers } = D;
  if (D.prCat.bg) G.push({ id: 'pr-bg', step: 'bg', zone: 'green', kind: 'principle', title: `${D.prCat.bg} principle`, count: 1, items: PRINCIPLES.filter((p) => p[1] === D.prCat.bg).map(principleItem) });
  if (ps) {
    if (ps.yellow) G.push({ id: 'ps-yellow', step: 'ps', zone: 'yellow', title: 'Yellow abilities', note: ps.yellow.diff ? 'Each using a different power.' : '', count: ps.yellow.count, items: mk(ps.yellow.list || []) });
    if (ps.green) G.push({ id: 'ps-green', step: 'ps', zone: 'green', title: 'Green ability', count: ps.green.count, items: mk(ps.green.list || []) });
  }
  if (archTop) {
    if (archTop.modular) {
      G.push({ id: 'mod-fixed', step: 'arch', zone: 'green', title: 'Modular abilities', fixed: true, count: 0, items: [...mk(MODULAR.fixed.green, { zone: 'green' }), ...mk(MODULAR.fixed.yellow, { zone: 'yellow' }), ...mk(MODULAR.fixed.red, { zone: 'red' })] });
      const modeItems = (arr: typeof MODULAR.green, zone: Zone): AbilityItem[] => arr.map((m) => ({ id: m.name, name: m.ability[0], type: m.ability[1], text: m.ability[2], mode: m.name, rule: m.rule, zone }));
      G.push({ id: 'mod-green', step: 'arch', zone: 'green', title: 'Extra Green mode', note: 'Choose one more Green mode (in addition to your default mode).', count: 1, items: modeItems(MODULAR.green, 'green'), modes: true });
      G.push({ id: 'mod-yellow', step: 'arch', zone: 'yellow', title: 'Yellow modes', note: 'Choose two Yellow modes.', count: 2, items: modeItems(MODULAR.yellow, 'yellow'), modes: true });
      G.push({ id: 'mod-red', step: 'arch', zone: 'red', title: 'Red mode', note: 'Choose one Red mode.', count: 1, items: modeItems(MODULAR.red, 'red'), modes: true });
    } else if (arch) {
      if (arch.fixedGreen) G.push({ id: 'arch-fixed', step: 'arch', zone: 'green', title: 'Green abilities (granted)', note: arch.fixedGreenNote || '', fixed: true, count: 0, items: mk(arch.fixedGreen) });
      if (arch.green) G.push({ id: 'arch-green', step: 'arch', zone: 'green', title: 'Green abilities', note: arch.green.note || (arch.green.diff ? 'Each using a different power or quality.' : ''), count: arch.green.count, items: mk(arch.green.list || []) });
      if (arch.yellow) G.push({ id: 'arch-yellow', step: 'arch', zone: 'yellow', title: 'Yellow ' + (arch.yellow.count > 1 ? 'abilities' : 'ability'), note: arch.yellow.note || '', count: arch.yellow.count, items: arch.yellow.fromGreen ? mk(arch.green?.list || []) : mk(arch.yellow.list || []) });
      if (arch.forms) {
        G.push({ id: 'form-g1', step: 'arch', zone: 'green', title: 'Green form #1', count: 1, items: mk(FORM_CHANGER.greenForms), form: 'g1' });
        G.push({ id: 'form-g2', step: 'arch', zone: 'green', title: 'Green form #2', count: 1, items: mk(FORM_CHANGER.greenForms), form: 'g2' });
        const usedG = [...(h.sel['form-g1'] || []), ...(h.sel['form-g2'] || [])];
        G.push({ id: 'form-y', step: 'arch', zone: 'yellow', title: 'Yellow form', note: 'A Yellow form ability, or one of the unused Green form abilities.', count: 1, items: [...mk(FORM_CHANGER.yellowForms), ...mk(FORM_CHANGER.greenForms.filter((a) => !usedG.includes(a[0])))], form: 'y' });
      }
      if (arch.fixedRed) G.push({ id: 'arch-red', step: 'arch', zone: 'red', title: 'Red ability (granted)', fixed: true, count: 0, items: mk(arch.fixedRed) });
    }
    if (archTop.divided) {
      const t = DIVIDED.transitions.find((x) => x.name === h.arch.transition);
      if (t) G.push({ id: 'div-trans', step: 'arch', zone: 'green', title: t.name, note: t.abilities.length > 1 ? 'Gain one of these Green abilities.' : '', count: 1, fixed: t.abilities.length === 1, items: mk(t.abilities) });
      G.push({ id: 'div-ab', step: 'arch', zone: 'green', title: 'Divided ability', note: 'Gain one of these Green abilities.', count: 1, items: mk(DIVIDED.dividedAbilities) });
    }
    if (D.prCat.arch) G.push({ id: 'pr-arch', step: 'arch', zone: 'green', kind: 'principle', title: `${D.prCat.arch} principle`, count: 1, items: PRINCIPLES.filter((p) => p[1] === D.prCat.arch).map(principleItem) });
  }
  if (pers) G.push({ id: 'out', step: 'pers', zone: 'out', title: 'Out ability', fixed: true, count: 0, items: [{ id: 'Out', name: 'Out', type: 'A', text: pers.out }] });
  const redItems: AbilityItem[] = [];
  for (const [cat, v] of Object.entries(RED_ABILITIES)) for (const a of v.list) redItems.push({ id: cat + '/' + a[0], name: a[0], type: a[1], text: a[2], need: a[3], cat, ckind: v.kind });
  if (arch && arch.extraRed) for (const a of arch.extraRed) redItems.push({ id: 'Minion-Maker/' + a[0], name: a[0], type: a[1], text: a[2], cat: 'Minion-Maker', ckind: 'arch' });
  G.push({ id: 'red', step: 'red', zone: 'red', title: 'Red abilities', count: D.redCount, items: redItems });
  return G;
}

function groupIssues(h: Hero, D: Derived) {
  for (const g of D.groups) {
    if (g.fixed || g.kind === 'principle' || g.step === 'red') continue;
    const n = (h.sel[g.id] || []).length;
    if (n < g.count) D.issues[g.step].push(`${g.title}: choose ${g.count} (${n} chosen).`);
    if (n > g.count) D.issues[g.step].push(`${g.title}: too many chosen (${n}/${g.count}).`);
  }
  if (D.archTop && D.archTop.divided && !h.arch.transition) D.issues.arch.push('Divided: choose a method of transformation.');
}

export function redEligible(item: AbilityItem, D: Derived): { ok: boolean; why?: string } {
  const traits = [...D.traits.values()];
  if (item.ckind === 'arch') return { ok: true };
  const usesTrait = /\[(power|quality|power\/quality|Signature Weaponry|Signature Vehicle)\]/.test(item.text) || !!item.need;
  if (item.need) return traits.some((t) => t.base === item.need) ? { ok: true } : { ok: false, why: `Needs ${item.need}` };
  const inCat = traits.filter((t) => t.cat === item.cat && t.kind === item.ckind);
  if (!inCat.length) return { ok: false, why: `Needs a ${item.cat} ${item.ckind}` };
  if (!usesTrait && !inCat.some((t) => t.die >= 6)) return { ok: false, why: `Needs a d6+ ${item.cat} ${item.ckind}` };
  return { ok: true };
}

export function itemEligible(h: Hero, D: Derived, g: AbilityGroup, it: AbilityItem): { ok: boolean; why?: string } {
  if (h.bend) return { ok: true };
  if (g.id === 'red') return redEligible(it, D);
  if (it.need) {
    const all = [...D.traits.values()];
    if (it.need.startsWith('@')) {
      const c = it.need.slice(1);
      return all.some((t) => t.kind === 'quality' && t.cat === c) ? { ok: true } : { ok: false, why: `Needs a ${c} quality` };
    }
    return all.some((t) => t.base === it.need) ? { ok: true } : { ok: false, why: `Needs ${it.need}` };
  }
  return { ok: true };
}

// ---------- [bracket] templates in ability text ----------
export type TplPart = string | { tok: string };
export function parseTpl(text: string): TplPart[] {
  const parts: TplPart[] = [];
  const re = /\[([^\]]+)\]/g;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ tok: m[1] });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
export function tokenOptions(tok: string, D: Derived | null, item?: AbilityItem): { opts: string[]; all?: string[]; free?: boolean } {
  const t = norm(tok);
  const traits = D ? [...D.traits.values()] : [];
  const lab = (arr: Trait[]) => arr.map((x) => x.label);
  const P = traits.filter((x) => x.kind === 'power'), Q = traits.filter((x) => x.kind === 'quality');
  if (t === 'power') {
    if (item && item.cat && item.ckind === 'power' && item.cat !== 'Hallmark') return { opts: lab(P.filter((x) => x.cat === item.cat)), all: lab(P) };
    return { opts: lab(P) };
  }
  if (t === 'quality') {
    if (item && item.cat && item.ckind === 'quality') return { opts: lab(Q.filter((x) => x.cat === item.cat)), all: lab(Q) };
    return { opts: lab(Q) };
  }
  if (t === 'power/quality') return { opts: [...lab(P), ...lab(Q)] };
  if (t === 'psychic power') return { opts: lab(P.filter((x) => x.cat === 'Psychic')), all: lab(P) };
  if (t === 'self control power') return { opts: lab(P.filter((x) => x.cat === 'Self Control')), all: lab(P) };
  if (t === 'mental quality') return { opts: lab(Q.filter((x) => x.cat === 'Mental')), all: lab(Q) };
  if (t === 'signature weaponry') return { opts: lab(P.filter((x) => x.base === 'Signature Weaponry')), all: lab(P) };
  if (t === 'signature vehicle') return { opts: lab(P.filter((x) => x.base === 'Signature Vehicle')), all: lab(P) };
  if (t === 'a power gained from your archetype') return { opts: lab(P) };
  if (t === 'a quality gained from your archetype') return { opts: lab(Q) };
  if (t === 'any physical or mental quality') return { opts: lab(Q.filter((x) => x.cat === 'Physical' || x.cat === 'Mental')), all: lab(Q) };
  if (t === 'boost or hinder') return { opts: ['Boost', 'Hinder'] };
  if (t === 'physical or energy') return { opts: ['physical', 'energy'] };
  if (t.includes('you have a related power')) {
    const own = lab(P.filter((x) => x.cat === 'Elemental/Energy'));
    return { opts: own.length ? own : ELEMENTS, all: ELEMENTS, free: true };
  }
  if (/^(energy\/element|element\/energy|elemental\/energy)$/.test(t)) return { opts: ELEMENTS, free: true };
  return { free: true, opts: [] };
}
export function fillText(text: string, fills?: string[]) {
  let i = 0;
  return text.replace(/\[([^\]]+)\]/g, (m) => {
    const v = fills && fills[i++];
    return v ? v : m;
  });
}
function tplComplete(text: string, fills?: string[]) {
  const n = (text.match(/\[[^\]]+\]/g) || []).length;
  for (let i = 0; i < n; i++) if (!fills || !fills[i]) return false;
  return true;
}

function collectAbilities(h: Hero, D: Derived): Derived['abilities'] {
  const out: Derived['abilities'] = { green: [], yellow: [], red: [], principles: [], out: null };
  for (const g of D.groups) {
    const chosen = g.fixed ? g.items : (h.sel[g.id] || []).map((id) => g.items.find((i) => i.id === id)).filter((x): x is AbilityItem => !!x);
    for (const it of chosen) {
      const c = h.abil[g.id + '|' + it.id] || {};
      if (g.kind === 'principle') {
        const swapped = D.principles.find((p) => p.gid === g.id);
        if (!swapped || swapped.p[0] !== it.id) continue; // replaced by retcon
      }
      const pn = g.kind === 'principle' && c.fills && c.fills[0] ? it.name.replace(/\[[^\]]+\]/g, c.fills[0]) : it.name;
      const rec: AbilityRec = { gid: g.id, id: it.id, base: pn, name: (c.name || '').trim() || pn, type: it.type, text: fillText(it.text, c.fills), raw: it.text, complete: tplComplete(it.text, c.fills), mode: it.mode, form: g.form, cat: it.cat };
      const zone = it.zone || g.zone;
      if (g.kind === 'principle') out.principles.push(rec);
      else if (zone === 'out') out.out = rec;
      else out[zone].push(rec);
    }
  }
  const rc = D.retcon;
  if (rc && rc.id === 'swapPrinciple' && h.retcon.principle) {
    const p = PRINCIPLE_BY_NAME[h.retcon.principle];
    if (p) {
      const gid = 'pr-retcon';
      const c = h.abil[gid + '|' + p[0]] || {};
      const pn = c.fills && c.fills[0] ? p[0].replace(/\[[^\]]+\]/g, c.fills[0]) : p[0];
      out.principles.push({ gid, id: p[0], base: pn, name: (c.name || '').trim() || pn, type: p[6] || 'A', text: fillText(p[5], c.fills), raw: p[5], complete: tplComplete(p[5], c.fills) });
    }
  }
  return out;
}

export const ACTIONS = ['Attack', 'Defend', 'Overcome', 'Boost', 'Hinder', 'Recover'] as const;
export type Action = (typeof ACTIONS)[number];
export function actionsIn(text: string): Action[] {
  const found: Action[] = [];
  const re = /\b(Attack|Defend|Overcome|Boost|Hinder|Recover)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) if (!found.includes(m[1] as Action)) found.push(m[1] as Action);
  return found.slice(0, 3);
}

// Which of Min/Mid/Max an ability's text calls for (basic actions use Mid).
export function effectDiceIn(text: string): ('Min' | 'Mid' | 'Max')[] {
  const m = text.match(/use (?:your )?((?:Max|Mid|Min)(?:\+(?:Max|Mid|Min))*) dic?e/i);
  if (!m) return ['Mid'];
  return m[1].split('+').map((x) => (x[0].toUpperCase() + x.slice(1).toLowerCase()) as 'Min' | 'Mid' | 'Max');
}

// ---------- builder helpers ----------
export const STEPS: [StepKey | 'sheet', string, string][] = [
  ['bg', '1', 'Background'], ['ps', '2', 'Power Source'], ['arch', '3', 'Archetype'], ['pers', '4', 'Personality'],
  ['red', '5', 'Red Abilities'], ['retcon', '6', 'Retcon'], ['health', '7', 'Health'], ['finish', '8', 'Finishing'], ['sheet', '★', 'Hero Sheet'],
];

export function stepTouched(h: Hero, D: Derived, k: StepKey) {
  return !!({ bg: h.bg.n, ps: h.ps.n, arch: h.arch.n, pers: h.pers.n, red: (h.sel.red || []).length, retcon: h.retcon.id, health: D.status, finish: h.info.name } as Record<StepKey, unknown>)[k];
}

export function canPick(h: Hero, key: string, n: number, extraReach?: Set<number> | null) {
  if (h.method !== 'guided' || h.bend) return true;
  const r = h.rolls[key] || {};
  if (r.ignore) return true;
  const set = reachable(r.vals || []);
  if (extraReach) for (const v of extraReach) set.add(v);
  return set.has(n);
}

export function optionGroupsFor(h: Hero, cfg: { req?: ArchReq; pow?: string[]; qual?: string[]; required?: string; reqKind?: Kind }): OptionGroup[] {
  const groups: OptionGroup[] = [];
  if (cfg.req) {
    const rq = cfg.req;
    if (rq.kind === 'power' || rq.kind === 'quality') groups.push({ label: 'Required', kind: rq.kind, items: rq.opts });
    else if (rq.kind === 'powerCat') groups.push({ label: 'Required: any ' + rq.opts[0] + ' power', kind: 'power', items: Object.keys(POWER_CATS[rq.opts[0]].items) });
    else groups.push({ label: 'Required: Signature Vehicle or Mobility', kind: 'power', items: ['Signature Vehicle', ...Object.keys(POWER_CATS.Mobility.items)] });
  }
  if (cfg.required) groups.push({ label: 'Required', kind: cfg.reqKind || 'quality', items: [cfg.required] });
  if (cfg.pow) for (const g of expandList(cfg.pow, 'power')) groups.push({ label: g.label === 'Listed' ? 'Powers' : g.label, kind: 'power', items: g.items });
  if (cfg.qual) for (const g of expandList(cfg.qual, 'quality')) groups.push({ label: g.label === 'Listed' ? 'Qualities' : g.label, kind: 'quality', items: g.items });
  if (h.bend) {
    for (const g of allOfKind('power')) groups.push({ label: '⚠ Any ' + g.label + ' power', kind: 'power', items: g.items });
    for (const g of allOfKind('quality')) groups.push({ label: '⚠ Any ' + g.label + ' quality', kind: 'quality', items: g.items });
  }
  return groups;
}

function resetGroups(h: Hero, prefixes: string[]) {
  for (const k of Object.keys(h.sel)) if (prefixes.some((p) => k.startsWith(p))) delete h.sel[k];
}
// Choosing a different background/source/archetype clears what depended on it.
export function selectEntry(h: Hero, step: 'bg' | 'ps' | 'arch' | 'pers', n: number) {
  if (step === 'bg') {
    if (h.bg.n === n) return;
    h.bg = { n, slots: [] };
    resetGroups(h, ['pr-bg']);
    delete h.rolls.ps;
  } else if (step === 'ps') {
    if (h.ps.n === n) return;
    h.ps = { n, slots: [], extra: {} };
    resetGroups(h, ['ps-']);
    delete h.rolls.arch;
    delete h.rolls.archBase;
  } else if (step === 'arch') {
    if (h.arch.n === n) return;
    h.arch = Object.assign(newHero().arch, { n });
    resetGroups(h, ['arch-', 'form-', 'mod-', 'div-', 'pr-arch']);
    h.forms = {};
    h.modes = {};
    delete h.rolls.archBase;
  } else if (step === 'pers') {
    if (h.pers.n === n) return;
    h.pers.n = n;
    h.pers.upgradeKey = '';
  }
}
export function pickBase(h: Hero, n: number) {
  h.arch.baseN = n;
  h.arch.slots = [];
  h.arch.extra = {};
  h.arch.extraPowers = [];
  resetGroups(h, ['arch-', 'form-', 'mod-']);
}

export function trimSlots(h: Hero, D: Derived) {
  const t = (arr: Slot[], run?: SlotRun) => {
    if (arr && run && arr.length > run.pool.length) arr.length = run.pool.length;
  };
  t(h.bg.slots, D.bgRun);
  t(h.ps.slots, D.psRun);
  t(h.arch.slots, D.archRun);
}

// Renaming a trait updates every ability fill-in and reference that used the old name.
export function propagateRename(h: Hero, kind: Kind, oldL: string, newL: string) {
  if (!oldL || !newL || oldL === newL) return;
  for (const c of Object.values(h.abil)) if (c.fills) c.fills = c.fills.map((v) => (v === oldL ? newL : v));
  const ok = traitKey(kind, oldL), nk = traitKey(kind, newL);
  if (h.health.traitKey === ok) h.health.traitKey = nk;
  if (h.pers.upgradeKey === ok) h.pers.upgradeKey = nk;
  if (h.ps.extra.upKey === ok) h.ps.extra.upKey = nk;
  if (h.ps.extra.downKey === ok) h.ps.extra.downKey = nk;
  if (h.retcon.a === ok) h.retcon.a = nk;
  if (h.retcon.b === ok) h.retcon.b = nk;
  if (h.arch.minionQuality === ok) h.arch.minionQuality = nk;
}

export function toggleSel(h: Hero, g: AbilityGroup, id: string) {
  let arr = h.sel[g.id] || [];
  if (arr.includes(id)) arr = arr.filter((x) => x !== id);
  else arr = g.count === 1 ? [id] : [...arr, id];
  h.sel[g.id] = arr;
}

export function setFill(h: Hero, gid: string, id: string, i: number, val: string) {
  const k = gid + '|' + id;
  const c = (h.abil[k] = h.abil[k] || {});
  c.fills = c.fills || [];
  c.fills[i] = val;
}

export function archName(D: Derived) {
  if (!D.archTop) return '';
  return D.archTop.name + (D.arch && D.arch !== D.archTop ? ' ' + D.arch.name : '');
}

export function sheetText(h: Hero, D: Derived) {
  const L: string[] = [];
  const i = h.info;
  L.push(`${i.name || 'Unnamed Hero'}${i.alias ? ' (' + i.alias + ')' : ''}`);
  L.push(`Background: ${D.bg ? D.bg.name : '—'} | Power Source: ${D.ps ? D.ps.name : '—'} | Archetype: ${archName(D) || '—'} | Personality: ${D.pers ? D.pers.name : '—'}`);
  L.push('', 'POWERS: ' + D.powers.map((t) => `${t.label} d${t.die}`).join(', '));
  L.push('QUALITIES: ' + D.qualities.map((t) => `${t.label} d${t.die}`).join(', '));
  if (D.status) L.push(`STATUS: Green d${D.status[0]} / Yellow d${D.status[1]} / Red d${D.status[2]}`);
  if (D.health.max && D.health.ranges) {
    const r = D.health.ranges;
    L.push(`HEALTH: ${D.health.max} (Green ${r.green.join('-')}, Yellow ${r.yellow.join('-')}, Red ${r.red.join('-')})`);
  }
  for (const p of D.principles) L.push(`PRINCIPLE: ${p.p[0]} (${p.p[1]})`);
  const ab = (t: string, l: AbilityRec[]) => {
    if (l.length) {
      L.push('', t);
      l.forEach((a) => L.push(`- ${a.name} [${a.type}]: ${a.text}`));
    }
  };
  ab('GREEN ABILITIES', [...D.abilities.green, ...D.abilities.principles]);
  ab('YELLOW ABILITIES', D.abilities.yellow);
  ab('RED ABILITIES', D.abilities.red);
  if (D.abilities.out) L.push('', 'OUT: ' + D.abilities.out.text);
  return L.join('\n');
}

// ---------- play helpers ----------
export function healthZone(D: Derived, health: number | null): Zone | 'out' | null {
  const r = D.health.ranges;
  if (!r || health == null) return null;
  if (health <= 0) return 'out';
  if (health >= r.green[1]) return 'green';
  if (health >= r.yellow[1]) return 'yellow';
  return 'red';
}
const zoneRank = (z: Zone) => ZONES.indexOf(z);
// Your status is whichever is closer to Out: your Health zone or the scene's zone.
export function effectiveZone(personal: Zone | 'out' | null, scene: Zone): Zone {
  if (!personal || personal === 'out') return personal === 'out' ? 'red' : scene;
  return zoneRank(personal) >= zoneRank(scene) ? personal : scene;
}
export function zoneAllows(current: Zone, abilityZone: Zone) {
  return zoneRank(abilityZone) <= zoneRank(current);
}
