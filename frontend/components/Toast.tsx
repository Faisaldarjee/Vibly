import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerToastHandler } from '@/lib/toast';
import { Colors } from '@/constants/Colors';
import type { ToastType } from '@/types';

const TOAST_CONFIG: Record<ToastType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  error: { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  info: { icon: 'information-circle', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  warning: { icon: 'warning', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
};

export function GlobalToast() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-120, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 });
    setTimeout(() => setVisible(false), 260);
  }, []);

  const show = useCallback((msg: string, t: ToastType) => {
    // Clear existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setMessage(msg);
    setType(t);
    setVisible(true);

    // Animate in
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto dismiss after 3.5s
    timerRef.current = setTimeout(() => {
      dismiss();
    }, 3500);
  }, [dismiss]);

  useEffect(() => {
    registerToastHandler(show);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const config = TOAST_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + (Platform.OS === 'android' ? 12 : 8) },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: config.bg,
            borderLeftColor: config.color,
          },
        ]}
        onPress={dismiss}
        activeOpacity={0.9}
      >
        <Ionicons name={config.icon as any} size={22} color={config.color} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    // Glassmorphism effect
    backgroundColor: Colors.bg.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 20,
  },
});
