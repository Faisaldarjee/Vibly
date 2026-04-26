import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/constants/Colors';

// ==================== BASE SKELETON ====================
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.25, 0.5]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ==================== PRE-BUILT SKELETONS ====================

/** Skeleton for habit/goal cards */
export function CardSkeleton() {
  return (
    <View style={sStyles.card}>
      <View style={sStyles.row}>
        <Skeleton width={44} height={44} borderRadius={14} />
        <View style={sStyles.col}>
          <Skeleton width="65%" height={14} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton for the Vibe Score ring */
export function VibeScoreSkeleton() {
  return (
    <View style={sStyles.vibeCard}>
      <Skeleton width={156} height={156} borderRadius={78} />
      <Skeleton
        width={180}
        height={12}
        borderRadius={6}
        style={{ marginTop: 14 }}
      />
    </View>
  );
}

/** Skeleton for stats summary row */
export function StatsSkeleton() {
  return (
    <View style={sStyles.statsRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={sStyles.statCard}>
          <Skeleton width={48} height={28} borderRadius={6} />
          <Skeleton
            width={60}
            height={10}
            borderRadius={4}
            style={{ marginTop: 8 }}
          />
        </View>
      ))}
    </View>
  );
}

/** Skeleton for Quick Log row */
export function QuickLogSkeleton() {
  return (
    <View style={sStyles.quickRow}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={sStyles.quickCard}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={32} height={16} borderRadius={4} style={{ marginTop: 6 }} />
          <Skeleton width={40} height={8} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

/** Full home page skeleton */
export function HomeSkeleton() {
  return (
    <View style={sStyles.homePage}>
      {/* Greeting skeleton */}
      <View style={[sStyles.row, { justifyContent: 'space-between', marginBottom: 20 }]}>
        <View style={{ gap: 6 }}>
          <Skeleton width={120} height={14} />
          <Skeleton width={160} height={22} />
        </View>
        <Skeleton width={56} height={32} borderRadius={16} />
      </View>
      {/* Vibe score */}
      <VibeScoreSkeleton />
      {/* Habits */}
      <Skeleton width={120} height={16} style={{ marginBottom: 12 }} />
      <View style={[sStyles.quickRow, { marginBottom: 20 }]}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width={120} height={44} borderRadius={16} />
        ))}
      </View>
      {/* Quick log */}
      <Skeleton width={80} height={16} style={{ marginBottom: 12 }} />
      <QuickLogSkeleton />
      {/* Chart */}
      <View style={sStyles.card}>
        <Skeleton width={140} height={14} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={100} borderRadius={8} />
      </View>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 8,
  },
  vibeCard: {
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: 16,
    alignItems: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.glass.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    paddingVertical: 14,
  },
  homePage: {
    padding: 16,
  },
});
