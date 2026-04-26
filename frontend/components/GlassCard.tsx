import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function GlassCard({ children, style, testID }: GlassCardProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass.bg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: 16,
  },
});
