import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import AuthPage from './components/AuthPage';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import HabitsPage from './components/HabitsPage';
import GoalsPage from './components/GoalsPage';
import VitalsPage from './components/VitalsPage';
import AICoachPage from './components/AICoachPage';
import ChallengesPage from './components/ChallengesPage';
import AnalyticsPage from './components/AnalyticsPage';
import ProfilePage from './components/ProfilePage';
import FeedPage from './components/FeedPage';
import { LayoutDashboard, Flame, Heart, Sparkles, Users, Trophy, BarChart3, User, Bell, BellOff } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'habits', label: 'Habits', icon: Flame },
  { key: 'vitals', label: 'Vitals', icon: Heart },
  { key: 'ai', label: 'Coach', icon: Sparkles },
  { key: 'feed', label: 'Community', icon: Users },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('vibly_token');
    if (token) {
      api.token = token;
      api.get('/api/auth/me')
        .then(u => {
          setUser(u);
          if (!u.onboarding_complete) setNeedsOnboarding(true);
        })
        .catch(() => api.clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // Check notification permission
    if ('Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (!userData.onboarding_complete) setNeedsOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    setUser(prev => ({ ...prev, onboarding_complete: true }));
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
    setPage('dashboard');
    setNeedsOnboarding(false);
  };

  const enableNotifications = useCallback(async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotifEnabled(true);
      scheduleReminders();
    }
  }, []);

  const scheduleReminders = () => {
    // Water reminder every 2 hours
    setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('Vibly Reminder', {
          body: 'Time to drink some water! Stay hydrated.',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'water-reminder'
        });
      }
    }, 2 * 60 * 60 * 1000);

    // Habit check-in reminder at specific times
    const now = new Date();
    const evening = new Date(now);
    evening.setHours(20, 0, 0, 0);
    if (evening > now) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('Vibly', {
            body: 'Have you completed all your habits today? Check in now!',
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'habit-reminder'
          });
        }
      }, evening - now);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vibly-bg flex items-center justify-center">
        <div className="text-center">
          <img src="/logo192.png" alt="Vibly" className="w-16 h-16 mx-auto rounded-2xl mb-3 animate-pulse" />
          <p className="text-vibly-muted text-sm tracking-widest uppercase">Track it. Feel it. Vibly.</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage onLogin={handleLogin} />;
  if (needsOnboarding) return <OnboardingFlow userName={user.name} onComplete={handleOnboardingComplete} />;

  const renderPage = () => {
    switch (page) {
      case 'habits': return <HabitsPage />;
      case 'goals': return <GoalsPage />;
      case 'vitals': return <VitalsPage />;
      case 'ai': return <AICoachPage />;
      case 'challenges': return <ChallengesPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'profile': return <ProfilePage user={user} onLogout={handleLogout} />;
      case 'feed': return <FeedPage />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-vibly-bg" data-testid="app-container">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-vibly-bg/75 border-b border-white/10" data-testid="app-header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('dashboard')}>
            <img src="/logo192.png" alt="Vibly" className="w-8 h-8 rounded-lg" />
            <span className="font-heading text-xl font-black tracking-tight uppercase">VIBLY</span>
          </div>
          <div className="flex items-center gap-2">
            {/* More nav items for desktop */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              {[
                { key: 'goals', label: 'Goals', icon: BarChart3 },
                { key: 'challenges', label: 'Challenges', icon: Trophy },
                { key: 'analytics', label: 'Analytics', icon: BarChart3 },
              ].map(item => (
                <button key={item.key} onClick={() => setPage(item.key)} data-testid={`desktop-nav-${item.key}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${page === item.key ? 'bg-vibly-accent/10 text-vibly-accent' : 'text-vibly-muted hover:text-white'}`}>
                  {item.label}
                </button>
              ))}
            </div>
            {/* Notification Bell */}
            <button onClick={enableNotifications} data-testid="notification-btn"
              className="w-8 h-8 rounded-full bg-vibly-elevated border border-white/10 flex items-center justify-center hover:border-vibly-accent/40 transition-colors relative">
              {notifEnabled ? <Bell size={14} className="text-vibly-accent" /> : <BellOff size={14} className="text-vibly-muted" />}
              {notifEnabled && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-vibly-success rounded-full" />}
            </button>
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

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-vibly-bg/90 border-t border-white/10" data-testid="bottom-nav">
        <div className="max-w-4xl mx-auto px-1 flex">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button key={item.key} onClick={() => setPage(item.key)} data-testid={`nav-${item.key}`}
                className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${active ? 'text-vibly-accent' : 'text-vibly-muted hover:text-white'}`}>
                <Icon size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                {active && <div className="w-4 h-0.5 bg-vibly-accent rounded-full" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
