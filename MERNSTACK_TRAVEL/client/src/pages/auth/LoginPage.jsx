import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function LoginPage() {
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchRole = (newRole) => {
    setRole(newRole);
    setForm({ email: '', password: '' });
    setApprovalStatus(null);
    setRejectionReason('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApprovalStatus(null);

    if (role === 'user') {
      try {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const { data } = await api.post('/auth/guide/login', form);
        localStorage.setItem('token', data.token);
        toast.success('Welcome back!');
        window.location.href = '/guide/dashboard';
      } catch (err) {
        if (err.response?.status === 403) {
          const status = err.response.data.approvalStatus;
          setApprovalStatus(status);
          if (status === 'rejected') setRejectionReason(err.response.data.reason || '');
        } else {
          toast.error(err.response?.data?.message || 'Login failed');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: "url('src/assets/images/login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
      }}
    >
      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.45), rgba(0,0,0,0.6))',
      }} />

      <Navbar />

      <div style={{
        position: 'relative', zIndex: 10, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '160px 16px 100px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* ═══════ CARD ═══════ */}
          <div style={{
            borderRadius: 24,
            padding: '28px 28px 24px',
            background: 'linear-gradient(168deg, rgba(30,28,24,0.95) 0%, rgba(18,16,14,0.97) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>

            {/* ── Header ── */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                Welcome{' '}
                <span style={{
                  fontWeight: 800, fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  paddingRight: 4,
                }}>
                  Back
                </span>
              </h1>
              <p style={{ color: '#6b7280', fontSize: 11, marginTop: 5, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}>
                Sign in to continue your journey
              </p>
            </div>

            {/* ── Role Switcher ── */}
            <div style={{
              position: 'relative',
              borderRadius: 12,
              padding: 3,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 20,
            }}>
              <div style={{ position: 'relative', display: 'flex', height: 38, borderRadius: 9 }}>
                {/* Sliding pill */}
                <div style={{
                  position: 'absolute',
                  top: 2, bottom: 2,
                  width: 'calc(50% - 2px)',
                  borderRadius: 8,
                  left: role === 'user' ? 2 : 'calc(50%)',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 14px rgba(245,158,11,0.35), 0 1px 4px rgba(245,158,11,0.15)',
                  transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
                {['user', 'guide'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => switchRole(r)}
                    style={{
                      position: 'relative', zIndex: 1,
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontSize: 13, fontWeight: 600, letterSpacing: '0.03em',
                      color: role === r ? '#111' : '#6b7280',
                      background: 'none', border: 'none', cursor: 'pointer',
                      transition: 'color 0.3s',
                    }}
                  >
                    {r === 'user' ? (
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
                      </svg>
                    )}
                    {r === 'user' ? 'User' : 'Guider'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Approval Alerts ── */}
            {role === 'guide' && approvalStatus === 'pending' && (
              <div style={{
                borderRadius: 14, padding: '12px 16px', marginBottom: 22, textAlign: 'center',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>Account Pending Approval</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Your registration is being reviewed. Check back later.</p>
              </div>
            )}
            {role === 'guide' && approvalStatus === 'rejected' && (
              <div style={{
                borderRadius: 14, padding: '12px 16px', marginBottom: 22, textAlign: 'center',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>Registration Rejected</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>{rejectionReason || 'Please contact support.'}</p>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 600, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5,
                }}>
                  {role === 'user' ? 'Email Address' : 'Guide Email'}
                </label>
                <div style={{
                  position: 'relative',
                  borderRadius: 10,
                  background: focusedField === 'email' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: focusedField === 'email' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: focusedField === 'email'
                    ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(245,158,11,0.06)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'email' ? '#d97706' : '#4b5563',
                    transition: 'color 0.2s',
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-10 6L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="Enter your email" required
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%', padding: '10px 16px 10px 38px',
                      background: 'transparent', border: 'none', outline: 'none',
                      color: '#fff', fontSize: 14, fontWeight: 400,
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: 6 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 600, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5,
                }}>
                  Password
                </label>
                <div style={{
                  position: 'relative',
                  borderRadius: 10,
                  background: focusedField === 'password' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                  border: focusedField === 'password' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: focusedField === 'password'
                    ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(245,158,11,0.06)'
                    : 'inset 0 2px 4px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'password' ? '#d97706' : '#4b5563',
                    transition: 'color 0.2s',
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="Enter your password" required
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%', padding: '10px 40px 10px 38px',
                      background: 'transparent', border: 'none', outline: 'none',
                      color: '#fff', fontSize: 14, fontWeight: 400,
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', padding: 0, transition: 'color 0.2s',
                  }}
                    onMouseEnter={(e) => e.target.closest('button').style.color = '#d1d5db'}
                    onMouseLeave={(e) => e.target.closest('button').style.color = '#6b7280'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <button type="button" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6b7280', fontSize: 12, fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={(e) => e.target.style.color = '#f59e0b'}
                  onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                >
                  Forgot Password?
                </button>
              </div>

              {/* ── Login Button ── */}
              <button
                type="submit" disabled={loading}
                style={{
                  position: 'relative', overflow: 'hidden',
                  width: '100%', padding: '12px 0',
                  borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#78350f' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 35%, #d97706 70%, #b45309 100%)',
                  boxShadow: loading ? 'none' : '0 8px 28px rgba(245,158,11,0.3), 0 2px 6px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                  fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: '0.02em',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {loading ? 'Signing in...' : role === 'user' ? 'Login' : 'Login as Guider'}
                </span>
              </button>
            </form>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245,158,11,0.25)' }} />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />
            </div>

            {/* ── Links ── */}
            <div style={{ textAlign: 'center' }}>
              {role === 'user' ? (
                <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 8px', fontWeight: 400 }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
                </p>
              ) : (
                <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 8px', fontWeight: 400 }}>
                  New guide?{' '}
                  <Link to="/guide/register" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>Register Here</Link>
                </p>
              )}
              <p style={{ color: '#4b5563', fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                Admin access?
                <Link to="/admin/login" style={{ color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Admin Login
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Footer />
      </div>

      {/* Autofill override */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(18,16,14,0.97) inset !important;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: #fff;
        }
      `}</style>
    </div>
  );
}
