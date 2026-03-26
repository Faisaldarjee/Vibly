import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Calendar, Target, Flame, Edit3, Save, LogOut, Trophy, BarChart3, ChevronRight } from 'lucide-react';

export default function ProfilePage({ user, onLogout, onNavigate }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    api.get('/api/profile').then(p => {
      setProfile(p);
      setName(p.name);
      setBio(p.bio || '');
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    await api.put('/api/profile', { name, bio });
    setProfile(prev => ({ ...prev, name, bio }));
    setEditing(false);
  };

  if (!profile) return <div className="text-vibly-muted text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in-up" data-testid="profile-page">
      <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Profile</h2>

      <div className="bg-vibly-surface border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-vibly-accent/20 flex items-center justify-center">
            <User size={28} className="text-vibly-accent" />
          </div>
          <div className="flex-1">
            {editing ? (
              <input data-testid="profile-name-input" value={name} onChange={e => setName(e.target.value)}
                className="bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-lg font-bold w-full" />
            ) : (
              <h3 className="text-xl font-bold text-white">{profile.name}</h3>
            )}
            <p className="text-vibly-muted text-sm">{profile.email}</p>
          </div>
          {editing ? (
            <button onClick={saveProfile} data-testid="save-profile-btn" className="bg-vibly-success text-white p-2 rounded-md hover:bg-vibly-success/80 transition-colors">
              <Save size={18} />
            </button>
          ) : (
            <button onClick={() => setEditing(true)} data-testid="edit-profile-btn" className="text-vibly-muted hover:text-white transition-colors p-2">
              <Edit3 size={18} />
            </button>
          )}
        </div>

        {editing ? (
          <textarea data-testid="profile-bio-input" value={bio} onChange={e => setBio(e.target.value)}
            placeholder="Write something about yourself..."
            className="w-full bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm h-24 resize-none mb-4" />
        ) : profile.bio ? (
          <p className="text-vibly-muted text-sm mb-4">{profile.bio}</p>
        ) : null}

        <div className="grid grid-cols-3 gap-3">
          <StatBlock icon={<Flame size={18} />} label="Habits" value={profile.habits_count} color="#007AFF" />
          <StatBlock icon={<Target size={18} />} label="Goals" value={profile.goals_count} color="#FF9F0A" />
          <StatBlock icon={<Calendar size={18} />} label="Days" value={profile.member_days} color="#00D084" />
        </div>
      </div>

      <button onClick={onLogout} data-testid="logout-btn"
        className="w-full bg-vibly-danger/10 border border-vibly-danger/30 text-vibly-danger font-bold uppercase tracking-wider py-3 rounded-md hover:bg-vibly-danger/20 transition-colors flex items-center justify-center gap-2">
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}

function StatBlock({ icon, label, value, color }) {
  return (
    <div className="bg-vibly-elevated border border-white/10 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
      <p className="font-heading text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-vibly-muted uppercase tracking-wider font-bold">{label}</p>
    </div>
  );
}
