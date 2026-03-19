import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import RatingStars from '../../components/RatingStars';


export default function GuideDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/guides/${id}`), api.get(`/guides/${id}/reviews`)])
      .then(([g, r]) => { setGuide(g.data); setReviews(r.data); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
      </div>
    </Layout>
  );

  if (!guide) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
        Guide not found. <Link to="/services/guides" style={{ color: '#d97706' }}>← Back</Link>
      </div>
    </Layout>
  );

  const card = {
    background: '#fff', border: '1px solid #e8eaed', borderRadius: 18,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };
  const sectionTitle = { fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 };

  return (
    <Layout>
      <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
            <Link to="/services/guides" style={{ color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.target.style.color = '#d97706'; }} onMouseLeave={(e) => { e.target.style.color = '#9ca3af'; }}>
              Guides
            </Link>
            <span style={{ color: '#d1d5db' }}>/</span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>{guide.name}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28, alignItems: 'start' }} className="guide-detail-grid">
            {/* ── Left: Profile Card (sticky) ── */}
            <div style={{ ...card, overflow: 'hidden', position: 'sticky', top: 90 }}>
              {/* Guide image */}
              <div style={{ height: 280, overflow: 'hidden', position: 'relative' }}>
                {guide.image ? (
                  <img src={guide.image} alt={guide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 72, opacity: 0.4 }}>👤</span>
                  </div>
                )}
                {/* Gradient overlay at bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, rgba(0,0,0,0.3))' }} />
              </div>

              <div style={{ padding: '20px 22px 24px' }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{guide.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 12 }}>
                  <RatingStars rating={guide.rating} size="md" />
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>({guide.reviewCount})</span>
                </div>

                {/* Availability */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  fontSize: 12, fontWeight: 600,
                  background: guide.isAvailable ? '#ecfdf5' : '#fef2f2',
                  color: guide.isAvailable ? '#059669' : '#dc2626',
                  border: `1px solid ${guide.isAvailable ? '#a7f3d0' : '#fecaca'}`,
                  marginBottom: 20,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: guide.isAvailable ? '#10b981' : '#ef4444' }} />
                  {guide.isAvailable ? 'Available for Booking' : 'Currently Booked'}
                </div>

                {/* Price */}
                <div style={{
                  textAlign: 'center', paddingTop: 18,
                  borderTop: '1px solid #f3f4f6',
                }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: '#d97706', margin: 0, lineHeight: 1 }}>
                    LKR {guide.pricePerDay?.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>per day</p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate(`/guide-booking/${id}`)}
                  disabled={!guide.isAvailable}
                  style={{
                    width: '100%', marginTop: 18, padding: '14px 0',
                    fontSize: 15, fontWeight: 700, color: '#fff',
                    background: guide.isAvailable ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#d1d5db',
                    border: 'none', borderRadius: 14,
                    cursor: guide.isAvailable ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    boxShadow: guide.isAvailable ? '0 4px 14px rgba(245,158,11,0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (guide.isAvailable) e.target.style.boxShadow = '0 6px 20px rgba(245,158,11,0.4)'; }}
                  onMouseLeave={(e) => { if (guide.isAvailable) e.target.style.boxShadow = '0 4px 14px rgba(245,158,11,0.3)'; }}
                >
                  {guide.isAvailable ? 'Request This Guide' : 'Not Available'}
                </button>
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
                  Only a 30% advance deposit is required to submit your request. Final confirmation after guide approval.
                </p>
              </div>
            </div>

            {/* ── Right: Details ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* About */}
              {guide.bio && (
                <div style={{ ...card, padding: '22px 24px' }}>
                  <h2 style={sectionTitle}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📖</span>
                    About
                  </h2>
                  <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{guide.bio}</p>
                </div>
              )}

              {/* Info Grid: Location + Experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ ...card, padding: '20px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Location</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📍</div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{guide.location}</span>
                  </div>
                </div>
                <div style={{ ...card, padding: '20px 22px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Experience</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⏳</div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{guide.experience} year{guide.experience !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {guide.languages?.length > 0 && (
                <div style={{ ...card, padding: '22px 24px' }}>
                  <h3 style={sectionTitle}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🗣️</span>
                    Languages Spoken
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {guide.languages.map((l) => (
                      <span key={l} style={{
                        padding: '6px 16px', borderRadius: 20,
                        fontSize: 13, fontWeight: 600,
                        background: '#fffbeb', color: '#92400e',
                        border: '1px solid #fde68a',
                      }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {guide.certifications?.length > 0 && (
                <div style={{ ...card, padding: '22px 24px' }}>
                  <h3 style={sectionTitle}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: '#fdf4ff', border: '1px solid #e9d5ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎖️</span>
                    Certifications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {guide.certifications.map((c) => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {guide.services?.length > 0 && (
                <div style={{ ...card, padding: '22px 24px' }}>
                  <h3 style={sectionTitle}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧳</span>
                    Services Offered
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {guide.services.map((s) => (
                      <div key={s} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: '#f0fdf4', border: '1px solid #dcfce7',
                        borderRadius: 12, padding: '10px 14px',
                        fontSize: 13, fontWeight: 500, color: '#166534',
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Reviews Section ── */}
          <div style={{ ...card, padding: '28px 28px', marginTop: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
              Traveler Reviews
              {reviews.length > 0 && <span style={{ color: '#9ca3af', fontSize: 14, fontWeight: 400, marginLeft: 8 }}>({reviews.length})</span>}
            </h2>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 8 }}>💬</div>
                <p style={{ color: '#9ca3af', fontSize: 14 }}>No reviews yet for this guide.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {reviews.map((r, i) => (
                  <div key={i} style={{
                    background: '#f9fafb', border: '1px solid #f3f4f6',
                    borderRadius: 14, padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {(r.userName || r.travelerName)?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{r.userName || r.travelerName}</p>
                        <RatingStars rating={r.rating} />
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 768px) {
          .guide-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
