import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { RolledDie } from '../../components/play/RolledDie';
import { Body, Btn, Card, Chip, CommitField, DieBadge, Field, Icon, Label, PickerSheet, PressScale, Segmented, Sheet, Stepper, Title } from '../../components/ui';
import { derive, DIE_SIZES, healthZone, rollDie, uid, upDie, ZONES, type Zone } from '../../engine/hero';
import { confirm } from '../../lib/confirm';
import { notify, thud } from '../../lib/haptics';
import { newScene, sceneOver, sceneZoneOf, trackerTotal, useStore, type Actor, type ActorKind } from '../../store/store';
import { comicShadow, radius, space, useColors } from '../../theme';

const KIND_META: Record<ActorKind, { label: string; icon: React.ComponentProps<typeof Icon>['name'] }> = {
  hero: { label: 'Hero', icon: 'shield-star' },
  villain: { label: 'Villain', icon: 'skull' },
  lieutenant: { label: 'Lieutenant', icon: 'account-tie' },
  minion: { label: 'Minions', icon: 'account-group' },
  environment: { label: 'Environment', icon: 'city-variant' },
};

export default function SceneScreen() {
  const { state, updateScene } = useStore();
  const c = useColors();
  const s = state.scene;
  const [adding, setAdding] = useState(false);
  const [heroPick, setHeroPick] = useState(false);
  const [setup, setSetup] = useState(false);
  const zone = sceneZoneOf(s);
  const total = trackerTotal(s);
  const over = sceneOver(s);
  const acted = s.actors.filter((a) => a.acted).length;

  const nextRound = () => {
    thud();
    updateScene((x) => {
      x.filled = Math.min(trackerTotal(x), x.filled + 1);
      x.round += 1;
      for (const a of x.actors) a.acted = false;
    });
    notify('warning');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <Card
          title={`Round ${s.round}`}
          right={<Btn small icon="cog" label="Tracker" onPress={() => setSetup(true)} />}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Array.from({ length: total }, (_, i) => {
              const z: Zone = i < s.tracker.green ? 'green' : i < s.tracker.green + s.tracker.yellow ? 'yellow' : 'red';
              const done = i < s.filled;
              const cur = i === s.filled;
              return (
                <PressScale
                  key={i}
                  accessibilityLabel={`Tracker box ${i + 1}, ${z}${done ? ', checked' : ''}`}
                  onPress={() => updateScene((x) => { x.filled = i < x.filled ? i : i + 1; })}
                  style={{
                    width: 40, height: 40, borderRadius: radius.sm, borderWidth: cur ? 3 : 2, borderColor: c.line, backgroundColor: c.zone[z].die,
                    alignItems: 'center', justifyContent: 'center', ...(cur ? comicShadow(c, 3) : {}),
                  }}
                >
                  {done ? <Icon name="close-thick" size={26} color="#15131a" /> : cur ? <Icon name="map-marker" size={20} color="#15131a" /> : null}
                </PressScale>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={{ backgroundColor: c.zone[zone].fg, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 2 }}>
              <Title size={20} color="#fff">{over ? 'TIME’S UP' : zone.toUpperCase()}</Title>
            </View>
            <Body muted style={{ flex: 1, fontSize: 13 }}>
              {over ? 'The tracker is full. Wrap the scene up however your table plays it.' : 'Heroes in this scene use the higher of this zone and their Health zone.'}
            </Body>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Btn kind="yellow" icon="skip-next" label="Next round" style={{ flex: 1 }} onPress={nextRound} disabled={over} />
            <Btn icon="undo" accessibilityLabel="Back one box" onPress={() => updateScene((x) => { x.filled = Math.max(0, x.filled - 1); x.round = Math.max(1, x.round - 1); })} />
          </View>
        </Card>

        <Card
          title="Turn order"
          right={<Body muted style={{ fontSize: 13 }}>{acted}/{s.actors.length} acted</Body>}
        >
          <Body muted style={{ fontSize: 13 }}>Whoever just acted hands off to someone who hasn't. Tap a name's check when they go.</Body>
          {s.actors.map((a) => <ActorRow key={a.id} a={a} />)}
          {!s.actors.length && <Body muted>Add the heroes, villains, minions, and environment in this scene.</Body>}
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            <Btn icon="shield-star" label="Add hero" onPress={() => setHeroPick(true)} style={{ flex: 1 }} />
            <Btn icon="skull" label="Add foe" onPress={() => setAdding(true)} style={{ flex: 1 }} />
          </View>
          {acted > 0 && <Btn small kind="ghost" icon="refresh" label="Clear acted marks" onPress={() => updateScene((x) => { for (const a of x.actors) a.acted = false; })} />}
        </Card>

        <Card title="Scene notes">
          <CommitField value={s.name} placeholder="Scene name (e.g. Rooftop chase)" onCommit={(v) => updateScene((x) => { x.name = v; })} />
          <CommitField multiline value={s.notes} placeholder="Environment features, twists, challenges…" onCommit={(v) => updateScene((x) => { x.notes = v; })} />
        </Card>

        <Btn
          kind="danger"
          icon="flag-checkered"
          label="End scene (new scene)"
          onPress={async () => {
            if (!(await confirm('Start a new scene?', 'Clears the tracker, villains, minions, and notes. Heroes stay in the turn order.', 'New scene'))) return;
            updateScene((x) => {
              const heroes = x.actors.filter((a) => a.kind === 'hero').map((a) => ({ ...a, acted: false }));
              Object.assign(x, newScene(), { tracker: x.tracker, actors: heroes });
            });
          }}
        />
      </ScrollView>

      <TrackerSetup visible={setup} onClose={() => setSetup(false)} />
      <AddOpposition visible={adding} onClose={() => setAdding(false)} />
      <PickerSheet
        visible={heroPick}
        onClose={() => setHeroPick(false)}
        title="Add a hero"
        groups={[
          {
            label: '',
            items: state.order
              .map((id) => state.heroes[id])
              .filter((h) => h && !s.actors.some((a) => a.heroId === h.id))
              .map((h) => ({ value: h.id, label: h.info.name || 'Unnamed hero', sub: h.info.alias })),
          },
        ]}
        onPick={(id) => updateScene((x) => { x.actors.push({ id: uid(), kind: 'hero', heroId: id, name: '', acted: false }); })}
      />
    </KeyboardAvoidingView>
  );
}

function ActorRow({ a }: { a: Actor }) {
  const { state, updateScene, updateHero } = useStore();
  const c = useColors();
  const [save, setSave] = useState<{ value: number; key: number } | null>(null);
  const [open, setOpen] = useState(false);
  const hero = a.heroId ? state.heroes[a.heroId] : undefined;
  const D = useMemo(() => (hero ? derive(hero) : null), [hero]);
  const set = (fn: (x: Actor) => void) => updateScene((s) => { const t = s.actors.find((y) => y.id === a.id); if (t) fn(t); });
  const meta = KIND_META[a.kind];
  const name = hero ? hero.info.name || 'Unnamed hero' : a.name || meta.label;

  let detail = null;
  if (hero && D?.health.max) {
    const hp = hero.play.health ?? D.health.max;
    const hz = healthZone(D, hp);
    detail = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Stepper value={hp} min={0} max={D.health.max} onChange={(n) => updateHero(hero.id, (x) => { x.play.health = n; })} />
        {hz ? <Chip small label={hz} active color={c.zone[hz].fg} /> : null}
        <Btn small icon="sword-cross" label="Open" onPress={() => router.push(`/play/${hero.id}`)} />
      </View>
    );
  } else if (a.kind === 'villain') {
    detail = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Stepper value={a.health ?? 0} min={0} max={a.maxHealth || 999} onChange={(n) => set((x) => { x.health = n; })} />
        {a.maxHealth ? <Body muted>/ {a.maxHealth}</Body> : null}
      </View>
    );
  } else if (a.kind === 'lieutenant' || a.kind === 'minion') {
    detail = (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PressScale onPress={() => set((x) => { x.die = upDie(x.die || 6, -1); })} accessibilityLabel="Shrink die">
            <Icon name="arrow-down-bold-box" size={30} color={c.ink} />
          </PressScale>
          {save ? <RolledDie size={a.die || 6} value={save.value} rollKey={save.key} px={40} fill={c.yellow} /> : <DieBadge size={a.die || 6} px={40} />}
          <PressScale onPress={() => set((x) => { x.die = upDie(x.die || 6, 1); })} accessibilityLabel="Grow die">
            <Icon name="arrow-up-bold-box" size={30} color={c.ink} />
          </PressScale>
          <Btn small icon="dice-multiple" label="Roll save" onPress={() => { thud(); setSave({ value: rollDie(a.die || 6), key: Date.now() }); }} />
          {a.kind === 'minion' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Label>Count</Label>
              <Stepper value={a.count ?? 1} min={0} onChange={(n) => set((x) => { x.count = n; })} />
            </View>
          ) : null}
        </View>
        {save ? <Body muted style={{ fontSize: 12 }}>Saved {save.value} on the d{a.die}. Compare with the damage, then shrink the die or remove it as your table rules.</Body> : null}
      </View>
    );
  }

  return (
    <View style={{ borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, padding: 10, gap: 8, backgroundColor: a.acted ? c.panel2 : c.panel, opacity: a.acted ? 0.7 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <PressScale onPress={() => set((x) => { x.acted = !x.acted; })} accessibilityLabel={a.acted ? `${name} has acted` : `Mark ${name} as acted`} hitSlop={6}>
          <Icon name={a.acted ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={30} color={a.acted ? c.green : c.ink} />
        </PressScale>
        <Icon name={meta.icon} size={20} color={a.kind === 'hero' ? c.blue : a.kind === 'environment' ? c.teal : c.red} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '900', color: c.ink, fontSize: 16, textDecorationLine: a.acted ? 'line-through' : 'none' }} numberOfLines={1}>{name}</Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>{meta.label}{a.notes ? ` · ${a.notes}` : ''}</Text>
        </View>
        <PressScale onPress={() => setOpen(true)} accessibilityLabel={`${name} options`} hitSlop={8}>
          <Icon name="dots-vertical" size={22} color={c.ink} />
        </PressScale>
      </View>
      {detail}
      <Sheet visible={open} onClose={() => setOpen(false)} title={name}>
        <View style={{ gap: space.sm }}>
          {!hero && <CommitField label="Name" value={a.name} onCommit={(v) => set((x) => { x.name = v; })} />}
          {a.kind === 'villain' && (
            <CommitField label="Max health" value={a.maxHealth ? String(a.maxHealth) : ''} keyboardType="number-pad" onCommit={(v) => set((x) => { x.maxHealth = parseInt(v, 10) || undefined; })} />
          )}
          <CommitField label="Notes" value={a.notes || ''} placeholder="Dice pool, abilities, conditions…" onCommit={(v) => set((x) => { x.notes = v; })} />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Btn icon="arrow-up" label="Move up" style={{ flex: 1 }} onPress={() => updateScene((s) => { const i = s.actors.findIndex((y) => y.id === a.id); if (i > 0) [s.actors[i - 1], s.actors[i]] = [s.actors[i], s.actors[i - 1]]; })} />
            <Btn icon="arrow-down" label="Move down" style={{ flex: 1 }} onPress={() => updateScene((s) => { const i = s.actors.findIndex((y) => y.id === a.id); if (i >= 0 && i < s.actors.length - 1) [s.actors[i + 1], s.actors[i]] = [s.actors[i], s.actors[i + 1]]; })} />
          </View>
          <Btn kind="danger" icon="close" label="Remove from scene" onPress={() => { setOpen(false); updateScene((s) => { s.actors = s.actors.filter((y) => y.id !== a.id); }); }} />
        </View>
      </Sheet>
    </View>
  );
}

function AddOpposition({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { updateScene } = useStore();
  const c = useColors();
  const [kind, setKind] = useState<Exclude<ActorKind, 'hero'>>('minion');
  const [name, setName] = useState('');
  const [die, setDie] = useState(6);
  const [count, setCount] = useState(3);
  const [health, setHealth] = useState('');
  const add = () => {
    updateScene((x) => {
      x.actors.push({
        id: uid(), kind, name: name.trim(), acted: false,
        ...(kind === 'minion' || kind === 'lieutenant' ? { die } : {}),
        ...(kind === 'minion' ? { count } : {}),
        ...(kind === 'villain' ? { health: parseInt(health, 10) || 0, maxHealth: parseInt(health, 10) || undefined } : {}),
      });
    });
    setName('');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a foe or the environment">
      <View style={{ gap: space.md }}>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'minion', label: 'Minions' },
            { value: 'lieutenant', label: 'Lieut.' },
            { value: 'villain', label: 'Villain' },
            { value: 'environment', label: 'Env.' },
          ]}
        />
        <Field value={name} onChangeText={setName} placeholder={kind === 'environment' ? 'e.g. Collapsing Rooftop' : kind === 'villain' ? 'e.g. Baron Blade' : 'e.g. Mordengrad Soldiers'} />
        {(kind === 'minion' || kind === 'lieutenant') && (
          <View style={{ gap: 6 }}>
            <Label>Die size</Label>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIE_SIZES.map((d) => (
                <PressScale key={d} onPress={() => setDie(d)} accessibilityLabel={`d${d}`}>
                  <DieBadge size={d} px={42} fill={die === d ? c.yellow : undefined} />
                </PressScale>
              ))}
            </View>
          </View>
        )}
        {kind === 'minion' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Label>How many</Label>
            <Stepper value={count} min={1} onChange={setCount} />
          </View>
        )}
        {kind === 'villain' && <Field label="Health" value={health} onChangeText={setHealth} keyboardType="number-pad" placeholder="e.g. 40" />}
        <Btn kind="primary" icon="plus" label="Add to scene" onPress={add} />
      </View>
    </Sheet>
  );
}

