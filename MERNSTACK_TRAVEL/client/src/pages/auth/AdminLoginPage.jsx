import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import loginBg from '../../assets/images/admin-login.png';
import { validateEmail, validatePassword } from '../../utils/authValidators';


export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
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
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name] || submitted) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin accounts only.');
        return;
      }
      toast.success(`Welcome, ${user.name}`);
      navigate('/admin');
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.accountStatus) {
        const status = err.response.data.accountStatus;
        if (status === 'hold') {
          toast.error('⚠️ Your admin account is currently on hold. Please contact another administrator.');
        } else if (status === 'deactivated') {
          toast.error('🚫 Your admin account has been deactivated. Please contact another administrator.');
        }
      } else {
        toast.error(err.response?.data?.message || 'Invalid email or password. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };
  const isFormValid = !hasErrors(validateForm());

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Full-screen background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }} />

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(160deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.78) 40%, rgba(30,41,59,0.82) 100%)',
      }} />

      {/* Main content - centered */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 2, padding: '20px 20px', width: '100%',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          {/* Logo + Brand */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{
              fontSize: '24px', fontWeight: 800, color: '#ffffff',
              letterSpacing: '-0.03em', margin: 0,
              textShadow: '0 2px 12px rgba(0,0,0,0.25)',
              lineHeight: 1.2,
            }}>
              Ceylon Compass
            </h1>
            <div style={{
              display: 'inline-block', marginTop: '10px',
              padding: '4px 14px', borderRadius: '20px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.18)',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, color: '#fbbf24',
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>
                Admin Panel
              </span>
            </div>
          </div>

          {/* Glass Login Card */}
          <div style={{
            background: 'rgba(15,20,35,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '24px',
            padding: '32px 28px 28px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{
                fontSize: '19px', fontWeight: 700, color: '#ffffff',
                margin: '0 0 6px 0', letterSpacing: '-0.01em',
              }}>
                Welcome back
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>
                Sign in to access your admin dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '13px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)', marginBottom: '8px',
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
                  }} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@ceyloncompass.com"
                    onBlur={handleBlur}
                    className="adm-login-input"
                    style={{
                      paddingLeft: '42px',
                      paddingRight: '16px',
                      borderColor: errors.email ? '#ef4444' : undefined,
                    }}
                  />
                </div>
                {errors.email && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '26px' }}>
                <label style={{
                  display: 'block', fontSize: '13px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)', marginBottom: '8px',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)',
                  }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    onBlur={handleBlur}
                    className="adm-login-input"
                    style={{
                      paddingLeft: '42px',
                      paddingRight: '46px',
                      borderColor: errors.password ? '#ef4444' : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: '2px',
                      color: 'rgba(255,255,255,0.35)', display: 'flex', transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: 6 }}>{errors.password}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="adm-login-btn"
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '18px', height: '18px', border: '2.5px solid rgba(15,23,42,0.2)',
                      borderTopColor: '#0f172a', borderRadius: '50%',
                      animation: 'admSpin 0.7s linear infinite', display: 'inline-block',
                    }} />
                    Authenticating...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Divider + back link */}
            <div style={{
              marginTop: '26px', paddingTop: '22px',
              borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
            }}>
              <Link
                to="/login"
                style={{
                  fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'none', display: 'inline-flex',
                  alignItems: 'center', gap: '6px', transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                <ArrowLeft size={14} />
                Back to user login
              </Link>
            </div>
          </div>

          {/* Restricted notice */}
          <p style={{
            textAlign: 'center', marginTop: '22px',
            fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            Restricted area &middot; Unauthorized access is prohibited
          </p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes admSpin {
          to { transform: rotate(360deg); }
        }
        .adm-login-input {
          width: 100%;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          background: rgba(255,255,255,0.08);
          border: 1.5px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          outline: none;
          transition: all 0.25s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
          box-sizing: border-box;
        }
        .adm-login-input::placeholder {
          color: rgba(255,255,255,0.28);
        }
        .adm-login-input:focus {
          border-color: rgba(245,158,11,0.6);
          background: rgba(255,255,255,0.12) !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
        }
        .adm-login-input:-webkit-autofill,
        .adm-login-input:-webkit-autofill:hover,
        .adm-login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(30,41,59,0.95) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          border-color: rgba(255,255,255,0.12) !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .adm-login-btn {
          width: 100%;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .adm-login-btn:hover {
          box-shadow: 0 6px 28px rgba(245,158,11,0.45);
          transform: translateY(-1px);
        }
        .adm-login-btn:active {
          transform: scale(0.98);
        }
        .adm-login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
      `}</style>
    </div>
  );
}
