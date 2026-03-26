import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Trophy, Users, CheckCircle, Plus, X } from 'lucide-react';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [days, setDays] = useState(7);
  const [leaderboard, setLeaderboard] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => { loadChallenges(); }, []);
  const loadChallenges = () => api.get('/api/challenges').then(setChallenges).catch(() => {});

  const joinChallenge = async (id) => {
    await api.post(`/api/challenges/${id}/join`);
    loadChallenges();
  };

  const checkin = async (id) => {
    await api.post(`/api/challenges/${id}/checkin`);
    loadChallenges();
  };

  const viewLeaderboard = async (challenge) => {
    const board = await api.get(`/api/challenges/${challenge.id}/leaderboard`);
    setLeaderboard(board);
    setSelectedChallenge(challenge);
  };

  const createChallenge = async () => {
    if (!title) return;
    await api.post('/api/challenges', { title, description: desc, duration_days: days });
    loadChallenges();
    setShowAdd(false);
    setTitle(''); setDesc(''); setDays(7);
  };

  return (
    <div className="space-y-4 animate-fade-in-up" data-testid="challenges-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Challenges</h2>
        <button data-testid="add-challenge-btn" onClick={() => setShowAdd(true)}
          className="bg-vibly-accent text-white px-4 py-2 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-vibly-accent-hover transition-colors active:scale-[0.98] flex items-center gap-2">
          <Plus size={16} /> Create
        </button>
      </div>

      <div className="space-y-3">
        {challenges.map((c, i) => (
          <div key={c.id} className="bg-vibly-surface border border-white/10 rounded-lg p-5 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }} data-testid={`challenge-${c.id}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-vibly-warning/20 flex items-center justify-center flex-shrink-0">
                <Trophy size={20} className="text-vibly-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{c.title}</h3>
                <p className="text-vibly-muted text-sm mt-1">{c.description}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-vibly-muted flex items-center gap-1"><Users size={12} /> {c.participants} joined</span>
                  <span className="text-xs text-vibly-muted">{c.duration_days} days</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {!c.joined ? (
                <button onClick={() => joinChallenge(c.id)} data-testid={`join-${c.id}`}
                  className="bg-vibly-accent text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-vibly-accent-hover transition-colors flex-1">
                  Join Challenge
                </button>
              ) : (
                <>
                  <button onClick={() => checkin(c.id)} data-testid={`checkin-${c.id}`}
                    className="bg-vibly-success/20 text-vibly-success px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-vibly-success/30 transition-colors flex-1 flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Check In
                  </button>
                  <button onClick={() => viewLeaderboard(c)} data-testid={`leaderboard-${c.id}`}
                    className="bg-vibly-elevated border border-white/10 text-white px-4 py-2 rounded-md font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-colors">
                    <Trophy size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Modal */}
      {leaderboard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="leaderboard-modal">
          <div className="bg-vibly-surface border border-white/10 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold uppercase">Leaderboard</h3>
              <button onClick={() => setLeaderboard(null)} className="text-vibly-muted hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-vibly-muted text-sm mb-4">{selectedChallenge?.title}</p>
            {leaderboard.length === 0 ? (
              <p className="text-vibly-muted text-center py-4">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-md ${p.is_you ? 'bg-vibly-accent/10 border border-vibly-accent/30' : 'bg-vibly-elevated'}`}>
                    <span className="font-heading text-lg font-bold text-vibly-muted w-8">#{i + 1}</span>
                    <span className="flex-1 font-bold text-white">{p.name} {p.is_you && <span className="text-vibly-accent text-xs">(You)</span>}</span>
                    <span className="font-mono text-sm text-vibly-accent">{p.checkins} days</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="create-challenge-modal">
          <div className="bg-vibly-surface border border-white/10 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold uppercase">Create Challenge</h3>
              <button onClick={() => setShowAdd(false)} className="text-vibly-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input data-testid="challenge-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Challenge title"
                className="w-full bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm" />
              <textarea data-testid="challenge-desc-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description"
                className="w-full bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm h-20 resize-none" />
              <input data-testid="challenge-days-input" type="number" value={days} onChange={e => setDays(parseInt(e.target.value))} placeholder="Duration (days)"
                className="w-full bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm" />
              <button onClick={createChallenge} data-testid="create-challenge-submit"
                className="w-full bg-vibly-accent text-white font-bold uppercase tracking-wider py-2 rounded-md hover:bg-vibly-accent-hover transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
