import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { ActionIcons, TypeBadge } from '../../components/abilityBits';
import { RollPanel, type PoolTrait } from '../../components/play/RollPanel';
import { Body, Btn, Card, Chip, CommitField, DieBadge, Empty, Field, Icon, Label, PressScale, Segmented, Sheet, Stepper, Title } from '../../components/ui';
import {
  archName, effectiveZone, healthZone, uid, zoneAllows, ZONES, type AbilityRec, type Derived, type Hero, type Mod, type Zone,
} from '../../engine/hero';
import { notify, tap } from '../../lib/haptics';
import { sceneZoneOf, useHero, useStore } from '../../store/store';
import { comicShadow, radius, space, useColors, type ZoneKey } from '../../theme';

const ZONE_LABEL: Record<ZoneKey, string> = { green: 'Green', yellow: 'Yellow', red: 'Red', out: 'Out' };

export default function PlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hero: h, D, update } = useHero(id);
  const { state, addRoll } = useStore();
  const c = useColors();
  const [power, setPower] = useState<string | null>(null);
  const [quality, setQuality] = useState<string | null>(null);
  const [ability, setAbility] = useState<AbilityRec | null>(null);
  const [tab, setTab] = useState<ZoneKey | 'principles' | null>(null);

  const max = D?.health.max ?? null;
  useEffect(() => {
    if (h && max && h.play.health == null) update((x) => { x.play.health = max; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h?.id, max]);

  // In the GM's scene on this device? Then the scene tracker sets the scene zone.
  const inScene = !!h && state.scene.actors.some((a) => a.heroId === h.id);
  const sceneZone: Zone = inScene ? sceneZoneOf(state.scene) : h?.play.sceneZone ?? 'green';
  const hp = h?.play.health ?? max ?? 0;
  const personal = D ? healthZone(D, hp) : null;
  const zone = effectiveZone(personal, sceneZone);
  const out = personal === 'out';

  // Form-Changer / Modular: a chosen form's power list replaces the default one.
  const formOptions = useMemo(() => (h && D ? formsOf(h, D) : []), [h, D]);
  const form = formOptions.find((f) => f.name === h?.play.form);

  if (!h || !D) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <Stack.Screen options={{ title: 'Play' }} />
        <Empty icon="account-question" title="Hero not found" />
      </View>
    );
  }

  const powers: PoolTrait[] = form?.rows?.length
    ? form.rows.filter((r) => r.label).map((r, i) => ({ key: 'form:' + i, label: r.label, die: +r.die }))
    : D.powers.map((t) => ({ key: t.key, label: t.label, die: t.die }));
  const qualities: PoolTrait[] = D.qualities.map((t) => ({ key: t.key, label: t.label, die: t.die }));
  const statusDie = D.status ? D.status[ZONES.indexOf(zone)] : null;
  const shownTab: ZoneKey | 'principles' = tab ?? (out ? 'out' : zone);

  const useAbility = (a: AbilityRec) => {
    setAbility(a);
    // Preselect the power and quality the ability names, when it names one.
    const pw = powers.find((t) => a.text.includes(t.label));
    const ql = qualities.find((t) => a.text.includes(t.label));
    if (pw) setPower(pw.key);
    if (ql) setQuality(ql.key);
    tap();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: h.info.name || 'Unnamed hero',
          headerRight: () => (
            <PressScale onPress={() => router.push(`/build/${h.id}?step=sheet`)} accessibilityLabel="Hero sheet" hitSlop={10} style={{ paddingHorizontal: 8 }}>
              <Icon name="card-account-details-outline" size={24} color="#fff" />
            </PressScale>
          ),
        }}
      />
      <ZoneBanner zone={out ? 'out' : zone} statusDie={statusDie} sub={[D.ps?.name, archName(D)].filter(Boolean).join(' · ')} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
          {!max && (
            <Card zone="yellow">
              <Body>This hero isn't finished yet. Health and status dice come from the builder.</Body>
              <Btn icon="hammer-wrench" label="Finish in the builder" onPress={() => router.push(`/build/${h.id}`)} />
            </Card>
          )}

          {max && D.health.ranges ? (
            <HealthCard
              hp={hp}
              max={max}
              ranges={D.health.ranges}
              personal={personal}
              onChange={(n) => update((x) => { x.play.health = n; })}
            />
          ) : null}

          <Card title="Scene">
            {inScene ? (
              <Body>
                The GM's scene tracker on this device is in the <Text style={{ fontWeight: '900', color: c.zone[sceneZone].fg }}>{ZONE_LABEL[sceneZone]}</Text> zone.
              </Body>
            ) : (
              <Segmented<Zone>
                value={sceneZone}
                onChange={(z) => update((x) => { x.play.sceneZone = z; })}
                options={ZONES.map((z) => ({ value: z, label: ZONE_LABEL[z] }))}
                colors={{ green: c.green, yellow: '#c99a00', red: c.red }}
              />
            )}
            <Body muted style={{ fontSize: 13 }}>Your status die is whichever is closer to Out: your Health zone or the scene's zone.</Body>
          </Card>

          {formOptions.length > 0 && (
            <Card title={D.archTop?.modular ? 'Mode' : 'Form'}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label="Default" active={!h.play.form} onPress={() => update((x) => { x.play.form = ''; })} />
                {formOptions.map((f) => (
                  <Chip key={f.name} label={f.name} active={h.play.form === f.name} color={c.zone[f.zone].fg} onPress={() => update((x) => { x.play.form = f.name; })} />
                ))}
              </View>
              {form?.note ? <Body muted style={{ fontSize: 13 }}>{form.note}</Body> : null}
              {form && !form.rows?.length ? <Body muted style={{ fontSize: 13 }}>No powers recorded for this {D.archTop?.modular ? 'mode' : 'form'}, so your default powers are shown.</Body> : null}
            </Card>
          )}

          <RollPanel
            powers={powers}
            qualities={qualities}
            zone={zone}
            statusDie={statusDie}
            ability={ability}
            onClearAbility={() => setAbility(null)}
            mods={h.play.mods}
            power={power}
            quality={quality}
            setPower={setPower}
            setQuality={setQuality}
            onRolled={(dice, note) => addRoll({ who: h.info.name || 'Hero', dice, note })}
            onSpendMods={(ids) => update((x) => { x.play.mods = x.play.mods.filter((m) => m.persistent || !ids.includes(m.id)); })}
          />

          <ModsCard mods={h.play.mods} onChange={(fn) => update((x) => fn(x.play.mods))} />

          <Card title="Abilities">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['green', 'yellow', 'red', 'out'] as ZoneKey[]).map((z) => (
                <Chip
                  key={z}
                  small
                  label={ZONE_LABEL[z]}
                  active={shownTab === z}
                  color={c.zone[z].fg}
                  icon={z !== 'out' && !zoneAllows(zone, z as Zone) ? 'lock' : undefined}
                  onPress={() => setTab(z)}
                />
              ))}
              <Chip small label="Principles" active={shownTab === 'principles'} color={c.blue} onPress={() => setTab('principles')} />
            </View>
            <AbilityList
              list={
                shownTab === 'principles' ? [] : shownTab === 'out' ? (D.abilities.out ? [D.abilities.out] : []) : shownTab === 'green' ? [...D.abilities.green, ...D.abilities.principles] : D.abilities[shownTab]
              }
              zone={shownTab === 'principles' ? 'green' : shownTab}
              locked={shownTab === 'out' ? !out : shownTab !== 'principles' && !zoneAllows(zone, shownTab as Zone)}
              used={h.play.used}
              onToggleUsed={(k) => update((x) => { x.play.used[k] = !x.play.used[k]; })}
              onUse={useAbility}
              current={ability}
              currentZone={out ? 'out' : zone}
            />
            {shownTab === 'principles' && <PrinciplesList h={h} D={D} onUse={useAbility} />}
            {Object.values(h.play.used).some(Boolean) && (
              <Btn small kind="ghost" icon="broom" label="Clear “used” marks (new scene)" onPress={() => update((x) => { x.play.used = {}; })} />
            )}
          </Card>

          <Card title="Hero points" right={<Stepper value={h.play.heroPoints} min={0} onChange={(n) => update((x) => { x.play.heroPoints = n; })} />}>
            <Body muted style={{ fontSize: 13 }}>Your principles' Green abilities give you and each ally a hero point.</Body>
          </Card>

          <Card title="Session notes">
            <CommitField multiline value={h.play.notes} placeholder="Twists, clues, who owes you a favor…" onCommit={(v) => update((x) => { x.play.notes = v; })} />
          </Card>

          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            <Btn icon="card-account-details-outline" label="Full hero sheet" onPress={() => router.push(`/build/${h.id}?step=sheet`)} style={{ flex: 1 }} />
            <Btn
              icon="restart"
              label="Reset for new session"
              style={{ flex: 1 }}
              onPress={() => update((x) => { x.play.health = max; x.play.mods = []; x.play.used = {}; x.play.form = ''; })}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function formsOf(h: Hero, D: Derived): { name: string; zone: Zone; rows?: { label: string; die: number }[]; note?: string }[] {
  const out: { name: string; zone: Zone; rows?: { label: string; die: number }[]; note?: string }[] = [];
  if (D.arch?.forms) {
    for (const [k, z, fallback] of [['g1', 'green', 'Green form 1'], ['g2', 'green', 'Green form 2'], ['y', 'yellow', 'Yellow form']] as const) {
      const f = h.forms[k];
      out.push({ name: f?.name || fallback, zone: z, rows: f?.rows });
    }
  }
  if (D.archTop?.modular) {
    if (h.arch.powerless) out.push({ name: 'Powerless Mode', zone: 'green', rows: h.modes['Powerless Mode']?.rows, note: 'Only principle abilities usable.' });
    for (const [gid, z] of [['mod-green', 'green'], ['mod-yellow', 'yellow'], ['mod-red', 'red']] as const) {
      const g = D.groups.find((x) => x.id === gid);
      for (const m of h.sel[gid] || []) out.push({ name: m, zone: z, rows: h.modes[m]?.rows, note: g?.items.find((i) => i.id === m)?.rule });
    }
  }
  return out;
}

