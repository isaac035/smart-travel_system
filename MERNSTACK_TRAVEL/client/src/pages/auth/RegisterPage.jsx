import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to Ceylon Compass.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInputWrapperStyle = (field) => ({
    position: 'relative',
    borderRadius: 10,
    background: focusedField === field ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
    border: focusedField === field ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.08)',
    boxShadow: focusedField === field
      ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 3px rgba(245,158,11,0.06)'
      : 'inset 0 2px 4px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
  });

  const inputStyle = {
    width: '100%', padding: '10px 16px 10px 38px',
    background: 'transparent', border: 'none', outline: 'none',
    color: '#fff', fontSize: 14, fontWeight: 400,
  };

  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 600, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5,
  };

  const iconStyle = (field) => ({
    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
    color: focusedField === field ? '#d97706' : '#4b5563',
    transition: 'color 0.2s',
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      backgroundImage: "url('src/assets/images/login.png')",
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
      position: 'relative',
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.45), rgba(0,0,0,0.6))',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom right, rgba(120,53,15,0.1), transparent, rgba(120,53,15,0.06))',
      }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 400, background: 'rgba(245,158,11,0.04)',
          borderRadius: '50%', filter: 'blur(120px)',
        }} />
      </div>

      <Navbar />

      <div style={{
        position: 'relative', zIndex: 10, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '140px 16px 100px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Card */}
          <div style={{
            borderRadius: 20,
            padding: '28px 28px 24px',
            background: 'linear-gradient(168deg, rgba(30,28,24,0.95) 0%, rgba(18,16,14,0.97) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 26, fontWeight: 300, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                Create{' '}
                <span style={{
                  fontWeight: 800, fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  paddingRight: 4,
                }}>
                  Account
                </span>
              </h1>
              <p style={{ color: '#6b7280', fontSize: 11, marginTop: 5, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 400 }}>
                Join Ceylon Compass today
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full Name</label>
                <div style={getInputWrapperStyle('name')}>
                  <div style={iconStyle('name')}>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                  <input
                    type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="Enter your full name" required
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Email Address</label>
                <div style={getInputWrapperStyle('email')}>
                  <div style={iconStyle('email')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-10 6L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="Enter your email" required
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Password</label>
                <div style={getInputWrapperStyle('password')}>
                  <div style={iconStyle('password')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="Min. 6 characters" required
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, paddingRight: 40 }}
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

              {/* Confirm Password */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={getInputWrapperStyle('confirm')}>
                  <div style={iconStyle('confirm')}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                      <circle cx="12" cy="16.5" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm" value={form.confirm} onChange={handleChange}
                    placeholder="Re-enter password" required
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    style={{ ...inputStyle, paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', padding: 0, transition: 'color 0.2s',
                  }}
                    onMouseEnter={(e) => e.target.closest('button').style.color = '#d1d5db'}
                    onMouseLeave={(e) => e.target.closest('button').style.color = '#6b7280'}
                  >
                    {showConfirm ? (
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

              {/* Submit Button */}
              <button
                type="submit" disabled={loading}
                style={{
                  position: 'relative', overflow: 'hidden',
                  width: '100%', padding: '12px 0',
                  borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#78350f' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 35%, #d97706 70%, #b45309 100%)',
                  boxShadow: loading ? 'none' : '0 8px 28px rgba(245,158,11,0.3), 0 2px 6px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
                  fontSize: 15, fontWeight: 700, color: '#111', letterSpacing: '0.02em',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(245,158,11,0.25)' }} />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)' }} />
            </div>

            {/* Links */}
            <div style={{ textAlign: 'center', space: 2 }}>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 8px', fontWeight: 400 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
              </p>
              <p style={{ color: '#4b5563', fontSize: 11, margin: 0 }}>
                Want to be a guide?{' '}
                <Link to="/guide/register" style={{ color: '#6b7280', fontWeight: 500, textDecoration: 'none' }}>Guide Registration</Link>
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
