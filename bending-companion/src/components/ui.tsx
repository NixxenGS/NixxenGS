import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { tap } from '../lib/haptics';
import { colors, radius, space, type } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Card({
  title,
  right,
  children,
  style,
  accent,
}: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
}) {
  return (
    <View style={[styles.card, accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : null, style]}>
      {(title || right) && (
        <View style={styles.cardHeader}>
          {title ? <Text style={type.label}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

/** Pressable that springs down slightly when touched. */
export function PressScale({
  onPress,
  onLongPress,
  children,
  style,
  containerStyle,
  disabled,
  haptic = true,
  accessibilityLabel,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Layout style for the outer touch target, e.g. flex: 1. */
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={containerStyle}
      onPressIn={() => (scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 300 }))}
      onPress={() => {
        if (haptic) tap();
        onPress?.();
      }}
      onLongPress={onLongPress}
    >
      <Animated.View style={[style, animated, disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color = colors.accent,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
  icon?: IconName;
}) {
  return (
    <PressScale
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        styles.chip,
        active && { backgroundColor: color + '26', borderColor: color },
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={15} color={active ? color : colors.textMuted} />}
      <Text style={[styles.chipText, active && { color }]}>{label}</Text>
    </PressScale>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === 'primary' ? colors.bg : variant === 'danger' ? colors.danger : colors.text;
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[
        styles.button,
        variant === 'primary' && { backgroundColor: colors.accent, borderColor: colors.accent },
        variant === 'danger' && { borderColor: colors.danger + '66' },
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={18} color={fg} />}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </PressScale>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.textMuted,
  size = 20,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  label: string;
}) {
  return (
    <PressScale onPress={onPress} accessibilityLabel={label} style={styles.iconButton}>
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </PressScale>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  format = (n: number) => String(n),
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
}) {
  return (
    <View style={styles.stepper}>
      <IconButton icon="minus" label="Decrease" onPress={() => value > min && onChange(value - 1)} />
      <Text style={styles.stepperValue}>{format(value)}</Text>
      <IconButton icon="plus" label="Increase" onPress={() => value < max && onChange(value + 1)} />
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label?: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ gap: space.xs }}>
      {label && <Text style={type.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        style={[styles.input, multiline && { minHeight: 88, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

/** A row of tappable boxes, e.g. fatigue or growth. */
export function PipTrack({
  value,
  max,
  onChange,
  color = colors.accent,
  icon = 'checkbox-blank',
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  color?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.pipRow}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        return (
          <PressScale
            key={i}
            accessibilityLabel={`Box ${i + 1}${filled ? ', marked' : ''}`}
            onPress={() => onChange(filled && value === i + 1 ? i : i + 1)}
            style={[styles.pip, filled && { backgroundColor: color, borderColor: color }]}
          >
            {filled && <MaterialCommunityIcons name={icon} size={16} color={colors.bg} />}
          </PressScale>
        );
      })}
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={36} color={colors.accent} />
      </View>
      <Text style={type.heading}>{title}</Text>
      <Text style={[type.caption, { textAlign: 'center', maxWidth: 280 }]}>{body}</Text>
      {action}
    </View>
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
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepperValue: { color: colors.text, fontSize: 20, fontWeight: '800', minWidth: 34, textAlign: 'center' },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: space.md,
    paddingVertical: 12,
  },
  pipRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' },
  pip: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl * 2, paddingHorizontal: space.xl },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
