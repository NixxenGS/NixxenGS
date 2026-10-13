import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

// Pip positions on a 3x3 grid for faces 1-6.
const FACES: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export function Die({
  value,
  rollKey,
  size = 84,
  color = colors.text,
  delay = 0,
}: {
  value: number;
  /** Changes on every roll to replay the tumble animation. */
  rollKey: number;
  size?: number;
  color?: string;
  delay?: number;
}) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (rollKey === 0) return;
    rotate.value = 0;
    const spin = setTimeout(() => {
      rotate.value = withTiming(720 + Math.random() * 40 - 20, { duration: 650, easing: Easing.out(Easing.cubic) });
      lift.value = withSequence(
        withTiming(-28, { duration: 220, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 8, stiffness: 220 }),
      );
      scale.value = withSequence(withTiming(0.8, { duration: 160 }), withSpring(1, { damping: 7, stiffness: 260 }));
    }, delay);
    return () => clearTimeout(spin);
  }, [rollKey, delay, rotate, lift, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  const pip = size * 0.16;
  const cell = size / 3;

  return (
    <Animated.View
      style={[styles.die, { width: size, height: size, borderRadius: size * 0.2, borderColor: color + '55' }, style]}
    >
      {FACES[value]?.map(([r, c], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: pip,
            height: pip,
            borderRadius: pip / 2,
            backgroundColor: color,
            top: r * cell + (cell - pip) / 2,
            left: c * cell + (cell - pip) / 2,
          }}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  die: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
