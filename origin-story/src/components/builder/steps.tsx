import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  ARCHETYPES, BACKGROUNDS, DIVIDED, FORM_CHANGER, MINION_CHART, MINION_FORMS, MINION_FORMS_NOTE, MODULAR, PERSONALITIES, POWER_CATS,
  POWER_SOURCES, PRINCIPLES, QUALITY_CATS, RED_ABILITIES, RETCONS,
} from '../../data/rules';
import {
  DIE_SIZES, PRINCIPLE_BY_NAME, PRINCIPLE_CATS, allOfKind, entry, listHas, listText, optionGroupsFor, pickBase, principleItem, reachable,
  reqText, rollDie, selectEntry, sortTraits, type AbilityGroup, type OptionGroup, type Slot, type Zone,
} from '../../engine/hero';
import type { ArchetypeDef, ArchetypeDef as ArchDef, PowerSourceDef } from '../../data/types';
import { radius, space, useColors } from '../../theme';
import { Body, Btn, Callout, Chip, CommitField, DieBadge, DiceRow, Icon, Label, PickerSheet, PressScale, Section, SelectButton, Segmented, Title } from '../ui';
import {
  AbilityCard, Detail, GroupView, IssuesBox, NextHint, OptionGrid, PrincipleChip, PrincipleView, RollBox, SingleSlot, SlotEditor, StepHead, TraitSelect,
} from './common';
import { useBuilder } from './context';

const useG = () => {
  const { D } = useBuilder();
  return (id: string) => D.groups.find((g) => g.id === id);
};

// ===================== Step 1: Background =====================
export function BackgroundStep() {
  const { h, D, update } = useBuilder();
  const G = useG();
  const bg = D.bg;
  return (
    <View>
      <StepHead n="1" title="Background" lede="Where your hero came from before they became a hero. Roll 2d10 and use either die, or add them together." />
      {h.method === 'guided' && <RollBox rollKey="bg" dice={[10, 10]} label="2d10" />}
      <OptionGrid
        rollKey="bg"
        list={BACKGROUNDS}
        selected={h.bg.n}
        onPick={(n) => update((x) => selectEntry(x, 'bg', n))}
        meta={(e) => (
          <>
            <PrincipleChip cat={e.principle} />
            <Icon name="arrow-right" size={14} color="#888" />
            <DiceRow dice={e.roll} px={22} />
          </>
        )}
      />
      {bg && (
        <Detail n={bg.n} name={bg.name} blurb={bg.blurb}>
          <Section
            title="Qualities"
            note={`Assign ${bg.assign.map((d) => 'd' + d).join(', ')} to ${bg.count} of: ${bg.required ? bg.required + ' (required), ' : ''}${listText(bg.q)}`}
          />
          {bg.note ? <Callout>{bg.note}</Callout> : null}
          <SlotEditor
            run={D.bgRun}
            slots={h.bg.slots}
            setSlots={(fn) => update((x) => fn(x.bg.slots))}
            groups={optionGroupsFor(h, { qual: bg.q, required: bg.required })}
            baseLen={bg.assign.length}
          />
          <PrincipleView g={G('pr-bg')} />
          <NextHint>
            <Body>Next: roll</Body>
            <DiceRow dice={bg.roll} px={22} />
            <Body>for your power source. Those dice become your powers.</Body>
          </NextHint>
        </Detail>
      )}
      <IssuesBox step="bg" />
    </View>
  );
}

// ===================== Step 2: Power Source =====================
export function PowerSourceStep() {
  const { h, D, update } = useBuilder();
  const G = useG();
  const { ps, bg } = D;
  return (
    <View>
      <StepHead n="2" title="Power Source" lede="What changed you and fuels your powers. The dice your background gave you are the dice you assign to powers here." />
      {!bg && <Callout tone="warn">Choose a background first. It gives you the dice for this step.</Callout>}
      {h.method === 'guided' && bg && <RollBox rollKey="ps" dice={bg.roll} label={bg.roll.map((d) => 'd' + d).join(' ')} />}
      <OptionGrid
        rollKey="ps"
        list={POWER_SOURCES}
        selected={h.ps.n}
        onPick={(n) => update((x) => selectEntry(x, 'ps', n))}
        meta={(e) => (
          <>
            <Icon name="arrow-right" size={14} color="#888" />
            <DiceRow dice={e.roll} px={22} />
          </>
        )}
      />
      {ps && (
        <Detail n={ps.n} name={ps.name} blurb={ps.blurb}>
          <Section title="Powers" note={`${ps.required ? `One die to ${ps.required}; the rest` : 'Assign all the dice from your background'} to: ${listText(ps.p)}`} />
          {bg && (
            <SlotEditor
              run={D.psRun}
              slots={h.ps.slots}
              setSlots={(fn) => update((x) => fn(x.ps.slots))}
              groups={optionGroupsFor(h, { pow: ps.p, required: ps.required, reqKind: 'power' })}
              baseLen={bg.roll.length}
              owned={D.snap.bg}
            />
          )}
          <PsExtra ps={ps} />
          <GroupView g={G('ps-yellow')} />
          <GroupView g={G('ps-green')} />
          <NextHint>
            <Body>Next: roll</Body>
            <DiceRow dice={ps.roll} px={22} />
            <Body>for your archetype. Those dice become more powers and qualities.</Body>
          </NextHint>
        </Detail>
      )}
      <IssuesBox step="ps" />
    </View>
  );
}

