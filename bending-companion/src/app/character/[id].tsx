import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BalanceTrack } from '../../components/BalanceTrack';
import { characterColor } from '../../components/CharacterCard';
import { Button, Card, Chip, EmptyState, Field, IconButton, PipTrack, PressScale } from '../../components/ui';
import {
  BALANCE_LIMIT,
  CONDITIONS,
  ERAS,
  FATIGUE_MAX,
  GROWTH_MAX,
  STAT_MAX,
  STAT_MIN,
  STATS,
  STATUSES,
  TECHNIQUE_LEVELS,
  TRAININGS,
  moveById,
  type Approach,
  type TechniqueLevel,
} from '../../data/game';
import { notify, thud } from '../../lib/haptics';
import { makeId } from '../../lib/id';
import { formatMod } from '../../lib/roll';
import { playbookName, principlesOf, useCharacter, useStore } from '../../store/store';
import type { Character } from '../../store/types';
import { colors, elementColors, radius, space, type } from '../../theme';

type Section = 'sheet' | 'moves' | 'story';
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'sheet', label: 'Sheet' },
  { key: 'moves', label: 'Moves' },
  { key: 'story', label: 'Story' },
];

export default function CharacterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { character, update } = useCharacter(id);
  const { setActive } = useStore();
  const [section, setSection] = useState<Section>('sheet');

  if (!character) {
    return <EmptyState icon="account-question" title="Character not found" body="It may have been deleted." />;
  }

  const accent = characterColor(character);
  const openRoller = () => {
    setActive(character.id);
    router.navigate('/roll');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: character.name || 'Character',
          headerRight: () => <IconButton icon="dice-multiple" label="Roll for this character" color={colors.accent} onPress={openRoller} />,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <LinearGradient colors={[accent + '40', 'transparent']} style={StyleSheet.absoluteFill} />
          <Text style={type.label}>{playbookName(character)}</Text>
          <Text style={type.title}>{character.name || 'Unnamed'}</Text>
          <View style={styles.wrap}>
            {character.trainings.map((t) => {
              const tr = TRAININGS.find((x) => x.key === t)!;
              return (
                <View key={t} style={[styles.tag, { backgroundColor: elementColors[t] + '22' }]}>
                  <MaterialCommunityIcons name={tr.icon} size={14} color={elementColors[t]} />
                  <Text style={[styles.tagText, { color: elementColors[t] }]}>{tr.label}</Text>
                </View>
              );
            })}
            {character.era ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{character.era}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.segments}>
          {SECTIONS.map((s) => (
            <PressScale
              key={s.key}
              onPress={() => setSection(s.key)}
              accessibilityLabel={s.label}
              containerStyle={{ flex: 1 }}
              style={[styles.segment, section === s.key && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, section === s.key && { color: colors.bg }]}>{s.label}</Text>
            </PressScale>
          ))}
        </View>

        {section === 'sheet' && <SheetSection character={character} update={update} />}
        {section === 'moves' && <MovesSection character={character} update={update} />}
        {section === 'story' && <StorySection character={character} update={update} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type SectionProps = { character: Character; update: (fn: (c: Character) => Character) => void };

function SheetSection({ character, update }: SectionProps) {
  const principles = principlesOf(character);
  const [overflow, setOverflow] = useState<0 | 1 | null>(null);
  const fatigueFull = character.fatigue >= FATIGUE_MAX;

  return (
    <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
      <View style={styles.statGrid}>
        {STATS.map((s) => (
          <View key={s.key} style={styles.statTile}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{formatMod(character.stats[s.key])}</Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <IconButton
                icon="minus"
                size={16}
                label={`Lower ${s.label}`}
                onPress={() =>
                  update((c) => ({ ...c, stats: { ...c.stats, [s.key]: Math.max(STAT_MIN, c.stats[s.key] - 1) } }))
                }
              />
              <IconButton
                icon="plus"
                size={16}
                label={`Raise ${s.label}`}
                onPress={() =>
                  update((c) => ({ ...c, stats: { ...c.stats, [s.key]: Math.min(STAT_MAX, c.stats[s.key] + 1) } }))
                }
              />
            </View>
          </View>
        ))}
      </View>

      <Card title="Balance">
        <BalanceTrack
          principles={principles}
          balance={character.balance}
          center={character.center}
          onChange={(n) => update((c) => ({ ...c, balance: n }))}
          onOverflow={(i) => {
            notify('warning');
            setOverflow(i);
          }}
        />
        <View style={styles.rowBetween}>
          <Text style={type.caption}>Center</Text>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <IconButton
              icon="chevron-left"
              label={`Move center toward ${principles[0]}`}
              onPress={() => update((c) => ({ ...c, center: Math.max(-BALANCE_LIMIT, c.center - 1) }))}
            />
            <Text style={[type.body, { minWidth: 24, textAlign: 'center' }]}>{formatMod(character.center)}</Text>
            <IconButton
              icon="chevron-right"
              label={`Move center toward ${principles[1]}`}
              onPress={() => update((c) => ({ ...c, center: Math.min(BALANCE_LIMIT, c.center + 1) }))}
            />
            <Button
              label="Return to center"
              variant="ghost"
              style={{ paddingVertical: 8 }}
              onPress={() => update((c) => ({ ...c, balance: c.center }))}
            />
          </View>
        </View>
        {overflow !== null && (
          <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.alert}>
            <Text style={[type.heading, { color: colors.danger }]}>You've lost your balance!</Text>
            <Text style={type.caption}>
              Your balance was pushed past {principles[overflow]}. Resolve losing your balance with the GM using the
              core rules, then reset your track.
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              <Button
                label="Reset to center"
                onPress={() => {
                  update((c) => ({ ...c, balance: c.center }));
                  setOverflow(null);
                }}
              />
              <Button label="Dismiss" variant="ghost" onPress={() => setOverflow(null)} />
            </View>
          </Animated.View>
        )}
      </Card>

      <Card title="Conditions">
        {CONDITIONS.map((cond) => {
          const marked = character.conditions[cond.key];
          return (
            <PressScale
              key={cond.key}
              accessibilityLabel={`${cond.label}${marked ? ', marked' : ''}`}
              onPress={() => {
                if (!marked) thud();
                update((c) => ({ ...c, conditions: { ...c.conditions, [cond.key]: !marked } }));
              }}
              style={[styles.condition, marked && styles.conditionMarked]}
            >
              <MaterialCommunityIcons
                name={marked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={marked ? colors.danger : colors.textFaint}
              />
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { fontWeight: '700' }, marked && { color: colors.danger }]}>{cond.label}</Text>
                <Text style={type.caption}>{cond.effect}</Text>
                {marked && <Text style={[type.caption, { color: colors.text }]}>To clear: {cond.clear}</Text>}
              </View>
            </PressScale>
          );
        })}
      </Card>

      <Card title="Fatigue" right={<Text style={type.caption}>{character.fatigue}/{FATIGUE_MAX}</Text>}>
        <PipTrack
          value={character.fatigue}
          max={FATIGUE_MAX}
          color={colors.mixed}
          icon="close-thick"
          onChange={(n) => update((c) => ({ ...c, fatigue: n }))}
        />
        {fatigueFull && (
          <Text style={[type.caption, { color: colors.mixed }]}>
            Fatigue is full. Any further fatigue means marking a condition instead.
          </Text>
        )}
      </Card>

      <Card title="Statuses">
        <View style={styles.wrap}>
          {STATUSES.positive.map((s) => (
            <StatusChip key={s} name={s} positive character={character} update={update} />
          ))}
        </View>
        <View style={styles.wrap}>
          {STATUSES.negative.map((s) => (
            <StatusChip key={s} name={s} positive={false} character={character} update={update} />
          ))}
        </View>
      </Card>

      <Card title="Growth" right={<Text style={type.caption}>Advancements: {character.advancements}</Text>}>
        <PipTrack
          value={character.growth}
          max={GROWTH_MAX}
          color={colors.success}
          icon="leaf"
          onChange={(n) => update((c) => ({ ...c, growth: n }))}
        />
        {character.growth >= GROWTH_MAX && (
          <Button
            label="Take an advancement"
            icon="star-four-points"
            onPress={() => {
              notify('success');
              update((c) => ({ ...c, growth: 0, advancements: c.advancements + 1 }));
            }}
          />
        )}
      </Card>
    </Animated.View>
  );
}