function ZoneBanner({ zone, statusDie, sub }: { zone: ZoneKey; statusDie: number | null; sub: string }) {
  const c = useColors();
  const pulse = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    pulse.value = withSequence(withTiming(1.12, { duration: 140 }), withTiming(1, { duration: 220 }));
    notify(zone === 'out' ? 'error' : zone === 'green' ? 'success' : 'warning');
  }, [zone, pulse]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const z = c.zone[zone];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: z.bg, borderBottomWidth: 2, borderColor: c.line }}>
      <Animated.View style={[{ backgroundColor: z.fg, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 2, ...comicShadow(c, 2) }, anim]}>
        <Title size={22} color="#fff">{ZONE_LABEL[zone].toUpperCase()}</Title>
      </Animated.View>
      <Body muted style={{ flex: 1, fontSize: 13 }} numberOfLines={1}>{sub}</Body>
      {statusDie ? <DieBadge size={statusDie} px={34} fill={c.zone[zone].die} /> : null}
    </View>
  );
}

function HealthCard({
  hp, max, ranges, personal, onChange,
}: {
  hp: number; max: number; ranges: Record<Zone, [number, number]>; personal: ZoneKey | null; onChange: (n: number) => void;
}) {
  const c = useColors();
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState('');
  const seg = (z: Zone) => ranges[z][0] - ranges[z][1] + 1;
  const pct = Math.max(0, Math.min(1, hp / max));
  const apply = (sign: 1 | -1) => {
    const n = parseInt(amount, 10);
    if (n > 0) onChange(Math.max(0, Math.min(max, hp + sign * n)));
    setAmount('');
    setCustom(false);
  };
  return (
    <Card title="Health" right={personal ? <Chip small label={`${ZONE_LABEL[personal]} zone`} active color={c.zone[personal].fg} /> : null}>
      <View style={{ alignItems: 'center', gap: space.sm }}>
        <Stepper value={hp} min={0} max={max} size="lg" onChange={onChange} />
        <Body muted style={{ fontSize: 12 }}>of {max}. Long-press −/+ for 5.</Body>
      </View>
      {/* zone bar: Red | Yellow | Green, low to high */}
      <View style={{ height: 22, flexDirection: 'row', borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, overflow: 'hidden' }}>
        {(['red', 'yellow', 'green'] as Zone[]).map((z) => (
          <View key={z} style={{ flex: seg(z), backgroundColor: c.zone[z].die, borderLeftWidth: z === 'red' ? 0 : 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#15131a' }}>{ranges[z][1]}–{ranges[z][0]}</Text>
          </View>
        ))}
        <View pointerEvents="none" style={{ position: 'absolute', left: `${pct * 100}%`, top: -2, bottom: -2, width: 5, marginLeft: -2.5, backgroundColor: c.ink, borderWidth: 1, borderColor: c.panel }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {[-1, -2, -3, -5].map((d) => <Chip key={d} small label={String(d)} onPress={() => onChange(Math.max(0, hp + d))} />)}
        {[1, 3].map((d) => <Chip key={d} small label={`+${d}`} onPress={() => onChange(Math.min(max, hp + d))} />)}
        <Chip small icon="calculator" label="Amount…" onPress={() => setCustom(true)} />
        <Chip small icon="heart-plus" label="Full" onPress={() => onChange(max)} />
      </View>
      <Sheet visible={custom} onClose={() => setCustom(false)} title="Damage or healing">
        <View style={{ gap: space.md }}>
          <Field value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Amount" autoFocus />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Btn kind="danger" icon="sword" label="Take damage" style={{ flex: 1 }} onPress={() => apply(-1)} />
            <Btn kind="primary" icon="heart-plus" label="Recover" style={{ flex: 1 }} onPress={() => apply(1)} />
          </View>
        </View>
      </Sheet>
    </Card>
  );
}

function ModsCard({ mods, onChange }: { mods: Mod[]; onChange: (fn: (m: Mod[]) => void) => void }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(1);
  const [label, setLabel] = useState('');
  const [persistent, setPersistent] = useState(false);
  const [exclusive, setExclusive] = useState(false);
  const add = () => {
    onChange((m) => { m.push({ id: uid(), label: label.trim() || (value >= 0 ? 'Bonus' : 'Penalty'), value, persistent, exclusive }); });
    setOpen(false);
    setLabel('');
    setPersistent(false);
    setExclusive(false);
  };
  return (
    <Card title="Bonuses & penalties" right={<Btn small icon="plus" label="Add" onPress={() => setOpen(true)} />}>
      {mods.length ? (
        mods.map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 8, backgroundColor: m.value >= 0 ? c.zone.green.bg : c.zone.red.bg }}>
            <Title size={24} style={{ minWidth: 40 }}>{m.value > 0 ? '+' : ''}{m.value}</Title>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: c.ink }}>{m.label}</Text>
              <Body muted style={{ fontSize: 12 }}>{[m.persistent && 'persistent', m.exclusive && 'exclusive'].filter(Boolean).join(' · ') || 'one use'}</Body>
            </View>
            <PressScale onPress={() => onChange((arr) => { const i = arr.findIndex((x) => x.id === m.id); if (i >= 0) arr.splice(i, 1); })} accessibilityLabel={`Remove ${m.label}`} hitSlop={8}>
              <Icon name="close-circle" size={24} color={c.muted} />
            </PressScale>
          </View>
        ))
      ) : (
        <Body muted>None. Boosts and Hinders aimed at you go here.</Body>
      )}
      <Sheet visible={open} onClose={() => setOpen(false)} title="Add a bonus or penalty">
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[-4, -3, -2, -1, 1, 2, 3, 4].map((v) => (
              <Chip key={v} label={`${v > 0 ? '+' : ''}${v}`} active={value === v} color={v > 0 ? c.green : c.red} onPress={() => setValue(v)} />
            ))}
          </View>
          <Field value={label} onChangeText={setLabel} placeholder="What is it? (e.g. Tactical Analysis)" />
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Chip icon={persistent ? 'checkbox-marked' : 'checkbox-blank-outline'} label="Persistent" active={persistent} onPress={() => setPersistent(!persistent)} />
            <Chip icon={exclusive ? 'checkbox-marked' : 'checkbox-blank-outline'} label="Exclusive" active={exclusive} onPress={() => setExclusive(!exclusive)} />
          </View>
          <Body muted style={{ fontSize: 13 }}>One-use bonuses and penalties are cleared when you tap “Done: use up bonuses” after a roll. Persistent ones stay.</Body>
          <Btn kind="primary" icon="check" label="Add" onPress={add} />
        </View>
      </Sheet>
    </Card>
  );
}