function PsExtra({ ps }: { ps: PowerSourceDef }) {
  const { h, D, update } = useBuilder();
  const ex = ps.extra;
  if (!ex) return null;
  const owned = D.snap.bg;
  const setSlot = (fn: (s: Slot) => Slot) => update((x) => { x.ps.extra.slot = fn(x.ps.extra.slot ?? null); });
  let body = null;
  if (ex.type === 'quality') {
    const groups: OptionGroup[] = (ex.cats as string[]).map((c) => ({ label: 'Any ' + c + ' quality', kind: 'quality', items: Object.keys(QUALITY_CATS[c].items) }));
    body = <SingleSlot die={ex.die!} slot={h.ps.extra.slot} setSlot={setSlot} groups={groups} owned={owned} title={`Extra quality at d${ex.die}`} />;
  } else if (ex.type === 'power') {
    body = <SingleSlot die={ex.die!} slot={h.ps.extra.slot} setSlot={setSlot} groups={allOfKind('power')} owned={owned} title={`Extra power at d${ex.die}`} />;
  } else if (ex.type === 'powerNotOnList') {
    const groups = allOfKind('power').map((g) => ({ ...g, items: g.items.filter((it) => !listHas(ps.p, 'power', it)) }));
    body = <SingleSlot die={ex.die!} slot={h.ps.extra.slot} setSlot={setSlot} groups={groups} owned={owned} title={`Power not on the list, at d${ex.die}`} />;
  } else if (ex.type === 'upgradeD6') {
    const d6 = (D.psCtx || []).filter((t) => t.die === 6);
    body = d6.length ? (
      <TraitSelect list={d6} value={h.ps.extra.upKey || ''} onChange={(k) => update((x) => { x.ps.extra.upKey = k; })} placeholder="— pick a d6 power or quality to upgrade —" />
    ) : (
      <SingleSlot die={6} slot={h.ps.extra.slot} setSlot={setSlot} groups={optionGroupsFor(h, { pow: ps.p })} owned={owned} title="No d6 traits: add a new power from the list at d6" />
    );
  } else if (ex.type === 'cosmosShift') {
    const pw = (D.psCtx || []).filter((t) => t.kind === 'power');
    body = (
      <View style={{ gap: space.sm }}>
        <Label>Downgrade</Label>
        <TraitSelect list={pw.filter((t) => t.die >= 8)} value={h.ps.extra.downKey || ''} onChange={(k) => update((x) => { x.ps.extra.downKey = k; })} placeholder="— a d8+ power —" />
        <Label>Upgrade</Label>
        <TraitSelect list={pw.filter((t) => t.die <= 10)} value={h.ps.extra.upKey || ''} onChange={(k) => update((x) => { x.ps.extra.upKey = k; })} placeholder="— a d10-or-lower power —" />
      </View>
    );
  } else if (ex.type === 'archetypeQuality') body = <Body muted>You'll pick this extra quality in Step 3.</Body>;
  return (
    <View>
      <Section title="Bonus" note={ex.text} />
      {body}
    </View>
  );
}

// ===================== Step 3: Archetype =====================
function archAssignText(a: ArchDef) {
  let t = '';
  if (a.req) t += `One die to ${reqText(a.req)}. `;
  if (a.psychicRule) return t + `At least two dice to Psychic powers. Remaining dice to: ${listText(a.p)} powers, or ${listText(a.q)} qualities.`;
  t += (a.pRule === 'one' ? 'Exactly one remaining die' : a.pRule === 'oneOrMore' ? 'One or more ' + (a.req ? 'remaining ' : '') + 'dice' : 'Any number of remaining dice') + ` to powers: ${listText(a.p)}. `;
  return t + `The rest to qualities: ${listText(a.q)}.`;
}

