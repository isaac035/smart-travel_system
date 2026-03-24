import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';


const LANGUAGES = ['English', 'Sinhala', 'Tamil', 'Hindi', 'French', 'German', 'Japanese', 'Chinese'];
const LOCATIONS = ['Colombo', 'Kandy', 'Galle', 'Ella', 'Sigiriya', 'Nuwara Eliya', 'Jaffna', 'Trincomalee', 'Anuradhapura'];

export default function GuideRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    phone: '', location: '', experience: 1, bio: '',
    languages: [], services: '', certifications: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!form.location) return toast.error('Please select a location');

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        location: form.location,
        experience: Number(form.experience),
        bio: form.bio,
        languages: form.languages,
        services: form.services ? form.services.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      await api.post('/auth/guide/register', payload);
      toast.success('Registration submitted! Your account is pending admin approval.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s'
  };

  const labelStyle = { display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 4, fontWeight: 500 };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 16px'
    }}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)', borderRadius: 20, padding: '36px 32px',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
              Registration Submitted!
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Your guide account is pending admin approval.<br />
              You will be able to log in once an admin approves your registration.
            </p>
            <Link to="/guide/login" style={{
              display: 'inline-block', padding: '12px 32px', borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none'
            }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ color: '#f59e0b', fontSize: 26, fontWeight: 700, margin: 0 }}>
                Become a Travel Guide
              </h1>
              <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>
                Register to receive booking requests from travelers
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="Your full name" />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="+94 7X XXX XXXX" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} placeholder="guide@email.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required style={inputStyle} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required style={inputStyle} placeholder="Confirm password" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 4 }}>
                <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Professional Details</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Location *</label>
                  <select name="location" value={form.location} onChange={handleChange} required style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select location</option>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Experience (years)</label>
                  <input name="experience" type="number" min="1" value={form.experience} onChange={handleChange} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Languages</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LANGUAGES.map(lang => (
                    <button type="button" key={lang} onClick={() => toggleLanguage(lang)} style={{
                      padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      border: form.languages.includes(lang) ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                      background: form.languages.includes(lang) ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                      color: form.languages.includes(lang) ? '#f59e0b' : '#9ca3af',
                      transition: 'all 0.2s'
                    }}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Bio</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Tell travelers about yourself and your expertise..." />
              </div>

              <div>
                <label style={labelStyle}>Services (comma separated)</label>
                <input name="services" value={form.services} onChange={handleChange} style={inputStyle}
                  placeholder="City Tours, Wildlife Safaris, Trekking" />
              </div>

              <div>
                <label style={labelStyle}>Certifications (comma separated)</label>
                <input name="certifications" value={form.certifications} onChange={handleChange} style={inputStyle}
                  placeholder="Licensed Tour Guide, First Aid Certified" />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: loading ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8, transition: 'opacity 0.2s'
              }}>
                {loading ? 'Creating Account...' : 'Register as Guide'}
              </button>
            </form>

            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 20 }}>
              Already have a guide account?{' '}
              <Link to="/guide/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
            </p>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
              Looking to book a guide?{' '}
              <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>User Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
