import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { formatLKR } from '../../utils/currency';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
const VEHICLE_LABEL = { car: '🚗 Car', van: '🚐 Van', bus: '🚌 Bus' };

function PackageCard({ pkg }) {
  return (
    <Link
      to={`/tours/${pkg._id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.3s, box-shadow 0.3s',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
        <img
          src={pkg.images?.[0] || PLACEHOLDER}
          alt={pkg.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent 60%)' }} />

        {/* Duration badge */}
        <span style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff', fontSize: '12px', fontWeight: 700,
          padding: '5px 14px', borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
        }}>
          {pkg.duration} {pkg.duration === 1 ? 'Day' : 'Days'}
        </span>

        {/* Stops badge */}
        {pkg.locations?.length > 0 && (
          <span style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: '12px', fontWeight: 500,
            padding: '5px 12px', borderRadius: '20px',
          }}>
            📍 {pkg.locations.length} {pkg.locations.length === 1 ? 'Stop' : 'Stops'}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
        <h3 style={{
          color: '#111827', fontSize: '16px', fontWeight: 700,
          lineHeight: 1.4, marginBottom: '8px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {pkg.name}
        </h3>

        <p style={{
          color: '#6b7280', fontSize: '14px', lineHeight: 1.6, marginBottom: '14px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {pkg.description}
        </p>

        {/* Vehicle pills */}
        {pkg.vehicleOptions?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {pkg.vehicleOptions.slice(0, 3).map((v) => (
              <span key={v} style={{
                fontSize: '11px', color: '#6b7280',
                background: '#f9fafb', border: '1px solid #e5e7eb',
                padding: '4px 10px', borderRadius: '8px', fontWeight: 500,
              }}>
                {VEHICLE_LABEL[v] ?? v}
              </span>
            ))}
          </div>
        )}

        <div style={{ flex: 1, minHeight: '12px' }} />

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          paddingTop: '16px', borderTop: '1px solid #f3f4f6',
        }}>
          <div>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Starting from</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{formatLKR(pkg.basePrice)}<span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>/ person</span>
            </p>
          </div>
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', fontSize: '13px', fontWeight: 700,
            padding: '10px 22px', borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
            flexShrink: 0,
          }}>
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: '20px', overflow: 'hidden',
      border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ height: '220px', background: '#e5e7eb', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '8px', width: '80%' }} />
        <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '8px', width: '100%' }} />
        <div style={{ height: '14px', background: '#e5e7eb', borderRadius: '8px', width: '70%' }} />
        <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
          <div style={{ height: '26px', background: '#f3f4f6', borderRadius: '8px', width: '60px' }} />
          <div style={{ height: '26px', background: '#f3f4f6', borderRadius: '8px', width: '60px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '6px', width: '60px' }} />
            <div style={{ height: '20px', background: '#e5e7eb', borderRadius: '6px', width: '90px' }} />
          </div>
          <div style={{ height: '40px', background: '#e5e7eb', borderRadius: '12px', width: '110px' }} />
        </div>
      </div>
    </div>
  );
}

export default function TourPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/tours')
      .then((r) => { setPackages(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#1a1a2e', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{
          position: 'relative', height: '65vh', minHeight: '420px',
          backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#fff', marginBottom: '12px', lineHeight: 1.1 }}>
              Explore Sri Lanka <span style={{ color: '#f59e0b' }}>Tours</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', marginBottom: '36px', maxWidth: '550px' }}>
              Curated experiences from highlands to coast — discover the island like never before
            </p>

            {/* Search Widget */}
            <div style={{
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
              padding: '6px', maxWidth: '600px', display: 'flex', alignItems: 'center',
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255,255,255,0.5)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search packages by name or destination..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', height: '48px', background: 'transparent',
                    border: 'none', paddingLeft: '48px', paddingRight: '16px',
                    color: '#fff', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>
              <button style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000', fontWeight: 700, padding: '10px 24px',
                borderRadius: '12px', border: 'none', cursor: 'pointer',
                fontSize: '14px', boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                flexShrink: 0,
              }}>
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px' }}>

          {/* Result count */}
          {!loading && (
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              {filtered.length === 0
                ? 'No packages match your search.'
                : <><span style={{ fontWeight: 700, color: '#111827' }}>{filtered.length}</span> package{filtered.length !== 1 ? 's' : ''} found</>
              }
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div style={{
                width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '36px',
              }}>
                🧳
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>No packages found</p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '6px' }}>Try searching with a different keyword</p>
            </div>
          )}

          {/* Card grid */}
          {!loading && filtered.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
              ...(filtered.length === 1 ? { maxWidth: '380px' } : filtered.length === 2 ? { maxWidth: '784px' } : {}),
            }}>
              {filtered.map((pkg) => <PackageCard key={pkg._id} pkg={pkg} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
