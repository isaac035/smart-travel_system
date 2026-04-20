import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, X, MapPin } from 'lucide-react';
import bannerImage from '../../assets/images/travel-products-banner.png';
import { formatLKR } from '../../utils/currency';


const MAX_PRICE = 200000;
const TRAVELER_TYPES = ['solo', 'couple', 'family', 'group'];
const TRIP_CATEGORIES = ['adventure', 'relaxation', 'luxury', 'nature', 'beach', 'cultural'];
const WEATHER_OPTIONS = ['hot', 'cold', 'rainy', 'any'];
const DURATION_OPTIONS = ['short', 'medium', 'long'];
const ACTIVITY_LEVELS = ['low', 'moderate', 'high'];
const AGE_OPTIONS = ['kids', 'adults', 'all'];
const EMPTY_PREFERENCES = {
  travelerType: 'solo',
  destination: '',
  budget: '',
  weatherPreference: 'any',
  tripDuration: 'short',
  tripCategory: 'adventure',
  activityLevel: 'moderate',
  ageGroup: 'all',
};

const labelize = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

const getMatchBadgeStyle = (score = 0) => {
  if (score >= 85) return { background: '#dcfce7', color: '#166534', border: '#86efac' };
  if (score >= 70) return { background: '#fef3c7', color: '#92400e', border: '#fcd34d' };
  if (score >= 50) return { background: '#e0f2fe', color: '#075985', border: '#7dd3fc' };
  return { background: '#fee2e2', color: '#991b1b', border: '#fecaca' };
};

const getAvailabilityConfig = (availability, stock) => {
  if (availability === 'out_of_stock' || stock === 0) {
    return { text: 'Out of Stock', bg: 'rgba(239,68,68,0.12)', color: '#dc2626', border: 'rgba(239,68,68,0.25)', isUnavailable: true };
  }
  if (availability === 'coming_soon') {
    return { text: 'Coming Soon', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.25)', isUnavailable: true };
  }
  if (availability === 'pre_order') {
    return { text: 'Pre Order', bg: 'rgba(56,189,248,0.12)', color: '#0284c7', border: 'rgba(56,189,248,0.25)', isUnavailable: false };
  }
  return { text: `In Stock ${stock > 0 ? `(${stock})` : ''}`, bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.25)', isUnavailable: false };
};

