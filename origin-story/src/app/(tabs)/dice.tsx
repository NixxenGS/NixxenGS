import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { RolledDie } from '../../components/play/RolledDie';
import { Body, Btn, Card, DieBadge, Label, PressScale, Title } from '../../components/ui';
import { DIE_SIZES, rollDie } from '../../engine/hero';
import { thud } from '../../lib/haptics';
import { useStore, type RollDie } from '../../store/store';
import { comicShadow, radius, space, useColors } from '../../theme';

const NAMES = ['Min', 'Mid', 'Max'];

export default function DiceScreen() {
  const { state, addRoll, clearRolls } = useStore();
  const c = useColors();
  const [pool, setPool] = useState<number[]>([8, 8, 8]);
  const [res, setRes] = useState<{ dice: RollDie[]; key: number } | null>(null);
  const roll = () => {
    if (!pool.length) return;
    thud();
    const dice = pool.map((size) => ({ size, value: rollDie(size) }));
    setRes({ dice, key: Date.now() });
    addRoll({ who: 'Quick roll', dice });
  };
  const sorted = res ? [...res.dice].sort((a, b) => a.value - b.value) : [];
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' }}>
      <Card title="Build a pool">
        <Body muted style={{ fontSize: 13 }}>Tap a die to add it. Tap a die in the pool to remove it.</Body>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {DIE_SIZES.map((d) => (
            <PressScale key={d} onPress={() => setPool((p) => (p.length < 6 ? [...p, d] : p))} accessibilityLabel={`Add d${d}`}>
              <DieBadge size={d} px={52} label={`d${d}`} />
            </PressScale>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 48, alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: c.line, borderRadius: radius.sm, padding: 6 }}>
          {pool.map((d, i) => (
            <PressScale key={i} onPress={() => setPool((p) => p.filter((_, k) => k !== i))} accessibilityLabel={`Remove d${d}`}>
              <DieBadge size={d} px={38} fill={c.yellow} />
            </PressScale>
          ))}
          {!pool.length && <Body muted>Empty pool</Body>}
        </View>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Btn kind="yellow" icon="dice-multiple" label="Roll" style={{ flex: 1 }} onPress={roll} disabled={!pool.length} />
          <Btn icon="delete-sweep" accessibilityLabel="Clear pool" onPress={() => setPool([])} />
        </View>
        {res && (
          <View style={{ alignItems: 'center', gap: space.sm, paddingTop: space.sm }}>
            <View style={{ flexDirection: 'row', gap: space.md, flexWrap: 'wrap', justifyContent: 'center' }}>
              {sorted.map((d, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                  <RolledDie size={d.size} value={d.value} rollKey={res.key} delay={i * 60} px={56} fill={sorted.length === 3 && i === 1 ? c.yellow : undefined} />
                  <Text style={{ fontWeight: '900', color: c.muted }}>{sorted.length === 3 ? NAMES[i] : `d${d.size}`}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Stat label="Min" v={sorted[0]?.value} />
              {sorted.length === 3 ? <Stat label="Mid" v={sorted[1].value} big /> : null}
              <Stat label="Max" v={sorted[sorted.length - 1]?.value} />
              <Stat label="Total" v={sorted.reduce((n, d) => n + d.value, 0)} />
            </View>
          </View>
        )}
      </Card>

      <Card title="Roll log" right={state.rolls.length ? <Btn small kind="ghost" icon="delete-outline" label="Clear" onPress={clearRolls} /> : null}>
        {state.rolls.length ? (
          state.rolls.map((r) => {
            const s = [...r.dice].sort((a, b) => a.value - b.value);
            return (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderColor: c.panel2 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: c.ink }} numberOfLines={1}>{r.who}{r.note ? ` · ${r.note}` : ''}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{new Date(r.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {s.map((d, i) => <DieBadge key={i} size={d.size} value={d.value} px={28} fill={s.length === 3 && i === 1 ? c.yellow : undefined} />)}
                </View>
              </View>
            );
          })
        ) : (
          <Body muted>Rolls from here and from heroes in play show up in this log.</Body>
        )}
      </Card>
    </ScrollView>
  );

  function Stat({ label, v, big }: { label: string; v?: number; big?: boolean }) {
    return (
      <View style={{ alignItems: 'center', minWidth: 56, padding: 6, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, backgroundColor: big ? c.yellow : c.panel, ...(big ? comicShadow(c, 2) : {}) }}>
        <Label style={big ? { color: c.onAccent } : undefined}>{label}</Label>
        <Title size={26} color={big ? c.onAccent : undefined}>{v ?? '–'}</Title>
      </View>
    );
  }
}
