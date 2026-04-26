// ==================== API RESPONSE TYPES ====================

export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  completed_today: boolean;
  streak: number;
  last_7_days: number[];
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  target: number;
  current: number;
  unit: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  habit_type: string;
  duration_days: number;
  daily_target: string;
  participant_count: number;
  joined: boolean;
  my_checkins: number;
  creator_name?: string;
}

export interface VibeData {
  today: number;
  weekly: number[];
  labels: string[];
  max_streak: number;
}

export interface Vitals {
  water?: { value: number };
  mood?: { value: number };
  sleep?: { value: number };
  steps?: { value: number };
}

export interface AiInsight {
  text: string;
  type: 'success' | 'warning' | 'info';
}

export interface ProfileData {
  name: string;
  email: string;
  created_at: string;
  stats: {
    total_habits: number;
    total_completions: number;
    total_goals: number;
    completed_goals: number;
  };
}

export interface AnalyticsSummary {
  habit_consistency: { name: string; consistency: number; color: string }[];
  mood_distribution: Record<number, number>;
  avg_sleep: number;
  total_logs: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
