import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import HotelCard from '../../components/HotelCard';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

const filterInputStyle = {
  background: '#fff',
  border: '2px solid #e5e7eb',
  color: '#111827',
  fontSize: '13px',
  borderRadius: '10px',
  padding: '8px 12px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

export default function HotelSearchPage() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source');
  const searchType = searchParams.get('search_type');
  const sortParam = searchParams.get('sort');
  const locationParam = searchParams.get('location');
  const highlight = source === 'hot-deals' ? 'price' : sortParam === 'rating' ? 'rating' : searchType === 'location' ? 'location' : null;

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;
  const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', rating: '', location: locationParam || '' });

  useEffect(() => { fetchHotels(); }, [searchParams]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationParam) params.set('location', locationParam);
      if (searchParams.get('filter')) params.set('filter', searchParams.get('filter'));
      if (searchParams.get('sort')) params.set('sort', searchParams.get('sort'));
      const { data } = await api.get(`/hotels?${params}`);
      setHotels(data);
    } catch {} finally { setLoading(false); }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.location) params.set('location', filters.location);
      if (filters.rating) params.set('rating', filters.rating);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      const { data } = await api.get(`/hotels?${params}`);
      setHotels(data);
      setPage(1);
    } catch {} finally { setLoading(false); }
  };

  const paginated = hotels.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(hotels.length / PER_PAGE);
  const mapHotels = hotels.filter((h) => h.coordinates?.lat);

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#1a1a2e', minHeight: '100vh' }}>
        {/* Top Filter Bar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
              <div style={{ marginRight: 'auto' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                  {locationParam ? `Hotels in ${locationParam}` : 'All Hotels'}
                </h1>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>{hotels.length} hotels found</p>
              </div>

              <input type="text" placeholder="Location" value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                style={{ ...filterInputStyle, width: '140px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
              <select value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                style={{ ...filterInputStyle, width: '120px' }}>
                <option value="">Stars</option>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}★ & above</option>)}
              </select>
              <input type="number" placeholder="Min LKR" value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                style={{ ...filterInputStyle, width: '100px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
              <input type="number" placeholder="Max LKR" value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                style={{ ...filterInputStyle, width: '100px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
              <button onClick={applyFilters}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                Apply
              </button>
              <button onClick={() => { setFilters({ minPrice: '', maxPrice: '', rating: '', location: '' }); fetchHotels(); }}
                style={{ padding: '8px 14px', background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                Clear
              </button>

              <button onClick={() => setShowMap((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                  borderRadius: '10px', border: '2px solid', cursor: 'pointer', transition: 'all 0.2s',
                  background: showMap ? '#fef3c7' : '#fff',
                  borderColor: showMap ? '#f59e0b' : '#e5e7eb',
                  color: showMap ? '#92400e' : '#4b5563',
                }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {showMap ? 'Hide Map' : 'Map'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Hotel List */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ width: '200px', height: '140px', background: '#e5e7eb', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '8px', width: '65%' }} />
                        <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '8px', width: '35%' }} />
                        <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '8px', width: '50%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
                    🏨
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>No hotels found</p>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {paginated.map((hotel) => (
                    <HotelCard key={hotel._id} hotel={hotel} highlight={highlight} onHover={setHoveredId} variant="horizontal" />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: '8px 14px', background: '#fff', border: '2px solid #e5e7eb', color: '#4b5563', borderRadius: '10px', fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                    ← Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      style={{
                        padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: page === i + 1 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#fff',
                        color: page === i + 1 ? '#fff' : '#4b5563',
                        boxShadow: page === i + 1 ? '0 2px 8px rgba(245,158,11,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                      }}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '8px 14px', background: '#fff', border: '2px solid #e5e7eb', color: '#4b5563', borderRadius: '10px', fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Map Panel */}
            {showMap && (
              <div style={{ width: '380px', flexShrink: 0, display: 'none' }} className="md:!block">
                <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 100px)', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {mapHotels.map((h) => (
                      <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}
                        icon={hoveredId === h._id ? highlightIcon : defaultIcon}>
                        <Popup>
                          <div style={{ fontSize: '13px', minWidth: '160px' }}>
                            {h.images?.[0] && <img src={h.images[0]} alt={h.name} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />}
                            <p style={{ fontWeight: 600 }}>{h.name}</p>
                            <p style={{ color: '#6b7280', fontSize: '12px' }}>{h.location}</p>
                            <p style={{ color: '#d97706', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>LKR {h.pricePerNight?.toLocaleString()}/night</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Map Modal */}
        {showMap && (
          <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ color: '#111827', fontWeight: 600 }}>Map View</h3>
              <button onClick={() => setShowMap(false)} style={{ color: '#9ca3af', fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ flex: 1 }}>
              <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapHotels.map((h) => (
                  <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}>
                    <Popup><p style={{ fontWeight: 600, fontSize: '13px' }}>{h.name}</p></Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
