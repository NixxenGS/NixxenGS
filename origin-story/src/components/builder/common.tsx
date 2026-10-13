import { useEffect, useState, type ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import {
  canPick, catOf, describeTrait, itemEligible, parseTpl, propagateRename, reachable, rollDie, setFill, toggleSel, tokenOptions,
  traitKey, type AbilityGroup, type AbilityItem, type Kind, type OptionGroup, type Slot, type SlotRun, type StepKey, type Trait,
} from '../../engine/hero';
import { thud } from '../../lib/haptics';
import { comicShadow, fonts, radius, space, useColors, useStyles, type Colors } from '../../theme';
import { ActionIcons, TypeBadge } from '../abilityBits';
import {
  Body, Btn, Callout, Chip, CommitField, DieBadge, Field, Icon, Label, PickerSheet, PressScale, Section, SelectButton, Sheet, Title, type PickGroup,
} from '../ui';
import { useBuilder } from './context';

// ---------- step header + issues ----------
export function StepHead({ n, title, lede }: { n: string; title: string; lede: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6, marginBottom: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ backgroundColor: c.red, borderWidth: 2, borderColor: c.line, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: '-3deg' }] }}>
          <Text style={{ fontFamily: fonts.display, color: '#fff', fontSize: 15, letterSpacing: 1 }}>STEP {n}</Text>
        </View>
        <Title size={32}>{title}</Title>
      </View>
      <Body muted>{lede}</Body>
    </View>
  );
}

export function IssuesBox({ step }: { step: StepKey }) {
  const { D } = useBuilder();
  const c = useColors();
  const is = D.issues[step];
  return (
    <View style={{ marginTop: space.lg, borderWidth: 2, borderColor: c.line, borderRadius: radius.md, padding: space.md, backgroundColor: is.length ? c.zone.yellow.bg : c.zone.green.bg, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={is.length ? 'clipboard-list-outline' : 'check-decagram'} size={20} color={is.length ? c.ink : c.zone.green.fg} />
        <Title size={19}>{is.length ? 'Still to do' : 'Step complete!'}</Title>
      </View>
      {is.map((x) => <Body key={x}>• {x}</Body>)}
    </View>
  );
}

// ---------- guided dice roll ----------
export function RollBox({ rollKey, dice, label }: { rollKey: string; dice: number[]; label?: string }) {
  const { h, update } = useBuilder();
  const c = useColors();
  const s = useStyles(makeStyles);
  const [pick, setPick] = useState<number | null>(null);
  const shake = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }] }));
  const r = h.rolls[rollKey] || {};
  const vals = r.vals || [];
  const has = vals.length === dice.length && vals.every(Boolean);
  const reach = has ? [...reachable(vals)].sort((a, b) => a - b) : [];
  if (!dice.length) return null;

  const roll = () => {
    thud();
    shake.value = withSequence(withTiming(-14, { duration: 70 }), withTiming(12, { duration: 90 }), withTiming(-6, { duration: 80 }), withTiming(0, { duration: 80 }));
    update((x) => {
      const rr = (x.rolls[rollKey] = x.rolls[rollKey] || {});
      if (rr.vals && rr.vals.length === dice.length && rr.vals.every(Boolean)) rr.rerolled = true;
      rr.vals = dice.map(rollDie);
      rr.dice = dice;
    });
  };
  const canReroll = !r.rerolled || h.bend;

  return (
    <View style={s.rollBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flexWrap: 'wrap' }}>
        <Animated.View style={[{ flexDirection: 'row', gap: 6 }, anim]}>
          {dice.map((d, i) => (
            <PressScale key={i} onPress={() => setPick(i)} accessibilityLabel={`d${d} result, tap to enter`}>
              <DieBadge size={d} value={vals[i] ?? '?'} px={46} fill={c.yellow} label={`d${d}`} />
            </PressScale>
          ))}
        </Animated.View>
        <View style={{ flex: 1, minWidth: 150, gap: 6 }}>
          {!has ? (
            <Btn kind="primary" icon="dice-multiple" label={`Roll ${label ?? ''}`} onPress={roll} />
          ) : (
            <Btn icon="restore" label={r.rerolled ? 'Re-rolled' : 'Re-roll (once)'} onPress={roll} disabled={!canReroll} small />
          )}
          <Chip
            small
            icon={r.ignore ? 'checkbox-marked' : 'checkbox-blank-outline'}
            label="Pick any (ignore roll)"
            active={!!r.ignore}
            onPress={() => update((x) => { const rr = (x.rolls[rollKey] = x.rolls[rollKey] || {}); rr.ignore = !rr.ignore; })}
          />
        </View>
      </View>
      <Body muted style={{ fontSize: 13 }}>
        {has ? 'Use one die or add any two: ' : 'Roll here, or tap a die to enter your physical roll.'}
        {has ? <Text style={{ fontWeight: '900', color: c.ink }}>{reach.join(', ')}</Text> : null}
      </Body>
      <PickerSheet
        visible={pick !== null}
        onClose={() => setPick(null)}
        title={pick !== null ? `d${dice[pick]} result` : ''}
        searchable={false}
        value={pick !== null && vals[pick] ? String(vals[pick]) : undefined}
        groups={pick !== null ? [{ label: '', items: Array.from({ length: dice[pick] }, (_, k) => ({ value: String(k + 1), label: String(k + 1) })) }] : []}
        onPick={(v) => {
          const i = pick!;
          update((x) => {
            const rr = (x.rolls[rollKey] = x.rolls[rollKey] || {});
            rr.vals = rr.vals || [];
            for (let k = 0; k < dice.length; k++) if (rr.vals[k] === undefined) rr.vals[k] = null;
            rr.vals[i] = Number(v);
          });
        }}
      />
    </View>
  );
}

