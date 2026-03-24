import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AMENITY_ICONS = {
  'Free WiFi': '📶', Pool: '🏊', Parking: '🅿️', Gym: '💪',
  Spa: '💆', Restaurant: '🍽️', AC: '❄️', Bar: '🍸',
};
const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const sectionTitle = { fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '16px' };

export default function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/hotels/${id}`)
      .then((res) => setHotel(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to leave a review');
    setSubmitting(true);
    try {
      await api.post(`/hotels/${id}/reviews`, review);
      toast.success('Review submitted!');
      const { data } = await api.get(`/hotels/${id}`);
      setHotel(data);
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    </Layout>
  );

  if (!hotel) return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
        Hotel not found. <Link to="/hotels" style={{ color: '#d97706', marginLeft: 4 }}>← Back to Hotels</Link>
      </div>
    </Layout>
  );

  const discountedPrice = hotel.pricePerNight * (1 - (hotel.discount || 0) / 100);
  const images = hotel.images?.length > 0 ? hotel.images : [PLACEHOLDER];
  // For the grid, repeat images if we have fewer than 5
  const gridImages = [];
  for (let i = 0; i < 5; i++) {
    gridImages.push(images[i] || images[i % images.length]);
  }

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#1a1a2e', minHeight: '100vh' }}>
        {/* Image Grid */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 24px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '200px 200px', gap: '6px', borderRadius: '20px', overflow: 'hidden' }}>
            <button onClick={() => { setLightboxIdx(0); setLightboxOpen(true); }}
              style={{ gridRow: '1 / 3', cursor: 'pointer', border: 'none', padding: 0, overflow: 'hidden', position: 'relative' }}>
              <img src={gridImages[0]} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }} />
            </button>
            {[1, 2, 3, 4].map((i) => (
              <button key={i} onClick={() => { setLightboxIdx(i % images.length); setLightboxOpen(true); }}
                style={{ cursor: 'pointer', border: 'none', padding: 0, overflow: 'hidden', position: 'relative' }}>
                <img src={gridImages[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }} />
                {i === 4 && images.length > 5 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>+{images.length - 5} photos</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {hotel.starRating && (
                    <>
                      <span style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 700 }}>{'★'.repeat(hotel.starRating)}</span>
                      <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', fontWeight: 600, padding: '3px 10px', borderRadius: '20px' }}>
                        {hotel.starRating}-Star Hotel
                      </span>
                    </>
                  )}
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>{hotel.name}</h1>
                <p style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                  <svg width="16" height="16" fill="#f59e0b" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {hotel.location}{hotel.district ? `, ${hotel.district}` : ''}
                </p>
              </div>

              {/* About */}
              <div style={cardStyle}>
                <h2 style={sectionTitle}>About</h2>
                <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.7 }}>{hotel.description}</p>
              </div>

              {/* Amenities */}
              {hotel.amenities?.length > 0 && (
                <div>
                  <h2 style={sectionTitle}>Amenities</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {hotel.amenities.map((a) => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <span style={{ fontSize: '18px' }}>{AMENITY_ICONS[a] || '✓'}</span>
                        <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events & Weddings */}
              {(hotel.weddings?.available || hotel.events?.available) && (
                <div>
                  <h2 style={sectionTitle}>Events & Weddings</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {hotel.weddings?.available && (
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        {hotel.weddings.image && <img src={hotel.weddings.image} alt="Weddings" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}
                        <div style={{ padding: '20px' }}>
                          <h3 style={{ color: '#111827', fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>Weddings</h3>
                          <p style={{ color: '#6b7280', fontSize: '14px' }}>{hotel.weddings.description || 'Make your special day unforgettable.'}</p>
                        </div>
                      </div>
                    )}
                    {hotel.events?.available && (
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        {hotel.events.image && <img src={hotel.events.image} alt="Events" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />}
                        <div style={{ padding: '20px' }}>
                          <h3 style={{ color: '#111827', fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>Events & Meetings</h3>
                          <p style={{ color: '#6b7280', fontSize: '14px' }}>{hotel.events.description || 'Professional event spaces.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dining */}
              {hotel.dining && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Dining & Menus</h2>
                  <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.7 }}>{hotel.dining}</p>
                </div>
              )}

              {/* Policies */}
              {hotel.policies && (
                <div style={cardStyle}>
                  <h2 style={sectionTitle}>Important Information</h2>
                  <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: 1.7 }}>{hotel.policies}</p>
                </div>
              )}

              {/* Reviews */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>Guest Reviews</h2>
                    {hotel.reviewCount > 0 && (
                      <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>★ {hotel.averageRating} average from {hotel.reviewCount} reviews</p>
                    )}
                  </div>
                </div>

                {hotel.reviews?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                    {hotel.reviews.slice(-6).map((r, i) => (
                      <div key={i} style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '14px', padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                            {r.userName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ color: '#111827', fontSize: '14px', fontWeight: 600 }}>{r.userName}</p>
                            <p style={{ color: '#f59e0b', fontSize: '12px' }}>{'★'.repeat(r.rating)}</p>
                          </div>
                        </div>
                        <p style={{ color: '#4b5563', fontSize: '13px', lineHeight: 1.6 }}>{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>No reviews yet. Be the first to review!</p>
                )}

                {user ? (
                  <form onSubmit={handleReview} style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    <h3 style={{ color: '#111827', fontWeight: 600, marginBottom: '16px' }}>Leave a Review</h3>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReview({ ...review, rating: s })}
                          style={{ fontSize: '26px', background: 'none', border: 'none', cursor: 'pointer', color: s <= review.rating ? '#f59e0b' : '#d1d5db', transition: 'color 0.2s' }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })}
                      placeholder="Share your experience..." required rows={3}
                      style={{ width: '100%', background: '#f9fafb', border: '2px solid #e5e7eb', color: '#111827', borderRadius: '12px', padding: '14px', fontSize: '14px', resize: 'none', outline: 'none' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                    <button type="submit" disabled={submitting}
                      style={{ marginTop: '12px', padding: '10px 28px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 600, borderRadius: '12px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: submitting ? 0.5 : 1, boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <p style={{ color: '#6b7280', fontSize: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <Link to="/login" style={{ color: '#d97706', fontWeight: 600 }}>Login</Link> to leave a review.
                  </p>
                )}
              </div>
            </div>

            {/* Right — Sticky Booking Card */}
            <div style={{ position: 'sticky', top: '96px' }}>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827' }}>LKR {Math.round(discountedPrice).toLocaleString()}</span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>/night</span>
                </div>
                {hotel.discount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>LKR {hotel.pricePerNight?.toLocaleString()}</span>
                    <span style={{ fontSize: '12px', background: '#ef4444', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>-{hotel.discount}%</span>
                  </div>
                )}
                {!hotel.discount && <div style={{ marginBottom: '16px' }} />}


                {hotel.reviewCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '16px' }}>★ {hotel.averageRating}</span>
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>({hotel.reviewCount} reviews)</span>
                  </div>
                )}

                <button onClick={() => navigate(`/hotels/${id}/book`)}
                  style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700, borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '15px', boxShadow: '0 6px 20px rgba(245,158,11,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,158,11,0.45)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.35)'; }}>
                  Book Now
                </button>

                {/* Contact */}
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#4b5563' }}>
                  {hotel.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#9ca3af' }}>📞</span>{hotel.phone}</div>}
                  {hotel.email && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#9ca3af' }}>✉️</span>{hotel.email}</div>}
                  {hotel.address && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#9ca3af' }}>📍</span>{hotel.address}</div>}
                  {hotel.website && <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#9ca3af' }}>🌐</span><a href={hotel.website} target="_blank" rel="noopener noreferrer" style={{ color: '#d97706', wordBreak: 'break-all' }}>{hotel.website}</a></div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#9ca3af' }}>🕐</span>In: {hotel.checkInTime} / Out: {hotel.checkOutTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
          <div onClick={() => setLightboxOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <button onClick={() => setLightboxOpen(false)} style={{ position: 'absolute', top: 20, right: 24, color: 'rgba(255,255,255,0.7)', fontSize: '32px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}>✕</button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p - 1 + images.length) % images.length); }}
              style={{ position: 'absolute', left: 20, color: 'rgba(255,255,255,0.7)', fontSize: '48px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}>‹</button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p + 1) % images.length); }}
              style={{ position: 'absolute', right: 20, color: 'rgba(255,255,255,0.7)', fontSize: '48px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}>›</button>
            <img src={images[lightboxIdx]} alt="" style={{ maxHeight: '85vh', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()} />
            <p style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{lightboxIdx + 1} / {images.length}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
