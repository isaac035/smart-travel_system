import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

/* ── fallback cover (reliable Unsplash Sri Lanka photo) ── */
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1588598198321-9735fd510275?w=1400&q=80';

/* ── status badge styles (light mode) ── */
const STATUS = {
  pending:   { badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', dot: 'bg-amber-400', msg: 'text-amber-600', text: 'Payment slip under review — we\'ll confirm shortly.' },
  confirmed: { badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400', msg: 'text-emerald-600', text: 'Confirmed! Your items will be prepared for delivery.' },
  rejected:  { badge: 'bg-red-50 text-red-700 ring-1 ring-red-200', dot: 'bg-red-400', msg: 'text-red-600', text: 'Rejected — please contact support or place a new order.' },
  cancelled: { badge: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200', dot: 'bg-gray-400', msg: 'text-gray-500', text: 'This order has been cancelled.' },
};

const GUIDE_CANCELLABLE = ['deposit_submitted', 'pending_guide_review', 'guide_accepted', 'under_admin_review', 'admin_confirmed', 'remaining_payment_pending', 'pending', 'confirmed'];

const TABS = [
  { label: 'Hotel Bookings', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Guide Bookings', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Tour Bookings', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { label: 'Trip Plans', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
];

const QUICK_LINKS = [
  { to: '/my-guides', label: 'Guide Bookings', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { to: '/my-tours', label: 'Tour Bookings', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064' },
  { to: '/services/travel-products', label: 'Shop Products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { to: '/explore', label: 'Explore', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { to: '/explore?tab=tripplan', label: 'Trip Plans', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { to: '/emergency', label: 'Emergency Support', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', emergency: true },
];

/* ── Inline SVG icon helper ── */
function Icon({ d, className = 'w-4 h-4' }) {
  const paths = d.split(' M').map((p, i) => (i === 0 ? p : 'M' + p));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {paths.map((path, i) => (
        <path key={i} strokeLinecap="round" strokeLinejoin="round" d={path} />
      ))}
    </svg>
  );
}

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Redirect admin to admin dashboard
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef(null);

  const [hotelBookings, setHotelBookings] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [tripPlans, setTripPlans] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/hotels/bookings/my'),
      api.get('/guides/bookings/my'),
      api.get('/tours/bookings/my'),
      api.get('/payments/my-orders'),
      api.get('/trips/my').catch(() => ({ data: [] })),
    ]).then(([h, g, t, p, tr]) => {
      setHotelBookings(h.data);
      setGuideBookings(g.data);
      setTourBookings(t.data);
      setProductOrders(p.data);
      setTripPlans(tr.data);
    }).catch(() => {}).finally(() => setLoadingBookings(false));
  }, []);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (coverFile) fd.append('coverPhoto', coverFile);
      const r = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(r.data);
      setEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', user.name);
      fd.append('coverPhoto', file);
      const r = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(r.data);
      toast.success('Cover photo updated');
    } catch {
      toast.error('Failed to update cover');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCancelGuide = async (bookingId, startDate) => {
    const daysUntilTrip = Math.ceil((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24));
    const refundMsg = daysUntilTrip >= 3 ? 'Full deposit refund.' : daysUntilTrip >= 1 ? '50% deposit refund.' : 'No refund (same-day).';
    if (!window.confirm(`Cancel this guide booking?\n\n${refundMsg}`)) return;
    try {
      const { data } = await api.put(`/guides/bookings/${bookingId}/cancel`);
      toast.success(`Cancelled. ${data.refundEligibility === 'none' ? 'No refund.' : `Refund: LKR ${data.refundAmount?.toLocaleString()}`}`);
      const { data: updated } = await api.get('/guides/bookings/my');
      setGuideBookings(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  const totalBookings = hotelBookings.length + guideBookings.length + tourBookings.length;
  const confirmedCount = [...hotelBookings, ...guideBookings, ...tourBookings].filter((b) => b.status === 'confirmed').length;

  return (
    <Layout>
      <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* ════════════════════════════════════════════
              PROFILE HEADER CARD
              ════════════════════════════════════════════ */}
          <div style={{
            background: '#fff',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 16px rgba(0,0,0,0.04)',
            border: '1px solid #e8eaed',
          }}>

            {/* ── Cover Banner ── */}
            <div style={{ position: 'relative', height: 200, overflow: 'hidden' }} className="group">
              <img
                src={user?.coverPhoto || DEFAULT_COVER}
                alt="Cover"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.src = DEFAULT_COVER; }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.15) 100%)' }} />
              <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverBannerUpload} className="hidden" />
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={saving}
                style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
                  padding: '8px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 500, color: '#374151',
                  transition: 'all 0.2s',
                }}
                className="opacity-0 group-hover:opacity-100 hover:!bg-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Edit Cover
              </button>
            </div>

            {/* ── Avatar + Info section ── */}
            <div style={{ padding: '0 28px 24px', position: 'relative' }}>

              {/* Avatar — overlapping the banner */}
              <div style={{
                marginTop: -48, marginBottom: 16,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
                  {/* Avatar circle */}
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{
                        width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                        border: '4px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 96, height: 96, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 36, fontWeight: 700,
                      border: '4px solid #fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                      flexShrink: 0,
                    }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Name block */}
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                        {user?.name}
                      </h1>
                      {user?.role === 'admin' && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#92400e',
                          background: '#fef3c7', padding: '2px 10px', borderRadius: 20,
                        }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#6b7280', fontSize: 14, margin: '2px 0 0' }}>{user?.email}</p>
                    <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0' }}>
                      Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => { setEditOpen(true); setName(user?.name || ''); }}
                  style={{
                    fontSize: 13, fontWeight: 600, color: '#d97706',
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 10, padding: '9px 20px', cursor: 'pointer',
                    transition: 'all 0.2s', marginBottom: 4,
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#fef3c7'; e.target.style.borderColor = '#fcd34d'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#fffbeb'; e.target.style.borderColor = '#fde68a'; }}
                >
                  Edit Profile
                </button>
              </div>

              {/* ── Stats Row ── */}
              <div style={{
                display: 'flex', gap: 12, marginBottom: 20,
                flexWrap: 'wrap',
              }}>
                {[
                  { value: totalBookings, label: 'Total Bookings', color: '#d97706', bg: '#fffbeb', ring: '#fde68a' },
                  { value: confirmedCount, label: 'Confirmed', color: '#059669', bg: '#ecfdf5', ring: '#a7f3d0' },
                  { value: productOrders.length, label: 'Orders', color: '#ea580c', bg: '#fff7ed', ring: '#fed7aa' },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    background: stat.bg, border: `1px solid ${stat.ring}`,
                    borderRadius: 14, padding: '14px 24px', textAlign: 'center',
                    minWidth: 110, flex: '1 1 0',
                  }}>
                    <p style={{ fontSize: 28, fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* ── Emergency Support Banner ── */}
              <Link
                to="/emergency"
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #dc2626 100%)',
                  borderRadius: 16, padding: '18px 24px', textDecoration: 'none',
                  transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(220,38,38,0.2)',
                  marginBottom: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(220,38,38,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(220,38,38,0.2)'; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>🚨</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>Emergency Support</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '3px 0 0' }}>Nearby police stations &amp; hospitals on a live map</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.7)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

            </div>
          </div>

          {/* ════════════════════════════════════════════
              MY ACTIVITY SECTION
              ════════════════════════════════════════════ */}
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20 }}>My Activity</h2>

            {/* ── Underline Tabs ── */}
            <div style={{
              display: 'flex', gap: 4,
              borderBottom: '2px solid #f3f4f6',
              marginBottom: 24, overflowX: 'auto',
            }}>
              {TABS.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => setTab(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', fontSize: 13, fontWeight: tab === i ? 600 : 500,
                    color: tab === i ? '#d97706' : '#9ca3af',
                    background: 'none', border: 'none',
                    borderBottom: tab === i ? '2px solid #d97706' : '2px solid transparent',
                    marginBottom: -2, cursor: 'pointer',
                    whiteSpace: 'nowrap', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (tab !== i) e.target.style.color = '#6b7280'; }}
                  onMouseLeave={(e) => { if (tab !== i) e.target.style.color = '#9ca3af'; }}
                >
                  <Icon d={t.icon} className="w-4 h-4" />
                  {t.label}
                  {[hotelBookings.length, guideBookings.length, tourBookings.length, productOrders.length, tripPlans.length][i] > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '1px 7px',
                      borderRadius: 20, marginLeft: 2,
                      background: tab === i ? '#fef3c7' : '#f3f4f6',
                      color: tab === i ? '#92400e' : '#6b7280',
                    }}>
                      {[hotelBookings.length, guideBookings.length, tourBookings.length, productOrders.length, tripPlans.length][i]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            {loadingBookings ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{ height: 80, background: '#f3f4f6', borderRadius: 16 }} className="animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Hotel Bookings */}
                {tab === 0 && (
                  hotelBookings.length === 0 ? <EmptyState label="hotel bookings" to="/hotels" /> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {hotelBookings.map((b) => (
                      <BookingCard key={b._id}>
                        {b.hotelId?.images?.[0] && <CardImage src={b.hotelId.images[0]} />}
                        <CardBody>
                          <CardTitle name={b.hotelId?.name || 'Hotel'} status={b.status} />
                          <CardMeta>{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} · {b.rooms} room{b.rooms !== 1 ? 's' : ''}</CardMeta>
                          <CardPrice>${b.totalPrice?.toFixed(2)}</CardPrice>
                        </CardBody>
                        <CardLink to={`/hotels/${b.hotelId?._id}`} />
                      </BookingCard>
                    ))}
                  </div>
                )}

                {/* Guide Bookings */}
                {tab === 1 && (
                  guideBookings.length === 0 ? <EmptyState label="guide bookings" to="/services/guides" /> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {guideBookings.map((b) => (
                      <BookingCard key={b._id}>
                        {b.guideId?.avatar ? (
                          <CardImage src={b.guideId.avatar} round />
                        ) : (
                          <div style={{
                            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 20,
                          }}>
                            {b.guideId?.name?.[0]}
                          </div>
                        )}
                        <CardBody>
                          <CardTitle name={b.guideId?.name || 'Guide'} status={b.status} />
                          <CardMeta>{new Date(b.startDate).toLocaleDateString()} · {b.days} day{b.days !== 1 ? 's' : ''}</CardMeta>
                          <CardPrice>${b.totalPrice?.toFixed(2)}</CardPrice>
                        </CardBody>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          {GUIDE_CANCELLABLE.includes(b.status) && (
                            <button
                              onClick={() => handleCancelGuide(b._id, b.startDate || b.travelDate)}
                              style={{
                                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                            >
                              Cancel
                            </button>
                          )}
                          <CardLink to="/my-guides" />
                        </div>
                      </BookingCard>
                    ))}
                  </div>
                )}

                {/* Tour Bookings */}
                {tab === 2 && (
                  tourBookings.length === 0 ? <EmptyState label="tour bookings" to="/tours" /> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tourBookings.map((b) => (
                      <BookingCard key={b._id}>
                        {b.packageId?.images?.[0] && <CardImage src={b.packageId.images[0]} />}
                        <CardBody>
                          <CardTitle name={b.packageId?.name || 'Tour Package'} status={b.status} />
                          <CardMeta>{new Date(b.startDate).toLocaleDateString()} · {b.travelers} traveler{b.travelers !== 1 ? 's' : ''} · <span style={{ textTransform: 'capitalize' }}>{b.vehicle}</span></CardMeta>
                          <CardPrice>LKR {Math.round(b.totalPrice)?.toLocaleString()}</CardPrice>
                        </CardBody>
                        <CardLink to="/my-tours" />
                      </BookingCard>
                    ))}
                  </div>
                )}

                {/* Product Orders */}
                {tab === 3 && (
                  productOrders.length === 0 ? <EmptyState label="product orders" to="/services/travel-products" /> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {productOrders.map((order) => {
                      const statusKey = order.status || 'pending';
                      const s = STATUS[statusKey] || STATUS.pending;
                      return (
                        <div key={order._id} style={{
                          background: '#fff', border: '1px solid #e8eaed', borderRadius: 16,
                          padding: '18px 20px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', background: '#f9fafb', padding: '3px 8px', borderRadius: 6 }}>
                                #{order._id.slice(-8).toUpperCase()}
                              </span>
                              <StatusBadge status={statusKey} />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: '#d97706', margin: 0 }}>LKR {Math.round(order.amount).toLocaleString()}</p>
                              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                    background: item.type === 'bundle' ? '#f3e8ff' : '#fef3c7',
                                    color: item.type === 'bundle' ? '#7c3aed' : '#92400e',
                                  }}>
                                    {item.type === 'bundle' ? 'Bundle' : 'Product'}
                                  </span>
                                  <span style={{ color: '#374151' }}>{item.name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6b7280' }}>
                                  <span>x{item.qty}</span>
                                  <span style={{ color: '#374151', fontWeight: 500 }}>LKR {Math.round((item.price || 0) * item.qty).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                            <p style={{ fontSize: 12, margin: 0 }} className={s.msg}>{s.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Trip Plans */}
                {tab === 4 && (
                  tripPlans.length === 0 ? <EmptyState label="trip plans" to="/explore?tab=tripplan" /> :
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tripPlans.map((trip) => (
                      <div key={trip._id} style={{
                        background: '#fff', border: '1px solid #e8eaed', borderRadius: 16,
                        padding: '18px 20px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: 12,
                              background: '#fffbeb', border: '1px solid #fde68a',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 20,
                            }}>
                              🗺️
                            </div>
                            <div>
                              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>{trip.name}</h3>
                              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                                {trip.days?.length || 0} days · {trip.days?.reduce((s, d) => s + (d.locations?.length || 0), 0) || 0} stops
                                {trip.totalDistance > 0 && ` · ${(trip.totalDistance / 1000).toFixed(0)} km`}
                                {trip.pace && ` · ${trip.pace}`}
                              </p>
                            </div>
                          </div>
                          <p style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(trip.updatedAt || trip.createdAt).toLocaleDateString()}</p>
                        </div>

                        {trip.days?.some((d) => d.locations?.some((l) => l.locationId?.images?.[0])) && (
                          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflow: 'hidden' }}>
                            {trip.days.flatMap((d) => d.locations).filter((l) => l.locationId?.images?.[0]).slice(0, 4).map((l, i) => (
                              <img key={i} src={l.locationId.images[0]} alt={l.locationId.name} style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link
                            to="/explore?tab=tripplan"
                            style={{
                              fontSize: 12, fontWeight: 600, color: '#d97706',
                              background: '#fffbeb', border: '1px solid #fde68a',
                              borderRadius: 8, padding: '7px 16px',
                              textDecoration: 'none', transition: 'all 0.2s',
                            }}
                          >
                            Edit Plan
                          </Link>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this trip?')) return;
                              try {
                                await api.delete(`/trips/${trip._id}`);
                                setTripPlans((prev) => prev.filter((t) => t._id !== trip._id));
                                toast.success('Trip deleted');
                              } catch { toast.error('Failed to delete'); }
                            }}
                            style={{
                              fontSize: 12, fontWeight: 500, color: '#9ca3af',
                              background: 'none', border: '1px solid #e5e7eb',
                              borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.target.style.color = '#ef4444'; e.target.style.borderColor = '#fca5a5'; }}
                            onMouseLeave={(e) => { e.target.style.color = '#9ca3af'; e.target.style.borderColor = '#e5e7eb'; }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ════════════════════════════════════════════
              SLIDE-OVER EDIT PANEL
              ════════════════════════════════════════════ */}
          {/* Backdrop */}
          <div
            onClick={() => setEditOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
              opacity: editOpen ? 1 : 0,
              pointerEvents: editOpen ? 'auto' : 'none',
              transition: 'opacity 0.3s',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, height: '100%',
            width: '100%', maxWidth: 420,
            background: '#fff', boxShadow: '-8px 0 30px rgba(0,0,0,0.1)',
            zIndex: 50,
            transform: editOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Edit Profile</h3>
              <button
                onClick={() => setEditOpen(false)}
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#6b7280', display: 'flex' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveProfile} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Avatar */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {avatarPreview || user?.avatar ? (
                    <img src={avatarPreview || user.avatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #f3f4f6' }} />
                  ) : (
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 28, fontWeight: 700, border: '3px solid #f3f4f6',
                    }}>
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <label style={{
                    fontSize: 13, fontWeight: 600, color: '#d97706',
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 10, padding: '8px 18px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    Change Photo
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Cover */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Cover Photo</label>
                <div style={{ position: 'relative', height: 120, borderRadius: 14, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img
                    src={coverPreview || user?.coverPhoto || DEFAULT_COVER}
                    alt="Cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = DEFAULT_COVER; }}
                  />
                  <label style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.25)', opacity: 0,
                    transition: 'opacity 0.2s', cursor: 'pointer',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
                  >
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '6px 16px', borderRadius: 8 }}>
                      Change Cover
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%', background: '#f9fafb', border: '1.5px solid #e5e7eb',
                    borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#111827',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Email</label>
                <input
                  value={user?.email || ''}
                  readOnly
                  style={{
                    width: '100%', background: '#f3f4f6', border: '1.5px solid #e5e7eb',
                    borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#9ca3af',
                    cursor: 'not-allowed', boxSizing: 'border-box',
                  }}
                />
              </div>
            </form>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 12 }}>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff',
                  background: saving ? '#d4d4d4' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', borderRadius: 12, cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                style={{
                  padding: '12px 24px', fontSize: 14, fontWeight: 500, color: '#6b7280',
                  background: 'none', border: '1px solid #e5e7eb',
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Cancel
              </button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

/* ════════════════════════════════════════════
   REUSABLE CARD SUB-COMPONENTS
   ════════════════════════════════════════════ */

function BookingCard({ children }) {
  return (
    <div
      style={{
        background: '#fff', border: '1px solid #e8eaed', borderRadius: 16,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {children}
    </div>
  );
}

function CardImage({ src, round }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: 56, height: 56, objectFit: 'cover', flexShrink: 0,
        borderRadius: round ? '50%' : 12,
        border: '1px solid #f3f4f6',
      }}
    />
  );
}

function CardBody({ children }) {
  return <div style={{ flex: 1, minWidth: 0 }}>{children}</div>;
}

function CardTitle({ name, status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <StatusBadge status={status} />
    </div>
  );
}

function CardMeta({ children }) {
  return <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 4px' }}>{children}</p>;
}

function CardPrice({ children }) {
  return <p style={{ fontSize: 14, fontWeight: 700, color: '#d97706', margin: 0 }}>{children}</p>;
}

function CardLink({ to }) {
  return (
    <Link
      to={to}
      style={{
        fontSize: 12, fontWeight: 600, color: '#d97706',
        background: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 8, padding: '6px 14px',
        textDecoration: 'none', flexShrink: 0,
        transition: 'all 0.2s',
      }}
    >
      View →
    </Link>
  );
}

function EmptyState({ label, to }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📋</div>
      <p style={{ fontSize: 16, color: '#9ca3af', marginBottom: 12 }}>No {label} yet</p>
      <Link
        to={to}
        style={{
          fontSize: 13, fontWeight: 600, color: '#d97706',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, padding: '10px 24px',
          textDecoration: 'none', display: 'inline-block',
        }}
      >
        Browse now →
      </Link>
    </div>
  );
}