// ---------- table of numbered options (backgrounds, power sources...) ----------
export function OptionGrid<T extends { n: number; name: string }>({
  rollKey, list, selected, meta, onPick, filter, extraReach,
}: {
  rollKey: string; list: T[]; selected: number | null; meta: (e: T) => ReactNode; onPick: (n: number) => void;
  filter?: (e: T) => boolean; extraReach?: Set<number> | null;
}) {
  const { h } = useBuilder();
  const c = useColors();
  const s = useStyles(makeStyles);
  const [open, setOpen] = useState(selected == null);
  useEffect(() => {
    if (selected == null) setOpen(true);
  }, [selected]);
  const guided = h.method === 'guided';
  const r = h.rolls[rollKey] || {};
  const rolledReach = reachable(r.vals || []);
  const items = list.filter((e) => !filter || filter(e));
  const shown = open ? items : items.filter((e) => e.n === selected);
  return (
    <View style={{ gap: 6 }}>
      {shown.map((e) => {
        const ok = canPick(h, rollKey, e.n, extraReach);
        const inReach = guided && (rolledReach.has(e.n) || !!extraReach?.has(e.n));
        const sel = e.n === selected;
        return (
          <PressScale
            key={e.n}
            disabled={!ok && !sel}
            onPress={() => {
              onPick(e.n);
              setOpen(false);
            }}
            style={[s.opt, sel && { backgroundColor: c.yellow, ...comicShadow(c, 3) }, !sel && inReach && { borderColor: c.blue, backgroundColor: c.hi }]}
          >
            <View style={[s.optN, sel && { backgroundColor: c.onAccent }]}>
              <Text style={[s.optNText, sel && { color: c.yellow }]}>{e.n}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.optName, sel && { color: c.onAccent }]}>{e.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{meta(e)}</View>
            </View>
            {sel ? <Icon name="check-circle" size={22} color={c.onAccent} /> : null}
          </PressScale>
        );
      })}
      {selected != null && (
        <Btn small kind="ghost" icon={open ? 'chevron-up' : 'swap-horizontal'} label={open ? 'Show only my pick' : `Change (${items.length} options)`} onPress={() => setOpen(!open)} />
      )}
    </View>
  );
}

export function PrincipleChip({ cat }: { cat: string }) {
  const c = useColors();
  return (
    <View style={{ borderWidth: 1.5, borderColor: c.line, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1, backgroundColor: c.panel2 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: c.ink }}>{cat}</Text>
    </View>
  );
}

// ---------- assigning dice to powers & qualities ----------
const ownedSub = (owned: Map<string, Trait> | null | undefined, kind: Kind, item: string) => {
  const o = owned?.get(traitKey(kind, item));
  return o ? `You have it at d${o.die}` : describeTrait(kind, item);
};
export function groupsToPick(groups: OptionGroup[], owned?: Map<string, Trait> | null): PickGroup[] {
  const seen = new Set<string>();
  return groups
    .map((g) => ({
      label: g.label,
      items: g.items
        .filter((it) => {
          const v = g.kind + '|' + it;
          if (seen.has(v)) return false;
          seen.add(v);
          return true;
        })
        .map((it) => ({ value: g.kind + '|' + it, label: it, sub: ownedSub(owned, g.kind, it) })),
    }))
    .filter((g) => g.items.length);
}