function StatusChip({ name, positive, character, update }: SectionProps & { name: string; positive: boolean }) {
  const active = character.statuses.includes(name);
  return (
    <Chip
      label={name}
      active={active}
      color={positive ? colors.success : colors.danger}
      icon={positive ? 'arrow-up-bold' : 'arrow-down-bold'}
      onPress={() =>
        update((c) => ({
          ...c,
          statuses: active ? c.statuses.filter((s) => s !== name) : [...c.statuses, name],
        }))
      }
    />
  );
}

const LEVEL_COLOR: Record<TechniqueLevel, string> = {
  learned: colors.textMuted,
  practiced: colors.mixed,
  mastered: colors.success,
};

function MovesSection({ character, update }: SectionProps) {
  const [moveName, setMoveName] = useState('');
  const [techName, setTechName] = useState('');
  const [approach, setApproach] = useState<Approach>('advance');

  const addMove = () => {
    if (!moveName.trim()) return;
    update((c) => ({ ...c, moves: [...c.moves, { id: makeId(), name: moveName.trim(), notes: '' }] }));
    setMoveName('');
  };

  const addTechnique = () => {
    if (!techName.trim()) return;
    update((c) => ({
      ...c,
      techniques: [...c.techniques, { id: makeId(), name: techName.trim(), approach, level: 'learned', notes: '' }],
    }));
    setTechName('');
  };

  return (
    <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
      <Card title="Playbook & feature moves">
        {character.moves.length === 0 && (
          <Text style={type.caption}>Add the moves you picked from your playbook, with notes as reminders.</Text>
        )}
        {character.moves.map((m) => (
          <Animated.View key={m.id} layout={LinearTransition} entering={FadeInDown} exiting={FadeOut} style={styles.listItem}>
            <View style={styles.rowBetween}>
              <Text style={[type.body, { fontWeight: '700', flex: 1 }]}>{m.name}</Text>
              <IconButton
                icon="trash-can-outline"
                label={`Delete ${m.name}`}
                onPress={() => update((c) => ({ ...c, moves: c.moves.filter((x) => x.id !== m.id) }))}
              />
            </View>
            <Field
              value={m.notes}
              placeholder="What does it do?"
              multiline
              onChangeText={(s) =>
                update((c) => ({ ...c, moves: c.moves.map((x) => (x.id === m.id ? { ...x, notes: s } : x)) }))
              }
            />
          </Animated.View>
        ))}
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <Field value={moveName} onChangeText={setMoveName} placeholder="Move name" />
          </View>
          <IconButton icon="plus" label="Add move" color={colors.accent} onPress={addMove} />
        </View>
      </Card>

      <Card title="Techniques">
        {(['advance', 'defend', 'evade'] as Approach[]).map((ap) => {
          const list = character.techniques.filter((t) => t.approach === ap);
          if (list.length === 0) return null;
          return (
            <View key={ap} style={{ gap: space.sm }}>
              <Text style={[type.caption, { fontWeight: '700' }]}>{moveById(ap).name}</Text>
              {list.map((t) => (
                <Animated.View key={t.id} layout={LinearTransition} entering={FadeInDown} exiting={FadeOut} style={styles.technique}>
                  <Text style={[type.body, { flex: 1 }]}>{t.name}</Text>
                  <PressScale
                    accessibilityLabel={`${t.name} is ${t.level}. Tap to change.`}
                    onPress={() => {
                      const next = TECHNIQUE_LEVELS[(TECHNIQUE_LEVELS.indexOf(t.level) + 1) % TECHNIQUE_LEVELS.length];
                      if (next === 'mastered') notify('success');
                      update((c) => ({
                        ...c,
                        techniques: c.techniques.map((x) => (x.id === t.id ? { ...x, level: next } : x)),
                      }));
                    }}
                    style={[styles.level, { borderColor: LEVEL_COLOR[t.level] }]}
                  >
                    <Text style={[styles.levelText, { color: LEVEL_COLOR[t.level] }]}>{t.level}</Text>
                  </PressScale>
                  <IconButton
                    icon="trash-can-outline"
                    label={`Delete ${t.name}`}
                    onPress={() => update((c) => ({ ...c, techniques: c.techniques.filter((x) => x.id !== t.id) }))}
                  />
                </Animated.View>
              ))}
            </View>
          );
        })}
        {character.techniques.length === 0 && (
          <Text style={type.caption}>Track your techniques and tap the badge to move them from learned to mastered.</Text>
        )}
        <View style={styles.wrap}>
          {(['advance', 'defend', 'evade'] as Approach[]).map((ap) => (
            <Chip key={ap} label={moveById(ap).name} active={approach === ap} onPress={() => setApproach(ap)} />
          ))}
        </View>
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <Field value={techName} onChangeText={setTechName} placeholder="Technique name" />
          </View>
          <IconButton icon="plus" label="Add technique" color={colors.accent} onPress={addTechnique} />
        </View>
      </Card>
    </Animated.View>
  );
}

