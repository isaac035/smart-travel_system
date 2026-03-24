import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import HotelCard from '../../components/HotelCard';
import { formatLKR } from '../../utils/currency';

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
    <div className="h-52 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
      <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
      <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
      <div className="h-6 bg-gray-200 rounded-lg w-1/3 mt-2" />
    </div>
  </div>
);

const HotelSection = ({ title, subtitle, hotels, loading, queryParam }) => {
  const navigate = useNavigate();
  if (!loading && hotels.length === 0) return null;
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => navigate(`/hotels/search?${queryParam}`)}
          className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 text-sm font-semibold bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-full transition-colors"
        >
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : hotels.slice(0, 4).map((h) => (
              <HotelCard key={h._id} hotel={h} variant="vertical" />
            ))}
      </div>
    </section>
  );
};

export default function HotelLandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ location: '', checkIn: '', checkOut: '', adults: 1, children: 0 });
  const [deals, setDeals] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [mapHotels, setMapHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [d, p, t, all] = await Promise.all([
          api.get('/hotels?filter=hot-deals'),
          api.get('/hotels?filter=popular'),
          api.get('/hotels?sort=rating_desc'),
          api.get('/hotels'),
        ]);
        setDeals(d.data);
        setPopular(p.data);
        setTopRated(t.data);
        setMapHotels(all.data.filter((h) => h.coordinates?.lat));
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      ...(search.location && { location: search.location }),
      ...(search.checkIn && { checkIn: search.checkIn }),
      ...(search.checkOut && { checkOut: search.checkOut }),
      adults: search.adults,
      children: search.children,
      search_type: 'location',
    });
    navigate(`/hotels/search?${params.toString()}`);
  };

  const heroInputStyle = {
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '12px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
  };

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#1a1a2e', minHeight: '100vh' }}>
        {/* Hero */}
        <section
          style={{
            position: 'relative',
            height: '75vh',
            minHeight: '500px',
            backgroundImage: "url('https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1920')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: '#fff', marginBottom: '12px', lineHeight: 1.1 }}>
              Find Your Perfect <span style={{ color: '#f59e0b' }}>Stay</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', marginBottom: '40px', maxWidth: '550px' }}>
              Discover the finest hotels across Sri Lanka's most stunning destinations
            </p>

            {/* Search Widget */}
            <form
              onSubmit={handleSearch}
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                padding: '20px 24px',
                maxWidth: '900px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: 600 }}>Location</label>
                <input type="text" placeholder="Colombo, Kandy, Ella..." value={search.location}
                  onChange={(e) => setSearch({ ...search, location: e.target.value })} style={heroInputStyle} />
              </div>
              <div style={{ flex: '0 1 150px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: 600 }}>Check-in</label>
                <input type="date" value={search.checkIn}
                  onChange={(e) => setSearch({ ...search, checkIn: e.target.value })} style={heroInputStyle} />
              </div>
              <div style={{ flex: '0 1 150px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: 600 }}>Check-out</label>
                <input type="date" value={search.checkOut}
                  onChange={(e) => setSearch({ ...search, checkOut: e.target.value })} style={heroInputStyle} />
              </div>
              <div style={{ flex: '0 0 70px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: 600 }}>Adults</label>
                <input type="number" min="1" max="10" value={search.adults}
                  onChange={(e) => setSearch({ ...search, adults: e.target.value })} style={heroInputStyle} />
              </div>
              <div style={{ flex: '0 0 70px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px', fontWeight: 600 }}>Children</label>
                <input type="number" min="0" max="10" value={search.children}
                  onChange={(e) => setSearch({ ...search, children: e.target.value })} style={heroInputStyle} />
              </div>
              <div>
                <button type="submit" style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                  fontWeight: 700,
                  padding: '10px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Hotel Sections */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 24px' }}>
          <HotelSection title="Hot Deals" subtitle="Limited-time offers — book before they're gone" hotels={deals} loading={loading} queryParam="filter=hot-deals&source=hot-deals" />
          <HotelSection title="Popular Destinations" subtitle="Most booked hotels by our travellers" hotels={popular} loading={loading} queryParam="filter=popular&search_type=popular" />
          <HotelSection title="Top Rated" subtitle="Highest rated hotels across Sri Lanka" hotels={topRated} loading={loading} queryParam="sort=rating_desc&sort=rating" />

          {/* Map Section */}
          <section>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Hotels on Map</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Explore hotel locations across Sri Lanka</p>
            <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', height: '420px' }}>
              <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapHotels.map((h) => (
                  <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}>
                    <Popup>
                      <div style={{ fontSize: '13px', minWidth: '150px' }}>
                        <p style={{ fontWeight: 600 }}>{h.name}</p>
                        <p style={{ color: '#6b7280', fontSize: '12px' }}>{h.location}</p>
                        <p style={{ color: '#d97706', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>{formatLKR(h.pricePerNight)}/night</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