function RenameInput({ slot, onRename }: { slot: NonNullable<Slot>; onRename: (label: string, old: string) => void }) {
  const s = useStyles(makeStyles);
  const c = useColors();
  const [text, setText] = useState(slot.label || '');
  useEffect(() => setText(slot.label || ''), [slot.label, slot.base]);
  const commit = () => {
    if (text === (slot.label || '')) return;
    onRename(text, (slot.label || '').trim() || slot.base);
  };
  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onEndEditing={commit}
      onBlur={commit}
      placeholder="Rename (optional)"
      placeholderTextColor={c.faint}
      style={s.rename}
    />
  );
}

function SlotRow({
  die, slot, groups, owned, onSet, msg, extra,
}: {
  die: number; slot: Slot | undefined; groups: OptionGroup[]; owned?: Map<string, Trait> | null;
  onSet: (fn: (s: Slot) => Slot) => void; msg?: string; extra?: boolean;
}) {
  const c = useColors();
  const s = useStyles(makeStyles);
  const { update } = useBuilder();
  const [open, setOpen] = useState(false);
  const cur = slot && slot.base ? slot : null;
  const curV = cur ? cur.kind + '|' + cur.base : undefined;
  const pick = groupsToPick(groups, owned);
  const onList = !cur || pick.some((g) => g.items.some((i) => i.value === curV));
  return (
    <View style={[s.slot, extra && { borderStyle: 'dashed' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <DieBadge size={die} px={38} />
        <SelectButton
          value={cur ? (cur.label ? `${cur.label} (${cur.base})` : cur.base) + (onList ? '' : ' ⚠ not on list') : undefined}
          placeholder="Assign this die…"
          onPress={() => setOpen(true)}
          warn={!onList}
        />
      </View>
      {cur && (
        <RenameInput
          slot={cur}
          onRename={(label, old) => {
            onSet((x) => (x ? { ...x, label } : x));
            update((h) => propagateRename(h, cur.kind, old, label.trim() || cur.base));
          }}
        />
      )}
      {msg ? <Body muted style={{ fontSize: 13 }}>{msg}</Body> : null}
      <PickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={`Assign d${die}`}
        groups={pick}
        value={curV}
        onClear={() => onSet(() => null)}
        onPick={(v) => {
          const [kind, base] = v.split('|') as [Kind, string];
          onSet((prev) => ({ kind, base, label: prev && prev.base === base ? prev.label : '' }));
        }}
      />
    </View>
  );
}

export function SlotEditor({
  run, slots, setSlots, groups, baseLen, owned,
}: {
  run?: SlotRun; slots: Slot[]; setSlots: (fn: (slots: Slot[]) => void) => void; groups: OptionGroup[]; baseLen: number; owned?: Map<string, Trait> | null;
}) {
  if (!run) return null;
  return (
    <View style={{ gap: space.sm }}>
      {run.pool.map((die, i) => {
        const sl = slots[i];
        const r = run.res[i] || {};
        const custom = sl && sl.base && (catOf(sl.kind, sl.base) === 'Hallmark' || sl.base === 'Power Suit');
        let msg: string | undefined;
        if (r.existed && sl) msg = `Already had ${sl.label || sl.base} → it's now d${r.newDie}. The smaller die (d${r.extra}) comes back as an extra die below.`;
        else if (i >= baseLen) msg = 'Returned die — assign it within this step.';
        else if (custom && !sl?.label) msg = 'Customize: give it a name (a weapon or vehicle name, say).';
        return (
          <SlotRow
            key={i}
            die={die}
            slot={sl}
            groups={groups}
            owned={owned}
            extra={i >= baseLen}
            msg={msg}
            onSet={(fn) =>
              setSlots((arr) => {
                for (let k = arr.length; k < i; k++) arr[k] = null;
                arr[i] = fn(arr[i] ?? null);
              })
            }
          />
        );
      })}
    </View>
  );
}

export function SingleSlot({
  die, slot, setSlot, groups, owned, title,
}: {
  die: number; slot: Slot | undefined; setSlot: (fn: (s: Slot) => Slot) => void; groups: OptionGroup[]; owned?: Map<string, Trait> | null; title: string;
}) {
  return <SlotRow die={die} slot={slot} groups={groups} owned={owned} onSet={setSlot} msg={title} extra />;
}

export function TraitSelect({ list, value, onChange, placeholder }: { list: Trait[]; value: string; onChange: (key: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const cur = list.find((t) => t.key === value);
  return (
    <>
      <SelectButton value={cur ? `${cur.label} (d${cur.die})` : undefined} placeholder={placeholder} onPress={() => setOpen(true)} left={cur ? <DieBadge size={cur.die} px={26} /> : undefined} />
      <PickerSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={placeholder.replace(/^— | —$/g, '')}
        value={value}
        onClear={() => onChange('')}
        onPick={onChange}
        groups={[{ label: '', items: list.map((t) => ({ value: t.key, label: t.label, sub: t.cat, badge: <DieBadge size={t.die} px={26} /> })) }]}
      />
    </>
  );
}

// ---------- ability cards ----------
function FillSheet({
  tok, opts, others, free, value, onPick, onClose,
}: {
  tok: string; opts: string[]; others: string[]; free?: boolean; value: string; onPick: (v: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState(value);
  if (!free) {
    return (
      <PickerSheet
        visible
        onClose={onClose}
        title={`Choose ${tok}`}
        value={value}
        onClear={() => onPick('')}
        onPick={onPick}
        groups={[
          { label: opts.length ? 'Yours' : 'Nothing that fits yet', items: opts.map((x) => ({ value: x, label: x })) },
          ...(others.length ? [{ label: 'Other', items: others.map((x) => ({ value: x, label: x })) }] : []),
        ]}
      />
    );
  }
  return (
    <Sheet visible onClose={onClose} title={`Fill in ${tok}`}>
      <View style={{ gap: space.md }}>
        <Field value={text} onChangeText={setText} placeholder={tok} autoFocus onSubmitEditing={() => { onPick(text.trim()); onClose(); }} />
        {opts.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[...new Set([...opts, ...others])].map((x) => (
              <Chip key={x} small label={x} active={x === text} onPress={() => setText(x)} />
            ))}
          </View>
        )}
        <Btn kind="primary" label="Done" onPress={() => { onPick(text.trim()); onClose(); }} />
      </View>
    </Sheet>
  );
}

/** Ability text with each [token] shown as a tappable fill-in when the ability is chosen. */
export function TemplateText({ g, it, interactive }: { g: AbilityGroup; it: AbilityItem; interactive: boolean }) {
  const { h, D, update } = useBuilder();
  const c = useColors();
  const s = useStyles(makeStyles);
  const [editing, setEditing] = useState<number | null>(null);
  const fills = h.abil[g.id + '|' + it.id]?.fills || [];
  let i = -1;
  const parts = parseTpl(it.text);
  const tokens: string[] = [];
  const nodes = parts.map((p, k) => {
    if (typeof p === 'string') return <Text key={k}>{p}</Text>;
    i++;
    const idx = i;
    tokens[idx] = p.tok;
    const v = fills[idx];
    if (!interactive) return <Text key={k} style={s.tokStatic}>[{p.tok}]</Text>;
    return (
      <Text key={k} onPress={() => setEditing(idx)} style={[s.tok, v ? s.tokFilled : s.tokEmpty]} accessibilityRole="button">
        {v || `[${p.tok}]`} ▾
      </Text>
    );
  });
  let sheet: ReactNode = null;
  if (editing !== null) {
    const o = tokenOptions(tokens[editing], D, it);
    const others = (o.all || []).filter((x) => !o.opts.includes(x));
    sheet = (
      <FillSheet
        tok={tokens[editing]}
        opts={o.opts}
        others={others}
        free={o.free}
        value={fills[editing] || ''}
        onClose={() => setEditing(null)}
        onPick={(v) => update((x) => setFill(x, g.id, it.id, editing, v))}
      />
    );
  }
  return (
    <>
      <Text style={[s.abText, { color: c.ink }]}>{nodes}</Text>
      {sheet}
    </>
  );
}

function AbilityNameInput({ gid, id, placeholder }: { gid: string; id: string; placeholder: string }) {
  const { h, update } = useBuilder();
  const c = useColors();
  const s = useStyles(makeStyles);
  const saved = h.abil[gid + '|' + id]?.name || '';
  const [text, setText] = useState(saved);
  useEffect(() => setText(saved), [saved]);
  const commit = () => {
    if (text !== saved) update((x) => { const k = gid + '|' + id; (x.abil[k] = x.abil[k] || {}).name = text; });
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name="pencil-outline" size={16} color={c.muted} />
      <TextInput value={text} onChangeText={setText} onBlur={commit} onEndEditing={commit} placeholder={`Name it (${placeholder})`} placeholderTextColor={c.faint} style={[s.rename, { flex: 1 }]} />
    </View>
  );
}

export function AbilityCard({ g, it, zoneOverride }: { g: AbilityGroup; it: AbilityItem; zoneOverride?: 'green' | 'yellow' | 'red' }) {
  const { h, D, update } = useBuilder();
  const c = useColors();
  const s = useStyles(makeStyles);
  const sel = h.sel[g.id] || [];
  const on = !!g.fixed || sel.includes(it.id);
  const el = itemEligible(h, D, g, it);
  const full = !g.fixed && g.count > 1 && sel.length >= g.count && !on;
  const disabled = !!g.fixed || (!on && (!el.ok || (full && !h.bend)));
  const zone = zoneOverride || it.zone || g.zone;
  const zc = c.zone[zone];
  return (
    <View style={[s.ab, { borderLeftColor: zc.fg }, on && { backgroundColor: zc.bg, ...comicShadow(c, 3) }, !on && (!el.ok || full) && { opacity: 0.55 }]}>
      <PressScale disabled={disabled} onPress={() => update((x) => toggleSel(x, g, it.id))} style={s.abHead} accessibilityLabel={`${on ? 'Remove' : 'Choose'} ${it.mode || it.name}`}>
        <Icon name={g.fixed ? 'lock-check' : on ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={on ? zc.fg : c.muted} />
        <View style={{ flex: 1 }}>
          <Text style={s.abName}>{it.mode || it.name}</Text>
          {it.mode ? <Text style={s.abSub}>{it.name} ability</Text> : null}
          {it.cat && g.id === 'red' ? <Text style={s.abSub}>{it.cat}</Text> : null}
          {!el.ok ? <Text style={[s.abSub, { color: c.red }]}>{el.why}</Text> : null}
        </View>
        <ActionIcons text={it.text} />
        <TypeBadge type={it.type} />
      </PressScale>
      {it.rule ? <Body muted style={{ fontSize: 13 }}>{it.rule}</Body> : null}
      <TemplateText g={g} it={it} interactive={on} />
      {on && g.kind !== 'principle' && g.zone !== 'out' ? <AbilityNameInput gid={g.id} id={it.id} placeholder={it.name} /> : null}
    </View>
  );
}

export function GroupView({ g, title }: { g?: AbilityGroup; title?: string }) {
  const { h } = useBuilder();
  if (!g) return null;
  const n = (h.sel[g.id] || []).length;
  const countTxt = g.fixed ? 'granted' : `choose ${g.count}${g.count > 1 ? ` · ${n}/${g.count}` : ''}`;
  return (
    <View>
      <Section title={title || g.title} note={`${g.note ? g.note + ' ' : ''}(${countTxt})`} />
      <View style={{ gap: space.sm }}>
        {g.items.map((it) => <AbilityCard key={it.id} g={g} it={it} />)}
      </View>
    </View>
  );
}

export function PrincipleView({ g }: { g?: AbilityGroup }) {
  const { h, update } = useBuilder();
  const c = useColors();
  const s = useStyles(makeStyles);
  const [showAll, setShowAll] = useState(false);
  if (!g) return null;
  const sel = (h.sel[g.id] || [])[0];
  const swapped = h.retcon.id === 'swapPrinciple' && h.retcon.slot === g.id.slice(3) && h.retcon.principle;
  const items = g.items.filter((it) => !sel || showAll || it.id === sel);
  return (
    <View>
      <Section title={g.title} note="Roleplaying notes, twist questions, and a Green ability. (choose 1)" />
      {swapped ? <Callout>Your retcon replaces this principle with {h.retcon.principle}.</Callout> : null}
      <View style={{ gap: space.sm }}>
        {items.map((it) => {
          const p = it.principle!;
          const on = sel === it.id;
          const needsSpec = on && /\[/.test(p[2]) && !/\[/.test(p[5]);
          return (
            <View key={it.id} style={[s.ab, { borderLeftColor: c.zone.green.fg }, on && { backgroundColor: c.zone.green.bg, ...comicShadow(c, 3) }]}>
              <PressScale
                onPress={() => {
                  update((x) => toggleSel(x, g, it.id));
                  setShowAll(false);
                }}
                style={s.abHead}
              >
                <Icon name={on ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={on ? c.zone.green.fg : c.muted} />
                <Text style={[s.abName, { flex: 1 }]}>{p[0]}</Text>
                <ActionIcons text={p[5]} />
                <TypeBadge type={it.type} />
              </PressScale>
              <Text style={[s.abText, { fontStyle: 'italic', color: c.muted }]}>{p[2]}</Text>
              {on ? (
                <View style={{ gap: 2 }}>
                  <Body style={{ fontSize: 14 }}><Text style={{ fontWeight: '800' }}>Minor twist: </Text>{p[3]}</Body>
                  <Body style={{ fontSize: 14 }}><Text style={{ fontWeight: '800' }}>Major twist: </Text>{p[4]}</Body>
                </View>
              ) : null}
              <TemplateText g={g} it={it} interactive={on} />
              {needsSpec ? <SpecifyInput gid={g.id} id={it.id} placeholder={(p[2].match(/\[([^\]]+)\]/) || [])[1] || ''} /> : null}
            </View>
          );
        })}
      </View>
      {sel ? <Btn small kind="ghost" icon={showAll ? 'chevron-up' : 'chevron-down'} label={showAll ? 'Show only my pick' : `Show all ${g.items.length} principles`} onPress={() => setShowAll(!showAll)} style={{ marginTop: 4 }} /> : null}
    </View>
  );
}

function SpecifyInput({ gid, id, placeholder }: { gid: string; id: string; placeholder: string }) {
  const { h, update } = useBuilder();
  const saved = h.abil[gid + '|' + id]?.fills?.[0] || '';
  return <CommitField label="Specify" value={saved} onCommit={(v) => update((x) => setFill(x, gid, id, 0, v))} placeholder={placeholder} />;
}

export function NextHint({ children }: { children: ReactNode }) {
  return (
    <Callout icon="arrow-right-bold-circle-outline">
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>{children}</View>
    </Callout>
  );
}

export function Detail({ n, name, blurb, children }: { n?: number; name: string; blurb?: string; children: ReactNode }) {
  const c = useColors();
  const s = useStyles(makeStyles);
  return (
    <View style={s.detail}>
      <View style={s.detailHead}>
        {n != null && <Text style={s.detailNo}>{n}</Text>}
        <View style={{ flex: 1 }}>
          <Title size={26} color="#fff">{name}</Title>
          {blurb ? <Text style={{ color: '#fff', opacity: 0.9, fontSize: 14 }}>{blurb}</Text> : null}
        </View>
      </View>
      <View style={{ padding: space.md, backgroundColor: c.bg }}>{children}</View>
    </View>
  );
}

export { Label };

const makeStyles = (c: Colors) => ({
  rollBox: { borderWidth: 2, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: space.sm, backgroundColor: c.panel, marginBottom: space.md, ...comicShadow(c, 3) },
  opt: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.md, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 10, backgroundColor: c.panel, minHeight: 56 },
  optN: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.ink, alignItems: 'center' as const, justifyContent: 'center' as const },
  optNText: { fontFamily: fonts.display, color: c.bg, fontSize: 17 },
  optName: { fontWeight: '800' as const, fontSize: 16, color: c.ink },
  slot: { borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: space.sm, gap: 6, backgroundColor: c.panel },
  rename: { borderBottomWidth: 1.5, borderColor: c.faint, color: c.ink, paddingVertical: 6, fontSize: 15 },
  ab: { borderWidth: 2, borderLeftWidth: 6, borderColor: c.line, borderRadius: radius.sm, padding: space.md, gap: 6, backgroundColor: c.panel },
  abHead: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.sm },
  abName: { fontWeight: '900' as const, fontSize: 16, color: c.ink },
  abSub: { fontSize: 12, color: c.muted, fontWeight: '600' as const },
  abText: { fontSize: 15, lineHeight: 22 },
  tok: { fontWeight: '800' as const, borderRadius: 4 },
  tokFilled: { color: c.blue, textDecorationLine: 'underline' as const },
  tokEmpty: { color: c.red, backgroundColor: c.hi },
  tokStatic: { color: c.muted, fontStyle: 'italic' as const },
  detail: { borderWidth: 2, borderColor: c.line, borderRadius: radius.md, overflow: 'hidden' as const, marginTop: space.md, ...comicShadow(c, 4) },
  detailHead: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.md, backgroundColor: c.blue, padding: space.md, borderBottomWidth: 2, borderColor: c.line },
  detailNo: { fontFamily: fonts.display, fontSize: 34, color: c.yellow },
});
