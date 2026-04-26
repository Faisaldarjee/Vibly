import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { CardSkeleton } from '@/components/Skeleton';
import { api } from '@/constants/Api';
import { showToast } from '@/lib/toast';

const CATEGORIES = [
  { key: 'fitness', label: 'Fitness', icon: 'barbell-outline' as const, color: '#EF4444' },
  { key: 'mental', label: 'Mental', icon: 'happy-outline' as const, color: '#8B5CF6' },
  { key: 'nutrition', label: 'Nutrition', icon: 'nutrition-outline' as const, color: '#10B981' },
  { key: 'sleep', label: 'Sleep', icon: 'moon-outline' as const, color: '#3B82F6' },
];
const CHALLENGE_ICONS: Record<string, { icon: string; color: string }> = {
  water: { icon: 'water', color: '#3B82F6' },
  meditate: { icon: 'leaf', color: '#10B981' },
  sleep: { icon: 'moon', color: '#8B5CF6' },
  steps: { icon: 'walk', color: '#F59E0B' },
  nutrition: { icon: 'nutrition', color: '#EF4444' },
  custom: { icon: 'flash', color: '#EC4899' },
};

function getMilestone(pct: number) {
  if (pct >= 100) return { label: '\uD83C\uDFC6 Complete!', color: '#F59E0B' };
  if (pct >= 75) return { label: '\uD83D\uDD25 75% there!', color: '#EF4444' };
  if (pct >= 50) return { label: '\u2B50 Halfway!', color: '#8B5CF6' };
  if (pct >= 25) return { label: '\uD83D\uDE80 25% done', color: '#3B82F6' };
  return null;
}

