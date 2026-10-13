import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '../lib/haptics';
import { comicShadow, fonts, radius, space, useColors, useStyles, type Colors, type ZoneKey } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export const Icon = MaterialCommunityIcons;

/** Pressable that springs down slightly when touched. */
export function PressScale({
  onPress, onLongPress, children, style, containerStyle, disabled, haptic = true, accessibilityLabel, hitSlop,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
  hitSlop?: number;
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={hitSlop}
      style={containerStyle}
      onPressIn={() => (scale.value = withSpring(0.94, { damping: 15, stiffness: 400 }))}
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

export function Title({ children, size = 28, color, style }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[{ fontFamily: fonts.display, fontSize: size, letterSpacing: 0.8, color: color ?? c.ink }, style]}>{children}</Text>;
}

export function Card({ children, style, zone, title, right }: { children: ReactNode; style?: StyleProp<ViewStyle>; zone?: ZoneKey; title?: string; right?: ReactNode }) {
  const s = useStyles(makeStyles);
  const c = useColors();
  return (
    <View style={[s.card, zone && { backgroundColor: c.zone[zone].bg }, style]}>
      {(title || right) && (
        <View style={s.cardHead}>
          {title ? <Title size={20}>{title}</Title> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

type BtnKind = 'primary' | 'plain' | 'danger' | 'ghost' | 'yellow';
export function Btn({
  label, icon, onPress, kind = 'plain', small, disabled, style, onLongPress, accessibilityLabel,
}: {
  label?: string; icon?: IconName; onPress?: () => void; kind?: BtnKind; small?: boolean; disabled?: boolean;
  style?: StyleProp<ViewStyle>; onLongPress?: () => void; accessibilityLabel?: string;
}) {
  const c = useColors();
  const s = useStyles(makeStyles);
  const bg = { primary: c.blue, plain: c.panel, danger: c.red, ghost: 'transparent', yellow: c.yellow }[kind];
  const fg = { primary: '#fff', plain: c.ink, danger: '#fff', ghost: c.ink, yellow: c.onAccent }[kind];
  return (
    <PressScale
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      containerStyle={style}
      style={[s.btn, small && s.btnSm, { backgroundColor: bg }, kind === 'ghost' && s.btnGhost]}
    >
      {icon && <Icon name={icon} size={small ? 16 : 20} color={fg} />}
      {label ? <Text style={[s.btnText, small && { fontSize: 13 }, { color: fg }]} numberOfLines={1}>{label}</Text> : null}
    </PressScale>
  );
}

export function Chip({
  label, active, onPress, color, icon, small, disabled, right,
}: {
  label: string; active?: boolean; onPress?: () => void; color?: string; icon?: IconName; small?: boolean; disabled?: boolean; right?: ReactNode;
}) {
  const c = useColors();
  const s = useStyles(makeStyles);
  const bg = active ? color ?? c.yellow : c.panel;
  const fg = active && color && color !== c.yellow ? '#fff' : active ? c.onAccent : c.ink;
  return (
    <PressScale onPress={onPress} disabled={disabled} style={[s.chip, small && s.chipSm, { backgroundColor: bg }, active && comicShadow(c, 2)]}>
      {icon && <Icon name={icon} size={14} color={fg} />}
      <Text style={[s.chipText, small && { fontSize: 12 }, { color: fg }]} numberOfLines={1}>{label}</Text>
      {right}
    </PressScale>
  );
}

export function Segmented<T extends string>({
  options, value, onChange, colors: colorMap,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  colors?: Partial<Record<T, string>>;
}) {
  const c = useColors();
  const s = useStyles(makeStyles);
  return (
    <View style={s.seg}>
      {options.map((o, i) => {
        const on = o.value === value;
        const bg = on ? colorMap?.[o.value] ?? c.blue : c.panel;
        return (
          <PressScale
            key={o.value}
            onPress={() => onChange(o.value)}
            containerStyle={{ flex: 1 }}
            style={[s.segItem, { backgroundColor: bg }, i > 0 && { borderLeftWidth: 2 }]}
          >
            {o.icon && <Icon name={o.icon} size={16} color={on ? '#fff' : c.ink} />}
            <Text style={[s.segText, { color: on ? '#fff' : c.ink }]} numberOfLines={1}>{o.label}</Text>
          </PressScale>
        );
      })}
    </View>
  );
}

export function Section({ title, note, right }: { title: string; note?: string; right?: ReactNode }) {
  const s = useStyles(makeStyles);
  return (
    <View style={s.section}>
      <View style={s.sectionRow}>
        <Title size={21} style={{ flexShrink: 1 }}>{title}</Title>
        {right}
      </View>
      {note ? <Text style={s.note}>{note}</Text> : null}
    </View>
  );
}

export function Callout({ children, icon = 'information-outline', tone = 'info' }: { children: ReactNode; icon?: IconName; tone?: 'info' | 'warn' }) {
  const c = useColors();
  const s = useStyles(makeStyles);
  return (
    <View style={[s.callout, tone === 'warn' && { backgroundColor: c.zone.red.bg }]}>
      <Icon name={icon} size={18} color={c.ink} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <Text style={s.body}>{children}</Text> : children}</View>
    </View>
  );
}

export function Body({ children, muted, style, numberOfLines }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const s = useStyles(makeStyles);
  return <Text numberOfLines={numberOfLines} style={[s.body, muted && s.muted, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const s = useStyles(makeStyles);
  return <Text style={[s.label, style]}>{children}</Text>;
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  const s = useStyles(makeStyles);
  return (
    <View style={[{ gap: 4 }, style]}>
      {label ? <Label>{label}</Label> : null}
      <TextInput placeholderTextColor={c.faint} {...props} style={[s.input, props.multiline && { minHeight: 84, textAlignVertical: 'top' }]} />
    </View>
  );
}

/**
 * A text field that keeps its own draft and saves it on blur, submit, or unmount,
 * so typing doesn't rebuild the whole hero on every keystroke.
 */
export function CommitField({ value, onCommit, ...props }: Omit<TextInputProps, 'value'> & { label?: string; style?: StyleProp<ViewStyle>; value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState(value);
  const latest = useRef({ text, value, onCommit });
  latest.current = { text, value, onCommit };
  useEffect(() => setText(value), [value]);
  useEffect(
    () => () => {
      const l = latest.current;
      if (l.text !== l.value) l.onCommit(l.text);
    },
    [],
  );
  const commit = () => {
    if (text !== value) onCommit(text);
  };
  return <Field {...props} value={text} onChangeText={setText} onBlur={commit} onSubmitEditing={commit} />;
}

/** Square stepper for numbers: tap −/+, long-press for ±5. */
export function Stepper({ value, onChange, min = -99, max = 999, size = 'md' }: { value: number; onChange: (n: number) => void; min?: number; max?: number; size?: 'md' | 'lg' }) {
  const c = useColors();
  const s = useStyles(makeStyles);
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  const big = size === 'lg';
  return (
    <View style={s.stepper}>
      <PressScale onPress={() => set(value - 1)} onLongPress={() => set(value - 5)} style={[s.stepBtn, big && s.stepBtnLg]} accessibilityLabel="Decrease">
        <Icon name="minus" size={big ? 28 : 18} color={c.ink} />
      </PressScale>
      <Text style={[s.stepVal, big && { fontSize: 44, minWidth: 72 }]}>{value}</Text>
      <PressScale onPress={() => set(value + 1)} onLongPress={() => set(value + 5)} style={[s.stepBtn, big && s.stepBtnLg]} accessibilityLabel="Increase">
        <Icon name="plus" size={big ? 28 : 18} color={c.ink} />
      </PressScale>
    </View>
  );
}

// ---------- dice ----------
/** A die drawn in its own shape (d4 triangle, d6 square, d8/d10 diamonds, d12 round). */
export function DieBadge({ size: n, value, px = 34, fill, textColor, label }: { size: number; value?: number | string; px?: number; fill?: string; textColor?: string; label?: string }) {
  const c = useColors();
  const bg = fill ?? (n === 12 ? c.ink : c.panel);
  const fg = textColor ?? (n === 12 && !fill ? c.panel : fill ? c.onAccent : c.ink);
  const shown = value ?? n;
  const fontSize = px * (String(shown).length > 1 ? 0.42 : 0.5);
  const text = <Text style={{ fontFamily: fonts.display, fontSize, color: fg, includeFontPadding: false }}>{shown}</Text>;
  let shape: ReactNode;
  if (n === 4) {
    const w = px, h = px * 0.9;
    shape = (
      <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', bottom: 0, width: 0, height: 0, borderLeftWidth: w / 2, borderRightWidth: w / 2, borderBottomWidth: h, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: c.line }} />
        <View style={{ position: 'absolute', bottom: 3, width: 0, height: 0, borderLeftWidth: w / 2 - 5, borderRightWidth: w / 2 - 5, borderBottomWidth: h - 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: bg }} />
        <View style={{ paddingBottom: h * 0.08 }}>{text}</View>
      </View>
    );
  } else if (n === 8 || n === 10) {
    const d = px * (n === 8 ? 0.72 : 0.68);
    shape = (
      <View style={{ width: px, height: px, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: d, height: d, backgroundColor: bg, borderWidth: 2, borderColor: c.line, borderRadius: 3, transform: [{ rotate: '45deg' }, ...(n === 10 ? [{ scaleX: 0.85 }] : [])] }} />
        {text}
      </View>
    );
  } else {
    shape = (
      <View style={{ width: px * 0.88, height: px * 0.88, margin: px * 0.06, backgroundColor: bg, borderWidth: 2, borderColor: c.line, borderRadius: n === 6 ? 5 : px * 0.3, alignItems: 'center', justifyContent: 'center' }}>
        {text}
      </View>
    );
  }
  if (!label) return shape;
  return (
    <View style={{ alignItems: 'center' }}>
      {shape}
      <Text style={{ fontSize: 10, fontWeight: '700', color: c.muted, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

export function DiceRow({ dice, px = 26, fills }: { dice: number[]; px?: number; fills?: (string | undefined)[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
      {dice.map((d, i) => <DieBadge key={i} size={d} px={px} fill={fills?.[i]} />)}
    </View>
  );
}

// ---------- bottom sheet + picker ----------
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const c = useColors();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={s.sheetHead}>
            <Title size={22} style={{ flex: 1 }}>{title}</Title>
            <PressScale onPress={onClose} accessibilityLabel="Close" hitSlop={10}>
              <Icon name="close" size={24} color={c.ink} />
            </PressScale>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export type PickItem = { value: string; label: string; sub?: string; badge?: ReactNode; disabled?: boolean };
export type PickGroup = { label: string; items: PickItem[] };

export function PickerSheet({
  visible, onClose, title, groups, value, onPick, onClear, searchable = true,
}: {
  visible: boolean; onClose: () => void; title: string; groups: PickGroup[]; value?: string;
  onPick: (v: string) => void; onClear?: () => void; searchable?: boolean;
}) {
  const c = useColors();
  const s = useStyles(makeStyles);
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const shown = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => !needle || it.label.toLowerCase().includes(needle) || (it.sub || '').toLowerCase().includes(needle)) }))
    .filter((g) => g.items.length);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <Sheet visible={visible} onClose={() => { setQ(''); onClose(); }} title={title}>
      {searchable && total > 8 && (
        <View style={s.search}>
          <Icon name="magnify" size={18} color={c.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={c.faint} style={s.searchInput} autoCorrect={false} />
        </View>
      )}
      <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
        {onClear && value ? (
          <PressScale onPress={() => { onClear(); setQ(''); onClose(); }} style={s.pickRow}>
            <Icon name="close-circle-outline" size={18} color={c.red} />
            <Text style={[s.pickLabel, { color: c.red }]}>Clear</Text>
          </PressScale>
        ) : null}
        {shown.map((g) => (
          <View key={g.label}>
            {groups.length > 1 || g.label ? <Text style={s.pickGroup}>{g.label}</Text> : null}
            {g.items.map((it) => {
              const on = it.value === value;
              return (
                <PressScale
                  key={g.label + it.value}
                  disabled={it.disabled}
                  onPress={() => { onPick(it.value); setQ(''); onClose(); }}
                  style={[s.pickRow, on && { backgroundColor: c.hi }]}
                >
                  {it.badge}
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickLabel}>{it.label}</Text>
                    {it.sub ? <Text style={s.pickSub} numberOfLines={2}>{it.sub}</Text> : null}
                  </View>
                  {on && <Icon name="check-bold" size={18} color={c.green} />}
                </PressScale>
              );
            })}
          </View>
        ))}
        {!shown.length && <Body muted style={{ padding: space.md }}>Nothing matches.</Body>}
      </ScrollView>
    </Sheet>
  );
}

/** A button that looks like a form control and opens a PickerSheet. */
export function SelectButton({
  value, placeholder, onPress, left, warn,
}: {
  value?: string; placeholder: string; onPress: () => void; left?: ReactNode; warn?: boolean;
}) {
  const c = useColors();
  const s = useStyles(makeStyles);
  return (
    <PressScale onPress={onPress} style={[s.select, warn && { borderColor: c.red }]} containerStyle={{ flex: 1 }}>
      {left}
      <Text style={[s.selectText, !value && { color: c.faint }]} numberOfLines={1}>{value || placeholder}</Text>
      <Icon name="chevron-down" size={20} color={c.muted} />
    </PressScale>
  );
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', padding: space.xl, gap: space.sm }}>
      <Icon name={icon} size={48} color={c.faint} />
      <Title size={24}>{title}</Title>
      {body ? <Body muted style={{ textAlign: 'center' }}>{body}</Body> : null}
      {action}
    </View>
  );
}

export const makeStyles = (c: Colors) => ({
  card: {
    backgroundColor: c.panel, borderWidth: 2, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: space.sm,
    ...comicShadow(c, 4),
  },
  cardHead: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  btn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6,
    borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 14, minHeight: 44,
    ...comicShadow(c, 2),
  },
  btnSm: { paddingVertical: 6, paddingHorizontal: 10, minHeight: 34 },
  btnGhost: { borderColor: 'transparent', boxShadow: undefined },
  btnText: { fontWeight: '800' as const, fontSize: 15 },
  chip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, borderWidth: 2, borderColor: c.line,
    borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, minHeight: 36,
  },
  chipSm: { paddingVertical: 3, paddingHorizontal: 8, minHeight: 28 },
  chipText: { fontWeight: '700' as const, fontSize: 14 },
  seg: { flexDirection: 'row' as const, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, overflow: 'hidden' as const },
  segItem: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 4, paddingVertical: 9, borderColor: c.line, minHeight: 40 },
  segText: { fontWeight: '800' as const, fontSize: 13 },
  section: { marginTop: space.lg, marginBottom: space.sm, gap: 2 },
  sectionRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: space.sm },
  note: { color: c.muted, fontSize: 13, lineHeight: 18 },
  callout: {
    flexDirection: 'row' as const, gap: space.sm, backgroundColor: c.hi, borderWidth: 2, borderColor: c.line, borderStyle: 'dashed' as const,
    borderRadius: radius.sm, padding: space.md, marginVertical: space.sm,
  },
  body: { color: c.ink, fontSize: 15, lineHeight: 21 },
  muted: { color: c.muted },
  label: { color: c.muted, fontSize: 11, fontWeight: '800' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
  input: {
    borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, backgroundColor: c.panel, color: c.ink,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, minHeight: 44,
  },
  stepper: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.sm },
  stepBtn: { width: 40, height: 40, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm, backgroundColor: c.panel2, alignItems: 'center' as const, justifyContent: 'center' as const },
  stepBtnLg: { width: 60, height: 60, borderRadius: radius.md, ...comicShadow(c, 3) },
  stepVal: { fontFamily: fonts.display, fontSize: 26, color: c.ink, minWidth: 40, textAlign: 'center' as const },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' as const },
  sheet: {
    backgroundColor: c.bg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 2, borderColor: c.line,
    paddingHorizontal: space.lg, paddingTop: space.md, maxHeight: '88%' as const, width: '100%' as const, maxWidth: 720, alignSelf: 'center' as const,
  },
  sheetHead: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: space.sm },
  search: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm,
    backgroundColor: c.panel, paddingHorizontal: 10, marginBottom: space.sm,
  },
  searchInput: { flex: 1, color: c.ink, fontSize: 16, paddingVertical: 9 },
  pickGroup: { color: c.muted, fontSize: 11, fontWeight: '800' as const, letterSpacing: 1, textTransform: 'uppercase' as const, marginTop: space.md, marginBottom: 4 },
  pickRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.sm, paddingVertical: 11, paddingHorizontal: space.sm, borderRadius: radius.sm, minHeight: 46 },
  pickLabel: { color: c.ink, fontSize: 16, fontWeight: '700' as const },
  pickSub: { color: c.muted, fontSize: 13, marginTop: 1 },
  select: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: space.sm, borderWidth: 2, borderColor: c.line, borderRadius: radius.sm,
    backgroundColor: c.panel, paddingHorizontal: 10, minHeight: 44,
  },
  selectText: { flex: 1, color: c.ink, fontSize: 15, fontWeight: '600' as const },
});
