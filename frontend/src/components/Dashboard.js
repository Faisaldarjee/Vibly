import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TrendingUp, Target, Heart, Droplets, Moon, Footprints, Brain, Flame, Quote, ArrowRight } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [vibe, setVibe] = useState(null);
  const [quote, setQuote] = useState(null);
  const [vitals, setVitals] = useState({});
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    api.get('/api/analytics/vibe-score').then(setVibe).catch(() => {});
    api.get('/api/quote').then(setQuote).catch(() => {});
    api.get('/api/vitals/today').then(setVitals).catch(() => {});
    api.get('/api/habits').then(setHabits).catch(() => {});
  }, []);

  const completedToday = habits.filter(h => h.completed_today).length;
  const vibeScore = vibe?.vibe_score || 0;

  const getVibeColor = (score) => {
    if (score >= 70) return '#00D084';
    if (score >= 40) return '#FF9F0A';
    return '#FF3B30';
  };

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="dashboard">
      {/* Quote Card */}
      {quote && (
        <div className="relative overflow-hidden rounded-lg border border-white/10" data-testid="quote-card">
          <div className="absolute inset-0 bg-gradient-to-r from-vibly-accent/10 to-transparent" />
          <div className="relative p-6">
            <Quote className="w-6 h-6 text-vibly-accent mb-3 opacity-60" />
            <p className="text-lg text-white font-body leading-relaxed italic">"{quote.text}"</p>
            <p className="text-vibly-muted text-sm mt-2">- {quote.author}</p>
          </div>
        </div>
      )}

      {/* Vibe Score */}
      <div className="bg-vibly-surface border border-white/10 rounded-lg p-6" data-testid="vibe-score-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-2xl font-bold tracking-tight uppercase">Vibe Score</h2>
          <TrendingUp className="w-5 h-5 text-vibly-accent" />
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A21" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={getVibeColor(vibeScore)} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${vibeScore * 2.64} 264`}
                style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading text-3xl font-black" style={{ color: getVibeColor(vibeScore) }}>{vibeScore}</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <ScoreBar label="Habits" value={vibe?.habit_score || 0} max={40} color="#007AFF" />
            <ScoreBar label="Vitals" value={vibe?.vital_score || 0} max={30} color="#00D084" />
            <ScoreBar label="Goals" value={vibe?.goal_score || 0} max={30} color="#FF9F0A" />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Flame />} label="Habits Done" value={`${completedToday}/${habits.length}`} color="#007AFF" onClick={() => onNavigate('habits')} />
        <StatCard icon={<Droplets />} label="Water" value={`${vitals.water || 0} glasses`} color="#007AFF" onClick={() => onNavigate('vitals')} />
        <StatCard icon={<Moon />} label="Sleep" value={`${vitals.sleep || 0}h`} color="#5856D6" onClick={() => onNavigate('vitals')} />
        <StatCard icon={<Footprints />} label="Steps" value={`${vitals.steps || 0}`} color="#00D084" onClick={() => onNavigate('vitals')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction icon={<Brain />} label="AI Coach" desc="Get personalized advice" onClick={() => onNavigate('ai')} />
        <QuickAction icon={<Target />} label="Goals" desc="Track your progress" onClick={() => onNavigate('goals')} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-vibly-muted uppercase tracking-wider font-bold">{label}</span>
        <span className="font-mono text-vibly-muted">{value}/{max}</span>
      </div>
      <div className="h-2 bg-vibly-elevated rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}
      className="bg-vibly-surface border border-white/10 rounded-lg p-4 text-left hover:bg-white/5 transition-all active:scale-[0.98] group">
      <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2" style={{ backgroundColor: `${color}20` }}>
        {React.cloneElement(icon, { size: 16, color })}
      </div>
      <p className="text-xs text-vibly-muted uppercase tracking-wider font-bold">{label}</p>
      <p className="text-white font-heading text-xl font-bold mt-1">{value}</p>
    </button>
  );
}

function QuickAction({ icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} data-testid={`quick-${label.toLowerCase().replace(/\s/g, '-')}`}
      className="bg-vibly-surface border border-white/10 rounded-lg p-4 text-left hover:border-vibly-accent/40 transition-all active:scale-[0.98] group flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-vibly-accent/20 flex items-center justify-center flex-shrink-0">
        {React.cloneElement(icon, { size: 20, className: 'text-vibly-accent' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm">{label}</p>
        <p className="text-vibly-muted text-xs truncate">{desc}</p>
      </div>
      <ArrowRight size={16} className="text-vibly-muted group-hover:text-vibly-accent transition-colors" />
    </button>
  );
}