export default function GoalsScreen() {
  const [tab, setTab] = useState<'goals' | 'challenges'>('goals');
  // Goals state
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('fitness');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [showProgress, setShowProgress] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState('');
  // Challenges state
  const [challenges, setChallenges] = useState<any[]>([]);
  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cDays, setCDays] = useState('7');
  const [cTarget, setCTarget] = useState('');
  const [cType, setCType] = useState('custom');
  const [showLeaderboard, setShowLeaderboard] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbChallenge, setLbChallenge] = useState<any>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [g, c] = await Promise.all([api('/goals'), api('/challenges')]);
      setGoals(g);
      setChallenges(c);
    } catch (_e) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  // Goal actions
  async function addGoal() {
    if (!title.trim() || !target || !unit.trim()) { Alert.alert('Error', 'Please fill all fields'); return; }
    setSaving(true);
    try {
      const g = await api('/goals', { method: 'POST', body: JSON.stringify({ title: title.trim(), category, target: parseFloat(target), unit: unit.trim() }) });
      setGoals(prev => [...prev, g]);
      setShowAddGoal(false); setTitle(''); setTarget(''); setUnit('');
      showToast('Goal created! 🏆', 'success');
    } catch (e: any) { showToast(e.message || 'Could not create goal', 'error'); }
    setSaving(false);
  }
  async function updateProgress(goalId: string) {
    const val = parseFloat(progressVal);
    if (isNaN(val)) return;
    try { await api(`/goals/${goalId}/progress`, { method: 'PUT', body: JSON.stringify({ value: val }) }); setShowProgress(null); setProgressVal(''); showToast('Progress updated! 📈', 'success'); fetchAll(); } catch (_e) { showToast('Could not update progress', 'error'); }
  }
  async function deleteGoal(id: string) {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await api(`/goals/${id}`, { method: 'DELETE' }); setGoals(prev => prev.filter(g => g.id !== id)); showToast('Goal deleted', 'info'); } catch (_e) { showToast('Could not delete goal', 'error'); } } }]);
  }

  // Challenge actions
  async function addChallenge() {
    if (!cTitle.trim() || !cDesc.trim()) { Alert.alert('Error', 'Please fill title and description'); return; }
    setSaving(true);
    try {
      const c = await api('/challenges', { method: 'POST', body: JSON.stringify({ title: cTitle.trim(), description: cDesc.trim(), habit_type: cType, duration_days: parseInt(cDays) || 7, daily_target: cTarget.trim() }) });
      setChallenges(prev => [c, ...prev]);
      setShowAddChallenge(false); setCTitle(''); setCDesc(''); setCTarget('');
      showToast('Challenge created! 🚀', 'success');
    } catch (e: any) { showToast(e.message || 'Could not create challenge', 'error'); }
    setSaving(false);
  }
  async function joinChallenge(id: string) {
    try { await api(`/challenges/${id}/join`, { method: 'POST' }); showToast('Joined challenge! 💪', 'success'); fetchAll(); } catch (_e) { showToast('Could not join challenge', 'error'); }
  }
  async function checkinChallenge(id: string) {
    try { const res = await api(`/challenges/${id}/checkin`, { method: 'POST' }); showToast(res.message || 'Checked in! ✅', 'success'); fetchAll(); } catch (_e) { showToast('Could not check in', 'error'); }
  }
  async function openLeaderboard(id: string) {
    setShowLeaderboard(id);
    try {
      const res = await api(`/challenges/${id}/leaderboard`);
      setLeaderboard(res.leaderboard || []);
      setLbChallenge(res.challenge || null);
    } catch (_e) {}
  }

  const catInfo = (key: string) => CATEGORIES.find(c => c.key === key) || CATEGORIES[0];
  const chIcon = (type: string) => CHALLENGE_ICONS[type] || CHALLENGE_ICONS.custom;

  return (
    <SafeAreaView style={styles.container}>
      {/* TAB SWITCHER */}
      <View style={styles.headerRow}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity testID="tab-goals" style={[styles.tabBtn, tab === 'goals' && styles.tabActive]} onPress={() => setTab('goals')}>
            <Ionicons name="trophy" size={16} color={tab === 'goals' ? '#fff' : Colors.text.muted} />
            <Text style={[styles.tabText, tab === 'goals' && styles.tabTextActive]}>Goals</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="tab-challenges" style={[styles.tabBtn, tab === 'challenges' && styles.tabActive]} onPress={() => setTab('challenges')}>
            <Ionicons name="people" size={16} color={tab === 'challenges' ? '#fff' : Colors.text.muted} />
            <Text style={[styles.tabText, tab === 'challenges' && styles.tabTextActive]}>Challenges</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity testID="add-goal-button" style={styles.addBtn} onPress={() => tab === 'goals' ? setShowAddGoal(true) : setShowAddChallenge(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: Spacing.m, gap: 12 }}>{[1,2,3].map(i => <CardSkeleton key={i} />)}</View>
      ) : tab === 'goals' ? (
        /* GOALS TAB */
        goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={56} color={Colors.text.muted} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySubtitle}>Set a goal to start tracking progress</Text>
          </View>
        ) : (
          <FlatList data={goals} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
            renderItem={({ item }) => {
              const pct = Math.min(Math.round((item.current / item.target) * 100), 100);
              const cat = catInfo(item.category);
              const ms = getMilestone(pct);
              return (
                <GlassCard testID={`goal-card-${item.id}`} style={styles.goalCard}>
                  <TouchableOpacity onLongPress={() => deleteGoal(item.id)} activeOpacity={0.8}>
                    <View style={styles.goalHeader}>
                      <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                        <Ionicons name={cat.icon} size={20} color={cat.color} />
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={styles.goalTitle}>{item.title}</Text>
                        <Text style={styles.goalMeta}>{item.current} / {item.target} {item.unit}</Text>
                      </View>
                      <Text style={[styles.goalPct, { color: pct >= 100 ? Colors.status.success : Colors.brand.secondary }]}>{pct}%</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                    </View>
                    {ms && <Text style={[styles.msText, { color: ms.color }]}>{ms.label}</Text>}
                    <TouchableOpacity testID={`update-progress-${item.id}`} style={styles.updateBtn}
                      onPress={() => { setShowProgress(item.id); setProgressVal(String(item.current)); }}>
                      <Ionicons name="add-circle-outline" size={16} color={Colors.brand.primary} />
                      <Text style={styles.updateText}>Update Progress</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </GlassCard>
              );
            }}
          />
        )
      ) : (
        /* CHALLENGES TAB */
        <FlatList data={challenges} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}><Ionicons name="people-outline" size={56} color={Colors.text.muted} /><Text style={styles.emptyTitle}>No challenges</Text><Text style={styles.emptySubtitle}>Create or join a challenge!</Text></View>
          }
          renderItem={({ item }) => {
            const ci = chIcon(item.habit_type);
            return (
              <GlassCard testID={`challenge-card-${item.id}`} style={styles.challengeCard}>
                <View style={styles.chHeader}>
                  <View style={[styles.chIconWrap, { backgroundColor: ci.color + '20' }]}>
                    <Ionicons name={ci.icon as any} size={22} color={ci.color} />
                  </View>
                  <View style={styles.chInfo}>
                    <Text style={styles.chTitle}>{item.title}</Text>
                    <Text style={styles.chDesc} numberOfLines={2}>{item.description}</Text>
                  </View>
                </View>
                <View style={styles.chMeta}>
                  <View style={styles.chTag}>
                    <Ionicons name="people-outline" size={12} color={Colors.text.secondary} />
                    <Text style={styles.chTagText}>{item.participant_count} joined</Text>
                  </View>
                  <View style={styles.chTag}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.text.secondary} />
                    <Text style={styles.chTagText}>{item.duration_days} days</Text>
                  </View>
                  {item.daily_target ? (
                    <View style={styles.chTag}>
                      <Ionicons name="flag-outline" size={12} color={Colors.text.secondary} />
                      <Text style={styles.chTagText}>{item.daily_target}</Text>
                    </View>
                  ) : null}
                  {item.joined && (
                    <View style={[styles.chTag, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                      <Text style={[styles.chTagText, { color: Colors.status.success }]}>{'\u2714'} {item.my_checkins} check-ins</Text>
                    </View>
                  )}
                </View>
                <View style={styles.chActions}>
                  {!item.joined ? (
                    <TouchableOpacity testID={`join-challenge-${item.id}`} style={styles.joinBtn} onPress={() => joinChallenge(item.id)}>
                      <Ionicons name="enter-outline" size={16} color="#fff" />
                      <Text style={styles.joinText}>Join Challenge</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity testID={`checkin-challenge-${item.id}`} style={styles.checkinBtn} onPress={() => checkinChallenge(item.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={Colors.status.success} />
                      <Text style={styles.checkinText}>Daily Check-in</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity testID={`leaderboard-${item.id}`} style={styles.lbBtn} onPress={() => openLeaderboard(item.id)}>
                    <Ionicons name="podium-outline" size={16} color={Colors.brand.secondary} />
                    <Text style={styles.lbText}>Leaderboard</Text>
                  </TouchableOpacity>
                </View>
                {item.creator_name && (
                  <Text style={styles.chCreator}>by {item.creator_name}</Text>
                )}
              </GlassCard>
            );
          }}
        />
      )}

      {/* ADD GOAL MODAL */}
      <Modal visible={showAddGoal} transparent animationType="slide" onRequestClose={() => setShowAddGoal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddGoal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>New Goal</Text>
              <TextInput testID="goal-title-input" style={styles.input} placeholder="Goal title..." placeholderTextColor={Colors.text.muted} value={title} onChangeText={setTitle} />
              <Text style={styles.pickLabel}>Category</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c.key} style={[styles.catPick, category === c.key && { borderColor: c.color, backgroundColor: c.color + '15' }]} onPress={() => setCategory(c.key)}>
                    <Ionicons name={c.icon} size={18} color={category === c.key ? c.color : Colors.text.secondary} />
                    <Text style={[styles.catPickText, category === c.key && { color: c.color }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.row}>
                <TextInput testID="goal-target-input" style={[styles.input, { flex: 1 }]} placeholder="Target" placeholderTextColor={Colors.text.muted} value={target} onChangeText={setTarget} keyboardType="numeric" />
                <TextInput testID="goal-unit-input" style={[styles.input, { flex: 1 }]} placeholder="Unit (km, hrs)" placeholderTextColor={Colors.text.muted} value={unit} onChangeText={setUnit} />
              </View>
              <TouchableOpacity testID="save-goal-button" style={styles.saveBtn} onPress={addGoal} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Create Goal'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* PROGRESS MODAL */}
      <Modal visible={!!showProgress} transparent animationType="fade" onRequestClose={() => setShowProgress(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowProgress(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Update Progress</Text>
              <TextInput testID="progress-value-input" style={styles.input} placeholder="Current value" placeholderTextColor={Colors.text.muted} value={progressVal} onChangeText={setProgressVal} keyboardType="numeric" />
              <TouchableOpacity testID="save-progress-button" style={styles.saveBtn} onPress={() => showProgress && updateProgress(showProgress)}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ADD CHALLENGE MODAL */}
      <Modal visible={showAddChallenge} transparent animationType="slide" onRequestClose={() => setShowAddChallenge(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddChallenge(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <ScrollView>
              <View style={styles.sheet}>
                <View style={styles.handle} />
                <Text style={styles.sheetTitle}>Create Challenge</Text>
                <TextInput testID="challenge-title-input" style={styles.input} placeholder="Challenge title..." placeholderTextColor={Colors.text.muted} value={cTitle} onChangeText={setCTitle} />
                <TextInput testID="challenge-desc-input" style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]} placeholder="Description..." placeholderTextColor={Colors.text.muted} value={cDesc} onChangeText={setCDesc} multiline />
                <View style={styles.row}>
                  <TextInput testID="challenge-days-input" style={[styles.input, { flex: 1 }]} placeholder="Days" placeholderTextColor={Colors.text.muted} value={cDays} onChangeText={setCDays} keyboardType="numeric" />
                  <TextInput testID="challenge-target-input" style={[styles.input, { flex: 2 }]} placeholder="Daily target (e.g. 8 glasses)" placeholderTextColor={Colors.text.muted} value={cTarget} onChangeText={setCTarget} />
                </View>
                <Text style={styles.pickLabel}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {Object.entries(CHALLENGE_ICONS).map(([key, val]) => (
                    <TouchableOpacity key={key} style={[styles.typePick, cType === key && { borderColor: val.color, backgroundColor: val.color + '15' }]} onPress={() => setCType(key)}>
                      <Ionicons name={val.icon as any} size={18} color={cType === key ? val.color : Colors.text.secondary} />
                      <Text style={[styles.typeText, cType === key && { color: val.color }]}>{key}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity testID="save-challenge-button" style={styles.saveBtn} onPress={addChallenge} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Creating...' : 'Create Challenge'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* LEADERBOARD MODAL */}
      <Modal visible={!!showLeaderboard} transparent animationType="slide" onRequestClose={() => setShowLeaderboard(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowLeaderboard(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>{'\uD83C\uDFC6'} Leaderboard</Text>
              {lbChallenge && <Text style={styles.lbChallengeTitle}>{lbChallenge.title}</Text>}
              {leaderboard.length === 0 ? (
                <Text style={styles.noData}>No participants yet. Be the first!</Text>
              ) : (
                leaderboard.map((entry, i) => (
                  <View key={i} style={[styles.lbRow, entry.is_me && styles.lbRowMe]}>
                    <Text style={styles.lbRank}>{entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : entry.rank === 3 ? '\uD83E\uDD49' : `#${entry.rank}`}</Text>
                    <Text style={[styles.lbName, entry.is_me && { color: Colors.brand.primary, fontWeight: '700' }]}>{entry.name} {entry.is_me ? '(You)' : ''}</Text>
                    <Text style={styles.lbCheckins}>{entry.checkins} {'\u2714'}</Text>
                  </View>
                ))
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.m, paddingTop: 8, paddingBottom: 8 },
  tabSwitcher: { flexDirection: 'row', backgroundColor: Colors.glass.bg, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: Colors.glass.border },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  tabActive: { backgroundColor: Colors.brand.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.text.muted },
  tabTextActive: { color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  emptySubtitle: { fontSize: 13, color: Colors.text.secondary },
  // Goal card
  goalCard: { marginBottom: 12, padding: 16 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  catIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  goalMeta: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  goalPct: { fontSize: 18, fontWeight: '700' },
  barBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  msText: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 10 },
  updateText: { fontSize: 12, color: Colors.brand.primary, fontWeight: '500' },
  // Challenge card
  challengeCard: { marginBottom: 12, padding: 16 },
  chHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  chIconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  chInfo: { flex: 1 },
  chTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  chDesc: { fontSize: 12, color: Colors.text.secondary, marginTop: 3, lineHeight: 17 },
  chMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  chTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chTagText: { fontSize: 11, color: Colors.text.secondary },
  chActions: { flexDirection: 'row', gap: 8 },
  joinBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.brand.primary, borderRadius: 12, paddingVertical: 10 },
  joinText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  checkinBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  checkinText: { fontSize: 13, fontWeight: '600', color: Colors.status.success },
  lbBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: 12 },
  lbText: { fontSize: 12, color: Colors.brand.secondary, fontWeight: '500' },
  chCreator: { fontSize: 10, color: Colors.text.muted, marginTop: 8 },
  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.text.muted, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  input: { backgroundColor: Colors.glass.bg, borderRadius: Radius.m, borderWidth: 1, borderColor: Colors.glass.border, paddingHorizontal: 16, height: 52, color: '#fff', fontSize: 16, marginBottom: 16 },
  pickLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8 },
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  catPick: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.glass.border, backgroundColor: Colors.glass.bg },
  catPickText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12 },
  typePick: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.glass.border, backgroundColor: Colors.glass.bg, marginRight: 8 },
  typeText: { fontSize: 12, color: Colors.text.secondary, fontWeight: '500' },
  saveBtn: { backgroundColor: Colors.brand.primary, borderRadius: Radius.m, height: 52, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Leaderboard
  lbChallengeTitle: { fontSize: 14, color: Colors.text.secondary, marginBottom: 16, marginTop: -12 },
  noData: { fontSize: 13, color: Colors.text.muted, textAlign: 'center', paddingVertical: 20 },
  lbRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  lbRowMe: { backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 12, paddingHorizontal: 12, marginHorizontal: -12, borderBottomWidth: 0 },
  lbRank: { width: 40, fontSize: 18, textAlign: 'center' },
  lbName: { flex: 1, fontSize: 15, color: '#fff', fontWeight: '500' },
  lbCheckins: { fontSize: 14, color: Colors.status.success, fontWeight: '600' },
});
