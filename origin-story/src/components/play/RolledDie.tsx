import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { DieBadge } from '../ui';

/** A die that tumbles each time rollKey changes. */
export function RolledDie({ size, value, rollKey, delay = 0, px = 56, fill, label }: { size: number; value?: number | string; rollKey: number; delay?: number; px?: number; fill?: string; label?: string }) {
  const rot = useSharedValue(0);
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!rollKey) return;
    rot.value = 0;
    // Two full turns so the number always lands upright.
    rot.value = withDelay(delay, withTiming(720, { duration: 600, easing: Easing.out(Easing.cubic) }));
    lift.value = withDelay(delay, withSequence(withTiming(-24, { duration: 200 }), withSpring(0, { damping: 8, stiffness: 220 })));
    scale.value = withDelay(delay, withSequence(withTiming(0.8, { duration: 150 }), withSpring(1, { damping: 7, stiffness: 260 })));
  }, [rollKey, delay, rot, lift, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: lift.value }, { rotate: `${rot.value}deg` }, { scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <DieBadge size={size} value={value} px={px} fill={fill} label={label} />
    </Animated.View>
  );
}
