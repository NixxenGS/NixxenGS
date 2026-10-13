import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Chip, Field, PressScale, Stepper } from '../components/ui';
import { CUSTOM_PLAYBOOK_ID, ERAS, PLAYBOOKS, STAT_MAX, STAT_MIN, STATS, TRAININGS, type StatKey, type TrainingKey } from '../data/game';
import { notify } from '../lib/haptics';
import { formatMod } from '../lib/roll';
import { newCharacter, useStore } from '../store/store';
import { colors, elementColors, radius, space, type } from '../theme';

export default function NewCharacterScreen() {
  const { addCharacter } = useStore();
  const [name, setName] = useState('');
  const [playbookId, setPlaybookId] = useState(PLAYBOOKS[0].id);
  const [customPrinciples, setCustomPrinciples] = useState<[string, string]>(['', '']);
  const [trainings, setTrainings] = useState<TrainingKey[]>([]);
  const [era, setEra] = useState('');
  const [stats, setStats] = useState<Record<StatKey, number>>({ creativity: 0, focus: 0, harmony: 0, passion: 0 });

  const toggleTraining = (t: TrainingKey) =>
    setTrainings((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const create = () => {
    const c = newCharacter({ name: name.trim(), playbookId, customPrinciples, trainings, era, stats });
    addCharacter(c);
    notify('success');
    router.dismiss();
    router.push(`/character/${c.id}`);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Kasumi of the Southern Isles" />

        <Text style={type.label}>Playbook</Text>
        <View style={{ gap: space.sm }}>
          {PLAYBOOKS.map((p) => {
            const active = p.id === playbookId;
            return (
              <PressScale
                key={p.id}
                onPress={() => setPlaybookId(p.id)}
                accessibilityLabel={p.name}
                style={[styles.playbook, active && styles.playbookActive]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.heading, active && { color: colors.accent }]}>{p.name}</Text>
                  <Text style={type.caption}>{p.pitch}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.principle}>{p.principles[0]}</Text>
                  <Text style={styles.vs}>vs</Text>
                  <Text style={styles.principle}>{p.principles[1]}</Text>
                </View>
              </PressScale>
            );
          })}
          <PressScale
            onPress={() => setPlaybookId(CUSTOM_PLAYBOOK_ID)}
            accessibilityLabel="Custom playbook"
            style={[styles.playbook, playbookId === CUSTOM_PLAYBOOK_ID && styles.playbookActive]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.heading, playbookId === CUSTOM_PLAYBOOK_ID && { color: colors.accent }]}>
                Other playbook
              </Text>
              <Text style={type.caption}>From a supplement or homebrew. Name your own principles.</Text>
            </View>
          </PressScale>
          {playbookId === CUSTOM_PLAYBOOK_ID && (
            <Card>
              <Field
                label="First principle"
                value={customPrinciples[0]}
                onChangeText={(s) => setCustomPrinciples([s, customPrinciples[1]])}
              />
              <Field
                label="Second principle"
                value={customPrinciples[1]}
                onChangeText={(s) => setCustomPrinciples([customPrinciples[0], s])}
              />
            </Card>
          )}
        </View>

        <Text style={type.label}>Training</Text>
        <View style={styles.wrap}>
          {TRAININGS.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              icon={t.icon}
              color={elementColors[t.key]}
              active={trainings.includes(t.key)}
              onPress={() => toggleTraining(t.key)}
            />
          ))}
        </View>

        <Text style={type.label}>Era</Text>
        <View style={styles.wrap}>
          {ERAS.map((e) => (
            <Chip key={e} label={e} active={era === e} onPress={() => setEra(era === e ? '' : e)} />
          ))}
        </View>

        <Card title="Stats" right={<Text style={type.caption}>Use your playbook's starting values</Text>}>
          {STATS.map((s) => (
            <View key={s.key} style={styles.statRow}>
              <Text style={type.body}>{s.label}</Text>
              <Stepper
                value={stats[s.key]}
                min={STAT_MIN}
                max={STAT_MAX}
                format={formatMod}
                onChange={(n) => setStats({ ...stats, [s.key]: n })}
              />
            </View>
          ))}
        </Card>

        <Button label="Create character" icon="check" onPress={create} disabled={!name.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  playbook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playbookActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  principle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  vs: { color: colors.textFaint, fontSize: 11 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
