import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { CONDITIONS, FATIGUE_MAX, STATS, TRAININGS } from '../data/game';
import { formatMod } from '../lib/roll';
import { playbookName, principlesOf } from '../store/store';
import type { Character } from '../store/types';
import { colors, elementColors, radius, space, type } from '../theme';
import { PressScale } from './ui';

export function characterColor(c: Character) {
  const t = c.trainings[0];
  return t ? elementColors[t] : colors.accent;
}

export function CharacterCard({ character, onPress }: { character: Character; onPress: () => void }) {
  const accent = characterColor(character);
  const [a, b] = principlesOf(character);
  const marked = CONDITIONS.filter((cond) => character.conditions[cond.key]);
  const lean = character.balance === 0 ? 'Centered' : `Leaning ${character.balance < 0 ? a : b} ${Math.abs(character.balance)}`;

  return (
    <PressScale onPress={onPress} accessibilityLabel={`Open ${character.name || 'character'}`}>
      <View style={styles.card}>
        <LinearGradient
          colors={[accent + '33', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.top}>
          <View style={[styles.avatar, { borderColor: accent }]}>
            <Text style={[styles.initial, { color: accent }]}>{(character.name || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.heading} numberOfLines={1}>
              {character.name || 'Unnamed'}
            </Text>
            <Text style={type.caption} numberOfLines={1}>
              {playbookName(character)}
              {character.trainings.length > 0 &&
                ' · ' + character.trainings.map((t) => TRAININGS.find((x) => x.key === t)?.label).join(', ')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
        </View>

        <View style={styles.stats}>
          {STATS.map((s) => (
            <View key={s.key} style={styles.stat}>
              <Text style={styles.statValue}>{formatMod(character.stats[s.key])}</Text>
              <Text style={styles.statLabel}>{s.short}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={type.caption}>
            <MaterialCommunityIcons name="yin-yang" size={13} color={colors.textMuted} /> {lean}
          </Text>
          <Text style={type.caption}>
            Fatigue {character.fatigue}/{FATIGUE_MAX}
          </Text>
        </View>
        {marked.length > 0 && (
          <View style={styles.conditions}>
            {marked.map((cond) => (
              <View key={cond.key} style={styles.condition}>
                <Text style={styles.conditionText}>{cond.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.md,
    overflow: 'hidden',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  initial: { fontSize: 22, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bg + 'AA',
  },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  conditions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  condition: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger + '22',
  },
  conditionText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
});
