import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Send, Sparkles, User, Loader2 } from 'lucide-react';

export default function AICoachPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await api.post('/api/ai/coach', { message: text, session_id: sessionId });
      setSessionId(res.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in-up" data-testid="ai-coach-page">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-vibly-accent/20 flex items-center justify-center animate-pulse-glow">
          <Sparkles size={20} className="text-vibly-accent" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold uppercase">Vibly AI Coach</h2>
          <p className="text-xs text-vibly-muted">Powered by AI - ask me anything</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles size={40} className="text-vibly-accent/30 mx-auto mb-4" />
            <p className="text-vibly-muted text-sm">Ask me about your health, habits, fitness, nutrition, or anything wellness-related!</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {['How much water should I drink?', 'Tips for better sleep', 'Quick workout ideas', 'How to build a habit?'].map(q => (
                <button key={q} onClick={() => { setInput(q); }} data-testid={`suggestion-${q.slice(0, 10)}`}
                  className="bg-vibly-elevated border border-white/10 text-vibly-muted text-xs px-3 py-2 rounded-full hover:border-vibly-accent/40 hover:text-white transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} data-testid={`message-${i}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-vibly-elevated' : 'bg-vibly-accent/20'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-vibly-accent" />}
            </div>
            <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-vibly-accent text-white' : 'bg-vibly-surface border border-white/10 text-white'}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3" data-testid="ai-loading">
            <div className="w-8 h-8 rounded-lg bg-vibly-accent/20 flex items-center justify-center">
              <Sparkles size={16} className="text-vibly-accent" />
            </div>
            <div className="bg-vibly-surface border border-white/10 rounded-lg px-4 py-3">
              <Loader2 size={16} className="text-vibly-accent animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex gap-2">
          <input
            data-testid="ai-chat-input"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI coach..."
            className="flex-1 bg-vibly-elevated border border-white/10 text-white px-4 py-3 rounded-md focus:border-vibly-accent focus:ring-1 focus:ring-vibly-accent outline-none transition-all placeholder:text-vibly-muted text-sm"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} data-testid="send-message-btn"
            className="bg-vibly-accent text-white px-4 py-3 rounded-md hover:bg-vibly-accent-hover transition-colors active:scale-[0.98] disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
