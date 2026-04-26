import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share, Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { CardSkeleton, StatsSkeleton, Skeleton } from '@/components/Skeleton';
import { api } from '@/constants/Api';
import { useAuth } from '../_layout';
import { showToast } from '@/lib/toast';

const ACHIEVEMENTS = [
  { id: 'first_habit', title: 'First Habit', desc: 'Created your first habit', icon: 'star', condition: (s: any) => s.total_habits >= 1 },
  { id: 'five_habits', title: 'Habit Builder', desc: 'Created 5 habits', icon: 'layers', condition: (s: any) => s.total_habits >= 5 },
  { id: 'streak_7', title: '7 Day Streak', desc: 'Kept a 7 day streak', icon: 'flame', condition: (s: any) => s.total_completions >= 7 },
  { id: 'perfect_week', title: 'Perfect Week', desc: '50+ habit completions', icon: 'ribbon', condition: (s: any) => s.total_completions >= 50 },
  { id: 'goal_setter', title: 'Goal Setter', desc: 'Set your first goal', icon: 'trophy', condition: (s: any) => s.total_goals >= 1 },
  { id: 'goal_crusher', title: 'Goal Crusher', desc: 'Completed a goal', icon: 'medal', condition: (s: any) => s.completed_goals >= 1 },
];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch { return ''; }
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<any>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api('/profile'), api('/share')]);
      setProfile(p);
      setShareData(s);
    } catch (_e) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  }

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={{ alignItems: 'center', marginBottom: 24, gap: 10 }}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <Skeleton width={160} height={22} />
            <Skeleton width={200} height={14} />
          </View>
          <StatsSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const stats = profile.stats || {};
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.condition(stats));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.condition(stats));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* AVATAR + INFO */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name || 'U')}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.memberSince}>Member since {formatDate(profile.created_at)}</Text>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statVal}>{stats.total_habits || 0}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statVal}>{stats.total_completions || 0}</Text>
            <Text style={styles.statLabel}>Completions</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statVal}>{stats.total_goals || 0}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statVal}>{stats.completed_goals || 0}</Text>
            <Text style={styles.statLabel}>Achieved</Text>
          </GlassCard>
        </View>

        {/* ACHIEVEMENTS */}
        <Text style={styles.sectionTitle}>Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</Text>
        <View style={styles.achieveGrid}>
          {unlockedAchievements.map(a => (
            <GlassCard key={a.id} testID={`achievement-${a.id}`} style={styles.achieveCard}>
              <View style={styles.achieveIcon}>
                <Ionicons name={a.icon as any} size={24} color={Colors.brand.primary} />
              </View>
              <Text style={styles.achieveTitle}>{a.title}</Text>
              <Text style={styles.achieveDesc}>{a.desc}</Text>
            </GlassCard>
          ))}
          {lockedAchievements.map(a => (
            <GlassCard key={a.id} style={[styles.achieveCard, styles.achieveLocked]}>
              <View style={[styles.achieveIcon, styles.achieveIconLocked]}>
                <Ionicons name="lock-closed" size={20} color={Colors.text.muted} />
              </View>
              <Text style={[styles.achieveTitle, { color: Colors.text.muted }]}>{a.title}</Text>
              <Text style={styles.achieveDesc}>{a.desc}</Text>
            </GlassCard>
          ))}
        </View>

        {/* SHARE STREAK */}
        {shareData && shareData.streak > 0 && (
          <GlassCard testID="share-streak-card" style={styles.shareCard}>
            <View style={styles.shareHeader}>
              <Text style={styles.shareFireEmoji}>{'\uD83D\uDD25'}</Text>
              <View>
                <Text style={styles.shareStreakNum}>{shareData.streak}-day streak!</Text>
                <Text style={styles.shareBestHabit}>{shareData.best_habit} • {shareData.total_completions} total completions</Text>
              </View>
            </View>
            <TouchableOpacity testID="share-streak-button" style={styles.shareBtn}
              onPress={async () => {
                try {
                  await Share.share({ message: shareData.share_text });
                } catch (_e) { Alert.alert('Copied!', shareData.share_text); }
              }}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share Streak</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* PRO CARD */}
        <GlassCard testID="pro-upgrade-card" style={styles.proCard}>
          <View style={styles.proBadge}>
            <Ionicons name="diamond" size={16} color="#F59E0B" />
            <Text style={styles.proLabel}>PRO</Text>
          </View>
          <Text style={styles.proTitle}>Upgrade to Vibly Pro</Text>
          <Text style={styles.proDesc}>
            Unlimited habits, advanced analytics, custom themes, and data export
          </Text>
          <View style={styles.proPricing}>
            <TouchableOpacity testID="pro-monthly-btn" style={styles.priceBtn}>
              <Text style={styles.priceAmount}>$4.99</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="pro-yearly-btn" style={[styles.priceBtn, styles.priceBtnPopular]}>
              <Text style={styles.popularTag}>SAVE 40%</Text>
              <Text style={styles.priceAmount}>$29.99</Text>
              <Text style={styles.pricePeriod}>/year</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* SETTINGS */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <GlassCard style={{ padding: 0 }}>
          {[
            { icon: 'notifications-outline', label: 'Notifications', value: 'On' },
            { icon: 'moon-outline', label: 'Dark Mode', value: 'Always' },
            { icon: 'scale-outline', label: 'Weight Unit', value: 'kg' },
            { icon: 'information-circle-outline', label: 'About VIBLY', value: 'v1.0.0' },
          ].map((item, i) => (
            <TouchableOpacity key={i} testID={`setting-${item.label.toLowerCase().replace(/\s/g, '-')}`} style={[styles.settingRow, i > 0 && styles.settingBorder]}>
              <Ionicons name={item.icon as any} size={20} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingValue}>{item.value}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
            </TouchableOpacity>
          ))}
        </GlassCard>

        {/* LOGOUT */}
        <TouchableOpacity testID="logout-button" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  scroll: { padding: Spacing.m, paddingBottom: 40 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 12 },
  email: { fontSize: 13, color: Colors.text.secondary, marginTop: 4 },
  memberSince: { fontSize: 11, color: Colors.text.muted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  statVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 9, color: Colors.text.secondary, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12, marginTop: 8 },
  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  achieveCard: { width: '47%', alignItems: 'center', paddingVertical: 16 },
  achieveLocked: { opacity: 0.5 },
  achieveIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(124,58,237,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  achieveIconLocked: { backgroundColor: 'rgba(255,255,255,0.05)' },
  achieveTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  achieveDesc: { fontSize: 10, color: Colors.text.secondary, textAlign: 'center', marginTop: 2 },
  proCard: {
    marginBottom: 24, borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.05)',
  },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10,
  },
  proLabel: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  proTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  proDesc: { fontSize: 13, color: Colors.text.secondary, lineHeight: 19, marginBottom: 16 },
  proPricing: { flexDirection: 'row', gap: 12 },
  priceBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: Colors.glass.bg, borderRadius: Radius.m,
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  priceBtnPopular: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.08)' },
  popularTag: { fontSize: 9, fontWeight: '700', color: '#F59E0B', marginBottom: 4 },
  priceAmount: { fontSize: 20, fontWeight: '700', color: '#fff' },
  pricePeriod: { fontSize: 11, color: Colors.text.secondary },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingBorder: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)' },
  settingLabel: { flex: 1, fontSize: 14, color: '#fff' },
  settingValue: { fontSize: 13, color: Colors.text.secondary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, paddingVertical: 14,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: Radius.m,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.status.error },
  // Share
  shareCard: { marginBottom: 24, borderColor: 'rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.05)' },
  shareHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  shareFireEmoji: { fontSize: 36 },
  shareStreakNum: { fontSize: 20, fontWeight: '800', color: '#F59E0B' },
  shareBestHabit: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.brand.primary, borderRadius: 14, paddingVertical: 12 },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
