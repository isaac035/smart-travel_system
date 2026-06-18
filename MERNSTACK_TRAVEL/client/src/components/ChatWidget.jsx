import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Compass, Hotel, MapPin, Map, X, Trash2, Loader2, MessageCircle } from 'lucide-react';
import api from '../utils/api';

const STORAGE_KEY = 'ceylon_compass_chat_history';

const SUGGESTIONS = [
  { icon: <Hotel size={12} />, text: 'Hotels in Kandy' },
  { icon: <MapPin size={12} />, text: 'Places in Ella' },
  { icon: <Map size={12} />, text: 'Tour to Sigiriya' },
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
    /* storage full */
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialMount = useRef(true);


  // Persist to localStorage (skip initial mount)
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    saveHistory(messages);
  }, [messages]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, loading, open, scrollToBottom]);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
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
        text: '⚠️ Something went wrong. Please try again.',
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

  return (
    <div className="cw-root">
      {/* ── Chat Panel ── */}
      {open && (
        <div className="cw-panel">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header__left">
              <div className="cw-header__logo">
                <Compass size={16} />
              </div>
              <div>
                <div className="cw-header__title">Ceylon Compass AI</div>
                <div className="cw-header__status">
                  <span className="cw-header__dot" /> Online
                </div>
              </div>
            </div>
            <div className="cw-header__actions">
              {messages.length > 0 && (
                <button className="cw-header__btn" onClick={clearChat} title="Clear chat">
                  <Trash2 size={13} />
                </button>
              )}
              <button className="cw-header__btn" onClick={() => setOpen(false)} title="Close">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.length === 0 && (
              <div className="cw-welcome">
                <div className="cw-welcome__icon">
                  <Compass size={22} />
                </div>
                <p className="cw-welcome__text">
                  Hi! I&rsquo;m your Sri Lanka travel assistant. Ask me anything!
                </p>
                <div className="cw-welcome__suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      className="cw-welcome__chip"
                      onClick={() => sendMessage(s.text)}
                      aria-label={`Try: ${s.text}`}
                    >
                      {s.icon} {s.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={`${msg.time}-${i}`}
                className={`cw-msg cw-msg--${msg.sender}`}
              >
                {msg.sender === 'bot' && (
                  <div className="cw-msg__avatar cw-msg__avatar--bot">
                    <Compass size={10} />
                  </div>
                )}
                <div className="cw-msg__bubble">
                  <div className="cw-msg__text">{msg.text}</div>
                  <div className="cw-msg__time">{formatTime(msg.time)}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="cw-msg cw-msg--bot">
                <div className="cw-msg__avatar cw-msg__avatar--bot">
                  <Compass size={10} />
                </div>
                <div className="cw-msg__bubble cw-msg__bubble--typing">
                  <div className="cw-typing">
                    <span className="cw-typing__dot" />
                    <span className="cw-typing__dot" />
                    <span className="cw-typing__dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="cw-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="cw-input__field"
              placeholder="Ask about hotels, guides, tours..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              aria-label="Chat message input"
            />
            <button
              type="submit"
              className="cw-input__send"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              {loading ? <Loader2 size={14} className="cw-spin" /> : <Send size={14} />}
            </button>
          </form>
        </div>
      )}

      {/* ── FAB Button ── */}
      <button
        className={`cw-fab ${open ? 'cw-fab--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close chat' : 'Chat with AI assistant'}
        aria-label={open ? 'Close chat' : 'Open chat assistant'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
