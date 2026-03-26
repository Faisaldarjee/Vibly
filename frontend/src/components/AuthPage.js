import React, { useState } from 'react';
import { api } from '../api';
import { Eye, EyeOff, Zap } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await api.post('/api/auth/login', { email, password });
      } else {
        data = await api.post('/api/auth/register', { name, email, password });
      }
      api.setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vibly-bg p-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vibly-accent/20 mb-4">
            <Zap className="w-8 h-8 text-vibly-accent" />
          </div>
          <h1 className="font-heading text-5xl font-black tracking-tight uppercase text-white">VIBLY</h1>
          <p className="text-vibly-muted mt-2 font-body tracking-wide">Your Wellness Command Center</p>
        </div>

        <div className="bg-vibly-surface border border-white/10 rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex mb-6 bg-vibly-bg rounded-md p-1">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${isLogin ? 'bg-vibly-accent text-white' : 'text-vibly-muted hover:text-white'}`}
            >Login</button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${!isLogin ? 'bg-vibly-accent text-white' : 'text-vibly-muted hover:text-white'}`}
            >Register</button>
          </div>

          {error && <div data-testid="auth-error" className="bg-vibly-danger/10 border border-vibly-danger/30 text-vibly-danger text-sm p-3 rounded-md mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                data-testid="name-input"
                type="text" placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)} required={!isLogin}
                className="w-full bg-vibly-elevated border border-white/10 text-white px-4 py-3 rounded-md focus:border-vibly-accent focus:ring-1 focus:ring-vibly-accent outline-none transition-all placeholder:text-vibly-muted"
              />
            )}
            <input
              data-testid="email-input"
              type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-vibly-elevated border border-white/10 text-white px-4 py-3 rounded-md focus:border-vibly-accent focus:ring-1 focus:ring-vibly-accent outline-none transition-all placeholder:text-vibly-muted"
            />
            <div className="relative">
              <input
                data-testid="password-input"
                type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-vibly-elevated border border-white/10 text-white px-4 py-3 rounded-md focus:border-vibly-accent focus:ring-1 focus:ring-vibly-accent outline-none transition-all placeholder:text-vibly-muted pr-12"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-vibly-muted hover:text-white">
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              data-testid="auth-submit-btn"
              type="submit" disabled={loading}
              className="w-full bg-vibly-accent text-white font-bold uppercase tracking-wider py-3 rounded-md hover:bg-vibly-accent-hover transition-colors active:scale-[0.98] disabled:opacity-50"
            >{loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
