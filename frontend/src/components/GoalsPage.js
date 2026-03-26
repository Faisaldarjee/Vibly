import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Trash2, X, Target } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [target, setTarget] = useState(100);
  const [unit, setUnit] = useState('%');

  useEffect(() => { loadGoals(); }, []);
  const loadGoals = () => api.get('/api/goals').then(setGoals).catch(() => {});

  const createGoal = async () => {
    if (!title) return;
    await api.post('/api/goals', { title, description: desc, target_value: target, unit });
    loadGoals();
    setShowAdd(false);
    setTitle(''); setDesc(''); setTarget(100); setUnit('%');
  };

  const updateProgress = async (id, val) => {
    const res = await api.put(`/api/goals/${id}/progress`, { current_value: val });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current_value: val, progress: res.progress } : g));
  };

  const deleteGoal = async (id) => {
    await api.del(`/api/goals/${id}`);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-4 animate-fade-in-up" data-testid="goals-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Goals</h2>
        <button data-testid="add-goal-btn" onClick={() => setShowAdd(true)}
          className="bg-vibly-accent text-white px-4 py-2 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-vibly-accent-hover transition-colors active:scale-[0.98] flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-vibly-surface border border-white/10 rounded-lg p-8 text-center">
          <Target className="w-10 h-10 text-vibly-muted mx-auto mb-3" />
          <p className="text-vibly-muted">No goals yet. Set your first goal!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g, i) => (
            <div key={g.id} className="bg-vibly-surface border border-white/10 rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }} data-testid={`goal-${g.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{g.title}</h3>
                  {g.description && <p className="text-vibly-muted text-sm mt-1">{g.description}</p>}
                </div>
                <button onClick={() => deleteGoal(g.id)} className="text-vibly-muted hover:text-vibly-danger transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-3 bg-vibly-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-vibly-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(g.progress, 100)}%` }} />
                  </div>
                </div>
                <span className="font-mono text-sm text-vibly-accent font-bold min-w-[50px] text-right">{g.progress}%</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input type="range" min="0" max={g.target_value} value={g.current_value || 0}
                  onChange={(e) => updateProgress(g.id, parseFloat(e.target.value))}
                  className="flex-1 accent-vibly-accent" data-testid={`goal-slider-${g.id}`} />
                <span className="text-xs text-vibly-muted font-mono">{g.current_value || 0}/{g.target_value} {g.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="add-goal-modal">
          <div className="bg-vibly-surface border border-white/10 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold uppercase">New Goal</h3>
              <button onClick={() => setShowAdd(false)} className="text-vibly-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input data-testid="goal-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title"
                className="w-full bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm" />
              <textarea data-testid="goal-desc-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
                className="w-full bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm h-20 resize-none" />
              <div className="flex gap-2">
                <input data-testid="goal-target-input" type="number" value={target} onChange={e => setTarget(parseFloat(e.target.value))} placeholder="Target"
                  className="flex-1 bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm" />
                <input data-testid="goal-unit-input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit"
                  className="w-24 bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm" />
              </div>
              <button onClick={createGoal} data-testid="create-goal-btn"
                className="w-full bg-vibly-accent text-white font-bold uppercase tracking-wider py-2 rounded-md hover:bg-vibly-accent-hover transition-colors">Create Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
