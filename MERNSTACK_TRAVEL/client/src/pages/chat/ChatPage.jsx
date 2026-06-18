import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, Compass, MapPin, Hotel, Map, Loader2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/chat.css';

const STORAGE_KEY = 'ceylon_compass_chat_history';

const SUGGESTIONS = [
  { icon: <Hotel size={14} />, text: 'Find hotels in Kandy' },
  { icon: <MapPin size={14} />, text: 'Best places in Ella' },
  { icon: <Map size={14} />, text: 'Tour packages to Sigiriya' },
  { icon: <Compass size={14} />, text: 'Guide in Galle' },
];

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* storage full — silently ignore */
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialMount = useRef(true);

  // Persist to localStorage whenever messages change (skip initial mount)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    saveHistory(messages);
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;

    const userMsg = { sender: 'user', text: trimmed, time: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat', { message: trimmed });
      const botMsg = {
        sender: 'bot',
        text: data.reply || 'Sorry, I could not generate a response.',
        time: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const botMsg = {
        sender: 'bot',
        text: '⚠️ Something went wrong. Please check your connection and try again.',
        time: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    inputRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="chat-page">
      {/* ── Header ── */}
      <header className="chat-header">
        <div className="chat-header__left">
          <div className="chat-header__logo">
            <Compass size={18} />
          </div>
          <div>
            <div className="chat-header__title">Ceylon Compass AI</div>
            <div className="chat-header__subtitle">Your Sri Lanka travel assistant</div>
          </div>            <div className="chat-header__badge">
              <span className="chat-header__badge-dot" />
              Online
            </div>
          </div>

          <Link to="/" className="chat-header__back" title="Back to Home">
            <Home size={16} />
          </Link>

        <div className="chat-header__actions">
          {hasMessages && (
            <button
              className="chat-header__btn chat-header__btn--danger"
              onClick={clearChat}
              title="Clear all messages"
            >
              <Trash2 size={14} />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {!hasMessages && (
          <div className="chat-welcome">
            <div className="chat-welcome__icon">
              <Compass size={32} />
            </div>
            <h1 className="chat-welcome__title">Welcome to Ceylon Compass AI</h1>
            <p className="chat-welcome__subtitle">
              Ask me about hotels, tour packages, travel guides, or destinations across Sri Lanka.
              I&rsquo;ll help you plan the perfect trip!
            </p>
            <div className="chat-welcome__suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  className="chat-welcome__suggestion"
                  onClick={() => sendMessage(s.text)}
                  aria-label={`Try: ${s.text}`}
                >
                  <span className="chat-welcome__suggestion-icon">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={`${msg.time}-${i}`}
            className={`chat-message chat-message--${msg.sender}`}
          >
            <div className={`chat-avatar chat-avatar--${msg.sender}`}>
              {msg.sender === 'bot' ? <Compass size={14} /> : 'You'}
            </div>
            <div className="chat-message__content">
              <div className="chat-message__sender">
                {msg.sender === 'bot' ? 'Ceylon Compass' : 'You'}
                <span className="chat-message__time">{formatTime(msg.time)}</span>
              </div>
              <div className="chat-message__text">{msg.text}</div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="chat-typing">
            <div className="chat-avatar chat-avatar--bot">
              <Compass size={14} />
            </div>
            <div className="chat-typing__dots">
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
            </div>
          </div>
        )}



        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="chat-input-area">
        <div className="chat-input-area__inner">
          <form className="chat-input__wrapper" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="chat-input__field"
              placeholder="Ask about hotels, guides, tours, destinations..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              className="chat-input__send"
              disabled={!input.trim() || loading}
              title="Send message"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={16} className="chat-input__send--loading" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          <div className="chat-input__hint">
            Press Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
