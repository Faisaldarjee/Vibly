import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { CardSkeleton } from '@/components/Skeleton';
import { api } from '@/constants/Api';
import { showToast } from '@/lib/toast';

const ICON_OPTIONS = [
  'checkmark-circle', 'water', 'leaf', 'barbell-outline', 'book-outline',
  'moon-outline', 'walk-outline', 'fitness-outline', 'heart-outline',
  'musical-notes-outline', 'cafe-outline', 'bicycle-outline',
  'flash-outline', 'medkit-outline', 'happy-outline',
];
const COLOR_OPTIONS = [
  '#7C3AED', '#3B82F6', '#10B981', '#EF4444', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#8B5CF6',
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('checkmark-circle');
  const [color, setColor] = useState('#7C3AED');
  const [saving, setSaving] = useState(false);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const [h, t] = await Promise.all([api('/habits'), api('/habits/templates')]);
      setHabits(h);
      setTemplates(t);
    } catch (_e) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchHabits(); }, [fetchHabits]));

  async function toggleHabit(id: string) {
    try {
      const res = await api(`/habits/${id}/toggle`, { method: 'POST' });
      setHabits(prev => prev.map(h => h.id === id ? { ...h, completed_today: res.completed } : h));
      if (res.completed) showToast('Habit completed! ✅', 'success');
    } catch (_e) { showToast('Could not toggle habit', 'error'); }
  }

  async function addHabit() {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a habit name'); return; }
    setSaving(true);
    try {
      const h = await api('/habits', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), icon, color }),
      });
      setHabits(prev => [...prev, h]);
      setShowAdd(false);
      setName('');
      showToast('Habit created! 🎯', 'success');
    } catch (e: any) { showToast(e.message || 'Could not create habit', 'error'); }
    setSaving(false);
  }

  async function addFromTemplate(t: any) {
    try {
      const h = await api('/habits', {
        method: 'POST',
        body: JSON.stringify({ name: t.name, icon: t.icon, color: t.color }),
      });
      setHabits(prev => [...prev, h]);
      setShowAdd(false);
      showToast('Habit added from template! 🎯', 'success');
    } catch (_e) { showToast('Could not add habit', 'error'); }
  }

  async function deleteHabit(id: string) {
    Alert.alert('Delete Habit', 'Are you sure you want to delete this habit?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api(`/habits/${id}`, { method: 'DELETE' });
          setHabits(prev => prev.filter(h => h.id !== id));
          showToast('Habit deleted', 'info');
        } catch (_e) { showToast('Could not delete habit', 'error'); }
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Habits</Text>
        <TouchableOpacity testID="add-habit-button" style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: Spacing.m, gap: 12 }}>
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="add-circle-outline" size={56} color={Colors.text.muted} />
          <Text style={styles.emptyTitle}>No habits yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first habit</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.m, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <GlassCard testID={`habit-card-${item.id}`} style={styles.habitCard}>
              <TouchableOpacity
                style={styles.habitMain}
                onPress={() => toggleHabit(item.id)}
                onLongPress={() => deleteHabit(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.completed_today ? 'checkmark-circle' : (item.icon as any)} size={24}
                    color={item.completed_today ? Colors.status.success : item.color} />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={[styles.habitName, item.completed_today && styles.habitNameDone]}>{item.name}</Text>
                  <View style={styles.habitMeta}>
                    {item.streak > 0 && (
                      <View style={styles.streakTag}>
                        <Text style={styles.streakText}>{'\uD83D\uDD25'} {item.streak} day streak</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.dotsRow}>
                  {(item.last_7_days || []).map((d: number, i: number) => (
                    <View key={i} style={[styles.dot, d ? { backgroundColor: item.color } : {}]} />
                  ))}
                </View>
              </TouchableOpacity>
            </GlassCard>
          )}
        />
      )}

      {/* ADD HABIT MODAL */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAdd(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>New Habit</Text>

              <TextInput
                testID="habit-name-input"
                style={styles.nameInput}
                placeholder="Habit name..."
                placeholderTextColor={Colors.text.muted}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.pickLabel}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {ICON_OPTIONS.map(ic => (
                  <TouchableOpacity key={ic} style={[styles.iconPick, icon === ic && styles.iconPickActive]}
                    onPress={() => setIcon(ic)}>
                    <Ionicons name={ic as any} size={22} color={icon === ic ? '#fff' : Colors.text.secondary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.pickLabel}>Color</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity key={c} style={[styles.colorPick, { backgroundColor: c },
                    color === c && styles.colorPickActive]} onPress={() => setColor(c)} />
                ))}
              </View>

              <TouchableOpacity testID="save-habit-button" style={styles.saveBtn} onPress={addHabit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Create Habit'}</Text>
              </TouchableOpacity>

              {/* TEMPLATES */}
              <Text style={[styles.pickLabel, { marginTop: 20 }]}>Or pick a template</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {templates.map((t, i) => (
                  <TouchableOpacity key={i} style={styles.templateChip} onPress={() => addFromTemplate(t)}>
                    <Ionicons name={t.icon as any} size={16} color={t.color} />
                    <Text style={styles.templateText}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.main },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.m, paddingTop: 8, paddingBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  emptySubtitle: { fontSize: 13, color: Colors.text.secondary },
  habitCard: { marginBottom: 12, padding: 14 },
  habitMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  habitNameDone: { textDecorationLine: 'line-through', color: Colors.text.secondary },
  habitMeta: { flexDirection: 'row', marginTop: 4, gap: 6 },
  streakTag: {
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  streakText: { fontSize: 11, color: '#F59E0B', fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 3 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bg.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.text.muted, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  nameInput: {
    backgroundColor: Colors.glass.bg, borderRadius: Radius.m,
    borderWidth: 1, borderColor: Colors.glass.border,
    paddingHorizontal: 16, height: 52, color: '#fff', fontSize: 16, marginBottom: 16,
  },
  pickLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8 },
  iconPick: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.glass.bg, justifyContent: 'center', alignItems: 'center',
    marginRight: 8, borderWidth: 1, borderColor: 'transparent',
  },
  iconPickActive: { borderColor: Colors.brand.primary, backgroundColor: 'rgba(124,58,237,0.2)' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorPick: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent',
  },
  colorPickActive: { borderColor: '#fff' },
  saveBtn: {
    backgroundColor: Colors.brand.primary, borderRadius: Radius.m,
    height: 52, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.glass.bg, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: Colors.glass.border,
  },
  templateText: { fontSize: 12, color: '#fff' },
});
