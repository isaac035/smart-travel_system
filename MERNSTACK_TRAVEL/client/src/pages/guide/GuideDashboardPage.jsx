import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABELS = {
  deposit_submitted: 'Deposit Submitted',
  pending_guide_review: 'Awaiting Your Review',
  guide_accepted: 'You Accepted',
  guide_rejected: 'You Rejected',
  under_admin_review: 'Under Admin Review',
  admin_confirmed: 'Admin Confirmed',
  remaining_payment_pending: 'Remaining Payment Pending',
  remaining_payment_submitted: 'Remaining Payment Submitted',
  fully_paid: 'Fully Paid',
  completed: 'Completed',
  cancelled_by_user: 'Cancelled by User',
  cancelled_by_admin: 'Cancelled by Admin',
  refund_pending: 'Refund Pending',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
  no_refund: 'No Refund'
};

const STATUS_COLORS = {
  pending_guide_review: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  guide_accepted: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  guide_rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  remaining_payment_pending: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  remaining_payment_submitted: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  fully_paid: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  completed: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  cancelled_by_user: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  cancelled_by_admin: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  deposit_submitted: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  under_admin_review: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
};

const getStatusStyle = (status) => STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };

export default function GuideDashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        api.get('/guide-dashboard/profile'),
        api.get('/guide-dashboard/bookings')
      ]);
      setProfile(profileRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/guide/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.put(`/guide-dashboard/bookings/${bookingId}/accept`);
      toast.success('Booking request accepted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      await api.put(`/guide-dashboard/bookings/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Booking request rejected');
      setRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending_guide_review').length;
  const activeCount = bookings.filter(b => ['guide_accepted', 'under_admin_review', 'admin_confirmed', 'remaining_payment_pending', 'remaining_payment_submitted', 'fully_paid'].includes(b.status)).length;

  const filteredBookings = filter === 'all' ? bookings
    : filter === 'pending' ? bookings.filter(b => b.status === 'pending_guide_review')
    : filter === 'active' ? bookings.filter(b => ['guide_accepted', 'under_admin_review', 'admin_confirmed', 'remaining_payment_pending', 'remaining_payment_submitted', 'fully_paid'].includes(b.status))
    : bookings.filter(b => ['completed', 'cancelled_by_user', 'cancelled_by_admin', 'guide_rejected', 'refunded', 'partially_refunded', 'no_refund'].includes(b.status));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <div style={{ color: '#6b7280', fontSize: 16 }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '32px 24px 28px', color: '#fff'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                Welcome, {profile?.name || 'Guide'}
              </h1>
              <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>{profile?.location}</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/guide/schedule')} style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer'
              }}>
                My Schedule
              </button>
              <button onClick={() => { logout(); navigate('/guide/login'); }} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 13, cursor: 'pointer'
              }}>
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 24 }}>
            {[
              { label: 'Pending Review', value: pendingCount, color: '#fbbf24' },
              { label: 'Active Bookings', value: activeCount, color: '#34d399' },
              { label: 'Total Bookings', value: bookings.length, color: '#60a5fa' },
              { label: 'Rating', value: profile?.rating?.toFixed(1) || '0.0', color: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Requests */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Booking Requests</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'active', 'past'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: filter === f ? '1px solid #f59e0b' : '1px solid #d1d5db',
                background: filter === f ? '#fef3c7' : '#fff',
                color: filter === f ? '#92400e' : '#6b7280'
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: '50%',
                    padding: '1px 6px', fontSize: 11, fontWeight: 700
                  }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', background: '#fff',
            borderRadius: 16, border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#9ca3af', fontSize: 15 }}>No booking requests found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredBookings.map(booking => {
              const statusStyle = getStatusStyle(booking.status);
              return (
                <div key={booking._id} style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px',
                  border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{booking.travelerName}</span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`
                        }}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 13, color: '#6b7280' }}>
                        <span>Location: {booking.location}</span>
                        <span>Dates: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
                        <span>{booking.days} days | {booking.travelers} traveler{booking.travelers > 1 ? 's' : ''}</span>
                      </div>
                      {booking.specialRequests && (
                        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
                          "{booking.specialRequests}"
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 140 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>
                        LKR {booking.totalPrice?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        Deposit: LKR {booking.depositAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions for pending_guide_review */}
                  {booking.status === 'pending_guide_review' && (
                    <div style={{
                      display: 'flex', gap: 10, marginTop: 16, paddingTop: 16,
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <button onClick={() => handleAccept(booking._id)} disabled={actionLoading === booking._id}
                        style={{
                          padding: '9px 24px', borderRadius: 8, border: 'none',
                          background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600,
                          cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer'
                        }}>
                        {actionLoading === booking._id ? 'Processing...' : 'Accept Request'}
                      </button>
                      <button onClick={() => setRejectModal(booking._id)}
                        style={{
                          padding: '9px 24px', borderRadius: 8, border: '1px solid #fca5a5',
                          background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 440, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Reject Booking Request</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3} style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                fontSize: 14, resize: 'vertical', outline: 'none'
              }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer'
                }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
