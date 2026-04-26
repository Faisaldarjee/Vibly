import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, Dimensions, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { HomeSkeleton } from '@/components/Skeleton';
import { api } from '@/constants/Api';
import { useAuth } from '../_layout';
import { showToast } from '@/lib/toast';

const { width: SCREEN_W } = Dimensions.get('window');
const MOODS = [
  { val: 1, emoji: '\uD83D\uDE2B', label: 'Terrible' },
  { val: 2, emoji: '\uD83D\uDE14', label: 'Bad' },
  { val: 3, emoji: '\uD83D\uDE10', label: 'Okay' },
  { val: 4, emoji: '\uD83D\uDE42', label: 'Good' },
  { val: 5, emoji: '\uD83D\uDE04', label: 'Amazing' },
];
const QUICK_PROMPTS = [
  "How's my progress today?",
  "What should I improve?",
  "Motivate me!",
  "Analyze my habits",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function VibeRing({ score }: { score: number }) {
  const r = 68, sw = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const size = (r + sw) * 2;
  const c = size / 2;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke="rgba(124,58,237,0.12)" strokeWidth={sw} fill="none" />
        <Circle cx={c} cy={c} r={r} stroke={Colors.brand.primary} strokeWidth={sw} fill="none"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" rotation={-90} origin={`${c}, ${c}`} />
      </Svg>
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: '#fff' }}>{score}</Text>
          <Text style={{ fontSize: 11, color: Colors.text.secondary, marginTop: -2 }}>Vibe Score</Text>
        </View>
      </View>
    </View>
  );
}

