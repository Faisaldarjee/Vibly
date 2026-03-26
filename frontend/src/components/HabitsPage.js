import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Check, Plus, Trash2, X, Flame } from 'lucide-react';

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('circle');
  const [newColor, setNewColor] = useState('#007AFF');

  useEffect(() => {
    loadHabits();
    api.get('/api/habits/templates').then(setTemplates).catch(() => {});
  }, []);

  const loadHabits = () => api.get('/api/habits').then(setHabits).catch(() => {});

  const toggleHabit = async (id) => {
    const res = await api.post(`/api/habits/${id}/toggle`);
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed_today: res.completed_today, streak: res.streak, completed_dates: res.completed_dates } : h));
  };

  const createHabit = async (name, icon, color) => {
    await api.post('/api/habits', { name, icon: icon || 'circle', color: color || '#007AFF' });
    loadHabits();
    setShowAdd(false);
    setNewName('');
  };

  const deleteHabit = async (id) => {
    await api.del(`/api/habits/${id}`);
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="space-y-4 animate-fade-in-up" data-testid="habits-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Habits</h2>
        <button data-testid="add-habit-btn" onClick={() => setShowAdd(true)}
          className="bg-vibly-accent text-white px-4 py-2 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-vibly-accent-hover transition-colors active:scale-[0.98] flex items-center gap-2">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Habit List */}
      {habits.length === 0 ? (
        <div className="bg-vibly-surface border border-white/10 rounded-lg p-8 text-center">
          <p className="text-vibly-muted">No habits yet. Start building your routine!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((h, i) => (
            <div key={h.id} className="bg-vibly-surface border border-white/10 rounded-lg p-4 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }} data-testid={`habit-${h.id}`}>
              <button onClick={() => toggleHabit(h.id)} data-testid={`toggle-habit-${h.id}`}
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all active:scale-[0.9] ${h.completed_today ? 'bg-vibly-success' : 'border-2 border-white/20 hover:border-white/40'}`}>
                {h.completed_today && <Check size={20} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-bold ${h.completed_today ? 'text-vibly-muted line-through' : 'text-white'}`}>{h.name}</p>
                {h.streak > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Flame size={12} className="text-vibly-warning" />
                    <span className="text-xs text-vibly-warning font-mono">{h.streak} day streak</span>
                  </div>
                )}
              </div>
              <button onClick={() => deleteHabit(h.id)} data-testid={`delete-habit-${h.id}`}
                className="text-vibly-muted hover:text-vibly-danger transition-colors p-1">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Habit Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="add-habit-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="bg-vibly-surface border border-white/10 rounded-lg p-6 w-full max-w-md relative z-[51]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold uppercase">New Habit</h3>
              <button onClick={() => setShowAdd(false)} className="text-vibly-muted hover:text-white"><X size={20} /></button>
            </div>

            {/* Templates */}
            <p className="text-xs text-vibly-muted uppercase tracking-wider font-bold mb-2">Quick Add</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {templates.map(t => (
                <button key={t.name} onClick={() => createHabit(t.name, t.icon, t.color)} data-testid={`template-${t.name}`}
                  className="bg-vibly-elevated border border-white/10 rounded-md p-3 text-left hover:border-vibly-accent/40 transition-all text-sm text-white">
                  {t.name}
                </button>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-vibly-muted uppercase tracking-wider font-bold mb-2">Custom Habit</p>
              <div className="flex gap-2">
                <input data-testid="habit-name-input" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Habit name" className="flex-1 bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm" />
                <button onClick={() => newName && createHabit(newName, newIcon, newColor)} data-testid="create-habit-btn"
                  className="bg-vibly-accent text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-vibly-accent-hover transition-colors">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
