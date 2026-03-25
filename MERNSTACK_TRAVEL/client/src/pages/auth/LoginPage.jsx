import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { validateEmail, validatePassword } from '../../utils/authValidators';


export default function LoginPage() {
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [accountStatus, setAccountStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    if (name === 'email') return validateEmail(value);
    if (name === 'password') return validatePassword(value);
    return '';
  };

  const validateForm = (currentForm = form) => {
    return {
      email: validateField('email', currentForm.email),
      password: validateField('password', currentForm.password),
    };
  };

  const hasErrors = (nextErrors) => Object.values(nextErrors).some(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);

    if (touched[name] || submitted) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const switchRole = (newRole) => {
    setRole(newRole);
    setForm({ email: '', password: '' });
    setApprovalStatus(null);
    setRejectionReason('');
    setAccountStatus(null);
    setErrors({});
    setTouched({});
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    setApprovalStatus(null);
    setAccountStatus(null);

    if (role === 'user') {
      try {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/');
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.accountStatus) {
          setAccountStatus(err.response.data.accountStatus);
        } else {
          toast.error(err.response?.data?.message || 'Invalid email or password. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else if (role === 'guide') {
      try {
        const { data } = await api.post('/auth/guide/login', form);
        localStorage.setItem('token', data.token);
        toast.success('Welcome back!');
        window.location.href = '/guide/dashboard';
      } catch (err) {
        if (err.response?.status === 403) {
          if (err.response.data.accountStatus) {
            setAccountStatus(err.response.data.accountStatus);
          } else {
            const status = err.response.data.approvalStatus;
            setApprovalStatus(status);
            if (status === 'rejected') setRejectionReason(err.response.data.reason || '');
          }
        } else {
          toast.error(err.response?.data?.message || 'Invalid guide credentials. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      // hotel-owner
      try {
        const { data } = await api.post('/auth/hotel-owner/login', form);
        localStorage.setItem('token', data.token);
        toast.success('Welcome back!');
        window.location.href = '/hotel-owner/dashboard';
      } catch (err) {
        if (err.response?.status === 403) {
          if (err.response.data.accountStatus) {
            setAccountStatus(err.response.data.accountStatus);
          } else {
            const status = err.response.data.approvalStatus;
            setApprovalStatus(status);
            if (status === 'rejected') setRejectionReason(err.response.data.reason || '');
          }
        } else {
          toast.error(err.response?.data?.message || 'Invalid hotel owner credentials. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  /* ─── Role definitions ─── */
  const ROLES = [
    {
      id: 'user',
      label: 'User',
      icon: (
        <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      ),
    },
    {
      id: 'guide',
      label: 'Guider',
      icon: (
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'hotel-owner',
      label: 'Hotel',
      icon: (
        <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z" />
        </svg>
      ),
    },
  ];

  const activeIndex = ROLES.findIndex((r) => r.id === role);

  const ROLE_META = {
    user:        { subtitle: 'Traveller Login',     emailLabel: 'Email Address',  btnLabel: 'Sign In',               registerPath: '/register',       registerText: "Don't have an account ? ", registerCta: ' Sign Up' },
    guide:       { subtitle: 'Guide Login',          emailLabel: 'Guide Email',    btnLabel: 'Sign In as Guider',     registerPath: '/guide/register', registerText: 'New guide ? ',             registerCta: ' Register Here' },
    'hotel-owner':{ subtitle: 'Hotel Owner Login',   emailLabel: 'Owner Email',    btnLabel: 'Sign In as Owner',      registerPath: '/hotel-owner/register', registerText: 'New hotel owner ? ', registerCta: ' Register Here' },
  };

  const meta = ROLE_META[role];
  const isFormValid = !hasErrors(validateForm());

  /* ─── Shared input wrapper style ─── */
  const inputWrap = (field) => ({
    position: 'relative', borderRadius: 10,
    background: focusedField === field ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
    border: errors[field]
      ? '1px solid #ef4444'
      : focusedField === field
        ? '1px solid rgba(245,158,11,0.4)'
        : '1px solid rgba(255,255,255,0.08)',
    boxShadow: focusedField === field
      ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(245,158,11,0.06)'
      : 'inset 0 2px 4px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
  });

  const iconColor = (field) => ({
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: focusedField === field ? '#d97706' : '#4b5563',
    transition: 'color 0.2s',
  });

  const baseInput = {
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    color: '#fff', fontSize: 14, fontWeight: 400,
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      backgroundImage: "url('src/assets/images/login.png')",
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundAttachment: 'fixed', position: 'relative',
    }}>
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
        <div style={{ width: '100%', maxWidth: 430 }}>

          {/* ═══════ CARD ═══════ */}
          <div style={{
            borderRadius: 24, padding: '28px 28px 24px',
            background: 'linear-gradient(168deg, rgba(30,28,24,0.95) 0%, rgba(18,16,14,0.97) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                Welcome{' '}
                <span style={{
                  fontWeight: 800, fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingRight: 4,
                }}>
                  Back
                </span>
              </h1>
              <p style={{ color: '#6b7280', fontSize: 11, marginTop: 5, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}>
                Sign in to continue your journey
              </p>
            </div>

            {/* ── 3-WAY ROLE SWITCHER ── */}
            <div style={{
              borderRadius: 14, padding: 4,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 18, position: 'relative',
            }}>
              {/* Sliding amber pill */}
              <div style={{
                position: 'absolute',
                top: 4, bottom: 4,
                width: `calc(${100 / 3}% - 4px)`,
                left: `calc(${activeIndex * (100 / 3)}% + 2px)`,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.38), 0 1px 4px rgba(245,158,11,0.2)',
                transition: 'left 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 0,
              }} />

              <div style={{ display: 'flex', height: 40, position: 'relative', zIndex: 1 }}>
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => switchRole(r.id)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
                      color: role === r.id ? '#111827' : '#6b7280',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderRadius: 10, transition: 'color 0.25s',
                    }}
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Role subtitle badge */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 10, fontWeight: 700, color: 'rgba(245,158,11,0.8)',
                background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)',
                padding: '4px 14px', borderRadius: 99,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.25s',
              }}>
                {meta.subtitle}
              </span>
            </div>

            {/* ── Approval Alerts ── */}
            {(role === 'guide' || role === 'hotel-owner') && approvalStatus === 'pending' && (
              <div style={{
                borderRadius: 14, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>Account Pending Approval</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Your registration is being reviewed. Check back later.</p>
              </div>
            )}
            {(role === 'guide' || role === 'hotel-owner') && approvalStatus === 'rejected' && (
              <div style={{
                borderRadius: 14, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>Registration Rejected</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>{rejectionReason || 'Please contact support.'}</p>
              </div>
            )}

            {/* Account Status Alerts */}
            {accountStatus === 'hold' && (
              <div style={{
                borderRadius: 14, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>⚠️ Account On Hold</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Your account is currently on hold. Please contact the administrator for assistance.</p>
              </div>
            )}
            {accountStatus === 'deactivated' && (
              <div style={{
                borderRadius: 14, padding: '12px 16px', marginBottom: 20, textAlign: 'center',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 3px' }}>🚫 Account Deactivated</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: 0 }}>Your account has been deactivated. Please contact the administrator for assistance.</p>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 600, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5,
                }}>
                  {meta.emailLabel}
                </label>
                <div style={inputWrap('email')}>
                  <div style={iconColor('email')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-10 6L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder={`Enter your email`}
                    onFocus={() => setFocusedField('email')}
                    onBlur={(e) => { setFocusedField(null); handleBlur(e); }}
                    style={{ ...baseInput, padding: '10px 16px 10px 38px' }}
                  />
                </div>
                {errors.email && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 6 }}>
                <label style={{
                  display: 'block', fontSize: 10, fontWeight: 600, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5,
                }}>
                  Password
                </label>
                <div style={inputWrap('password')}>
                  <div style={iconColor('password')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="Enter your password"
                    onFocus={() => setFocusedField('password')}
                    onBlur={(e) => { setFocusedField(null); handleBlur(e); }}
                    style={{ ...baseInput, padding: '10px 40px 10px 38px' }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#6b7280', padding: 0, transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#d1d5db'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
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
                {errors.password && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{errors.password}</p>}
              </div>

              {/* Forgot */}
              <div style={{ textAlign: 'right', marginBottom: 18 }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12, fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f59e0b'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading || !isFormValid}
                style={{
                  position: 'relative', overflow: 'hidden',
                  width: '100%', padding: '12px 0',
                  borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading
                    ? '#78350f'
                    : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 35%, #d97706 70%, #b45309 100%)',
                  boxShadow: loading ? 'none' : '0 8px 28px rgba(245,158,11,0.3), 0 2px 6px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                  fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '0.02em',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ animation: 'loginSpin .8s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                  {loading ? 'Signing in...' : meta.btnLabel}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245,158,11,0.28)' }} />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />
            </div>

            {/* Footer links */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 10px', fontWeight: 400 }}>
                {meta.registerText}{' '}
                <Link to={meta.registerPath} style={{ color: '#f59e0b', fontWeight: 700, textDecoration: 'none' }}>
                  {meta.registerCta}
                </Link>
              </p>
              <p style={{ color: '#4b5563', fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                Admin access?
                <Link to="/admin/login" style={{ color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Admin Login
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <Footer />
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
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
