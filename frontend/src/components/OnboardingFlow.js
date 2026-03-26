import React, { useState } from 'react';
import { api } from '../api';
import { ChevronRight, Dumbbell, Zap, Heart, Brain, Moon, Droplets, Target, Sparkles, Check } from 'lucide-react';

const FITNESS_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'Just starting my wellness journey', icon: Heart },
  { key: 'intermediate', label: 'Active', desc: 'I exercise a few times a week', icon: Zap },
  { key: 'advanced', label: 'Athlete', desc: 'Fitness is my lifestyle', icon: Dumbbell },
];

const WELLNESS_GOALS = [
  { key: 'lose_weight', label: 'Lose Weight', icon: Target },
  { key: 'build_muscle', label: 'Build Muscle', icon: Dumbbell },
  { key: 'better_sleep', label: 'Better Sleep', icon: Moon },
  { key: 'reduce_stress', label: 'Reduce Stress', icon: Brain },
  { key: 'drink_more_water', label: 'Drink More Water', icon: Droplets },
  { key: 'eat_healthy', label: 'Eat Healthy', icon: Heart },
];

const HABITS = [
  'Drink Water', 'Exercise', 'Read', 'Meditate', 'Sleep 8h', 'No Junk Food', 'Walk 10k Steps', 'Journal'
];

export default function OnboardingFlow({ userName, onComplete }) {
  const [step, setStep] = useState(0);
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [goals, setGoals] = useState([]);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleGoal = (key) => {
    setGoals(prev => prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]);
  };
  const toggleHabit = (name) => {
    setSelectedHabits(prev => prev.includes(name) ? prev.filter(h => h !== name) : [...prev, name]);
  };

  const finish = async () => {
    setLoading(true);
    try {
      await api.post('/api/onboarding', { fitness_level: fitnessLevel, wellness_goals: goals, selected_habits: selectedHabits });
      onComplete();
    } catch (e) {
      onComplete();
    }
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center space-y-6" data-testid="onboarding-welcome">
      <img src="/logo192.png" alt="Vibly" className="w-24 h-24 mx-auto rounded-3xl" />
      <h1 className="font-heading text-4xl font-black uppercase tracking-tight">Welcome, {userName}!</h1>
      <p className="text-vibly-accent text-sm font-bold uppercase tracking-widest">Track it. Feel it. Vibly.</p>
      <p className="text-vibly-muted text-base max-w-sm mx-auto">Let's set up your wellness profile in 3 quick steps so we can personalize your experience.</p>
      <button onClick={() => setStep(1)} data-testid="onboarding-start-btn"
        className="bg-vibly-accent text-white font-bold uppercase tracking-wider px-8 py-3 rounded-md hover:bg-vibly-accent-hover transition-all active:scale-[0.98] inline-flex items-center gap-2">
        Get Started <ChevronRight size={18} />
      </button>
    </div>,

    // Step 1: Fitness Level
    <div key="fitness" className="space-y-6" data-testid="onboarding-fitness">
      <div className="text-center">
        <p className="text-xs text-vibly-muted uppercase tracking-widest font-bold mb-2">Step 1 of 3</p>
        <h2 className="font-heading text-3xl font-bold uppercase">Your Fitness Level</h2>
      </div>
      <div className="space-y-3">
        {FITNESS_LEVELS.map(f => {
          const Icon = f.icon;
          const active = fitnessLevel === f.key;
          return (
            <button key={f.key} onClick={() => setFitnessLevel(f.key)} data-testid={`fitness-${f.key}`}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all active:scale-[0.98] text-left ${active ? 'bg-vibly-accent/10 border-vibly-accent' : 'bg-vibly-surface border-white/10 hover:border-white/20'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-vibly-accent/20' : 'bg-vibly-elevated'}`}>
                <Icon size={22} className={active ? 'text-vibly-accent' : 'text-vibly-muted'} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{f.label}</p>
                <p className="text-vibly-muted text-sm">{f.desc}</p>
              </div>
              {active && <Check size={20} className="text-vibly-accent" />}
            </button>
          );
        })}
      </div>
      <button onClick={() => fitnessLevel && setStep(2)} disabled={!fitnessLevel} data-testid="onboarding-next-1"
        className="w-full bg-vibly-accent text-white font-bold uppercase tracking-wider py-3 rounded-md hover:bg-vibly-accent-hover transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
        Continue <ChevronRight size={18} />
      </button>
    </div>,

    // Step 2: Wellness Goals
    <div key="goals" className="space-y-6" data-testid="onboarding-goals">
      <div className="text-center">
        <p className="text-xs text-vibly-muted uppercase tracking-widest font-bold mb-2">Step 2 of 3</p>
        <h2 className="font-heading text-3xl font-bold uppercase">Your Goals</h2>
        <p className="text-vibly-muted text-sm mt-1">Pick as many as you like</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {WELLNESS_GOALS.map(g => {
          const Icon = g.icon;
          const active = goals.includes(g.key);
          return (
            <button key={g.key} onClick={() => toggleGoal(g.key)} data-testid={`goal-${g.key}`}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all active:scale-[0.95] ${active ? 'bg-vibly-accent/10 border-vibly-accent' : 'bg-vibly-surface border-white/10 hover:border-white/20'}`}>
              <Icon size={24} className={active ? 'text-vibly-accent' : 'text-vibly-muted'} />
              <p className={`text-sm font-bold ${active ? 'text-white' : 'text-vibly-muted'}`}>{g.label}</p>
            </button>
          );
        })}
      </div>
      <button onClick={() => goals.length > 0 && setStep(3)} disabled={goals.length === 0} data-testid="onboarding-next-2"
        className="w-full bg-vibly-accent text-white font-bold uppercase tracking-wider py-3 rounded-md hover:bg-vibly-accent-hover transition-colors disabled:opacity-30 flex items-center justify-center gap-2">
        Continue <ChevronRight size={18} />
      </button>
    </div>,

    // Step 3: Pick Habits
    <div key="habits" className="space-y-6" data-testid="onboarding-habits">
      <div className="text-center">
        <p className="text-xs text-vibly-muted uppercase tracking-widest font-bold mb-2">Step 3 of 3</p>
        <h2 className="font-heading text-3xl font-bold uppercase">Pick Habits</h2>
        <p className="text-vibly-muted text-sm mt-1">We'll add these to your daily tracker</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {HABITS.map(h => {
          const active = selectedHabits.includes(h);
          return (
            <button key={h} onClick={() => toggleHabit(h)} data-testid={`habit-pick-${h}`}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all active:scale-[0.95] ${active ? 'bg-vibly-accent/10 border-vibly-accent' : 'bg-vibly-surface border-white/10 hover:border-white/20'}`}>
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${active ? 'bg-vibly-accent' : 'border border-white/20'}`}>
                {active && <Check size={14} className="text-white" />}
              </div>
              <p className={`text-sm font-bold ${active ? 'text-white' : 'text-vibly-muted'}`}>{h}</p>
            </button>
          );
        })}
      </div>
      <button onClick={finish} disabled={loading} data-testid="onboarding-finish"
        className="w-full bg-vibly-accent text-white font-bold uppercase tracking-wider py-3 rounded-md hover:bg-vibly-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? 'Setting up...' : <><Sparkles size={18} /> Start My Journey</>}
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-vibly-bg flex items-center justify-center p-4" data-testid="onboarding-flow">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Progress */}
        {step > 0 && (
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-vibly-accent' : 'bg-vibly-elevated'}`} />
            ))}
          </div>
        )}
        {steps[step]}
      </div>
    </div>
  );
}
