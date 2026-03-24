import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
const VEHICLE_LABEL = { car: '🚗 Car', van: '🚐 Van', bus: '🚌 Bus' };

/* ─── Filter definitions ───────────────────────────────────────── */
const DURATION_OPTIONS = [
  { label: 'All', icon: '🗓️', min: 0, max: Infinity },
  { label: '1–3 Days', icon: '⚡', min: 1, max: 3, desc: 'Quick getaway' },
  { label: '4–7 Days', icon: '🌿', min: 4, max: 7, desc: 'Classic trip' },
  { label: '1–2 Weeks', icon: '🏔️', min: 8, max: 14, desc: 'Deep explore' },
  { label: '2+ Weeks', icon: '🌍', min: 15, max: Infinity, desc: 'Grand tour' },
];

const PRICE_OPTIONS = [
  { label: 'Any', icon: '💸', min: 0, max: Infinity },
  { label: 'Under $200', icon: '🟢', min: 0, max: 199 },
  { label: '$200–$500', icon: '🟡', min: 200, max: 500 },
  { label: '$500–$1000', icon: '🟠', min: 500, max: 1000 },
  { label: 'Over $1000', icon: '🔴', min: 1001, max: Infinity },
];

/* ─── Package Card ──────────────────────────────────────────────── */
function PackageCard({ pkg }) {
  return (
    <Link
      to={`/tours/${pkg._id}`}
      style={{
        display: 'flex', flexDirection: 'column',
        background: '#fff', borderRadius: '20px', overflow: 'hidden',
        border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit',
        transition: 'transform 0.3s, box-shadow 0.3s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}
    >
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
        <img
          src={pkg.images?.[0] || PLACEHOLDER} alt={pkg.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 60%)' }} />
        <span style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
          fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
        }}>
          {pkg.duration} {pkg.duration === 1 ? 'Day' : 'Days'}
        </span>
        {pkg.locations?.length > 0 && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '20px',
          }}>
            📍 {pkg.locations.length} {pkg.locations.length === 1 ? 'Stop' : 'Stops'}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
        {pkg.destination && (
          <p style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
            📌 {pkg.destination}
          </p>
        )}
        <h3 style={{
          color: '#111827', fontSize: '16px', fontWeight: 700, lineHeight: 1.4, marginBottom: '8px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{pkg.name}</h3>
        <p style={{
          color: '#6b7280', fontSize: '14px', lineHeight: 1.6, marginBottom: '14px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{pkg.description}</p>

        {pkg.vehicleOptions?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {pkg.vehicleOptions.slice(0, 3).map((v) => (
              <span key={v} style={{
                fontSize: '11px', color: '#6b7280', background: '#f9fafb',
                border: '1px solid #e5e7eb', padding: '4px 10px', borderRadius: '8px', fontWeight: 500,
              }}>{VEHICLE_LABEL[v] ?? v}</span>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Starting from</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>
              ${pkg.basePrice}
              <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>/ pkg</span>
            </p>
          </div>
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
            fontSize: '13px', fontWeight: 700, padding: '10px 22px', borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(245,158,11,0.3)', flexShrink: 0,
          }}>View Details</span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div style={{ height: '220px', background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '400% 100%', animation: 'shimmer 1.4s ease infinite' }} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '8px', width: '80%' }} />
        <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '8px' }} />
        <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '8px', width: '70%' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ height: '24px', background: '#e5e7eb', borderRadius: '6px', width: '80px' }} />
          <div style={{ height: '40px', background: '#e5e7eb', borderRadius: '12px', width: '110px' }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function TourPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [durIdx, setDurIdx] = useState(0);
  const [priceIdx, setPriceIdx] = useState(0);

  useEffect(() => {
    api.get('/tours')
      .then((r) => { setPackages(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const dur = DURATION_OPTIONS[durIdx];
  const pr = PRICE_OPTIONS[priceIdx];

  const filtered = packages.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || (p.destination || '').toLowerCase().includes(q);
    return matchSearch && p.duration >= dur.min && p.duration <= dur.max && p.basePrice >= pr.min && p.basePrice <= pr.max;
  });

  const hasFilter = durIdx !== 0 || priceIdx !== 0 || search;

  return (
    <Layout>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .dur-card:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .price-pill:hover { transform: scale(1.05) !important; }
      `}</style>

      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

        {/* ── Hero ───────────────────────────────────── */}
        <section style={{
          position: 'relative', minHeight: '380px',
          backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920')`,
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.75) 100%)' }} />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '0 24px 40px' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '8px' }}>
              Explore Sri Lanka <span style={{ color: '#f59e0b' }}>Tours</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', marginBottom: '28px', maxWidth: '480px' }}>
              Curated experiences from highlands to coast — pick your perfect getaway
            </p>

            {/* Search bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0',
              background: '#fff', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxWidth: '560px',
            }}>
              <span style={{ padding: '0 16px', fontSize: '20px', flexShrink: 0 }}>🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search packages, destinations..."
                style={{
                  flex: 1, height: '52px', border: 'none', outline: 'none',
                  fontSize: '15px', color: '#111827', background: 'transparent',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '18px', color: '#9ca3af', flexShrink: 0,
                }}>✕</button>
              )}
            </div>
          </div>
        </section>

        {/* ── Filter Panel ───────────────────────────── */}
        <section style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px' }}>

            {/* Duration filter */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px' }}>
                Trip Duration
              </p>
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {DURATION_OPTIONS.map((opt, i) => {
                  const active = durIdx === i;
                  return (
                    <button
                      key={opt.label}
                      className="dur-card"
                      onClick={() => setDurIdx(i)}
                      style={{
                        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '4px', padding: '12px 20px', borderRadius: '14px', cursor: 'pointer',
                        border: active ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                        background: active ? '#fffbeb' : '#f9fafb',
                        transition: 'all 0.2s', minWidth: '90px',
                        boxShadow: active ? '0 4px 16px rgba(245,158,11,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <span style={{ fontSize: '22px', lineHeight: 1 }}>{opt.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: active ? '#92400e' : '#374151', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                      {opt.desc && (
                        <span style={{ fontSize: '10px', color: active ? '#d97706' : '#9ca3af', fontWeight: 500 }}>
                          {opt.desc}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', letterSpacing: '1.2px', textTransform: 'uppercase', flexShrink: 0 }}>
                Budget
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {PRICE_OPTIONS.map((opt, i) => {
                  const active = priceIdx === i;
                  return (
                    <button
                      key={opt.label}
                      className="price-pill"
                      onClick={() => setPriceIdx(i)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                        border: active ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                        background: active ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#f9fafb',
                        color: active ? '#fff' : '#374151',
                        fontWeight: 700, fontSize: '13px',
                        boxShadow: active ? '0 4px 14px rgba(245,158,11,0.35)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Clear + count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                {!loading && (
                  <span style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#111827' }}>{filtered.length}</strong> package{filtered.length !== 1 ? 's' : ''}
                  </span>
                )}
                {hasFilter && (
                  <button
                    onClick={() => { setDurIdx(0); setPriceIdx(0); setSearch(''); }}
                    style={{
                      fontSize: '12px', fontWeight: 700, color: '#6b7280',
                      background: '#f3f4f6', border: '1px solid #e5e7eb',
                      borderRadius: '20px', padding: '6px 14px', cursor: 'pointer',
                      whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}
                  >
                    ✕ Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Results ────────────────────────────────── */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px' }}>

          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', animation: 'fadeUp 0.4s ease' }}>
              <div style={{
                width: '88px', height: '88px', background: '#fef3c7', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '40px',
              }}>🧳</div>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>No packages found</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Try adjusting your filters or keywords</p>
              <button
                onClick={() => { setDurIdx(0); setPriceIdx(0); setSearch(''); }}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontWeight: 700, fontSize: '14px',
                  padding: '12px 28px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                }}
              >Reset Filters</button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{
              display: 'grid', gap: '24px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              animation: 'fadeUp 0.35s ease',
            }}>
              {filtered.map((pkg) => <PackageCard key={pkg._id} pkg={pkg} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
