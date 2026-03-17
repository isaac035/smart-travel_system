import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const statusStyles = {
  pending: { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
  confirmed: { background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' },
  rejected: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  cancelled: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' },
};

export default function MyToursPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api.get('/tours/bookings/my').then((r) => { setBookings(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await api.put(`/tours/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>My Tour Bookings</h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>View and manage your tour package reservations</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '16px', background: '#fff',
                  border: '1px solid #e5e7eb', borderRadius: '16px',
                  padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: '100px', height: '100px', background: '#e5e7eb', borderRadius: '12px', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '8px', width: '60%' }} />
                    <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '8px', width: '40%' }} />
                    <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '8px', width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '36px',
              }}>
                🧳
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No tour bookings yet</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>Start exploring our curated tour packages</p>
              <Link to="/tours" style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                padding: '12px 28px', borderRadius: '12px', textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              }}>
                Explore Packages
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookings.map((b) => (
                <div key={b._id} style={{
                  display: 'flex', gap: '16px', background: '#fff',
                  border: '1px solid #e5e7eb', borderRadius: '16px',
                  padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                >
                  {b.packageId?.images?.[0] && (
                    <img src={b.packageId.images[0]} alt=""
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>{b.packageId?.name || 'Package'}</h3>
                      <span style={{
                        fontSize: '12px', fontWeight: 600, padding: '4px 12px',
                        borderRadius: '20px', textTransform: 'capitalize', flexShrink: 0,
                        ...(statusStyles[b.status] || statusStyles.pending),
                      }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p>Vehicle: <span style={{ color: '#374151', fontWeight: 500, textTransform: 'capitalize' }}>{b.vehicle}</span> · Travelers: <span style={{ color: '#374151', fontWeight: 500 }}>{b.travelers}</span></p>
                      <p>Start: <span style={{ color: '#374151', fontWeight: 500 }}>{new Date(b.startDate).toLocaleDateString()}</span></p>
                      <p>Total: <span style={{ color: '#d97706', fontWeight: 700, fontSize: '16px' }}>${b.totalPrice.toFixed(2)}</span></p>
                    </div>
                    {b.slipUrl && (
                      <a href={b.slipUrl} target="_blank" rel="noreferrer" style={{
                        fontSize: '12px', color: '#2563eb', marginTop: '6px', display: 'inline-block',
                      }}>View payment slip</a>
                    )}
                  </div>
                  {b.status === 'pending' && (
                    <div style={{ flexShrink: 0, alignSelf: 'center' }}>
                      <button
                        onClick={() => handleCancel(b._id)}
                        disabled={cancelling === b._id}
                        style={{
                          fontSize: '13px', color: '#dc2626', fontWeight: 600,
                          background: '#fef2f2', border: '1px solid #fecaca',
                          padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                          opacity: cancelling === b._id ? 0.5 : 1,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                      >
                        {cancelling === b._id ? '...' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
