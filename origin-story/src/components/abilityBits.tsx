import { Text, View } from 'react-native';
import { actionsIn, type Action } from '../engine/hero';
import { useColors } from '../theme';
import { Icon, type IconName } from './ui';

export const ACTION_ICONS: Record<Action, IconName> = {
  Attack: 'sword',
  Defend: 'shield-half-full',
  Overcome: 'stairs-up',
  Boost: 'chevron-double-up',
  Hinder: 'chevron-double-down',
  Recover: 'heart-plus',
};

export function ActionIcons({ text, size = 15 }: { text: string; size?: number }) {
  const c = useColors();
  const acts = actionsIn(text);
  if (!acts.length) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={acts.join(', ')}>
      {acts.map((a) => <Icon key={a} name={ACTION_ICONS[a]} size={size} color={c.muted} />)}
    </View>
  );
}

const TYPE_NAMES: Record<string, string> = { A: 'Action', R: 'Reaction', I: 'Inherent', 'A/I': 'Action / Inherent' };
export function TypeBadge({ type }: { type: string }) {
  const c = useColors();
  return (
    <View accessibilityLabel={TYPE_NAMES[type] ?? type} style={{ borderWidth: 1.5, borderColor: c.line, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: c.panel2 }}>
      <Text style={{ fontSize: 11, fontWeight: '900', color: c.ink }}>{type}</Text>
    </View>
  );
}
