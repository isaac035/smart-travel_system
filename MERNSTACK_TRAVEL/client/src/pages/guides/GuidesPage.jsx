import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import RatingStars from '../../components/RatingStars';


const LANGUAGES = ['Sinhala', 'Tamil', 'English', 'French', 'German', 'Chinese', 'Japanese', 'Korean'];
const LOCATIONS = ['Colombo', 'Kandy', 'Galle', 'Ella', 'Nuwara Eliya', 'Sigiriya', 'Trincomalee', 'Jaffna', 'Anuradhapura'];

/* ── Guide Card ── */
const GuideCard = ({ guide, index }) => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        border: '1px solid #e8eaed',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
        animationName: 'fadeSlideUp',
        animationDuration: '0.5s',
        animationFillMode: 'both',
        animationDelay: `${index * 0.07}s`,
      }}
      onClick={() => navigate(`/guides/${guide._id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.12)';
        e.currentTarget.style.borderColor = '#f59e0b';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = '#e8eaed';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        {guide.image ? (
          <img src={guide.image} alt={guide.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 64, opacity: 0.4 }}>👤</span>
          </div>
        )}
        {/* Availability badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          padding: '5px 12px', borderRadius: 20,
          fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
          backdropFilter: 'blur(8px)',
          background: guide.isAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: guide.isAvailable ? '#059669' : '#dc2626',
          border: `1px solid ${guide.isAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: guide.isAvailable ? '#10b981' : '#ef4444',
            marginRight: 6, verticalAlign: 'middle',
          }} />
          {guide.isAvailable ? 'Available' : 'Booked'}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px 22px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1.3 }}>{guide.name}</h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <RatingStars rating={guide.rating} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>({guide.reviewCount} reviews)</span>
        </div>

        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {guide.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
            {guide.languages?.join(', ') || 'N/A'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {guide.experience} year{guide.experience !== 1 ? 's' : ''} experience
          </div>
        </div>

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 18, paddingTop: 16,
          borderTop: '1px solid #f3f4f6',
        }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>LKR {guide.pricePerDay?.toLocaleString()}</span>
            <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 2 }}>/day</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/guides/${guide._id}`); }}
            style={{
              padding: '9px 20px', fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', border: 'none', borderRadius: 10,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.04)'; e.target.style.boxShadow = '0 4px 16px rgba(245,158,11,0.35)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(245,158,11,0.25)'; }}
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: '', language: '', rating: '', minPrice: '', maxPrice: '' });

  useEffect(() => { fetchGuides(); }, []);

  const fetchGuides = async (f = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.location) params.set('location', f.location);
      if (f.language) params.set('language', f.language);
      if (f.rating) params.set('rating', f.rating);
      if (f.minPrice) params.set('minPrice', f.minPrice);
      if (f.maxPrice) params.set('maxPrice', f.maxPrice);
      const { data } = await api.get(`/guides?${params}`);
      setGuides(data);
    } catch { }
    finally { setLoading(false); }
  };

  const handleFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const applyFilters = () => fetchGuides(filters);
  const clearFilters = () => { setFilters({ location: '', language: '', rating: '', minPrice: '', maxPrice: '' }); fetchGuides(); };

  const selectStyle = {
    background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '9px 14px', outline: 'none', minWidth: 140,
    transition: 'border-color 0.2s', cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 10px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    paddingRight: 32,
  };

  const miniInputStyle = {
    width: 85, background: '#fff', color: '#374151', fontSize: 13,
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '9px 12px', outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <Layout>
      {/* Keyframes */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Hero Banner (kept) ── */}
      <div className="relative h-56 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1920')" }}>
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Travel <span className="text-amber-400">Guides</span></h1>
          <p className="text-gray-300">Expert local guides for an unforgettable Sri Lanka experience</p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ background: '#f8f9fb', minHeight: '60vh', paddingBottom: 60 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

          {/* ── Filter Bar ── */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px 24px',
            marginTop: -28, position: 'relative', zIndex: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e8eaed',
            display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</label>
              <select value={filters.location} onChange={(e) => handleFilter('location', e.target.value)} style={selectStyle}>
                <option value="">All Locations</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Language</label>
              <select value={filters.language} onChange={(e) => handleFilter('language', e.target.value)} style={selectStyle}>
                <option value="">All Languages</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Min Rating</label>
              <select value={filters.rating} onChange={(e) => handleFilter('rating', e.target.value)} style={{ ...selectStyle, minWidth: 110 }}>
                <option value="">Any</option>
                {[4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}★ & above</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Price / Day (LKR)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Min" value={filters.minPrice}
                  onChange={(e) => handleFilter('minPrice', e.target.value)} style={miniInputStyle} />
                <input type="number" placeholder="Max" value={filters.maxPrice}
                  onChange={(e) => handleFilter('maxPrice', e.target.value)} style={miniInputStyle} />
              </div>
            </div>
            <button onClick={applyFilters}
              style={{
                padding: '9px 24px', fontSize: 13, fontWeight: 600,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', border: 'none', borderRadius: 10,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
              }}
            >
              Apply
            </button>
            <button onClick={clearFilters}
              style={{
                padding: '9px 18px', fontSize: 13, fontWeight: 500,
                background: 'none', color: '#9ca3af', border: '1.5px solid #e5e7eb',
                borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.color = '#6b7280'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.color = '#9ca3af'; }}
            >
              Clear
            </button>
          </div>

          {/* Results count */}
          <p style={{ color: '#9ca3af', fontSize: 14, margin: '24px 0 20px', fontWeight: 500 }}>
            {guides.length} guide{guides.length !== 1 ? 's' : ''} found
          </p>

          {/* ── Grid ── */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid #e8eaed' }}>
                  <div style={{ height: 220, background: '#f3f4f6' }} className="animate-pulse" />
                  <div style={{ padding: 22 }}>
                    <div style={{ height: 16, background: '#f3f4f6', borderRadius: 8, width: '65%', marginBottom: 10 }} className="animate-pulse" />
                    <div style={{ height: 12, background: '#f3f4f6', borderRadius: 8, width: '45%', marginBottom: 8 }} className="animate-pulse" />
                    <div style={{ height: 12, background: '#f3f4f6', borderRadius: 8, width: '75%' }} className="animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : guides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>🧭</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No guides found</p>
              <p style={{ fontSize: 14, color: '#9ca3af' }}>Try adjusting your filters to discover amazing guides</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {guides.map((g, i) => <GuideCard key={g._id} guide={g} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