export function ArchetypeStep() {
  const { h, D, update } = useBuilder();
  const G = useG();
  const { ps, archTop: top, arch } = D;
  const extra = top?.modular ? reachable(h.rolls.arch?.vals || []) : null;
  return (
    <View>
      <StepHead n="3" title="Archetype" lede="How you use your powers as a hero. The dice from your power source are the dice you assign here." />
      {!ps && <Callout tone="warn">Choose a power source first. It gives you the dice for this step.</Callout>}
      {h.method === 'guided' && ps && <RollBox rollKey="arch" dice={ps.roll} label={ps.roll.map((d) => 'd' + d).join(' ')} />}
      <OptionGrid
        rollKey="arch"
        list={ARCHETYPES}
        selected={h.arch.n}
        onPick={(n) => update((x) => selectEntry(x, 'arch', n))}
        meta={(e) => <PrincipleChip cat={e.principle || 'Varies'} />}
      />
      {top && (
        <Detail n={top.n} name={top.name + (arch && arch !== top ? ' ' + arch.name : '')} blurb={top.blurb}>
          {(top.divided || top.modular) && (
            <View>
              <Callout>{`${top.divided ? DIVIDED.note : MODULAR.note} The book recommends this isn't your first hero.`}</Callout>
              <Section title="Base archetype" />
              {h.method === 'guided' && ps && <RollBox rollKey="archBase" dice={ps.roll} label="(base)" />}
              <OptionGrid
                rollKey="archBase"
                list={ARCHETYPES}
                selected={h.arch.baseN}
                filter={(e) => !e.divided && !e.modular}
                extraReach={extra}
                onPick={(n) => update((x) => pickBase(x, n))}
                meta={(e) => <PrincipleChip cat={e.principle || ''} />}
              />
            </View>
          )}
          {arch && ps && <ArchAssign arch={arch} top={top} />}
          {top.modular ? (
            <>
              <GroupView g={G('mod-fixed')} />
              <ModesView />
            </>
          ) : arch ? (
            <>
              <GroupView g={G('arch-fixed')} />
              <GroupView g={G('arch-green')} />
              <GroupView g={G('arch-yellow')} />
              {arch.forms && <FormsView />}
              <GroupView g={G('arch-red')} />
              {arch.extraRed && <Callout>Minion-Maker: three extra Red abilities (Construction Focus, Swarm Combat, Sacrifice) are available in Step 5.</Callout>}
              {arch.minionForms && <MinionView />}
            </>
          ) : null}
          {top.divided && <DividedView />}
          <PrincipleView g={G('pr-arch')} />
          <NextHint>
            <Body>Next: roll</Body>
            <DiceRow dice={top.roll} px={22} />
            <Body>for your personality.</Body>
          </NextHint>
        </Detail>
      )}
      <IssuesBox step="arch" />
    </View>
  );
}

function ArchAssign({ arch, top }: { arch: ArchetypeDef; top: ArchetypeDef }) {
  const { h, D, update } = useBuilder();
  const ps = D.ps!;
  const owned = D.snap.ps;
  const anyPower = allOfKind('power');
  return (
    <View>
      <Section title="Powers & qualities" note={archAssignText(arch)} />
      {arch.req?.note ? <Callout>{arch.req.note}</Callout> : null}
      {arch.note ? <Callout>{arch.note}</Callout> : null}
      <Body muted style={{ fontSize: 13, marginBottom: 6 }}>If you pick something you already have, it keeps the bigger die and you get the smaller one back to use in this step.</Body>
      <SlotEditor
        run={D.archRun}
        slots={h.arch.slots}
        setSlots={(fn) => update((x) => fn(x.arch.slots))}
        groups={optionGroupsFor(h, { req: arch.req, pow: arch.p, qual: arch.q })}
        baseLen={ps.roll.length}
        owned={owned}
      />
      {ps.extra?.type === 'archetypeQuality' && (
        <>
          <Section title="Training bonus" note="An extra quality from this archetype's list at d8." />
          <SingleSlot die={8} slot={h.arch.extra.training} setSlot={(fn) => update((x) => { x.arch.extra.training = fn(x.arch.extra.training ?? null); })} groups={optionGroupsFor(h, { qual: arch.q })} owned={owned} title="Training: extra archetype quality at d8" />
        </>
      )}
      {arch.extra?.type === 'newPowerCat' && (
        <>
          <Section title="Built-in tech" note={arch.extra.text} />
          <SingleSlot die={10} slot={h.arch.extra.robot} setSlot={(fn) => update((x) => { x.arch.extra.robot = fn(x.arch.extra.robot ?? null); })} groups={[{ label: 'Technological powers', kind: 'power', items: Object.keys(POWER_CATS.Technological.items) }]} owned={owned} title="A Technological power you don't already have, at d10" />
        </>
      )}
      {top.modular && (
        <>
          <Section title="Extra powers" note="If you have fewer than four powers, add one or two d6 powers of your choice." />
          <View style={{ gap: space.sm }}>
            {[0, 1].map((i) => (
              <SingleSlot key={i} die={6} slot={h.arch.extraPowers[i]} setSlot={(fn) => update((x) => { for (let k = x.arch.extraPowers.length; k < i; k++) x.arch.extraPowers[k] = null; x.arch.extraPowers[i] = fn(x.arch.extraPowers[i] ?? null); })} groups={anyPower} owned={owned} title="Optional d6 power" />
            ))}
          </View>
        </>
      )}
      {arch.healthAlt && <Callout>When you work out Health in Step 7, you may use a {arch.healthAlt.join(' or ')} power instead of an Athletic power or Mental quality.</Callout>}
    </View>
  );
}

