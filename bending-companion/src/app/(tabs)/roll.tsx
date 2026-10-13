import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Die } from '../../components/Die';
import { Button, Card, Chip, Stepper } from '../../components/ui';
import { FATIGUE_MAX, MOVES, OUTCOME_LABEL, moveById, outcomeFor, type MoveId, type Outcome } from '../../data/game';
import { notify, thud } from '../../lib/haptics';
import { makeId } from '../../lib/id';
import { baseModifiers, formatMod, rollD6, type Modifier } from '../../lib/roll';
import { principlesOf, useStore } from '../../store/store';
import type { RollRecord } from '../../store/types';
import { colors, radius, space, type } from '../../theme';

const OUTCOME_COLOR: Record<Outcome, string> = { hit: colors.success, mixed: colors.mixed, miss: colors.miss };
const GROUPS = [
  { key: 'basic', label: 'Basic moves' },
  { key: 'balance', label: 'Balance moves' },
  { key: 'exchange', label: 'Combat approaches' },
] as const;

export default function RollScreen() {
  const insets = useSafeAreaInsets();
  const { state, setActive, addRoll, clearRolls, updateCharacter } = useStore();
  const character = state.characters.find((c) => c.id === state.activeCharacterId);
  const [moveId, setMoveId] = useState<MoveId | undefined>('push');
  const [principleIndex, setPrincipleIndex] = useState<0 | 1>(0);
  const [extra, setExtra] = useState(0);
  const [dice, setDice] = useState<[number, number]>([6, 6]);
  const [rollKey, setRollKey] = useState(0);
  const [result, setResult] = useState<RollRecord | null>(null);

  const move = moveId ? moveById(moveId) : undefined;
  const mods: Modifier[] = [...baseModifiers(character, move, principleIndex)];
  if (extra !== 0) mods.push({ label: 'Other', value: extra });
  const modTotal = mods.reduce((n, m) => n + m.value, 0);

  // Clear a stale result when the setup changes.
  useEffect(() => setResult(null), [moveId, character?.id, principleIndex]);

  const roll = () => {
    const d: [number, number] = [rollD6(), rollD6()];
    setDice(d);
    setRollKey((k) => k + 1);
    thud();
    const total = d[0] + d[1] + modTotal;
    const outcome = outcomeFor(total);
    const record: RollRecord = {
      id: makeId(),
      at: Date.now(),
      characterId: character?.id,
      characterName: character?.name,
      label: move?.name ?? '2d6',
      moveId,
      dice: d,
      modifiers: mods,
      total,
      outcome,
    };
    // Reveal once the dice settle.
    setResult(null);
    setTimeout(() => {
      setResult(record);
      addRoll(record);
      notify(outcome === 'hit' ? 'success' : outcome === 'mixed' ? 'warning' : 'error');
    }, 650);
  };

  const noRoll = move?.roll.kind === 'none';
  const principles = character ? principlesOf(character) : undefined;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
    >
      <Text style={type.title}>Roll</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Chip label="No character" icon="account-off-outline" active={!character} onPress={() => setActive(undefined)} />
        {state.characters.map((c) => (
          <Chip key={c.id} label={c.name || 'Unnamed'} icon="account" active={character?.id === c.id} onPress={() => setActive(c.id)} />
        ))}
      </ScrollView>

      {GROUPS.map((g) => (
        <View key={g.key} style={{ gap: space.sm }}>
          <Text style={type.label}>{g.label}</Text>
          <View style={styles.wrap}>
            {MOVES.filter((m) => m.group === g.key).map((m) => (
              <Chip key={m.id} label={m.name} active={moveId === m.id} onPress={() => setMoveId(moveId === m.id ? undefined : m.id)} />
            ))}
          </View>
        </View>
      ))}

      {move && (
        <Animated.View key={move.id} entering={FadeInDown.duration(250)}>
          <Card accent={colors.accent}>
            <Text style={type.heading}>{move.name}</Text>
            <Text style={type.caption}>{move.summary}</Text>
            {move.roll.kind === 'principle' && (
              <View style={{ gap: space.sm }}>
                <Text style={type.label}>Roll with principle</Text>
                {principles ? (
                  <View style={styles.wrap}>
                    {principles.map((p, i) => (
                      <Chip key={p} label={p} active={principleIndex === i} onPress={() => setPrincipleIndex(i as 0 | 1)} />
                    ))}
                  </View>
                ) : (
                  <Text style={type.caption}>Pick a character to roll with their principles, or add the value below.</Text>
                )}
              </View>
            )}
            {noRoll && character && (
              <Button
                label={character.fatigue >= FATIGUE_MAX ? 'Fatigue full: mark a condition' : 'Mark 1 fatigue'}
                icon="lightning-bolt"
                disabled={character.fatigue >= FATIGUE_MAX}
                onPress={() => updateCharacter(character.id, (c) => ({ ...c, fatigue: Math.min(FATIGUE_MAX, c.fatigue + 1) }))}
              />
            )}
          </Card>
        </Animated.View>
      )}

      {!noRoll && (
        <>
          <Card title="Modifiers" right={<Text style={styles.modTotal}>{formatMod(modTotal)}</Text>}>
            {mods.filter((m) => m.label !== 'Other').map((m, i) => (
              <View key={i} style={styles.modRow}>
                <Text style={type.body}>{m.label}</Text>
                <Text style={[type.body, { fontWeight: '700', color: m.value < 0 ? colors.danger : colors.text }]}>
                  {formatMod(m.value)}
                </Text>
              </View>
            ))}
            <View style={styles.modRow}>
              <Text style={type.body}>Other (statuses, help, GM)</Text>
              <Stepper value={extra} min={-4} max={4} format={formatMod} onChange={setExtra} />
            </View>
          </Card>

          <View style={styles.diceArea}>
            <Die value={dice[0]} rollKey={rollKey} color={result ? OUTCOME_COLOR[result.outcome] : colors.text} />
            <Die value={dice[1]} rollKey={rollKey} delay={70} color={result ? OUTCOME_COLOR[result.outcome] : colors.text} />
          </View>

          {result && (
            <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.result, { borderColor: OUTCOME_COLOR[result.outcome] }]}>
              <Text style={[styles.total, { color: OUTCOME_COLOR[result.outcome] }]}>{result.total}</Text>
              <Text style={[styles.outcome, { color: OUTCOME_COLOR[result.outcome] }]}>{OUTCOME_LABEL[result.outcome]}</Text>
              <Text style={type.caption}>
                {result.dice[0]} + {result.dice[1]}
                {result.modifiers.map((m) => ` ${m.value < 0 ? '−' : '+'} ${Math.abs(m.value)} ${m.label}`).join('')}
              </Text>
              {move && move[result.outcome] ? (
                <Text style={[type.body, { textAlign: 'center' }]}>{move[result.outcome]}</Text>
              ) : null}
            </Animated.View>
          )}

          <Button label={rollKey ? 'Roll again' : 'Roll 2d6'} icon="dice-multiple" onPress={roll} />
        </>
      )}

      {state.rolls.length > 0 && (
        <Card title="History" right={<Text style={styles.clear} onPress={clearRolls}>Clear</Text>}>
          {state.rolls.slice(0, 20).map((r, i) => (
            <Animated.View key={r.id} entering={FadeInUp} style={styles.historyRow}>
              <View style={[styles.historyTotal, { backgroundColor: OUTCOME_COLOR[r.outcome] + '22' }]}>
                <Text style={[styles.historyTotalText, { color: OUTCOME_COLOR[r.outcome] }]}>{r.total}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={1}>{r.label}</Text>
                <Text style={type.caption} numberOfLines={1}>
                  {r.characterName ? `${r.characterName} · ` : ''}
                  {new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[type.caption, { color: OUTCOME_COLOR[r.outcome] }]}>{OUTCOME_LABEL[r.outcome]}</Text>
            </Animated.View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  row: { gap: space.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  modRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modTotal: { color: colors.accent, fontSize: 18, fontWeight: '800' },
  diceArea: { flexDirection: 'row', justifyContent: 'center', gap: space.xl, paddingVertical: space.xl },
  result: {
    alignItems: 'center',
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  total: { fontSize: 64, fontWeight: '900', lineHeight: 70 },
  outcome: { fontSize: 20, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  clear: { color: colors.accent, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  historyTotal: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  historyTotalText: { fontSize: 18, fontWeight: '800' },
});
