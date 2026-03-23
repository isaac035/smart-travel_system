import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';


export default function GuideLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null); // 'pending' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApprovalStatus(null);
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
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 16px'
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)', borderRadius: 20, padding: '40px 32px',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            Guide Portal
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>
            Sign in to manage your bookings
          </p>
        </div>

        {approvalStatus === 'pending' && (
          <div style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'center'
          }}>
            <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
              Account Pending Approval
            </p>
            <p style={{ color: '#d1d5db', fontSize: 12, margin: 0 }}>
              Your registration is being reviewed by an admin. Please check back later.
            </p>
          </div>
        )}

        {approvalStatus === 'rejected' && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20, textAlign: 'center'
          }}>
            <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
              Registration Rejected
            </p>
            <p style={{ color: '#d1d5db', fontSize: 12, margin: 0 }}>
              {rejectionReason || 'Your guide registration has been rejected. Please contact support for more information.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              required style={inputStyle} placeholder="guide@email.com" />
          </div>

          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required style={inputStyle} placeholder="Enter your password" />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
            background: loading ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 4, transition: 'opacity 0.2s'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 24 }}>
          New guide?{' '}
          <Link to="/guide/register" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>
            Register Here
          </Link>
        </p>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
          <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>User Login</Link>
          {' · '}
          <Link to="/admin/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Admin Login</Link>
          {' · '}
          <Link to="/hotel-owner/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Hotel Owner Login</Link>
        </p>
      </div>
    </div>
  );
}
