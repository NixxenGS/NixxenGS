import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BALANCE_LIMIT } from '../data/game';
import { formatMod } from '../lib/roll';
import { tap } from '../lib/haptics';
import { colors, radius, space, type } from '../theme';
import { IconButton } from './ui';

const SLOTS = BALANCE_LIMIT * 2 + 1;
const KNOB = 30;

export function BalanceTrack({
  principles,
  balance,
  center,
  onChange,
  onOverflow,
  colorA = '#4FA3E0',
  colorB = '#E5533D',
}: {
  principles: [string, string];
  balance: number;
  center: number;
  onChange: (n: number) => void;
  /** Called when a shift would push balance off the end of the track. */
  onOverflow: (towardIndex: 0 | 1) => void;
  colorA?: string;
  colorB?: string;
}) {
  const [width, setWidth] = useState(0);
  const step = width > 0 ? (width - KNOB) / (SLOTS - 1) : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring((balance + BALANCE_LIMIT) * step, { damping: 14, stiffness: 180 });
  }, [balance, step, x]);

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const shift = (dir: -1 | 1) => {
    const next = balance + dir;
    if (Math.abs(next) > BALANCE_LIMIT) onOverflow(dir < 0 ? 0 : 1);
    else onChange(next);
  };

  const knobColor = balance < 0 ? colorA : balance > 0 ? colorB : colors.text;

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.labels}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.principle, { color: colorA }]}>{principles[0]}</Text>
          <Text style={type.caption}>{formatMod(-balance)}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[styles.principle, { color: colorB }]}>{principles[1]}</Text>
          <Text style={type.caption}>{formatMod(balance)}</Text>
        </View>
      </View>

      <View style={styles.trackRow}>
        <IconButton icon="chevron-left" label={`Shift toward ${principles[0]}`} onPress={() => shift(-1)} color={colorA} />
        <View style={{ flex: 1, height: KNOB }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          <View style={[styles.line, { left: KNOB / 2, right: KNOB / 2 }]} />
          {width > 0 &&
            Array.from({ length: SLOTS }, (_, i) => {
              const value = i - BALANCE_LIMIT;
              const isCenter = value === center;
              return (
                <Pressable
                  key={i}
                  accessibilityLabel={`Set balance to ${value}`}
                  onPress={() => {
                    tap();
                    onChange(value);
                  }}
                  style={[styles.slot, { left: i * step }]}
                >
                  {isCenter ? (
                    <MaterialCommunityIcons name="yin-yang" size={18} color={colors.accent} />
                  ) : (
                    <View style={styles.dot} />
                  )}
                </Pressable>
              );
            })}
          {width > 0 && (
            <Animated.View pointerEvents="none" style={[styles.knob, { borderColor: knobColor }, knobStyle]}>
              <View style={[styles.knobInner, { backgroundColor: knobColor }]} />
            </Animated.View>
          )}
        </View>
        <IconButton icon="chevron-right" label={`Shift toward ${principles[1]}`} onPress={() => shift(1)} color={colorB} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  principle: { fontSize: 17, fontWeight: '800' },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  line: { position: 'absolute', top: KNOB / 2 - 1, height: 2, backgroundColor: colors.border, borderRadius: 1 },
  slot: { position: 'absolute', width: KNOB, height: KNOB, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textFaint },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: radius.pill,
    borderWidth: 3,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobInner: { width: 10, height: 10, borderRadius: 5 },
});