function AbilityList({
  list, zone, locked, used, onToggleUsed, onUse, current, currentZone,
}: {
  list: AbilityRec[]; zone: ZoneKey; locked: boolean; used: Record<string, boolean>; onToggleUsed: (k: string) => void;
  onUse: (a: AbilityRec) => void; current: AbilityRec | null; currentZone: ZoneKey;
}) {
  const c = useColors();
  if (!list.length) return null;
  return (
    <View style={{ gap: 6 }}>
      {locked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="lock" size={16} color={c.muted} />
          <Body muted style={{ fontSize: 13 }}>
            {zone === 'out' ? 'Usable once you are taken out (0 Health).' : `Unlocks when you're in the ${ZONE_LABEL[zone]} zone (you're in ${ZONE_LABEL[currentZone]}).`}
          </Body>
        </View>
      ) : null}
      {list.map((a) => {
        const k = a.gid + '|' + a.id;
        const isUsed = !!used[k];
        const sel = current && current.gid === a.gid && current.id === a.id;
        return (
          <View
            key={k}
            style={{
              borderWidth: 2, borderLeftWidth: 6, borderColor: c.line, borderLeftColor: c.zone[zone].fg, borderRadius: radius.sm, padding: 10, gap: 4,
              backgroundColor: sel ? c.hi : c.panel, opacity: locked || isUsed ? 0.55 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ flex: 1, fontWeight: '900', color: c.ink, fontSize: 15, textDecorationLine: isUsed ? 'line-through' : 'none' }}>{a.name}</Text>
              <ActionIcons text={a.raw} />
              <TypeBadge type={a.type} />
            </View>
            <Body style={{ fontSize: 14 }}>{a.text}</Body>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {a.type.includes('A') && !locked ? <Chip small icon="dice-multiple" label={sel ? 'Rolling with this' : 'Roll with this'} active={!!sel} onPress={() => onUse(a)} /> : null}
              <Chip small icon={isUsed ? 'checkbox-marked' : 'checkbox-blank-outline'} label="Used" active={isUsed} color={c.muted} onPress={() => onToggleUsed(k)} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PrinciplesList({ h, D, onUse }: { h: Hero; D: Derived; onUse: (a: AbilityRec) => void }) {
  const c = useColors();
  if (!D.principles.length) return <Body muted>No principles chosen yet.</Body>;
  return (
    <View style={{ gap: 6 }}>
      {D.principles.map(({ p, slot }) => {
        const rec = D.abilities.principles.find((a) => a.id === p[0]);
        const gid = h.retcon.id === 'swapPrinciple' && h.retcon.slot === slot && h.retcon.principle ? 'pr-retcon' : 'pr-' + slot;
        const fill = h.abil[gid + '|' + p[0]]?.fills?.[0];
        const sub = (t: string) => (fill ? t.replace(/\[[^\]]+\]/g, fill) : t);
        return (
          <View key={slot} style={{ borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 10, gap: 4, backgroundColor: c.panel }}>
            <Text style={{ fontWeight: '900', color: c.ink, fontSize: 16 }}>{sub(p[0])}</Text>
            <Body style={{ fontStyle: 'italic', fontSize: 14 }}>{sub(p[2])}</Body>
            <Label>Minor twist</Label>
            <Body style={{ fontSize: 14 }}>{p[3]}</Body>
            <Label>Major twist</Label>
            <Body style={{ fontSize: 14 }}>{p[4]}</Body>
            {rec ? (
              <>
                <Label>Green ability</Label>
                <Body style={{ fontSize: 14 }}>{rec.text}</Body>
                <View style={{ flexDirection: 'row' }}>
                  <Chip small icon="dice-multiple" label="Roll with this" onPress={() => onUse(rec)} />
                </View>
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
