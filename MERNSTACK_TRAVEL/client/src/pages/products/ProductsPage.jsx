import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import bannerImage from '../../assets/images/travel-products-banner.png';

const MAX_PRICE = 200000;

/* ── Product / Bundle Card ── */
const ProductCard = ({ item, type, onAddToCart, index }) => {
  const price = type === 'bundle'
    ? item.totalPrice * (1 - (item.discount || 0) / 100)
    : item.price;
  const isOutOfStock = type === 'product' && item.stock === 0;

  return (
    <div
      style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        border: '1px solid #e8eaed',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        animationName: 'prodFadeIn', animationDuration: '0.45s',
        animationFillMode: 'both', animationDelay: `${(index || 0) * 0.05}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = '#fcd34d';
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
        {/* Stock badge */}
        {type === 'product' && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            padding: '4px 12px', borderRadius: 20,
            fontSize: 11, fontWeight: 600,
            backdropFilter: 'blur(8px)',
            background: isOutOfStock ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
            color: isOutOfStock ? '#dc2626' : '#059669',
            border: `1px solid ${isOutOfStock ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
          }}>
            {isOutOfStock ? 'Out of Stock' : `In Stock (${item.stock})`}
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
        {item.location && (
          <p style={{ fontSize: 12, color: '#b0b0b0', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {item.location}
          </p>
        )}
        {type === 'bundle' && item.products?.length > 0 && (
          <p style={{ fontSize: 11, color: '#b0b0b0', marginTop: 4 }}>{item.products.length} items included</p>
        )}

        {/* Price + CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6',
        }}>
          <div>
            {type === 'bundle' && item.discount > 0 && (
              <span style={{ fontSize: 11, color: '#b0b0b0', textDecoration: 'line-through', marginRight: 6 }}>
                LKR {item.totalPrice?.toLocaleString()}
              </span>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#d97706' }}>
              LKR {Math.round(price).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => onAddToCart(item._id, type)}
            disabled={isOutOfStock}
            style={{
              padding: '8px 18px', fontSize: 12, fontWeight: 600,
              background: isOutOfStock ? '#e5e7eb' : 'linear-gradient(135deg,#f59e0b,#d97706)',
              color: isOutOfStock ? '#9ca3af' : '#fff',
              border: 'none', borderRadius: 10,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isOutOfStock ? 'none' : '0 2px 8px rgba(245,158,11,0.25)',
            }}
            onMouseEnter={(e) => { if (!isOutOfStock) { e.target.style.transform = 'scale(1.04)'; e.target.style.boxShadow = '0 4px 14px rgba(245,158,11,0.35)'; } }}
            onMouseLeave={(e) => { if (!isOutOfStock) { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 2px 8px rgba(245,158,11,0.25)'; } }}
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
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
  const navigate = useNavigate();

  const [nameSearch, setNameSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(MAX_PRICE);
  const [availability, setAvailability] = useState({
    comingSoon: false, inStock: false, outOfStock: false, preOrder: false,
  });

  useEffect(() => {
    api.get('/locations').then((r) => setLocations(r.data)).catch(() => {});
    fetchBundles();
  }, []);

  useEffect(() => { fetchProducts(); }, [nameSearch, locationFilter, priceMin, priceMax, availability]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nameSearch) params.set('search', nameSearch);
      if (locationFilter) params.set('location', locationFilter);
      if (priceMin > 0) params.set('minPrice', priceMin);
      if (priceMax < MAX_PRICE) params.set('maxPrice', priceMax);
      if (availability.inStock && !availability.outOfStock) params.set('inStock', 'true');
      if (availability.outOfStock && !availability.inStock) params.set('inStock', 'false');
      const { data } = await api.get(`/products?${params}`);
      setProducts(data);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchBundles = async () => {
    try { const { data } = await api.get('/bundles'); setBundles(data); } catch {}
  };

  const resetPrice = () => { setPriceMin(0); setPriceMax(MAX_PRICE); };
  const toggleAvailability = (key) => setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
  const setQuickFilter = (min, max) => { setPriceMin(min); setPriceMax(max); };
  const locationNames = [...new Set(locations.map((l) => l.name))].sort();

  const activeFilterCount = [
    nameSearch, locationFilter,
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

  /* ── Filter Sidebar Content (shared between desktop sidebar + mobile drawer) ── */
  const FilterContent = () => (
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

      {/* Price Range */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SideLabel>Price Range</SideLabel>
          <button onClick={resetPrice} style={{ fontSize: 11, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>From</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Rs. {priceMin.toLocaleString()}</p>
          </div>
          <div style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>To</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Rs. {priceMax.toLocaleString()}</p>
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
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

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
            <div style={{ display: 'flex', gap: 28, marginTop: 28 }}>

              {/* ── Desktop Sidebar ── */}
              <aside className="hidden md:block" style={{ width: 240, flexShrink: 0 }}>
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
                  <FilterContent />
                </div>
              </aside>

              {/* ── Product Grid ── */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
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
              {bundles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                  <div style={{ fontSize: 56, opacity: 0.25, marginBottom: 12 }}>🎒</div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No bundles available yet</p>
                  <p style={{ fontSize: 14, color: '#9ca3af' }}>Check back soon for curated travel bundles</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16, fontWeight: 500 }}>{bundles.length} bundles found</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {bundles.map((b, i) => <ProductCard key={b._id} item={b} type="bundle" onAddToCart={addToCart} index={i} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
