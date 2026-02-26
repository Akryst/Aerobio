'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
}

const COLORS = [
  'text-red-600',
  'text-orange-600', 
  'text-yellow-600',
  'text-green-600',
  'text-blue-600',
  'text-indigo-600',
  'text-purple-600',
  'text-pink-600',
  'text-cyan-600',
  'text-teal-600',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getColorForUser(author: string): string {
  return COLORS[hashCode(author) % COLORS.length];
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'justo ahora';
}

export default function AnonymousWall() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canPost, setCanPost] = useState(true);
  const [timeUntilNextPost, setTimeUntilNextPost] = useState('');
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchMessages();
    checkPostCooldown();
    
    // Load liked messages from localStorage
    const liked = localStorage.getItem('likedMessages');
    if (liked) {
      setLikedMessages(new Set(JSON.parse(liked)));
    }

    // Check for admin mode
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');
    if (adminKey) {
      localStorage.setItem('adminSecret', adminKey);
      setIsAdmin(true);
    } else {
      const storedSecret = localStorage.getItem('adminSecret');
      if (storedSecret) {
        setIsAdmin(true);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkPostCooldown();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkPostCooldown = () => {
    const lastPost = localStorage.getItem('lastMessagePost');
    if (!lastPost) {
      setCanPost(true);
      return;
    }

    const lastPostTime = parseInt(lastPost);
    const now = Date.now();
    const diff = now - lastPostTime;
    const cooldown = 30 * 60 * 1000; // 30 minutes

    if (diff < cooldown) {
      setCanPost(false);
      const remaining = cooldown - diff;
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setTimeUntilNextPost(`${hours}h ${minutes}m`);
    } else {
      setCanPost(true);
      setTimeUntilNextPost('');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !canPost) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: isAnonymous ? 'Anonymous' : (nickname.trim() || 'Anonymous'),
          content: message.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        // Cooldown enforced by server
        localStorage.setItem('lastMessagePost', Date.now().toString());
        checkPostCooldown();
        alert(data.error || 'Please wait before posting again');
        return;
      }

      if (response.ok) {
        setMessage('');
        setNickname('');
        localStorage.setItem('lastMessagePost', Date.now().toString());
        checkPostCooldown();
        fetchMessages();
      }
    } catch (err) {
      console.error('Error posting message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (messageId: string) => {
    if (likedMessages.has(messageId)) return;

    try {
      const response = await fetch('/api/messages/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        const newLiked = new Set(likedMessages);
        newLiked.add(messageId);
        setLikedMessages(newLiked);
        localStorage.setItem('likedMessages', JSON.stringify(Array.from(newLiked)));
        fetchMessages();
      }
    } catch (err) {
      console.error('Error liking message:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!isAdmin) return;
    if (!confirm('¿Estás seguro de que quieres eliminar este mensaje?')) return;

    try {
      const secret = localStorage.getItem('adminSecret');
      const response = await fetch(`/api/messages/${messageId}?secret=${secret}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMessages();
      } else {
        alert('Error al eliminar el mensaje');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="window active glass"
    >
      <div className="title-bar">
        <span className="title-bar-text">💬 Guestbook</span>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>

      <div className="window-body">
        {/* New message button */}
        {canPost && (
          <div className="mb-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1"
            >
              {showForm ? 'Cancel' : 'New Message'}
            </button>
          </div>
        )}
        
        {/* Form - colapsable */}
        {canPost && showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-2 mb-3 p-3 bg-gray-50 border border-gray-200"
          >
          <div className="flex items-center gap-3">
            <div className="field-row">
              <input
                type="checkbox"
                id="anonymous-check"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="anonymous-check">Anonymous</label>
            </div>
            {!isAnonymous && (
              <input
                type="text"
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            )}
          </div>

          <textarea
            placeholder="Leave a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full resize-none"
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{message.length}/200</span>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Message'}
            </button>
          </div>
        </motion.form>
        )}
        
        {!canPost && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 text-center">
            <p className="text-xs text-yellow-800">
              ⏰ Next post available in <span className="font-semibold">{timeUntilNextPost}</span>
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin pr-1">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No messages yet. Be the first to sign the guestbook!
            </p>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white border border-gray-200 p-3 shadow-sm"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${getColorForUser(msg.author)}`}>
                    {msg.author}
                  </span>
                  <span className="text-[10px] text-gray-400" title={new Date(msg.timestamp).toLocaleString()}>
                    {getRelativeTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 break-words leading-relaxed">{msg.content}</p>
                
                {/* Like button */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleLike(msg.id)}
                    disabled={likedMessages.has(msg.id)}
                    style={{ padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{likedMessages.has(msg.id) ? '❤️' : '🤍'}</span>
                    <span>{msg.likes || 0}</span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      style={{ padding: '2px 6px' }}
                      title="Eliminar mensaje"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <div className="status-bar">
        <p className="status-bar-field">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
        <p className="status-bar-field">{isAdmin ? '🔐 Admin mode' : 'Sign the guestbook!'}</p>
      </div>
    </motion.div>
  );
}