function RowsEditor({ rows, setRows, title, sub }: { rows: { label: string; die: number }[]; setRows: (fn: (r: { label: string; die: number }[]) => void) => void; title: string; sub?: string }) {
  const { D } = useBuilder();
  const c = useColors();
  return (
    <View style={{ borderWidth: 2, borderColor: c.line, borderStyle: 'dashed', borderRadius: radius.sm, padding: space.sm, gap: 6, marginTop: space.sm }}>
      <Text style={{ fontWeight: '900', color: c.ink }}>{title}</Text>
      {sub ? <Body muted style={{ fontSize: 13 }}>{sub}</Body> : null}
      {rows.map((r, i) => (
        <View key={i} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CommitField style={{ flex: 1 }} value={r.label} placeholder="Power" onCommit={(v) => setRows((rr) => { if (rr[i]) rr[i].label = v; })} />
            <PressScale onPress={() => setRows((rr) => { rr.splice(i, 1); })} accessibilityLabel="Remove row">
              <Icon name="close" size={20} color={c.red} />
            </PressScale>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {DIE_SIZES.map((d) => (
              <PressScale key={d} onPress={() => setRows((rr) => { rr[i].die = d; })}>
                <DieBadge size={d} px={30} fill={+r.die === d ? c.yellow : undefined} />
              </PressScale>
            ))}
          </View>
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Btn small icon="plus" label="Row" onPress={() => setRows((rr) => { rr.push({ label: '', die: 6 }); })} />
        <Btn small icon="content-copy" label="Copy current powers" onPress={() => setRows((rr) => { rr.splice(0, rr.length, ...D.powers.map((t) => ({ label: t.label, die: t.die }))); })} />
      </View>
    </View>
  );
}

function FormsView() {
  const { h, update } = useBuilder();
  const G = useG();
  const setForm = (k: string) => (fn: (r: { label: string; die: number }[]) => void) =>
    update((x) => {
      const f = (x.forms[k] = x.forms[k] || {});
      f.rows = f.rows || [];
      fn(f.rows);
    });
  const nameField = (k: string, label: string, ph: string) => (
    <CommitField label={label} value={h.forms[k]?.name || ''} placeholder={ph} onCommit={(v) => update((x) => { (x.forms[k] = x.forms[k] || {}).name = v; })} />
  );
  return (
    <View>
      <Section title="Forms" note={FORM_CHANGER.greenFormNote} />
      {([['g1', 'form-g1'], ['g2', 'form-g2']] as const).map(([k, gid]) => (
        <View key={k} style={{ marginTop: space.sm }}>
          {nameField(k, 'Green form name', 'e.g. Wolf Form')}
          <GroupView g={G(gid)} />
          <RowsEditor rows={h.forms[k]?.rows || []} setRows={setForm(k)} title="Form powers" sub="Swap dice between powers for this form; you may add powers from the archetype list and drop others." />
        </View>
      ))}
      <Callout>{FORM_CHANGER.yellowFormNote}</Callout>
      {nameField('y', 'Yellow form name', 'e.g. Towering Form')}
      <GroupView g={G('form-y')} />
      <RowsEditor rows={h.forms.y?.rows || []} setRows={setForm('y')} title="Yellow form powers" sub="Swap powers around and upgrade any two dice by one size." />
    </View>
  );
}

function ModesView() {
  const { h, update } = useBuilder();
  const G = useG();
  const setMode = (m: string) => (fn: (r: { label: string; die: number }[]) => void) =>
    update((x) => {
      const md = (x.modes[m] = x.modes[m] || {});
      md.rows = md.rows || [];
      fn(md.rows);
    });
  return (
    <View>
      <Section title="Modes" note={MODULAR.defaultMode} />
      <Chip
        icon={h.arch.powerless ? 'checkbox-marked' : 'checkbox-blank-outline'}
        label="Add a Powerless Mode"
        active={h.arch.powerless}
        onPress={() => update((x) => { x.arch.powerless = !x.arch.powerless; })}
      />
      <Body muted style={{ fontSize: 13, marginTop: 4 }}>{MODULAR.powerlessMode}</Body>
      {h.arch.powerless && <RowsEditor rows={h.modes['Powerless Mode']?.rows || []} setRows={setMode('Powerless Mode')} title="Powerless mode powers" sub="One power at d6, another at d10." />}
      {['mod-green', 'mod-yellow', 'mod-red'].map((gid) => {
        const g = G(gid);
        return (
          <View key={gid}>
            <GroupView g={g} />
            {(h.sel[gid] || []).map((m) => (
              <RowsEditor key={m} rows={h.modes[m]?.rows || []} setRows={setMode(m)} title={m + ' powers'} sub={g?.items.find((i) => i.id === m)?.rule} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function MinionView() {
  const { h, D, update } = useBuilder();
  const c = useColors();
  const rel = ['Creativity', 'Magical Lore', 'Otherworldly Mythos', 'Science', 'Technology'];
  const def = D.qualities.filter((q) => rel.includes(q.base)).sort(sortTraits)[0];
  const q = D.traits.get(h.arch.minionQuality) || def;
  const n = q ? q.die : 0;
  const chosen = h.arch.minionForms || [];
  return (
    <View>
      <Section title="Minion forms" note={MINION_FORMS_NOTE} />
      <TraitSelect list={D.qualities} value={h.arch.minionQuality} onChange={(k) => update((x) => { x.arch.minionQuality = k; })} placeholder={def ? `Auto: ${def.label} (d${def.die})` : '— pick a related quality —'} />
      <Body style={{ marginVertical: 6, fontWeight: '800' }}>{chosen.length}/{n} forms chosen</Body>
      <View style={{ gap: 6 }}>
        {MINION_FORMS.map((f) => {
          const on = chosen.includes(f[0]);
          const dis = !on && chosen.length >= n && !h.bend;
          return (
            <PressScale
              key={f[0]}
              disabled={dis}
              onPress={() => update((x) => { const arr = x.arch.minionForms; x.arch.minionForms = on ? arr.filter((y) => y !== f[0]) : [...arr, f[0]]; })}
              style={{ flexDirection: 'row', gap: 8, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 8, backgroundColor: on ? c.zone.green.bg : c.panel }}
            >
              <Icon name={on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={on ? c.zone.green.fg : c.muted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: c.ink }}>{f[0]} <Text style={{ fontWeight: '600', color: c.muted }}>· bonus {f[2]}</Text></Text>
                <Body style={{ fontSize: 13 }}>{f[1]}</Body>
              </View>
            </PressScale>
          );
        })}
      </View>
      <MinionChart />
    </View>
  );
}

export function MinionChart() {
  const c = useColors();
  return (
    <View>
      <Section title="Minion chart" />
      {MINION_CHART.map((r) => (
        <View key={r[0]} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderColor: c.faint }}>
          <Text style={{ width: 72, fontWeight: '800', color: c.ink }}>{r[0]}</Text>
          <DieBadge size={+r[1].slice(1)} px={26} />
          <Body style={{ flex: 1, fontSize: 14 }}>{r[2]}</Body>
        </View>
      ))}
    </View>
  );
}

function DividedView() {
  const { h, update } = useBuilder();
  const G = useG();
  const c = useColors();
  return (
    <View>
      <Section title="Method of transformation" />
      <View style={{ gap: 6 }}>
        {DIVIDED.transitions.map((t) => {
          const on = h.arch.transition === t.name;
          return (
            <PressScale
              key={t.name}
              onPress={() => update((x) => { x.arch.transition = t.name; delete x.sel['div-trans']; })}
              style={{ borderWidth: 2, borderColor: c.line, borderLeftWidth: 6, borderLeftColor: c.zone.green.fg, borderRadius: radius.sm, padding: 10, backgroundColor: on ? c.zone.green.bg : c.panel, gap: 4 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? c.zone.green.fg : c.muted} />
                <Text style={{ fontWeight: '900', color: c.ink, flex: 1 }}>{t.name}</Text>
              </View>
              <Body style={{ fontSize: 14 }}>{t.desc}</Body>
            </PressScale>
          );
        })}
      </View>
      <GroupView g={G('div-trans')} />
      <GroupView g={G('div-ab')} />
      <CommitField
        style={{ marginTop: space.md }}
        label="Form notes (auxiliary sheet)"
        multiline
        value={h.arch.dividedNotes || ''}
        placeholder="Civilian form vs. heroic form: which powers and qualities each can use…"
        onCommit={(v) => update((x) => { x.arch.dividedNotes = v; })}
      />
    </View>
  );
}

// ===================== Step 4: Personality =====================
export function PersonalityStep() {
  const { h, D, update } = useBuilder();
  const G = useG();
  const c = useColors();
  const { pers, archTop: top } = D;
  const [pick2, setPick2] = useState(false);
  const zoneFill = (i: number) => [c.zone.green.die, c.zone.yellow.die, c.zone.red.die][i];
  return (
    <View>
      <StepHead n="4" title="Personality" lede="Your demeanor, how you react under pressure (your status dice), and how you still help the team after you're taken out." />
      {h.method === 'guided' && <RollBox rollKey="pers" dice={top ? top.roll : [10, 10]} label="2d10" />}
      <OptionGrid
        rollKey="pers"
        list={PERSONALITIES}
        selected={h.pers.n}
        onPick={(n) => update((x) => selectEntry(x, 'pers', n))}
        meta={(e) => <DiceRow dice={e.status} px={22} fills={e.status.map((_, i) => zoneFill(i))} />}
      />
      {pers && (
        <Detail n={pers.n} name={pers.name}>
          <Section title="Status dice" note="Rolled with every action: Green, Yellow, or Red depending on how dire things are." />
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            {(['green', 'yellow', 'red'] as Zone[]).map((z, i) => <DieBadge key={z} size={pers.status[i]} px={44} fill={zoneFill(i)} label={z} />)}
          </View>
          <Section title="Roleplaying quality" note="Make up a quality that sums up your hero (their high concept), something not already covered. It's a d8." />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <DieBadge size={8} px={38} />
            <CommitField style={{ flex: 1 }} value={h.pers.custom} placeholder="e.g. Time-Lost Sheriff" onCommit={(v) => update((x) => { x.pers.custom = v; })} />
          </View>
          {pers.extra && (
            <>
              <Section title="Bonus" note={pers.extra.text} />
              <TraitSelect list={[...(D.snap.arch?.values() || [])].filter((t) => t.die < 12).sort(sortTraits)} value={h.pers.upgradeKey} onChange={(k) => update((x) => { x.pers.upgradeKey = k; })} placeholder="— pick a power or quality —" />
            </>
          )}
          {pers.extraText ? <Callout>{pers.extraText}</Callout> : null}
          <GroupView g={G('out')} title="Out ability" />
          <Body muted style={{ fontSize: 13, marginTop: 4 }}>Your Out ability is what you can still do for the team once you're incapacitated.</Body>
          {top?.divided && (
            <>
              <Section title="Second personality (optional)" note={DIVIDED.personalityNote} />
              <SelectButton value={h.pers.n2 ? entry(PERSONALITIES, h.pers.n2)?.name : undefined} placeholder="— none —" onPress={() => setPick2(true)} />
              <PickerSheet
                visible={pick2}
                onClose={() => setPick2(false)}
                title="Second personality"
                value={h.pers.n2 ? String(h.pers.n2) : undefined}
                onClear={() => update((x) => { x.pers.n2 = null; })}
                onPick={(v) => update((x) => { x.pers.n2 = Number(v); })}
                groups={[{ label: '', items: PERSONALITIES.map((p) => ({ value: String(p.n), label: `${p.n}. ${p.name}`, sub: p.status.map((d) => 'd' + d).join(' / ') })) }]}
              />
            </>
          )}
        </Detail>
      )}
      <IssuesBox step="pers" />
    </View>
  );
}

// ===================== Step 5: Red abilities =====================
export function RedStep() {
  const { h, D } = useBuilder();
  const G = useG();
  const [showOther, setShowOther] = useState(false);
  const g = G('red') as AbilityGroup;
  const n = (h.sel.red || []).length;
  const cats = [...new Set(g.items.map((i) => i.cat!))];
  const avail: [string, typeof g.items][] = [];
  const other: [string, typeof g.items][] = [];
  for (const cat of cats) {
    const items = g.items.filter((i) => i.cat === cat);
    const any = h.bend || items.some((i) => (i.ckind === 'arch' ? true : redOk(i, D))) || items.some((i) => (h.sel.red || []).includes(i.id));
    (any ? avail : other).push([cat, items]);
  }
  // Categories holding your picks come first, so you can see what you chose.
  const picked = (items: typeof g.items) => items.some((i) => (h.sel.red || []).includes(i.id));
  avail.sort((x, y) => Number(picked(y[1])) - Number(picked(x[1])));
  const block = ([cat, items]: [string, typeof g.items]) => (
    <View key={cat}>
      <Section title={cat} note={RED_ABILITIES[cat] ? (RED_ABILITIES[cat].kind === 'power' ? 'powers' : 'qualities') : 'archetype'} />
      <View style={{ gap: space.sm }}>{items.map((it) => <AbilityCard key={it.id} g={g} it={it} zoneOverride="red" />)}</View>
    </View>
  );
  return (
    <View>
      <StepHead n="5" title="Red Abilities" lede={`Choose ${D.redCount} Red abilities: your big moves when things get desperate. You need a power or quality in an ability's category to take it (rated d6+ if the ability doesn't use one).`} />
      <Callout icon="fire">{`${n}/${D.redCount} chosen.${D.retcon?.id === 'extraRed' ? ' Your retcon grants an extra Red ability.' : ''}`}</Callout>
      {avail.map(block)}
      {other.length > 0 && (
        <>
          <Btn kind="ghost" icon={showOther ? 'chevron-up' : 'chevron-down'} label={`Categories you don't have yet (${other.length})`} onPress={() => setShowOther(!showOther)} style={{ marginTop: space.md }} />
          {showOther && other.map(block)}
        </>
      )}
      <IssuesBox step="red" />
    </View>
  );
}
function redOk(it: AbilityGroup['items'][number], D: ReturnType<typeof useBuilder>['D']) {
  const traits = [...D.traits.values()];
  if (it.need) return traits.some((t) => t.base === it.need);
  return traits.some((t) => t.cat === it.cat && t.kind === it.ckind);
}

// ===================== Step 6: Retcon =====================
export function RetconStep() {
  const { h, D, update } = useBuilder();
  const c = useColors();
  const [prOpen, setPrOpen] = useState(false);
  const id = h.retcon.id;
  const pre = D.snap.pers ? [...D.snap.pers.values()] : [];
  let body = null;
  if (id === 'swapPowers' || id === 'swapQualities') {
    const kind = id === 'swapPowers' ? 'power' : 'quality';
    const list = pre.filter((t) => t.kind === kind).sort(sortTraits);
    body = (
      <View style={{ gap: space.sm }}>
        <Section title="Swap dice" />
        <TraitSelect list={list} value={h.retcon.a} onChange={(k) => update((x) => { x.retcon.a = k; })} placeholder={`— first ${kind} —`} />
        <Icon name="swap-vertical" size={22} color={c.muted} style={{ alignSelf: 'center' }} />
        <TraitSelect list={list} value={h.retcon.b} onChange={(k) => update((x) => { x.retcon.b = k; })} placeholder={`— second ${kind} —`} />
      </View>
    );
  } else if (id === 'swapAbility') {
    body = (
      <View>
        <Callout>Change the power or quality on any ability right in its step (tap the underlined fill-ins). Note what you changed:</Callout>
        <CommitField value={h.retcon.note} placeholder="e.g. Shocking Strike now uses Speed" onCommit={(v) => update((x) => { x.retcon.note = v; })} />
      </View>
    );
  } else if (id === 'addD6') {
    const groups: OptionGroup[] = [...allOfKind('power').map((g) => ({ ...g, label: g.label + ' powers' })), ...allOfKind('quality').map((g) => ({ ...g, label: g.label + ' qualities' }))];
    body = (
      <View>
        <Section title="Add a d6 trait" />
        <SingleSlot die={6} slot={h.retcon.add} setSlot={(fn) => update((x) => { x.retcon.add = fn(x.retcon.add); })} groups={groups} owned={D.snap.pers} title="Any power or quality at d6" />
      </View>
    );
  } else if (id === 'redUp' && D.pers && D.status) {
    body = <Callout icon="arrow-up-bold">{`Red status die: d${D.pers.status[2]} → d${D.status[2]}${D.pers.status[2] === 12 ? ' (already at maximum)' : ''}.`}</Callout>;
  } else if (id === 'swapPrinciple') {
    const p = PRINCIPLE_BY_NAME[h.retcon.principle];
    const g: AbilityGroup | null = p ? { id: 'pr-retcon', step: 'retcon', kind: 'principle', zone: 'green', title: '', items: [principleItem(p)], count: 1, fixed: true } : null;
    body = (
      <View style={{ gap: space.sm }}>
        <Section title="Replace a principle" />
        <Segmented
          value={h.retcon.slot}
          onChange={(v) => update((x) => { x.retcon.slot = v; })}
          options={[
            { value: 'bg', label: `Background: ${(h.sel['pr-bg'] || [])[0]?.replace('Principle of ', '') || '—'}` },
            { value: 'arch', label: `Archetype: ${(h.sel['pr-arch'] || [])[0]?.replace('Principle of ', '') || '—'}` },
          ]}
        />
        <SelectButton value={h.retcon.principle || undefined} placeholder="— new principle —" onPress={() => setPrOpen(true)} />
        <PickerSheet
          visible={prOpen}
          onClose={() => setPrOpen(false)}
          title="New principle"
          value={h.retcon.principle}
          onPick={(v) => update((x) => { x.retcon.principle = v; })}
          groups={PRINCIPLE_CATS.map((cat) => ({ label: cat, items: PRINCIPLES.filter((pp) => pp[1] === cat).map((pp) => ({ value: pp[0], label: pp[0], sub: pp[2] })) }))}
        />
        {g && <AbilityCard g={g} it={g.items[0]} />}
      </View>
    );
  } else if (id === 'extraRed') {
    body = <Callout>Pick your third Red ability on the Red Abilities step.</Callout>;
  }
  return (
    <View>
      <StepHead n="6" title="Retcon" lede="Almost done, but maybe something's not quiiiite right. Tweak your origin with one retcon." />
      <View style={{ gap: 6 }}>
        {RETCONS.map((r) => {
          const on = id === r.id;
          return (
            <PressScale key={r.id} onPress={() => update((x) => { x.retcon.id = r.id; })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 12, backgroundColor: on ? c.zone.yellow.bg : c.panel }}>
              <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={on ? c.ink : c.muted} />
              <Text style={{ flex: 1, fontWeight: on ? '900' : '600', color: c.ink, fontSize: 15 }}>{r.text}</Text>
            </PressScale>
          );
        })}
      </View>
      {body}
      <IssuesBox step="retcon" />
    </View>
  );
}

// ===================== Step 7: Health =====================
export function HealthStep() {
  const { h, D, update } = useBuilder();
  const c = useColors();
  const [open, setOpen] = useState(false);
  const hh = D.health;
  return (
    <View>
      <StepHead n="7" title="Health" lede="8 + your Red status die's max + the max of one Athletic power or Mental quality (d4 if none) + a d8 roll (or just take 4)." />
      {!D.status ? (
        <Callout tone="warn">Choose a personality first. Your Red status die feeds into Health.</Callout>
      ) : (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Title size={30}>8</Title>
            <Title size={22}>+</Title>
            <DieBadge size={D.status[2]} px={44} fill={c.zone.red.die} label="Red status" />
            <Title size={22}>+</Title>
            <PressScale onPress={() => setOpen(true)}>
              <DieBadge size={hh.traitDie} px={44} label={hh.trait ? hh.trait.label : 'none (d4)'} />
            </PressScale>
            <Title size={22}>+</Title>
            <DieBadge size={8} px={44} value={hh.d8 ?? '?'} fill={c.yellow} label={h.health.mode === 'four' ? 'take 4' : 'd8 roll'} />
          </View>
          <Label>Trait for Health</Label>
          <SelectButton value={hh.trait ? `${hh.trait.label} (d${hh.trait.die})` : undefined} placeholder="None (d4)" onPress={() => setOpen(true)} />
          <Body muted style={{ fontSize: 13 }}>Counts: {hh.any ? 'any power or quality (Mischievous)' : hh.altCats.join(', ')}. Decide before rolling: take 4 or roll the d8.</Body>
          <Segmented
            value={h.health.mode}
            onChange={(v) => update((x) => { x.health.mode = v; })}
            options={[{ value: 'four', label: 'Take 4', icon: 'numeric-4-box-outline' }, { value: 'roll', label: 'Roll d8', icon: 'dice-d8' }]}
          />
          {h.health.mode === 'roll' && (
            <Btn kind="primary" icon="dice-d8" label={h.health.rolled ? `Rolled ${h.health.rolled}` : 'Roll the d8'} disabled={!!h.health.rolled && !h.bend} onPress={() => update((x) => { x.health.rolled = rollDie(8); })} />
          )}
          {hh.max && hh.ranges ? <HealthBox max={hh.max} ranges={hh.ranges} /> : null}
          <PickerSheet
            visible={open}
            onClose={() => setOpen(false)}
            title="Trait for Health"
            value={h.health.traitKey}
            onClear={() => update((x) => { x.health.traitKey = ''; })}
            onPick={(k) => update((x) => { x.health.traitKey = k; })}
            groups={[{ label: '', items: hh.candidates.map((t) => ({ value: t.key, label: t.label, sub: t.cat, badge: <DieBadge size={t.die} px={26} /> })) }]}
          />
        </View>
      )}
      <IssuesBox step="health" />
    </View>
  );
}

export function HealthBox({ max, ranges }: { max: number; ranges: Record<Zone, [number, number]> }) {
  const c = useColors();
  const cell = (k: string, v: string, bg: string) => (
    <View key={k} style={{ flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: bg, borderLeftWidth: k === 'Max' ? 0 : 2, borderColor: c.line }}>
      <Label>{k}</Label>
      <Title size={22}>{v}</Title>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, overflow: 'hidden' }}>
      {cell('Max', String(max), c.panel)}
      {cell('Green', `${ranges.green[0]}–${ranges.green[1]}`, c.zone.green.bg)}
      {cell('Yellow', `${ranges.yellow[0]}–${ranges.yellow[1]}`, c.zone.yellow.bg)}
      {cell('Red', `${ranges.red[0]}–${ranges.red[1]}`, c.zone.red.bg)}
    </View>
  );
}

// ===================== Step 8: Finishing =====================
export function FinishStep() {
  const { h, D, update } = useBuilder();
  const set = (k: keyof typeof h.info) => (v: string) => update((x) => { x.info[k] = v; });
  const f = (k: keyof typeof h.info, label: string, ph?: string) => (
    <CommitField key={k} label={label} value={h.info[k]} placeholder={ph} onCommit={set(k)} style={{ flexBasis: '46%', flexGrow: 1 }} />
  );
  const all = [...D.abilities.green, ...D.abilities.yellow, ...D.abilities.red];
  return (
    <View>
      <StepHead n="8" title="Finishing Touches" lede="Name, alias, look, and snappy names for your abilities. Attributes are loose: “mid-thirties” is a fine age, and an alien can have “seven” eyes." />
      <View style={{ gap: space.sm, flexDirection: 'row', flexWrap: 'wrap' }}>
        {f('name', 'Hero name', 'e.g. Time-Slinger')}
        {f('alias', 'Alias', 'Civilian name')}
        {f('player', 'Player')}
      </View>
      <Section title="Physical attributes" />
      <View style={{ gap: space.sm, flexDirection: 'row', flexWrap: 'wrap' }}>
        {f('gender', 'Gender')}
        {f('age', 'Age')}
        {f('height', 'Height')}
        {f('eyes', 'Eyes')}
        {f('hair', 'Hair')}
        {f('skin', 'Skin')}
        {f('build', 'Build')}
      </View>
      <Section title="Costume / equipment" />
      <CommitField multiline value={h.info.costume} placeholder="What do they wear and carry in the field?" onCommit={set('costume')} />
      <Section title="Name your abilities" note="Rename each ability to fit your hero." />
      {all.length ? (
        <View style={{ gap: 6 }}>
          {all.map((a) => <AbilityRename key={a.gid + a.id} gid={a.gid} id={a.id} base={a.base} />)}
        </View>
      ) : (
        <Body muted>No abilities yet.</Body>
      )}
      <Section title="Notes" />
      <CommitField multiline value={h.info.notes} placeholder="Backstory, connections, anything else…" onCommit={set('notes')} />
      <IssuesBox step="finish" />
    </View>
  );
}

function AbilityRename({ gid, id, base }: { gid: string; id: string; base: string }) {
  const { h, update } = useBuilder();
  return (
    <CommitField
      label={base}
      value={h.abil[gid + '|' + id]?.name || ''}
      placeholder={base}
      onCommit={(v) => update((x) => { const k = gid + '|' + id; (x.abil[k] = x.abil[k] || {}).name = v; })}
    />
  );
}
