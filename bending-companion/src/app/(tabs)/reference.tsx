import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressScale, type IconName } from '../../components/ui';
import { CONDITIONS, FATIGUE_MAX, MOVES, PLAYBOOKS, STATS, STATUSES, type StatKey } from '../../data/game';
import { colors, radius, space, type } from '../../theme';

type Entry = { title: string; subtitle?: string; body: string[] };
type Section = { key: string; title: string; icon: IconName; entries: Entry[] };

const statLabel = (k: StatKey) => STATS.find((s) => s.key === k)!.label;

function rollLabel(m: (typeof MOVES)[number]) {
  if (m.roll.kind === 'stat') return `Roll + ${statLabel(m.roll.stat)}`;
  if (m.roll.kind === 'principle') return 'Roll + a principle';
  return 'No roll';
}

function moveEntry(m: (typeof MOVES)[number]): Entry {
  const body = [m.summary];
  if (m.hit) body.push(`10+: ${m.hit}`);
  if (m.mixed) body.push(`7–9: ${m.mixed}`);
  if (m.miss) body.push(`6−: ${m.miss}`);
  return { title: m.name, subtitle: rollLabel(m), body };
}

const SECTIONS: Section[] = [
  {
    key: 'rolling',
    title: 'Rolling',
    icon: 'dice-multiple',
    entries: [
      { title: 'Making a move', body: ['Roll two six-sided dice and add the relevant stat or principle, plus any modifiers.'] },
      { title: 'Outcomes', body: ['10+ is a strong hit: you get what you want.', '7–9 is a weak hit: you get it, with a cost or complication.', '6 or less is a miss: the GM makes a move.'] },
    ],
  },
  { key: 'basic', title: 'Basic moves', icon: 'run-fast', entries: MOVES.filter((m) => m.group === 'basic').map(moveEntry) },
  { key: 'balance', title: 'Balance moves', icon: 'yin-yang', entries: MOVES.filter((m) => m.group === 'balance').map(moveEntry) },
  {
    key: 'exchange',
    title: 'Combat exchanges',
    icon: 'sword-cross',
    entries: [
      { title: 'How an exchange works', body: ['Everyone secretly picks an approach, then reveals. Each combatant rolls for their approach and uses techniques based on the result.'] },
      ...MOVES.filter((m) => m.group === 'exchange').map(moveEntry),
      { title: 'Technique mastery', body: ['Techniques move from learned to practiced to mastered as you train and use them.'] },
    ],
  },
  {
    key: 'conditions',
    title: 'Conditions',
    icon: 'heart-broken',
    entries: CONDITIONS.map((c) => ({ title: c.label, body: [c.effect, `Clear it: ${c.clear}`] })),
  },
  {
    key: 'tracks',
    title: 'Balance, fatigue & growth',
    icon: 'chart-timeline-variant',
    entries: [
      { title: 'Balance', body: ['Your balance sits between your two principles. Leaning toward one raises its rating and lowers the other.', 'If your balance is pushed past the end of the track, you lose your balance.'] },
      { title: 'Fatigue', body: [`You have ${FATIGUE_MAX} fatigue boxes. When you must mark fatigue and cannot, mark a condition instead.`] },
      { title: 'Growth', body: ['Mark growth from your growth question and the end-of-session questions. When the track fills, take an advancement.'] },
    ],
  },
  {
    key: 'statuses',
    title: 'Statuses',
    icon: 'shield-half-full',
    entries: [
      { title: 'Positive', body: [STATUSES.positive.join(', ')] },
      { title: 'Negative', body: [STATUSES.negative.join(', ')] },
      { title: 'Using them', body: ['Statuses come and go during play, mostly in exchanges. Check the core book for each effect and add it with the "Other" modifier in the roller.'] },
    ],
  },
  {
    key: 'playbooks',
    title: 'Playbooks',
    icon: 'account-box-multiple',
    entries: PLAYBOOKS.map((p) => ({ title: p.name, subtitle: `${p.principles[0]} vs ${p.principles[1]}`, body: [p.pitch] })),
  },
];

export default function ReferenceScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>('rolling');

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      entries: s.entries.filter((e) => [e.title, e.subtitle ?? '', ...e.body].join(' ').toLowerCase().includes(q)),
    })).filter((s) => s.entries.length > 0);
  }, [q]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={type.title}>Rules</Text>
      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search moves, conditions, playbooks..."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
      </View>

      {filtered.map((s) => {
        const expanded = !!q || open === s.key;
        return (
          <Animated.View key={s.key} layout={LinearTransition} style={styles.section}>
            <PressScale
              onPress={() => setOpen(open === s.key ? null : s.key)}
              accessibilityLabel={s.title}
              style={styles.sectionHeader}
            >
              <MaterialCommunityIcons name={s.icon} size={22} color={colors.accent} />
              <Text style={[type.heading, { flex: 1 }]}>{s.title}</Text>
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textFaint} />
            </PressScale>
            {expanded && (
              <Animated.View entering={FadeIn} style={{ gap: space.md }}>
                {s.entries.map((e) => (
                  <View key={e.title} style={styles.entry}>
                    <Text style={[type.body, { fontWeight: '700' }]}>{e.title}</Text>
                    {e.subtitle && <Text style={[type.caption, { color: colors.accent }]}>{e.subtitle}</Text>}
                    {e.body.map((b, i) => (
                      <Text key={i} style={type.caption}>{b}</Text>
                    ))}
                  </View>
                ))}
              </Animated.View>
            )}
          </Animated.View>
        );
      })}

      <Text style={[type.caption, { color: colors.textFaint, textAlign: 'center' }]}>
        Short paraphrased reminders for play. Avatar Legends: The Roleplaying Game is published by Magpie Games; use
        the core book for the full rules.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  entry: { gap: 2, paddingLeft: space.md, borderLeftWidth: 2, borderLeftColor: colors.border },
});