/* ── Product / Bundle Card ── */
const ProductCard = ({ item, type, onAddToCart, index, onCardClick, hasPreferences }) => {
  const navigate = useNavigate();
  const price = type === 'bundle'
    ? item.totalPrice * (1 - (item.discount || 0) / 100)
    : item.price;
  const availConfig = type === 'product' ? getAvailabilityConfig(item.availability, item.stock) : null;
  const isUnavailable = type === 'product' ? availConfig.isUnavailable : false;
  const matchStyle = getMatchBadgeStyle(item.suitabilityScore);

  return (
    <div
      style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        border: '1px solid #e8eaed',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        animationName: 'prodFadeIn', animationDuration: '0.45s',
        animationFillMode: 'both', animationDelay: `${(index || 0) * 0.05}s`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = '#fcd34d';
      }}
      onClick={(e) => {
        if (e.target.closest('button')) return;
        if (type === 'bundle' && onCardClick) onCardClick(item);
        if (type === 'product') navigate(`/services/travel-products/${item._id}`);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = '#e8eaed';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            {type === 'bundle' ? '🎒' : '🛍️'}
          </div>
        )}
        {/* Availability badge */}
        {type === 'product' && availConfig && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            padding: '4px 12px', borderRadius: 20,
            fontSize: 11, fontWeight: 600,
            backdropFilter: 'blur(8px)',
            background: availConfig.bg,
            color: availConfig.color,
            border: `1px solid ${availConfig.border}`,
          }}>
            {availConfig.text}
          </div>
        )}
        {/* Discount badge */}
        {type === 'bundle' && item.discount > 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700,
            background: '#ef4444', color: '#fff',
          }}>
            -{item.discount}%
          </div>
        )}
        {type === 'bundle' && hasPreferences && typeof item.suitabilityScore === 'number' && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '5px 11px', borderRadius: 8,
            fontSize: 11, fontWeight: 800,
            background: matchStyle.background,
            color: matchStyle.color,
            border: `1px solid ${matchStyle.border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          }}>
            {item.suitabilityScore}% Match
          </div>
        )}
        {/* Weather badge */}
        {type === 'product' && item.weatherType !== 'BOTH' && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 500,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            color: '#fff',
          }}>
            {item.weatherType === 'RAINY' ? '🌧️ Rainy' : '☀️ Dry'}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 18px' }}>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: '#111827', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.name}</h3>
        <p style={{
          fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{item.description}</p>
        {item.location && item.location.length > 0 && (
          <p style={{ fontSize: 12, color: '#b0b0b0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {Array.isArray(item.location) ? item.location.join(', ') : item.location}
          </p>
        )}
        {type === 'bundle' && item.products?.length > 0 && (
          <p style={{ fontSize: 11, color: '#b0b0b0', marginTop: 4 }}>{item.products.length} items included</p>
        )}
        {type === 'bundle' && hasPreferences && (
          <div style={{ marginTop: 10 }}>
            <span style={{ display: 'inline-flex', padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: matchStyle.background, color: matchStyle.color, border: `1px solid ${matchStyle.border}` }}>
              {item.matchLabel || 'Bundle Match'}
            </span>
            {item.suitabilityReasons?.length > 0 ? (
              <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: '#6b7280', fontSize: 11, lineHeight: 1.5 }}>
                {item.suitabilityReasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            ) : (
              <p style={{ margin: '8px 0 0', color: '#9ca3af', fontSize: 11 }}>Low compatibility with your current preferences</p>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6',
        }}>
          <div>
            {type === 'bundle' && item.discount > 0 && (
              <span style={{ fontSize: 11, color: '#b0b0b0', textDecoration: 'line-through', marginRight: 6 }}>
                {formatLKR(item.totalPrice)}
              </span>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>
              {formatLKR(Math.round(price))}
            </span>
          </div>
          <button
            onClick={() => {
              if (isUnavailable) return;
              onAddToCart(item._id, type);
            }}
            disabled={isUnavailable}
            style={{
              padding: '8px 18px', fontSize: 12, fontWeight: 600,
              background: isUnavailable ? '#e5e7eb' : 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: isUnavailable ? '#9ca3af' : '#fff',
              border: 'none', borderRadius: 10,
              cursor: isUnavailable ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isUnavailable ? 'none' : '0 2px 8px rgba(245,158,11,0.25)',
            }}
            onMouseEnter={(e) => { if (!isUnavailable) { e.target.style.transform = 'scale(1.04)'; e.target.style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; } }}
            onMouseLeave={(e) => { if (!isUnavailable) { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(245,158,11,0.25)'; } }}
          >
            {isUnavailable ? 'Unavailable' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Sidebar section label ── */
const SideLabel = ({ children }) => (
  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 }}>{children}</p>
);

export default function ProductsPage() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart, itemCount } = useCart();
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES);
  const [hasBundlePreferences, setHasBundlePreferences] = useState(false);
  const [matchingBundles, setMatchingBundles] = useState(false);
  const navigate = useNavigate();

  const [nameSearch, setNameSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [weatherFilter, setWeatherFilter] = useState('');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [availability, setAvailability] = useState({
    comingSoon: false, inStock: false, outOfStock: false, preOrder: false,
  });

  useEffect(() => {
    api.get('/locations').then((r) => setLocations(r.data)).catch(() => {});
    fetchBundles();
  }, []);

  useEffect(() => { fetchProducts(); }, [nameSearch, locationFilter, weatherFilter, priceMin, priceMax, availability]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nameSearch) params.set('search', nameSearch);
      if (locationFilter) params.set('location', locationFilter);
      if (weatherFilter) params.set('weatherType', weatherFilter);
      if (priceMin > 0) params.set('minPrice', priceMin);
      if (priceMax < MAX_PRICE) params.set('maxPrice', priceMax);
      
      const availVals = [];
      if (availability.comingSoon) availVals.push('coming_soon');
      if (availability.inStock) availVals.push('in_stock');
      if (availability.outOfStock) availVals.push('out_of_stock');
      if (availability.preOrder) availVals.push('pre_order');
      if (availVals.length > 0) params.set('availability', availVals.join(','));

      const { data } = await api.get(`/products?${params}`);
      setProducts(data);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchBundles = async () => {
    try { const { data } = await api.get('/bundles'); setBundles(data); } catch {}
  };

  const handlePreferenceChange = (field) => (e) => {
    setPreferences((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleBundleMatch = async (e) => {
    e.preventDefault();
    if (!preferences.destination) return;
    setMatchingBundles(true);
    try {
      const { data } = await api.post('/bundles/check-suitability', {
        ...preferences,
        budget: Number(preferences.budget || 0),
      });
      setBundles(data);
      setHasBundlePreferences(true);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingBundles(false);
    }
  };

  const clearBundleMatch = async () => {
    setPreferences(EMPTY_PREFERENCES);
    setHasBundlePreferences(false);
    await fetchBundles();
  };

  const resetPrice = () => { setPriceMin(0); setPriceMax(MAX_PRICE); };
  const toggleAvailability = (key) => setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
  const setQuickFilter = (min, max) => { setPriceMin(min); setPriceMax(max); };
  const locationNames = [...new Set(locations.map((l) => l.name))].sort();

  const activeFilterCount = [
    nameSearch, locationFilter, weatherFilter,
    priceMin > 0 || priceMax < MAX_PRICE,
    Object.values(availability).some(Boolean),
  ].filter(Boolean).length;

  const inputBase = {
    width: '100%', background: '#f9fafb', color: '#111827', fontSize: 13,
    border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '10px 14px', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const selectBase = {
    ...inputBase,
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 10px center', backgroundRepeat: 'no-repeat', backgroundSize: '16px',
    paddingRight: 30, cursor: 'pointer',
  };

  const bundleMatchInput = {
    ...inputBase,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
  };

  const bundleMatchSelect = {
    ...selectBase,
    borderRadius: 8,
    padding: '9px 30px 9px 12px',
    fontSize: 12,
  };

  /* ── Filter Sidebar Content (shared between desktop sidebar + mobile drawer) ── */
  // NOTE: defined as a plain JSX variable, NOT a component function, to avoid
  // React remounting the input on every render and losing focus mid-typing.
  const renderFilters = (
    <>
      <div>
        <SideLabel>Search by Name</SideLabel>
        <input type="text" placeholder="Search products..." value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)} style={inputBase}
          onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }} />
      </div>

      <div>
        <SideLabel>Location</SideLabel>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={selectBase}>
          <option value="">All Locations</option>
          {locationNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div>
        <SideLabel>Weather</SideLabel>
        <select value={weatherFilter} onChange={(e) => setWeatherFilter(e.target.value)} style={selectBase}>
          <option value="">All Weather</option>
          <option value="DRY">Dry</option>
          <option value="RAINY">Rainy</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SideLabel>Price Range</SideLabel>
          <button onClick={resetPrice} style={{ fontSize: 11, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>From</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{formatLKR(priceMin)}</p>
          </div>
          <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>To</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>{formatLKR(priceMax)}</p>
          </div>
        </div>
        {/* Slider track */}
        <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', width: '100%', height: 5, background: '#e5e7eb', borderRadius: 4 }} />
          <div style={{
            position: 'absolute', height: 5, background: '#f59e0b', borderRadius: 4,
            left: `${(priceMin / MAX_PRICE) * 100}%`,
            right: `${100 - (priceMax / MAX_PRICE) * 100}%`,
          }} />
          <input type="range" min={0} max={MAX_PRICE} step={1000} value={priceMin}
            onChange={(e) => setPriceMin(Math.min(+e.target.value, priceMax - 1000))}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: priceMin > MAX_PRICE - 10000 ? 5 : 3 }} />
          <input type="range" min={0} max={MAX_PRICE} step={1000} value={priceMax}
            onChange={(e) => setPriceMax(Math.max(+e.target.value, priceMin + 1000))}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 4 }} />
          <div style={{ position: 'absolute', width: 16, height: 16, background: '#f59e0b', border: '3px solid #fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', pointerEvents: 'none', left: `calc(${(priceMin / MAX_PRICE) * 100}% - 8px)` }} />
          <div style={{ position: 'absolute', width: 16, height: 16, background: '#f59e0b', border: '3px solid #fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', pointerEvents: 'none', left: `calc(${(priceMax / MAX_PRICE) * 100}% - 8px)` }} />
        </div>
        {/* Quick filters */}
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 10, color: '#b0b0b0', marginBottom: 8 }}>Quick Filters</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { label: 'Under 50k', min: 0, max: 50000 },
              { label: '50k – 100k', min: 50000, max: 100000 },
              { label: 'Above 100k', min: 100000, max: MAX_PRICE },
            ].map(({ label, min, max }) => {
              const active = priceMin === min && priceMax === max;
              return (
                <button key={label} onClick={() => setQuickFilter(min, max)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    border: `1.5px solid ${active ? '#f59e0b' : '#e5e7eb'}`,
                    background: active ? '#fffbeb' : '#fff',
                    color: active ? '#92400e' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >{label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <SideLabel>Availability</SideLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'comingSoon', label: 'Coming Soon' },
            { key: 'inStock', label: 'In Stock' },
            { key: 'outOfStock', label: 'Out of Stock' },
            { key: 'preOrder', label: 'Pre Order' },
          ].map(({ key, label }) => (
            <label key={key} onClick={() => toggleAvailability(key)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `1.5px solid ${availability[key] ? '#f59e0b' : '#d1d5db'}`,
                background: availability[key] ? '#f59e0b' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {availability[key] && (
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Apply button (for mobile) */}
      <button onClick={() => setShowFilters(false)}
        className="md:hidden"
        style={{
          width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600,
          background: 'linear-gradient(135deg,#f59e0b,#d97706)',
          color: '#fff', border: 'none', borderRadius: 12,
          cursor: 'pointer', marginTop: 8,
        }}
      >
        Apply Filters
      </button>
    </>
  );

  return (
    <Layout>
      <style>{`
        @keyframes prodFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── Banner ── */}
      <div className="relative h-72 bg-cover bg-center flex items-end" style={{ backgroundImage: `url(${bannerImage})` }}>
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full text-center pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Travel Products</h1>
          <p className="text-amber-400 font-medium text-lg">Make your trip easier and more comfortable</p>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ background: '#f8f9fb', minHeight: '60vh', paddingBottom: 60 }}>
        <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto', padding: '0 clamp(20px, 3vw, 44px)', boxSizing: 'border-box' }}>

          {/* ── Tab Bar + Cart ── */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '0 24px',
            marginTop: -28, position: 'relative', zIndex: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e8eaed',
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32 }}>
              {['products', 'bundles'].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: '16px 4px', fontSize: 14, fontWeight: tab === t ? 700 : 500,
                    color: tab === t ? '#111827' : '#9ca3af',
                    background: 'none', border: 'none',
                    borderBottom: tab === t ? '2px solid #d97706' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {t === 'products' ? 'Travel Products' : 'Travel Bundles'}
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/services/travel-products/cart')}
              style={{ position: 'relative', padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d97706'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 0,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#f59e0b', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{itemCount}</span>
              )}
            </button>
          </div>

          {/* ── Products Tab ── */}
          {tab === 'products' && (
            <div style={{ display: 'flex', gap: 28, marginTop: 28, alignItems: 'flex-start', width: '100%' }}>

              {/* ── Desktop Sidebar ── */}
              <aside className="hidden md:block" style={{ width: 250, flexShrink: 0 }}>
                <div style={{
                  background: '#fff', border: '1px solid #e8eaed', borderRadius: 18,
                  padding: '22px 20px', position: 'sticky', top: 90,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', gap: 22,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                      Filters
                    </h3>
                    {activeFilterCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  {renderFilters}
                </div>
              </aside>

              {/* ── Product Grid ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', border: '1px solid #e8eaed' }}>
                        <div style={{ height: 200, background: '#f3f4f6' }} className="animate-pulse" />
                        <div style={{ padding: 18 }}>
                          <div style={{ height: 14, background: '#f3f4f6', borderRadius: 8, width: '70%', marginBottom: 8 }} className="animate-pulse" />
                          <div style={{ height: 10, background: '#f3f4f6', borderRadius: 8, width: '100%', marginBottom: 6 }} className="animate-pulse" />
                          <div style={{ height: 10, background: '#f3f4f6', borderRadius: 8, width: '45%' }} className="animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: 56, opacity: 0.25, marginBottom: 12 }}>🛍️</div>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No products found</p>
                    <p style={{ fontSize: 14, color: '#9ca3af' }}>Try adjusting your filters</p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16, fontWeight: 500 }}>
                      {products.length} product{products.length !== 1 ? 's' : ''} found
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                      {products.map((p, i) => <ProductCard key={p._id} item={p} type="product" onAddToCart={addToCart} index={i} />)}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Bundles Tab ── */}
          {tab === 'bundles' && (
            <div style={{ marginTop: 28 }}>
              <form onSubmit={handleBundleMatch} style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 16, padding: 18, marginBottom: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>Find Suitable Bundle</h2>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Enter your travel preferences to see bundle compatibility.</p>
                  </div>
                  {hasBundlePreferences && (
                    <button type="button" onClick={clearBundleMatch} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Clear Match
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div><SideLabel>Traveler Type</SideLabel><select value={preferences.travelerType} onChange={handlePreferenceChange('travelerType')} style={bundleMatchSelect}>{TRAVELER_TYPES.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></div>
                  <div><SideLabel>Destination</SideLabel><select required value={preferences.destination} onChange={handlePreferenceChange('destination')} style={bundleMatchSelect}><option value="">Select destination</option>{locationNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
                  <div><SideLabel>Budget</SideLabel><input required type="number" min={0} value={preferences.budget} onChange={handlePreferenceChange('budget')} placeholder="25000" style={bundleMatchInput} /></div>
                  <div><SideLabel>Weather</SideLabel><select value={preferences.weatherPreference} onChange={handlePreferenceChange('weatherPreference')} style={bundleMatchSelect}>{WEATHER_OPTIONS.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></div>
                  <div><SideLabel>Duration</SideLabel><select value={preferences.tripDuration} onChange={handlePreferenceChange('tripDuration')} style={bundleMatchSelect}>{DURATION_OPTIONS.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></div>
                  <div><SideLabel>Trip Category</SideLabel><select value={preferences.tripCategory} onChange={handlePreferenceChange('tripCategory')} style={bundleMatchSelect}>{TRIP_CATEGORIES.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></div>
                  <div><SideLabel>Activity Level</SideLabel><select value={preferences.activityLevel} onChange={handlePreferenceChange('activityLevel')} style={bundleMatchSelect}>{ACTIVITY_LEVELS.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></div>
                  <div><SideLabel>Age Group</SideLabel><select value={preferences.ageGroup} onChange={handlePreferenceChange('ageGroup')} style={bundleMatchSelect}>{AGE_OPTIONS.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}</select></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                  <button type="submit" disabled={matchingBundles} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 800, background: matchingBundles ? '#e5e7eb' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: matchingBundles ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, cursor: matchingBundles ? 'not-allowed' : 'pointer' }}>
                    {matchingBundles ? 'Checking...' : 'Check Bundle Match'}
                  </button>
                  {!hasBundlePreferences && <span style={{ fontSize: 12, color: '#9ca3af' }}>Enter your travel preferences to see bundle compatibility.</span>}
                </div>
              </form>
              {bundles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div style={{ fontSize: 56, opacity: 0.25, marginBottom: 12 }}>🎒</div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No bundles available yet</p>
                  <p style={{ fontSize: 14, color: '#9ca3af' }}>Check back soon for curated travel bundles</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16, fontWeight: 500 }}>{bundles.length} bundles found{hasBundlePreferences ? ' sorted by suitability score' : ''}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                    {bundles.map((b, i) => <ProductCard key={b._id} item={b} type="bundle" onAddToCart={addToCart} index={i} onCardClick={setSelectedBundle} hasPreferences={hasBundlePreferences} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bundle Detail Modal ── */}
      {selectedBundle && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBundle(null)}>
          <div style={{ background: '#fff', borderRadius: 20, width: '90%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedBundle(null)} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <X size={20} color="#fff" />
            </button>
            <div style={{ position: 'relative', height: 280 }}>
              {selectedBundle.images?.[0] ? (
                <img src={selectedBundle.images[0]} alt={selectedBundle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🎒</div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{selectedBundle.name}</h2>
                {selectedBundle.location && selectedBundle.location.length > 0 && (
                  <p style={{ fontSize: 13, color: '#f3f4f6', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#fcd34d" />
                    {Array.isArray(selectedBundle.location) ? selectedBundle.location.join(', ') : selectedBundle.location}
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>About this Bundle</h3>
                  <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{selectedBundle.description}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', minWidth: 200, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Total Price</p>
                  {selectedBundle.discount > 0 && (
                    <div style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through', marginBottom: 2 }}>
                      {formatLKR(selectedBundle.totalPrice)}
                    </div>
                  )}
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginBottom: 16 }}>
                    {formatLKR(Math.round(selectedBundle.totalPrice * (1 - (selectedBundle.discount || 0) / 100)))}
                  </div>
                  <button onClick={() => { addToCart(selectedBundle._id, 'bundle'); setSelectedBundle(null); }} style={{ width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>Add to Cart</button>
                </div>
              </div>

              {hasBundlePreferences && typeof selectedBundle.suitabilityScore === 'number' && (
                <div style={{ marginBottom: 24, padding: 18, borderRadius: 12, border: `1px solid ${getMatchBadgeStyle(selectedBundle.suitabilityScore).border}`, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Suitability Score: {selectedBundle.suitabilityScore}%</h3>
                    <span style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 800, background: getMatchBadgeStyle(selectedBundle.suitabilityScore).background, color: getMatchBadgeStyle(selectedBundle.suitabilityScore).color, border: `1px solid ${getMatchBadgeStyle(selectedBundle.suitabilityScore).border}` }}>
                      {selectedBundle.matchLabel}
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 8, background: '#e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${selectedBundle.suitabilityScore}%`, background: selectedBundle.suitabilityScore >= 70 ? '#16a34a' : selectedBundle.suitabilityScore >= 50 ? '#0284c7' : '#dc2626', borderRadius: 8 }} />
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Why this bundle matches you:</h4>
                  {selectedBundle.suitabilityReasons?.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#4b5563', fontSize: 13, lineHeight: 1.7 }}>
                      {selectedBundle.suitabilityReasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>This bundle has low compatibility with your current travel preferences.</p>
                  )}
                </div>
              )}

              {selectedBundle.products && selectedBundle.products.length > 0 && (
                <>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>Included Items ({selectedBundle.products.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {selectedBundle.products.map(p => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, background: '#f9fafb' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛍️</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h4>
                          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>

  );
}
