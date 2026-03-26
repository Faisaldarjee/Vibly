import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { TrendingUp, Target, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/api/analytics/summary').then(setSummary).catch(() => {});
  }, []);

  if (!summary) return <div className="text-vibly-muted text-center py-12">Loading analytics...</div>;

  const habitData = (summary.daily_habits || []).map(d => ({
    date: d.date.slice(5),
    completed: d.completed,
    total: d.total,
    rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0
  }));

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="analytics-page">
      <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Analytics</h2>

      {/* Habit Completion Chart */}
      <div className="bg-vibly-surface border border-white/10 rounded-lg p-5" data-testid="habit-chart">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-vibly-accent" />
          <h3 className="font-heading text-lg font-bold uppercase">Habit Completion (7 Days)</h3>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habitData}>
              <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="rate" fill="#007AFF" radius={[4, 4, 0, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goals Progress */}
      <div className="bg-vibly-surface border border-white/10 rounded-lg p-5" data-testid="goals-chart">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-vibly-warning" />
          <h3 className="font-heading text-lg font-bold uppercase">Goals Progress</h3>
        </div>
        {(summary.goals || []).length === 0 ? (
          <p className="text-vibly-muted text-sm text-center py-4">No goals to show</p>
        ) : (
          <div className="space-y-3">
            {summary.goals.map((g, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white font-medium">{g.title}</span>
                  <span className="text-vibly-accent font-mono">{g.progress}%</span>
                </div>
                <div className="h-2 bg-vibly-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-vibly-warning rounded-full transition-all" style={{ width: `${Math.min(g.progress, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vitals Trends */}
      {Object.entries(summary.vitals_trends || {}).map(([type, data]) => (
        <div key={type} className="bg-vibly-surface border border-white/10 rounded-lg p-5" data-testid={`vitals-trend-${type}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-vibly-success" />
            <h3 className="font-heading text-lg font-bold uppercase">{type} Trend</h3>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.map(d => ({ date: d.date.slice(5), value: d.value }))}>
                <XAxis dataKey="date" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#121217', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="value" stroke="#00D084" strokeWidth={2} dot={{ fill: '#00D084', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
