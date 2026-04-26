import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, G, Circle, Path, Line } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { StatsSkeleton, CardSkeleton } from '@/components/Skeleton';
import { api } from '@/constants/Api';

const { width: SW } = Dimensions.get('window');
const MOODS_MAP: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '\uD83D\uDE2B', label: 'Terrible' },
  2: { emoji: '\uD83D\uDE14', label: 'Bad' },
  3: { emoji: '\uD83D\uDE10', label: 'Okay' },
  4: { emoji: '\uD83D\uDE42', label: 'Good' },
  5: { emoji: '\uD83D\uDE04', label: 'Amazing' },
};

// ==================== SVG LINE CHART ====================
function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const pad = 16, w = SW - 64, h = 140;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (w - 2 * pad),
    y: pad + (1 - v / max) * (h - 2 * pad),
  }));
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${lineD} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`;
  return (
    <Svg width={w} height={h + 20}>
      {[0.25, 0.5, 0.75].map(f => (
        <Line key={f} x1={pad} y1={pad + (1 - f) * (h - 2 * pad)} x2={w - pad} y2={pad + (1 - f) * (h - 2 * pad)}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      <Path d={areaD} fill="rgba(124,58,237,0.08)" />
      <Path d={lineD} stroke={Colors.brand.primary} strokeWidth={2.5} fill="none" />
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill={Colors.brand.primary} />
          <Circle cx={p.x} cy={p.y} r={2} fill="#fff" />
        </G>
      ))}
      {labels.map((l, i) => (
        <SvgText key={i} x={pts[i]?.x || 0} y={h + 14} fill={Colors.text.secondary}
          fontSize={9} textAnchor="middle">{l}</SvgText>
      ))}
    </Svg>
  );
}

// ==================== HORIZONTAL BAR ====================
function HBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.hbarRow}>
      <Text style={styles.hbarLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.hbarBg}>
        <View style={[styles.hbarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.hbarPct, { color }]}>{pct}%</Text>
    </View>
  );
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [vibeData, setVibeData] = useState<any>({ today: 0, weekly: [], labels: [], max_streak: 0 });
  const [summary, setSummary] = useState<any>({ habit_consistency: [], mood_distribution: {}, avg_sleep: 0, total_logs: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vibe, sum] = await Promise.all([
        api('/analytics/vibe-score'),
        api('/analytics/summary'),
      ]);
      setVibeData(vibe);
      setSummary(sum);
    } catch (_e) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const moodTotal = Object.values(summary.mood_distribution || {}).reduce((a: number, b: any) => a + (b as number), 0) as number;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Analytics</Text>
          <StatsSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Analytics</Text>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{vibeData.today}</Text>
            <Text style={styles.summaryLabel}>Today's Vibe</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{vibeData.max_streak}</Text>
            <Text style={styles.summaryLabel}>Best Streak</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{summary.avg_sleep}h</Text>
            <Text style={styles.summaryLabel}>Avg Sleep</Text>
          </GlassCard>
        </View>

        {/* VIBE SCORE TREND */}
        <GlassCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Vibe Score Trend</Text>
            <Text style={styles.chartPeriod}>Last 7 days</Text>
          </View>
          {vibeData.weekly.length > 0 ? (
            <LineChart data={vibeData.weekly} labels={vibeData.labels} />
          ) : (
            <Text style={styles.noData}>Start logging to see trends</Text>
          )}
        </GlassCard>

        {/* HABIT CONSISTENCY */}
        <GlassCard style={styles.chartCard}>
          <Text style={styles.cardTitle}>Habit Consistency (30 days)</Text>
          {summary.habit_consistency.length > 0 ? (
            <View style={{ marginTop: 12, gap: 10 }}>
              {summary.habit_consistency.map((h: any, i: number) => (
                <HBar key={i} label={h.name} pct={h.consistency} color={h.color} />
              ))}
            </View>
          ) : (
            <Text style={styles.noData}>Add habits to track consistency</Text>
          )}
        </GlassCard>

        {/* MOOD DISTRIBUTION */}
        <GlassCard style={styles.chartCard}>
          <Text style={styles.cardTitle}>Mood Distribution</Text>
          {moodTotal > 0 ? (
            <View style={styles.moodGrid}>
              {[5, 4, 3, 2, 1].map(val => {
                const count = (summary.mood_distribution || {})[val] || 0;
                const pct = moodTotal > 0 ? Math.round((count / moodTotal) * 100) : 0;
                return (
                  <View key={val} style={styles.moodItem}>
                    <Text style={styles.moodEmoji}>{MOODS_MAP[val]?.emoji}</Text>
                    <View style={styles.moodBarBg}>
                      <View style={[styles.moodBarFill, { height: `${Math.max(pct, 4)}%` }]} />
                    </View>
                    <Text style={styles.moodPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noData}>Log your mood to see distribution</Text>
          )}
        </GlassCard>

        {/* WEEKLY REPORT CARD */}
        <GlassCard style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Ionicons name="document-text-outline" size={20} color={Colors.brand.secondary} />
            <Text style={styles.reportTitle}>Weekly Report</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Avg Vibe Score</Text>
            <Text style={styles.reportValue}>
              {vibeData.weekly.length > 0
                ? Math.round(vibeData.weekly.reduce((a: number, b: number) => a + b, 0) / vibeData.weekly.length)
                : 0}
            </Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Total Habit Logs</Text>
            <Text style={styles.reportValue}>{summary.total_logs}</Text>
          </View>
          <View style={styles.reportRow}>
            <Text style={styles.reportLabel}>Avg Sleep</Text>
            <Text style={styles.reportValue}>{summary.avg_sleep}h</Text>
          </View>
        </GlassCard>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  scroll: { padding: Spacing.m, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  summaryVal: { fontSize: 24, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 10, color: Colors.text.secondary, marginTop: 4 },
  chartCard: { marginBottom: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  chartPeriod: { fontSize: 11, color: Colors.text.muted },
  noData: { fontSize: 13, color: Colors.text.muted, textAlign: 'center', paddingVertical: 20 },
  hbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hbarLabel: { width: 80, fontSize: 12, color: Colors.text.secondary },
  hbarBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  hbarFill: { height: '100%', borderRadius: 4 },
  hbarPct: { width: 36, fontSize: 12, fontWeight: '600', textAlign: 'right' },
  moodGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, height: 120 },
  moodItem: { alignItems: 'center', gap: 6, flex: 1 },
  moodEmoji: { fontSize: 22 },
  moodBarBg: {
    flex: 1, width: 24, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end',
  },
  moodBarFill: { width: '100%', backgroundColor: Colors.brand.primary, borderRadius: 12 },
  moodPct: { fontSize: 10, color: Colors.text.secondary },
  reportCard: { marginBottom: 16, backgroundColor: 'rgba(124, 58, 237, 0.08)', borderColor: 'rgba(124,58,237,0.2)' },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  reportTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  reportLabel: { fontSize: 14, color: Colors.text.secondary },
  reportValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