function StorySection({ character, update }: SectionProps) {
  const { deleteCharacter } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (key: keyof Character) => (s: string) => update((c) => ({ ...c, [key]: s }));

  return (
    <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
      <Card>
        <Field label="Name" value={character.name} onChangeText={set('name')} />
        <Text style={type.label}>Training</Text>
        <View style={styles.wrap}>
          {TRAININGS.map((t) => {
            const active = character.trainings.includes(t.key);
            return (
              <Chip
                key={t.key}
                label={t.label}
                icon={t.icon}
                color={elementColors[t.key]}
                active={active}
                onPress={() =>
                  update((c) => ({
                    ...c,
                    trainings: active ? c.trainings.filter((x) => x !== t.key) : [...c.trainings, t.key],
                  }))
                }
              />
            );
          })}
        </View>
        <Text style={type.label}>Era</Text>
        <View style={styles.wrap}>
          {ERAS.map((e) => (
            <Chip
              key={e}
              label={e}
              active={character.era === e}
              onPress={() => update((c) => ({ ...c, era: c.era === e ? '' : e }))}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Field label="Background" value={character.background} onChangeText={set('background')} placeholder="Military, Monastic, Outlaw, Privileged, Urban, Wilderness..." />
        <Field label="Demeanor" value={character.demeanor} onChangeText={set('demeanor')} />
        <Field label="Look" value={character.look} onChangeText={set('look')} multiline />
        <Field label="History" value={character.history} onChangeText={set('history')} multiline />
        <Field label="Connections" value={character.connections} onChangeText={set('connections')} multiline />
        <Field label="Notes" value={character.notes} onChangeText={set('notes')} multiline />
      </Card>
      <Button
        label={confirmDelete ? 'Tap again to delete for good' : 'Delete character'}
        icon="trash-can-outline"
        variant="danger"
        onPress={() => {
          if (!confirmDelete) {
            notify('warning');
            setConfirmDelete(true);
            return;
          }
          deleteCharacter(character.id);
          router.back();
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  hero: { borderRadius: radius.lg, overflow: 'hidden', padding: space.lg, gap: space.sm, backgroundColor: colors.surface },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
  },
  tagText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  segments: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 },
  segment: { paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statTile: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statLabel: { ...type.label },
  statValue: { color: colors.text, fontSize: 34, fontWeight: '800' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  alert: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.danger + '1A',
    borderWidth: 1,
    borderColor: colors.danger + '55',
  },
  condition: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  conditionMarked: { backgroundColor: colors.danger + '1A' },
  listItem: { gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  technique: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    paddingLeft: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  level: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
