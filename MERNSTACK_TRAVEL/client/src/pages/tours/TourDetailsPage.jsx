import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { formatLKR } from '../../utils/currency';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
const LOC_PLACEHOLDER = 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=400&q=80';
const vehicleIcons = { car: '🚗', van: '🚐', bus: '🚌' };

const vehicleColorMap = {
  car: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  van: { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
  bus: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
};

export default function TourDetailsPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    api.get(`/tours/${id}`).then((r) => { setPkg(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ height: '20px', background: '#e5e7eb', borderRadius: '10px', width: '200px', marginBottom: '32px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ aspectRatio: '16/9', background: '#e5e7eb', borderRadius: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '32px', background: '#e5e7eb', borderRadius: '10px', width: '50%' }} />
              <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '10px', width: '75%' }} />
              <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '10px', width: '100%' }} />
            </div>
            <div style={{ height: '300px', background: '#e5e7eb', borderRadius: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!pkg) return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>Package not found.</p>
      </div>
    </Layout>
  );

  const images = pkg.images?.length > 0 ? pkg.images : [PLACEHOLDER];

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#111827', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            <Link to="/tours" style={{ color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d97706'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}>
              Tour Packages
            </Link>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span style={{ color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>{pkg.name}</span>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>

              {/* Gallery */}
              <div>
                <div style={{
                  borderRadius: '20px', overflow: 'hidden', background: '#e5e7eb',
                  aspectRatio: '16/9', maxHeight: '460px', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }} onClick={() => setLightbox(true)}>
                  <img
                    src={images[activeImg] || PLACEHOLDER}
                    alt={pkg.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                  />
                </div>
                {images.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        style={{
                          flexShrink: 0, width: '68px', height: '68px', borderRadius: '12px',
                          overflow: 'hidden', border: activeImg === i ? '3px solid #f59e0b' : '3px solid transparent',
                          opacity: activeImg === i ? 1 : 0.6, cursor: 'pointer',
                          transition: 'all 0.2s', boxShadow: activeImg === i ? '0 2px 8px rgba(245,158,11,0.3)' : 'none',
                          padding: 0, background: 'none',
                        }}
                        onMouseEnter={(e) => { if (activeImg !== i) e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { if (activeImg !== i) e.currentTarget.style.opacity = '0.6'; }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', marginBottom: '14px', lineHeight: 1.2 }}>{pkg.name}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  <span style={{
                    background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a',
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  }}>
                    🗓 {pkg.duration} {pkg.duration === 1 ? 'Day' : 'Days'}
                  </span>
                  {pkg.vehicleOptions?.map((v) => {
                    const c = vehicleColorMap[v] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
                    return (
                      <span key={v} style={{
                        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                        padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                        textTransform: 'capitalize',
                      }}>
                        {vehicleIcons[v]} {v}
                      </span>
                    );
                  })}
                </div>
                <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.7 }}>{pkg.description}</p>
              </div>

              {/* Includes / Excludes */}
              {(pkg.includes?.length > 0 || pkg.excludes?.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {pkg.includes?.length > 0 && (
                    <div style={{
                      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '24px',
                    }}>
                      <h3 style={{ fontWeight: 700, color: '#166534', marginBottom: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', background: '#22c55e', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>✓</span>
                        What's Included
                      </h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {pkg.includes.map((item, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#15803d' }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.excludes?.length > 0 && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px',
                    }}>
                      <h3 style={{ fontWeight: 700, color: '#991b1b', marginBottom: '14px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '24px', height: '24px', background: '#ef4444', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>✗</span>
                        Not Included
                      </h3>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {pkg.excludes.map((item, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px', color: '#b91c1c' }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: '2px' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Destinations */}
              {pkg.locations?.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
                    Destinations <span style={{ color: '#9ca3af', fontSize: '16px', fontWeight: 400 }}>({pkg.locations.length})</span>
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {pkg.locations.map((loc) => (
                      <Link key={loc._id} to={`/explore/location/${loc._id}`}
                        style={{
                          background: '#fff', borderRadius: '14px', overflow: 'hidden',
                          border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                        <div style={{ height: '100px', overflow: 'hidden', background: '#f3f4f6' }}>
                          <img src={loc.images?.[0] || LOC_PLACEHOLDER} alt={loc.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                            onError={(e) => { e.currentTarget.src = LOC_PLACEHOLDER; }} />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <p style={{ fontWeight: 700, color: '#111827', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {loc.name}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {loc.district}, {loc.province}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Guides */}
              {pkg.guideIds?.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>Available Guides</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {pkg.guideIds.map((g) => (
                      <Link key={g._id} to={`/guides/${g._id}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px',
                          padding: '14px 18px', textDecoration: 'none', color: 'inherit',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#f59e0b';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                        }}>
                        {g.avatar ? (
                          <img src={g.avatar} alt={g.name} style={{
                            width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover',
                            border: '2px solid #f3f4f6',
                          }} />
                        ) : (
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '16px',
                          }}>
                            {g.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{g.name}</p>
                          <p style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>★ {g.rating?.toFixed(1) || 'N/A'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Booking Card */}
            <div>
              <div style={{
                position: 'sticky', top: '96px',
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px',
                padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Starting from</p>
                <div style={{ marginBottom: '24px' }}>


                  <span style={{ fontSize: '40px', fontWeight: 800, color: '#d97706' }}>{formatLKR(pkg.basePrice)}</span>

                  <span style={{ color: '#9ca3af', fontSize: '14px', marginLeft: '6px' }}>/ person</span>
                </div>

                {/* Quick details */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Duration</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{pkg.duration} {pkg.duration === 1 ? 'day' : 'days'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ color: '#6b7280' }}>Destinations</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{pkg.locations?.length || 0} stops</span>
                  </div>
                </div>

                {/* Vehicle pricing */}
                {pkg.vehicleOptions?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Pricing by Vehicle</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pkg.vehicleOptions.map((v) => (
                        <div key={v} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: '#f9fafb', borderRadius: '12px', padding: '12px 14px',
                        }}>
                          <span style={{ fontSize: '14px', color: '#374151', fontWeight: 600, textTransform: 'capitalize' }}>{vehicleIcons[v]} {v}</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>{formatLKR((pkg.basePrice * (pkg.vehicleMultipliers?.[v] || 1)).toFixed(0))}<span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 400 }}>/person</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link to={`/tours/${pkg._id}/book`} style={{
                  display: 'block', width: '100%', textAlign: 'center', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontWeight: 700, fontSize: '15px',
                  padding: '14px 0', borderRadius: '14px',
                  boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,158,11,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(245,158,11,0.4)';
                  }}>
                  Book This Package
                </Link>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>No payment required to book</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} onClick={() => setLightbox(false)}>
            <button onClick={() => setLightbox(false)}
              style={{ position: 'absolute', top: '20px', right: '24px', color: '#fff', fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 51 }}>
              ✕
            </button>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i - 1 + images.length) % images.length); }}
                  style={{ position: 'absolute', left: '20px', color: '#fff', fontSize: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ‹
                </button>
                <button onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i + 1) % images.length); }}
                  style={{ position: 'absolute', right: '20px', color: '#fff', fontSize: '32px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ›
                </button>
              </>
            )}
            <img src={images[activeImg]} alt="" style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: '12px' }}
              onClick={(e) => e.stopPropagation()} />
          </div>
        )}
      </div>
    </Layout>
  );
}
