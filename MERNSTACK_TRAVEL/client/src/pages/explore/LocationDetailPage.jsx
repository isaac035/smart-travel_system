import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Tag, Globe, Layers, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import '../../styles/location-detail.css';

export default function LocationDetailPage() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get(`/locations/${id}`)
      .then((res) => setLocation(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#f9fafb' }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid #f59e0b', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f9fafb', minHeight: '60vh' }}>
          <p style={{ color: '#888', fontSize: '18px', marginBottom: '12px' }}>Location not found.</p>
          <Link to="/explore" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: '600' }}>
            ← Back to Explore
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ background: '#f9fafb', minHeight: '100vh' }}>

        {/* Hero Image */}
        {location.images?.length > 0 && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0' }}>
            <div className="loc-detail-hero">
              <img
                src={location.images[activeImg]}
                alt={location.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.3) 100%)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Thumbnail strip */}
            {location.images.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                {location.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      flexShrink: 0, width: '80px', height: '56px', borderRadius: '10px', overflow: 'hidden',
                      border: activeImg === i ? '3px solid #f59e0b' : '3px solid transparent',
                      cursor: 'pointer', padding: 0, background: 'none',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Main Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', marginBottom: '24px' }}>
            <Link to="/explore" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={14} /> Explore
            </Link>
            <span>/</span>
            <Link to={`/explore/${location.category?.toLowerCase().replace(/\s+/g, '-')}`} style={{ color: '#888', textDecoration: 'none' }}>
              {location.category}
            </Link>
            <span>/</span>
            <span style={{ color: '#333' }}>{location.name}</span>
          </nav>

          {/* Two column layout */}
          <div className="loc-detail-grid">

            {/* Left: Main content */}
            <div>
              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '5px 14px', background: '#f59e0b', color: '#000',
                  fontSize: '12px', fontWeight: '700', borderRadius: '20px',
                }}>
                  {location.subcategory}
                </span>
                <span style={{
                  padding: '5px 14px', background: '#f3f4f6', color: '#555',
                  fontSize: '12px', fontWeight: '600', borderRadius: '20px', border: '1px solid #e5e7eb',
                }}>
                  {location.category}
                </span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111', margin: '0 0 8px', lineHeight: '1.2' }}>
                {location.name}
              </h1>

              {/* Location */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#777', fontSize: '15px', marginBottom: '24px' }}>
                <MapPin size={16} />
                <span>{location.district}, {location.province} Province</span>
              </div>

              {/* Description */}
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#222', marginBottom: '12px' }}>About this place</h2>
                <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.8', margin: 0 }}>
                  {location.description}
                </p>
              </div>
            </div>

            {/* Right: Info card */}
            <div style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '28px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid #eee',
              position: 'sticky',
              top: '80px',
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#333', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                Location Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Province</p>
                    <p style={{ fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 }}>{location.province}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>District</p>
                    <p style={{ fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 }}>{location.district}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={18} style={{ color: '#22c55e' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Category</p>
                    <p style={{ fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 }}>{location.category}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={18} style={{ color: '#ec4899' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Subcategory</p>
                    <p style={{ fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 }}>{location.subcategory}</p>
                  </div>
                </div>

                {location.coordinates?.lat && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={18} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Coordinates</p>
                      <p style={{ fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 }}>
                        {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Section */}
          {location.coordinates?.lat && (
            <div style={{ marginTop: '48px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#222', marginBottom: '16px' }}>Location on Map</h2>
              <div className="loc-detail-map">
                <MapContainer
                  center={[location.coordinates.lat, location.coordinates.lng]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[location.coordinates.lat, location.coordinates.lng]}>
                    <Popup>{location.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}
