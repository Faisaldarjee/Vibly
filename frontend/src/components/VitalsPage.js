import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Droplets, Moon, Smile, Footprints, Scale, Minus, Plus } from 'lucide-react';

const VITAL_CONFIG = [
  { type: 'water', label: 'Water', icon: Droplets, unit: 'glasses', color: '#007AFF', min: 0, max: 15, step: 1 },
  { type: 'sleep', label: 'Sleep', icon: Moon, unit: 'hours', color: '#5856D6', min: 0, max: 12, step: 0.5 },
  { type: 'mood', label: 'Mood', icon: Smile, unit: '/5', color: '#FF9F0A', min: 1, max: 5, step: 1 },
  { type: 'steps', label: 'Steps', icon: Footprints, unit: 'steps', color: '#00D084', min: 0, max: 30000, step: 500 },
  { type: 'weight', label: 'Weight', icon: Scale, unit: 'kg', color: '#FF3B30', min: 30, max: 200, step: 0.5 },
];

const MOOD_LABELS = ['', 'Bad', 'Low', 'Okay', 'Good', 'Great'];

export default function VitalsPage() {
  const [vitals, setVitals] = useState({});
  const [weekData, setWeekData] = useState([]);

  useEffect(() => {
    api.get('/api/vitals/today').then(setVitals).catch(() => {});
    api.get('/api/vitals/week').then(setWeekData).catch(() => {});
  }, []);

  const logVital = async (type, value) => {
    await api.post('/api/vitals', { vital_type: type, value });
    setVitals(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="space-y-4 animate-fade-in-up" data-testid="vitals-page">
      <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Vitals</h2>

      <div className="space-y-3">
        {VITAL_CONFIG.map((v, i) => {
          const Icon = v.icon;
          const currentVal = vitals[v.type] || 0;
          return (
            <div key={v.type} className="bg-vibly-surface border border-white/10 rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }} data-testid={`vital-${v.type}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${v.color}20` }}>
                    <Icon size={20} style={{ color: v.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{v.label}</p>
                    <p className="text-xs text-vibly-muted">{v.type === 'mood' ? MOOD_LABELS[Math.round(currentVal)] || 'Not set' : `${currentVal} ${v.unit}`}</p>
                  </div>
                </div>
                <span className="font-heading text-2xl font-bold" style={{ color: v.color }}>{currentVal}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => logVital(v.type, Math.max(v.min, currentVal - v.step))} data-testid={`vital-minus-${v.type}`}
                  className="w-8 h-8 rounded-md bg-vibly-elevated border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-[0.9]">
                  <Minus size={14} className="text-white" />
                </button>
                <input type="range" min={v.min} max={v.max} step={v.step} value={currentVal}
                  onChange={(e) => logVital(v.type, parseFloat(e.target.value))}
                  className="flex-1 accent-vibly-accent" data-testid={`vital-slider-${v.type}`}
                  style={{ accentColor: v.color }} />
                <button onClick={() => logVital(v.type, Math.min(v.max, currentVal + v.step))} data-testid={`vital-plus-${v.type}`}
                  className="w-8 h-8 rounded-md bg-vibly-elevated border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-[0.9]">
                  <Plus size={14} className="text-white" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
