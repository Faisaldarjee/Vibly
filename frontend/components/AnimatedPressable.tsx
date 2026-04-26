import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface AnimatedPressableProps extends TouchableOpacityProps {
  /** Enable haptic feedback on press. Default: true */
  haptic?: boolean;
  /** Scale value when pressed. Default: 0.96 */
  scaleValue?: number;
  /** Haptic feedback style. Default: Light */
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export function AnimatedPressable({
  children,
  haptic = true,
  scaleValue = 0.96,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      {...props}
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        scale.value = withSpring(scaleValue, { damping: 15, stiffness: 400 });
        if (haptic) {
          Haptics.impactAsync(hapticStyle);
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        onPressOut?.(e);
      }}
      onPress={onPress}
      activeOpacity={1}
    >
      {children}
    </AnimatedTouchable>
  );
}
