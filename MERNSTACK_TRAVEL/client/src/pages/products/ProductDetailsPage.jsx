import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { ArrowLeft, MapPin, ShoppingBag, Info, ShieldCheck, Wind } from 'lucide-react';
import { formatLKR } from '../../utils/currency';


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

// Reused ProductCard component for recommendations
const ProductCard = ({ item, onAddToCart }) => {
  const navigate = useNavigate();
  const availConfig = getAvailabilityConfig(item.availability, item.stock);
  const isUnavailable = availConfig.isUnavailable;

  return (
    <div
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1px solid #e8eaed', cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.35s',
      }}
      onClick={(e) => {
        if (e.target.closest('button')) return;
        navigate(`/services/travel-products/${item._id}`);
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>ðŸ›ï¸</div>
        )}
        {availConfig && (
          <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backdropFilter: 'blur(8px)', background: availConfig.bg, color: availConfig.color, border: `1px solid ${availConfig.border}` }}>
            {availConfig.text}
          </div>
        )}
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#d97706' }}>{formatLKR(item.price)}</span>
          <button
            onClick={() => {
              if (isUnavailable) return;
              onAddToCart(item._id, 'product');
            }} disabled={isUnavailable}
            style={{ padding: '6px 14px', fontSize: 11, fontWeight: 600, background: isUnavailable ? '#e5e7eb' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: isUnavailable ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, cursor: isUnavailable ? 'not-allowed' : 'pointer' }}
          >
            {isUnavailable ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const { addToCart } = useCart();
  const [mainImage, setMainImage] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Product
      const { data: prodData } = await api.get(`/products/${id}`);
      setProduct(prodData);
      setMainImage(0);

      // 2. Fetch Recommendations if it has locations
      const locs = Array.isArray(prodData.location) ? prodData.location : [prodData.location];
      if (locs.length > 0) {
        // Find products matching at least one location or 'All Locations'
        const reqs = locs.map(loc => api.get(`/products?location=${encodeURIComponent(loc)}`));
        const res = await Promise.all(reqs);
        let related = [];
        res.forEach(r => related.push(...r.data));
        // Deduplicate and filter out current
        const uniqueSet = new Set();
        related = related.filter(p => {
          if (p._id === id || uniqueSet.has(p._id)) return false;
          uniqueSet.add(p._id);
          return true;
        });
        setRecommendations(related.slice(0, 4)); // top 4 max
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#9ca3af' }}>Loading Product...</div></Layout>;
  if (!product) return <Layout><div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#ef4444' }}>Product not found</div></Layout>;

  const availConfig = getAvailabilityConfig(product.availability, product.stock);
  const isUnavailable = availConfig.isUnavailable;
  const locArr = Array.isArray(product.location) ? product.location : [product.location].filter(Boolean);

  return (
    <Layout>
      <div style={{ background: '#f8f9fb', minHeight: '80vh', padding: '40px 20px', paddingBottom: 80 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: '#4b5563', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 24, padding: 0 }}>
            <ArrowLeft size={16} /> Back to Products
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 24, overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb', position: 'relative' }}>
                {product.images?.[mainImage] ? (
                  <img src={product.images[mainImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#fef3c7,#fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>ðŸ›ï¸</div>
                )}
                <div style={{ position: 'absolute', top: 16, right: 16, padding: '6px 16px', borderRadius: 30, fontSize: 12, fontWeight: 700, background: availConfig.bg, color: availConfig.color, border: `1px solid ${availConfig.border}`, backdropFilter: 'blur(8px)' }}>
                  {availConfig.text}
                </div>
              </div>
              {product.images && product.images.length > 1 && (
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
                  {product.images.map((img, i) => (
                    <div key={i} onClick={() => setMainImage(i)} style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: i === mainImage ? '2px solid #f59e0b' : '2px solid transparent', opacity: i === mainImage ? 1 : 0.6, flexShrink: 0, transition: 'all 0.2s' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ padding: '4px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{product.category}</span>
                  {product.weatherType !== 'BOTH' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <Wind size={12} /> {product.weatherType} Weather
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', margin: 0, marginBottom: 12, lineHeight: 1.2 }}>{product.name}</h1>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginBottom: 20 }}>{formatLKR(product.price)}</div>
              </div>

              <div style={{ padding: '24px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', paddingBottom: 8 }}>About Product</h3>
                  <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{product.description}</p>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />
                {locArr.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', paddingBottom: 8 }}>Locations</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {locArr.map(loc => (
                        <span key={loc} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#fff7ed', color: '#c2410c', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid #ffedd5' }}>
                          <MapPin size={12} /> {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                      <ShieldCheck size={16} /> Authentic Item
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={isUnavailable}
                onClick={() => {
                  if (isUnavailable) return;
                  addToCart(product._id, 'product');
                }}
                style={{
                  marginTop: 'auto', width: '100%', padding: '16px 0', fontSize: 16, fontWeight: 700,
                  background: isUnavailable ? '#e5e7eb' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                  color: isUnavailable ? '#9ca3af' : '#fff', border: 'none', borderRadius: 16, cursor: isUnavailable ? 'not-allowed' : 'pointer',
                  boxShadow: isUnavailable ? 'none' : '0 8px 16px rgba(245,158,11,0.25)', transition: 'transform 0.2s', alignSelf: 'stretch'
                }}
                onMouseEnter={(e) => { if (!isUnavailable) e.target.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { if (!isUnavailable) e.target.style.transform = 'translateY(0)' }}
              >
                {isUnavailable ? 'Unavailable' : `Add to Cart - ${formatLKR(product.price)}`}
              </button>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div style={{ marginTop: 60, paddingTop: 60, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <MapPin size={24} color="#d97706" />
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Recommended for Similar Locations</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                {recommendations.map((r) => (
                  <ProductCard key={r._id} item={r} onAddToCart={addToCart} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