function TrackerSetup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, updateScene } = useStore();
  const c = useColors();
  const t = state.scene.tracker;
  const presets: [string, Record<Zone, number>][] = [
    ['Short', { green: 2, yellow: 2, red: 1 }],
    ['Standard', { green: 2, yellow: 3, red: 2 }],
    ['Long', { green: 3, yellow: 4, red: 3 }],
  ];
  return (
    <Sheet visible={visible} onClose={onClose} title="Scene tracker">
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {presets.map(([n, p]) => (
            <Chip key={n} label={`${n} ${p.green}/${p.yellow}/${p.red}`} active={p.green === t.green && p.yellow === t.yellow && p.red === t.red} onPress={() => updateScene((x) => { x.tracker = { ...p }; })} />
          ))}
        </View>
        {ZONES.map((z) => (
          <View key={z} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: c.line, backgroundColor: c.zone[z].die }} />
            <Text style={{ flex: 1, fontWeight: '800', color: c.ink, textTransform: 'capitalize' }}>{z} boxes</Text>
            <Stepper value={t[z]} min={z === 'green' ? 1 : 0} max={10} onChange={(n) => updateScene((x) => { x.tracker[z] = n; })} />
          </View>
        ))}
        <Body muted style={{ fontSize: 13 }}>Set the boxes your scene calls for. The tracker advances one box each round.</Body>
        <Btn kind="primary" label="Done" onPress={onClose} />
      </View>
    </Sheet>
  );
}
