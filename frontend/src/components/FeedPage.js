import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Heart, MessageCircle, Share2, Sparkles, Send, User, Zap } from 'lucide-react';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { loadFeed(); }, []);
  const loadFeed = () => api.get('/api/feed').then(setPosts).catch(() => {});

  const createPost = async () => {
    if (!newPost.trim()) return;
    setLoading(true);
    try {
      const post = await api.post('/api/feed', { content: newPost.trim(), post_type: 'update' });
      setPosts(prev => [post, ...prev]);
      setNewPost('');
    } catch (e) {}
    setLoading(false);
  };

  const shareVibe = async () => {
    setSharing(true);
    try {
      const post = await api.post('/api/feed/share-vibe');
      loadFeed();
    } catch (e) {}
    setSharing(false);
  };

  const toggleLike = async (postId) => {
    try {
      const res = await api.post(`/api/feed/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: res.liked, likes_count: res.likes_count } : p));
    } catch (e) {}
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-4 animate-fade-in-up" data-testid="feed-page">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-3xl font-bold tracking-tight uppercase">Community</h2>
        <button onClick={shareVibe} disabled={sharing} data-testid="share-vibe-btn"
          className="bg-vibly-accent text-white px-4 py-2 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-vibly-accent-hover transition-colors active:scale-[0.98] flex items-center gap-2 disabled:opacity-50">
          <Zap size={14} /> Share Vibe
        </button>
      </div>

      {/* Create Post */}
      <div className="bg-vibly-surface border border-white/10 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-lg bg-vibly-elevated flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-vibly-muted" />
          </div>
          <div className="flex-1 flex gap-2">
            <input data-testid="feed-post-input" value={newPost} onChange={e => setNewPost(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createPost()}
              placeholder="Share an update with the community..."
              className="flex-1 bg-vibly-elevated border border-white/10 text-white px-3 py-2 rounded-md focus:border-vibly-accent outline-none text-sm placeholder:text-vibly-muted" />
            <button onClick={createPost} disabled={loading || !newPost.trim()} data-testid="feed-post-submit"
              className="bg-vibly-accent text-white px-3 py-2 rounded-md hover:bg-vibly-accent-hover transition-colors disabled:opacity-30">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-vibly-surface border border-white/10 rounded-lg p-8 text-center">
          <MessageCircle className="w-10 h-10 text-vibly-muted mx-auto mb-3" />
          <p className="text-vibly-muted">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <div key={post.id} className="bg-vibly-surface border border-white/10 rounded-lg p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }} data-testid={`feed-post-${post.id}`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-vibly-elevated flex items-center justify-center">
                  <User size={16} className="text-vibly-muted" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{post.user_name} {post.is_mine && <span className="text-vibly-accent text-xs">(You)</span>}</p>
                  <p className="text-vibly-muted text-xs">{timeAgo(post.created_at)}</p>
                </div>
                {post.post_type === 'vibe_card' && (
                  <span className="bg-vibly-accent/20 text-vibly-accent text-xs px-2 py-1 rounded-full font-bold uppercase">Vibe</span>
                )}
              </div>

              {/* Content */}
              <p className="text-white text-sm leading-relaxed mb-3">{post.content}</p>

              {/* Vibe Card Data */}
              {post.post_type === 'vibe_card' && post.data && (
                <div className="bg-vibly-bg border border-vibly-accent/20 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="font-heading text-xl font-bold text-vibly-accent">{post.data.habits_done}/{post.data.habits_total}</p>
                      <p className="text-[10px] text-vibly-muted uppercase tracking-wider font-bold">Habits</p>
                    </div>
                    <div>
                      <p className="font-heading text-xl font-bold text-vibly-warning">{post.data.streak}</p>
                      <p className="text-[10px] text-vibly-muted uppercase tracking-wider font-bold">Streak</p>
                    </div>
                    <div>
                      <p className="font-heading text-xl font-bold text-vibly-success">{post.data.steps || 0}</p>
                      <p className="text-[10px] text-vibly-muted uppercase tracking-wider font-bold">Steps</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                <button onClick={() => toggleLike(post.id)} data-testid={`like-${post.id}`}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? 'text-vibly-danger' : 'text-vibly-muted hover:text-vibly-danger'}`}>
                  <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                  <span className="font-mono">{post.likes_count || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-vibly-muted hover:text-white transition-colors"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Vibly', text: post.content, url: window.location.href });
                    }
                  }}>
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
