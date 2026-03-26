import React, { useState, useEffect } from 'react';
import { api } from './api';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import HabitsPage from './components/HabitsPage';
import GoalsPage from './components/GoalsPage';
import VitalsPage from './components/VitalsPage';
import AICoachPage from './components/AICoachPage';
import ChallengesPage from './components/ChallengesPage';
import AnalyticsPage from './components/AnalyticsPage';
import ProfilePage from './components/ProfilePage';
import { LayoutDashboard, Flame, Target, Heart, Sparkles, Trophy, BarChart3, User, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'habits', label: 'Habits', icon: Flame },
  { key: 'vitals', label: 'Vitals', icon: Heart },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'ai', label: 'Coach', icon: Sparkles },
  { key: 'challenges', label: 'Challenges', icon: Trophy },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vibly_token');
    if (token) {
      api.token = token;
      api.get('/api/auth/me')
        .then(u => setUser(u))
        .catch(() => {
          api.clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    setPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vibly-bg flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-10 h-10 text-vibly-accent mx-auto mb-3 animate-pulse" />
          <p className="text-vibly-muted text-sm">Loading Vibly...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage onLogin={setUser} />;

  const renderPage = () => {
    switch (page) {
      case 'habits': return <HabitsPage />;
      case 'goals': return <GoalsPage />;
      case 'vitals': return <VitalsPage />;
      case 'ai': return <AICoachPage />;
      case 'challenges': return <ChallengesPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'profile': return <ProfilePage user={user} onLogout={handleLogout} />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-vibly-bg" data-testid="app-container">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-vibly-bg/75 border-b border-white/10" data-testid="app-header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vibly-accent/20 flex items-center justify-center">
              <Zap size={16} className="text-vibly-accent" />
            </div>
            <span className="font-heading text-xl font-black tracking-tight uppercase">VIBLY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-vibly-muted text-sm font-body hidden sm:block">Hey, {user.name}</span>
            <button onClick={() => setPage('profile')} data-testid="header-profile-btn"
              className="w-8 h-8 rounded-full bg-vibly-elevated border border-white/10 flex items-center justify-center hover:border-vibly-accent/40 transition-colors">
              <User size={14} className="text-vibly-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-vibly-bg/90 border-t border-white/10" data-testid="bottom-nav">
        <div className="max-w-4xl mx-auto px-1 flex overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} data-testid={`nav-${item.key}`}
                className={`flex-1 min-w-[60px] py-3 flex flex-col items-center gap-1 transition-all ${active ? 'text-vibly-accent' : 'text-vibly-muted hover:text-white'}`}>
                <Icon size={18} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
                {active && <div className="w-4 h-0.5 bg-vibly-accent rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