function WeeklyBars({ data, labels }: { data: number[]; labels: string[] }) {
  const maxVal = Math.max(...data, 1);
  const barW = 28, gap = 10, h = 90;
  const totalW = data.length * (barW + gap) - gap;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={totalW} height={h + 22}>
        {data.map((val, i) => {
          const bh = Math.max((val / maxVal) * h, 4);
          const x = i * (barW + gap);
          return (
            <G key={i}>
              <Rect x={x} y={h - bh} width={barW} height={bh} rx={6}
                fill={Colors.brand.primary} opacity={0.5 + (val / maxVal) * 0.5} />
              <SvgText x={x + barW / 2} y={h + 16} fill={Colors.text.secondary}
                fontSize={9} textAnchor="middle" fontWeight="500">{labels[i]}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vibeData, setVibeData] = useState<any>({ today: 0, weekly: [0,0,0,0,0,0,0], labels: ['M','T','W','T','F','S','S'], max_streak: 0 });
  const [habits, setHabits] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any>({});
  const [quote, setQuote] = useState('');
  const [insights, setInsights] = useState<any[]>([]);
  const [moodModal, setMoodModal] = useState(false);
  // Sleep/Steps input modals
  const [sleepModal, setSleepModal] = useState(false);
  const [sleepInput, setSleepInput] = useState('');
  const [stepsModal, setStepsModal] = useState(false);
  const [stepsInput, setStepsInput] = useState('');
  // AI Coach state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [vibe, hab, vit, q] = await Promise.all([
        api('/analytics/vibe-score'),
        api('/habits'),
        api('/vitals/today'),
        api('/quote'),
      ]);
      setVibeData(vibe);
      setHabits(hab);
      setVitals(vit);
      setQuote(q.text);
      setInsights([]);
    } catch (_e) {
      setError(true);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  async function toggleHabit(id: string) {
    try {
      const res = await api(`/habits/${id}/toggle`, { method: 'POST' });
      setHabits(prev => prev.map(h => h.id === id ? { ...h, completed_today: res.completed_today } : h));
      if (res.completed_today) showToast('Habit completed! 🎉', 'success');
      fetchAll();
    } catch (_e) {
      showToast('Could not update habit', 'error');
    }
  }

  async function logWater() {
    try {
      await api('/vitals', { method: 'POST', body: JSON.stringify({ vital_type: 'water', value: 1 }) });
      showToast('Water logged! 💧', 'success');
      fetchAll();
    } catch (_e) { showToast('Could not log water', 'error'); }
  }
  async function logMood(val: number) {
    setMoodModal(false);
    try {
      await api('/vitals', { method: 'POST', body: JSON.stringify({ vital_type: 'mood', value: val }) });
      showToast('Mood logged! 🧠', 'success');
      fetchAll();
    } catch (_e) { showToast('Could not log mood', 'error'); }
  }
  async function logSleep(val: number) {
    setSleepModal(false);
    if (isNaN(val) || val <= 0) return;
    try {
      await api('/vitals', { method: 'POST', body: JSON.stringify({ vital_type: 'sleep', value: val }) });
      showToast(`${val}h sleep logged! 🌙`, 'success');
      fetchAll();
    } catch (_e) { showToast('Could not log sleep', 'error'); }
  }
  async function logSteps(val: number) {
    setStepsModal(false);
    if (isNaN(val) || val <= 0) return;
    try {
      await api('/vitals', { method: 'POST', body: JSON.stringify({ vital_type: 'steps', value: val }) });
      showToast(`${val} steps logged! 🚶`, 'success');
      fetchAll();
    } catch (_e) { showToast('Could not log steps', 'error'); }
  }

  async function askAI(question: string) {
    setAiQuery(question);
    setAiLoading(true);
    setAiResponse('');
    setAiOpen(true);
    try {
      const res = await api('/ai/coach', { method: 'POST', body: JSON.stringify({ message: question }) });
      setAiResponse(res.response);
    } catch (_e) { setAiResponse('Sorry, could not get a response. Try again!'); }
    setAiLoading(false);
  }

  const waterCount = vitals.water?.value || 0;
  const currentMood = vitals.mood?.value ? MOODS.find(m => m.val === Math.round(vitals.mood.value)) : null;
  const sleepHrs = vitals.sleep?.value || 0;
  const stepsCount = vitals.steps?.value || 0;

  if (loading && !habits.length) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  if (error && !habits.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.text.muted} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>Connection Error</Text>
          <Text style={{ fontSize: 13, color: Colors.text.secondary, textAlign: 'center' }}>Could not reach the server. Check your internet and try again.</Text>
          <TouchableOpacity style={{ marginTop: 12, backgroundColor: Colors.brand.primary, borderRadius: Radius.m, paddingHorizontal: 24, paddingVertical: 12 }} onPress={fetchAll}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* GREETING */}
        <View testID="home-greeting" style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Friend'} {'\uD83D\uDC4B'}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>{'\uD83D\uDD25'}</Text>
            <Text style={styles.streakNum}>{vibeData.max_streak}</Text>
          </View>
        </View>

        {/* VIBE SCORE */}
        <GlassCard testID="home-vibe-score" style={styles.vibeCard}>
          <VibeRing score={vibeData.today} />
          <Text style={styles.vibeLabel}>Your daily vibe based on habits & vitals</Text>
        </GlassCard>

        {/* AI INSIGHTS */}
        {insights.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.insightHeader}>
              <Ionicons name="sparkles" size={16} color={Colors.brand.secondary} />
              <Text style={styles.insightTitle}>AI Insights</Text>
            </View>
            {insights.map((ins, i) => (
              <View key={i} style={[styles.insightCard, ins.type === 'success' && styles.insightSuccess, ins.type === 'warning' && styles.insightWarning]}>
                <Text style={styles.insightText}>{ins.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TODAY'S HABITS */}
        {habits.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Today's Habits</Text>
            <FlatList
              testID="home-habits-list"
              horizontal showsHorizontalScrollIndicator={false}
              data={habits} keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 4 }}
              renderItem={({ item }) => (
                <TouchableOpacity testID={`habit-toggle-${item.id}`}
                  style={[styles.habitChip, item.completed_today && styles.habitChipDone]}
                  onPress={() => toggleHabit(item.id)} activeOpacity={0.7}>
                  <Ionicons name={item.completed_today ? 'checkmark-circle' : (item.icon as any) || 'ellipse-outline'}
                    size={20} color={item.completed_today ? Colors.status.success : item.color} />
                  <Text style={[styles.habitChipText, item.completed_today && styles.habitChipTextDone]}>{item.name}</Text>
                  {item.streak > 0 && <Text style={styles.habitStreak}>{'\uD83D\uDD25'}{item.streak}</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* QUICK LOG */}
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity testID="quick-log-water" style={styles.quickCard} onPress={logWater} activeOpacity={0.7}>
            <Ionicons name="water" size={24} color="#3B82F6" />
            <Text style={styles.quickVal}>{waterCount}</Text>
            <Text style={styles.quickLabel}>glasses</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-log-mood" style={styles.quickCard} onPress={() => setMoodModal(true)} activeOpacity={0.7}>
            <Text style={{ fontSize: 24 }}>{currentMood?.emoji || '\uD83D\uDE10'}</Text>
            <Text style={styles.quickVal}>{currentMood?.label || 'Log'}</Text>
            <Text style={styles.quickLabel}>mood</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-log-sleep" style={styles.quickCard} onPress={() => { setSleepInput(sleepHrs ? String(sleepHrs) : ''); setSleepModal(true); }} activeOpacity={0.7}>
            <Ionicons name="moon" size={24} color="#8B5CF6" />
            <Text style={styles.quickVal}>{sleepHrs ? `${sleepHrs}h` : '--'}</Text>
            <Text style={styles.quickLabel}>sleep</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-log-steps" style={styles.quickCard} onPress={() => { setStepsInput(stepsCount ? String(stepsCount) : ''); setStepsModal(true); }} activeOpacity={0.7}>
            <Ionicons name="walk" size={24} color="#10B981" />
            <Text style={styles.quickVal}>{stepsCount ? `${(stepsCount/1000).toFixed(1)}k` : '--'}</Text>
            <Text style={styles.quickLabel}>steps</Text>
          </TouchableOpacity>
        </View>

        {/* WEEKLY CHART */}
        <GlassCard style={styles.chartCard}>
          <Text style={styles.cardTitle}>Weekly Vibe Score</Text>
          <WeeklyBars data={vibeData.weekly} labels={vibeData.labels} />
        </GlassCard>

        {/* DAILY QUOTE */}
        <GlassCard style={styles.quoteCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.brand.secondary} />
          <Text style={styles.quoteText}>"{quote}"</Text>
        </GlassCard>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FLOATING AI BUTTON */}
      <TouchableOpacity testID="ai-coach-button" style={styles.aiFab} onPress={() => setAiOpen(true)} activeOpacity={0.8}>
        <Ionicons name="sparkles" size={24} color="#fff" />
      </TouchableOpacity>

      {/* SLEEP INPUT MODAL */}
      <Modal visible={sleepModal} transparent animationType="fade" onRequestClose={() => setSleepModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSleepModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.moodSheet}>
              <Text style={styles.moodTitle}>How many hours did you sleep?</Text>
              <TextInput testID="sleep-input" style={styles.vitalInput} placeholder="e.g. 7.5" placeholderTextColor={Colors.text.muted} value={sleepInput} onChangeText={setSleepInput} keyboardType="decimal-pad" autoFocus />
              <TouchableOpacity style={styles.vitalSaveBtn} onPress={() => logSleep(parseFloat(sleepInput))}>
                <Text style={styles.vitalSaveBtnText}>Log Sleep 🌙</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* STEPS INPUT MODAL */}
      <Modal visible={stepsModal} transparent animationType="fade" onRequestClose={() => setStepsModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStepsModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.moodSheet}>
              <Text style={styles.moodTitle}>How many steps today?</Text>
              <TextInput testID="steps-input" style={styles.vitalInput} placeholder="e.g. 8000" placeholderTextColor={Colors.text.muted} value={stepsInput} onChangeText={setStepsInput} keyboardType="number-pad" autoFocus />
              <TouchableOpacity style={styles.vitalSaveBtn} onPress={() => logSteps(parseInt(stepsInput))}>
                <Text style={styles.vitalSaveBtnText}>Log Steps 🚶</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MOOD MODAL */}
      <Modal visible={moodModal} transparent animationType="fade" onRequestClose={() => setMoodModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMoodModal(false)}>
          <View style={styles.moodSheet}>
            <Text style={styles.moodTitle}>How are you feeling?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.val} testID={`mood-${m.val}`} style={styles.moodBtn} onPress={() => logMood(m.val)}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* AI COACH MODAL */}
      <Modal visible={aiOpen} transparent animationType="slide" onRequestClose={() => setAiOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAiOpen(false)}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={styles.aiSheet}>
                <View style={styles.sheetHandle} />
                <View style={styles.aiHeader}>
                  <View style={styles.aiAvatarWrap}>
                    <Ionicons name="sparkles" size={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.aiTitle}>Vibly AI Coach</Text>
                    <Text style={styles.aiSubtitle}>Powered by AI — ask me anything</Text>
                  </View>
                </View>

                {/* Quick prompts */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {QUICK_PROMPTS.map((p, i) => (
                    <TouchableOpacity key={i} testID={`ai-prompt-${i}`} style={styles.promptChip}
                      onPress={() => askAI(p)} disabled={aiLoading}>
                      <Text style={styles.promptText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Custom input */}
                <View style={styles.aiInputRow}>
                  <TextInput testID="ai-input" style={styles.aiInput} placeholder="Ask your coach..."
                    placeholderTextColor={Colors.text.muted} value={aiQuery} onChangeText={setAiQuery}
                    editable={!aiLoading} />
                  <TouchableOpacity testID="ai-send-btn" style={styles.aiSendBtn}
                    onPress={() => aiQuery.trim() && askAI(aiQuery.trim())} disabled={aiLoading || !aiQuery.trim()}>
                    {aiLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
                  </TouchableOpacity>
                </View>

                {/* Response */}
                {(aiResponse || aiLoading) && (
                  <View style={styles.aiResponseCard}>
                    {aiLoading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color={Colors.brand.primary} />
                        <Text style={styles.aiThinking}>Analyzing your data...</Text>
                      </View>
                    ) : (
                      <Text style={styles.aiResponseText}>{aiResponse}</Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  scroll: { padding: Spacing.m, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: Colors.text.secondary },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
  streakEmoji: { fontSize: 18 },
  streakNum: { fontSize: 16, fontWeight: '700', color: '#F59E0B' },
  vibeCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 16 },
  vibeLabel: { fontSize: 12, color: Colors.text.secondary, marginTop: 10 },
  // AI Insights
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  insightTitle: { fontSize: 14, fontWeight: '600', color: Colors.brand.secondary },
  insightCard: { backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 12, padding: 12, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: Colors.brand.primary },
  insightSuccess: { borderLeftColor: Colors.status.success, backgroundColor: 'rgba(16,185,129,0.08)' },
  insightWarning: { borderLeftColor: Colors.status.warning, backgroundColor: 'rgba(245,158,11,0.08)' },
  insightText: { fontSize: 13, color: Colors.text.primary, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12, marginTop: 8 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.glass.bg, borderRadius: 16, borderWidth: 1, borderColor: Colors.glass.border, paddingHorizontal: 14, paddingVertical: 12, marginRight: 10 },
  habitChipDone: { borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.08)' },
  habitChipText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  habitChipTextDone: { textDecorationLine: 'line-through', color: Colors.text.secondary },
  habitStreak: { fontSize: 11, color: '#F59E0B', fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickCard: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: Colors.glass.bg, borderRadius: Radius.l, borderWidth: 1, borderColor: Colors.glass.border, paddingVertical: 14 },
  quickVal: { fontSize: 16, fontWeight: '700', color: '#fff' },
  quickLabel: { fontSize: 10, color: Colors.text.secondary },
  chartCard: { marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 12 },
  quoteCard: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  quoteText: { flex: 1, fontSize: 13, color: Colors.text.secondary, fontStyle: 'italic', lineHeight: 20 },
  // Floating AI button
  aiFab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.brand.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  moodSheet: { backgroundColor: Colors.bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  moodTitle: { fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 20 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodBtn: { alignItems: 'center', gap: 6, padding: 8 },
  moodEmoji: { fontSize: 36 },
  moodLabel: { fontSize: 11, color: Colors.text.secondary },
  // Vital input
  vitalInput: { backgroundColor: Colors.glass.bg, borderRadius: Radius.m, borderWidth: 1, borderColor: Colors.glass.border, paddingHorizontal: 16, height: 56, color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  vitalSaveBtn: { backgroundColor: Colors.brand.primary, borderRadius: Radius.m, height: 52, justifyContent: 'center', alignItems: 'center' },
  vitalSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // AI Coach Sheet
  aiSheet: { backgroundColor: Colors.bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.text.muted, alignSelf: 'center', marginBottom: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  aiAvatarWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  aiTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  aiSubtitle: { fontSize: 11, color: Colors.text.secondary },
  promptChip: { backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  promptText: { fontSize: 12, color: Colors.brand.secondary, fontWeight: '500' },
  aiInputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  aiInput: { flex: 1, backgroundColor: Colors.glass.bg, borderRadius: 16, borderWidth: 1, borderColor: Colors.glass.border, paddingHorizontal: 16, height: 48, color: '#fff', fontSize: 14 },
  aiSendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  aiResponseCard: { backgroundColor: 'rgba(124,58,237,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.15)' },
  aiThinking: { fontSize: 13, color: Colors.text.secondary, fontStyle: 'italic' },
  aiResponseText: { fontSize: 14, color: '#fff', lineHeight: 22 },
});
