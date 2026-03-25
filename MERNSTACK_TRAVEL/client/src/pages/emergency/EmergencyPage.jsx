import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import Layout from '../../components/Layout';
import 'leaflet/dist/leaflet.css';

// Fix leaflet marker icons in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ─── Custom marker icons ─── */
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#3b82f6,#1d4ed8);
    border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,130,246,0.4),0 4px 12px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;font-size:16px;
  ">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const makeServiceIcon = (emoji, color) => L.divIcon({
  className: '',
  html: `<div style="
    width:34px;height:34px;border-radius:50%;
    background:${color};border:2px solid #fff;
    box-shadow:0 3px 10px rgba(0,0,0,0.25);
    display:flex;align-items:center;justify-content:center;font-size:16px;
  ">${emoji}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const icons = {
  police:   makeServiceIcon('🚨', '#3b82f6'),
  hospital: makeServiceIcon('🏥', '#10b981'),
  clinic:   makeServiceIcon('⚕️', '#f59e0b'),
  pharmacy: makeServiceIcon('💊', '#8b5cf6'),
};

/* ─── Type config ─── */
const TYPE_META = {
  police:   { label: 'Police Station', color: '#3b82f6', bg: '#eff6ff', ring: '#bfdbfe' },
  hospital: { label: 'Hospital',        color: '#10b981', bg: '#f0fdf4', ring: '#a7f3d0' },
  clinic:   { label: 'Medical Clinic',  color: '#f59e0b', bg: '#fffbeb', ring: '#fde68a' },
  pharmacy: { label: 'Pharmacy',        color: '#8b5cf6', bg: '#f5f3ff', ring: '#ddd6fe' },
};

/* ─── Haversine distance ─── */
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Recenter map helper ─── */
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

/* ─── Overpass query ─── */
async function fetchNearbyServices(lat, lng, radiusM = 5000) {
  const query = `
    [out:json][timeout:30];
    (
      node["amenity"="police"](around:${radiusM},${lat},${lng});
      node["amenity"="hospital"](around:${radiusM},${lat},${lng});
      node["amenity"="clinic"](around:${radiusM},${lat},${lng});
      node["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
      way["amenity"="police"](around:${radiusM},${lat},${lng});
      way["amenity"="hospital"](around:${radiusM},${lat},${lng});
      way["amenity"="clinic"](around:${radiusM},${lat},${lng});
    );
    out center;
  `;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  if (!resp.ok) throw new Error('Overpass API error');
  const json = await resp.json();
  return json.elements;
}

function parseElement(el, userLat, userLng) {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!lat || !lng) return null;
  const tags = el.tags || {};
  const type = ['police', 'hospital', 'clinic', 'pharmacy'].includes(tags.amenity) ? tags.amenity : 'hospital';
  return {
    id: el.id,
    name: tags.name || tags['name:en'] || TYPE_META[type]?.label || 'Emergency Service',
    type,
    lat, lng,
    distance: distanceKm(userLat, userLng, lat, lng),
    phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
    hours: tags.opening_hours || null,
    website: tags.website || tags['contact:website'] || null,
    address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(', ') || null,
  };
}

/* ─── Distance badge ─── */
function DistanceBadge({ km }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '2px 8px',
      borderRadius: '20px', background: '#f3f4f6', color: '#374151',
      whiteSpace: 'nowrap',
    }}>
      {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}
    </span>
  );
}

/* ─── Main page ─── */
export default function EmergencyPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const listRef = useRef(null);

  const detectAndFetch = useCallback(() => {
    setGeoError('');
    setFetchError('');
    setLoading(true);
    setServices([]);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        try {
          const elements = await fetchNearbyServices(lat, lng);
          const parsed = elements
            .map((el) => parseElement(el, lat, lng))
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);
          setServices(parsed);
          if (parsed.length === 0) {
            setFetchError('No emergency services found within 5 km. Data depends on OpenStreetMap coverage.');
          }
        } catch {
          setFetchError('Failed to fetch nearby services. Please check your internet connection and try again.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access was denied. Please allow location permission in your browser and try again.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Your location is currently unavailable. Please try again.');
        } else {
          setGeoError('Could not determine your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { detectAndFetch(); }, [detectAndFetch]);

  const filtered = selectedType === 'all' ? services : services.filter((s) => s.type === selectedType);
  const counts = services.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {});

  const scrollToItem = (id) => {
    setActiveId(id);
    const el = document.getElementById(`service-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <Layout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .service-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .leaflet-container { border-radius: 16px; }
      `}</style>

      <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #dc2626 100%)',
          padding: '32px 24px 28px',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                }}>
                  🚨
                </div>
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                    Emergency Support
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', margin: '4px 0 0' }}>
                    Nearby emergency services within 5 km of your location
                  </p>
                </div>
              </div>

              <button
                onClick={detectAndFetch}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
                  borderRadius: '12px', padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : '📡'}
                {loading ? 'Detecting...' : 'Refresh Location'}
              </button>
            </div>

            {/* Type filter pills */}
            {services.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                {[{ key: 'all', label: `All (${services.length})` },
                  ...Object.entries(TYPE_META).filter(([k]) => counts[k]).map(([k, v]) => ({
                    key: k, label: `${v.label} (${counts[k] || 0})`,
                  }))
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    style={{
                      fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px',
                      cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                      background: selectedType === key ? '#fff' : 'rgba(255,255,255,0.15)',
                      color: selectedType === key ? '#1e3a5f' : '#fff',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Error / Geo states ── */}
        {(geoError || fetchError) && !loading && (
          <div style={{ maxWidth: '1200px', margin: '24px auto 0', padding: '0 24px' }}>
            <div style={{
              background: geoError ? '#fef2f2' : '#fff7ed',
              border: `1px solid ${geoError ? '#fecaca' : '#fed7aa'}`,
              borderRadius: '14px', padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>{geoError ? '📍' : '⚠️'}</span>
              <div>
                <p style={{ fontWeight: 700, color: geoError ? '#dc2626' : '#c2410c', marginBottom: '4px', fontSize: '14px' }}>
                  {geoError ? 'Location Error' : 'Data Notice'}
                </p>
                <p style={{ color: geoError ? '#ef4444' : '#ea580c', fontSize: '13px' }}>
                  {geoError || fetchError}
                </p>
                {geoError && (
                  <button
                    onClick={detectAndFetch}
                    style={{
                      marginTop: '10px', fontSize: '13px', fontWeight: 700,
                      color: '#fff', background: '#dc2626', border: 'none',
                      borderRadius: '8px', padding: '7px 16px', cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 24px 48px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

          {/* Map */}
          <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            {userLocation ? (
              <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                style={{ height: '520px', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />

                {/* 5km radius circle */}
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={5000}
                  pathOptions={{
                    color: '#3b82f6', fillColor: '#3b82f6',
                    fillOpacity: 0.06, weight: 2, dashArray: '6 4',
                  }}
                />

                {/* User marker */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>
                    <div style={{ textAlign: 'center', padding: '4px 8px' }}>
                      <strong style={{ color: '#1d4ed8' }}>📍 Your Location</strong>
                      <br />
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                      </span>
                    </div>
                  </Popup>
                </Marker>

                {/* Service markers */}
                {filtered.map((svc) => {
                  const meta = TYPE_META[svc.type] || TYPE_META.hospital;
                  const icon = icons[svc.type] || icons.hospital;
                  return (
                    <Marker
                      key={svc.id}
                      position={[svc.lat, svc.lng]}
                      icon={icon}
                      eventHandlers={{ click: () => scrollToItem(svc.id) }}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px', padding: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                              borderRadius: '20px', background: meta.bg, color: meta.color,
                            }}>{meta.label}</span>
                          </div>
                          <strong style={{ fontSize: '14px', color: '#111827' }}>{svc.name}</strong>
                          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              📏 {svc.distance < 1 ? `${Math.round(svc.distance * 1000)} m` : `${svc.distance.toFixed(1)} km`} away
                            </span>
                            {svc.phone && <span style={{ fontSize: '12px', color: '#6b7280' }}>📞 {svc.phone}</span>}
                            {svc.hours && <span style={{ fontSize: '12px', color: '#6b7280' }}>🕒 {svc.hours}</span>}
                            {svc.address && <span style={{ fontSize: '12px', color: '#6b7280' }}>🗺️ {svc.address}</span>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            ) : (
              <div style={{
                height: '520px', background: loading ? '#f8f9fb' : '#fef2f2',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
              }}>
                <div style={{ fontSize: '48px' }}>{loading ? '📡' : '📍'}</div>
                <p style={{ fontWeight: 700, color: '#374151', fontSize: '16px' }}>
                  {loading ? 'Detecting your location...' : 'Location not available'}
                </p>
                {loading && (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    border: '4px solid #e5e7eb', borderTopColor: '#3b82f6',
                    animation: 'spin 1s linear infinite',
                  }} />
                )}
              </div>
            )}
          </div>

          {/* Sidebar: services list */}
          <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: '0', maxHeight: '520px', overflowY: 'auto' }}>
            {loading && !userLocation && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ height: '90px', background: '#fff', borderRadius: '14px', animation: 'pulse 1.5s ease infinite', border: '1px solid #e5e7eb' }} />
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && userLocation && (
              <div style={{
                textAlign: 'center', padding: '48px 24px',
                background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏙️</div>
                <p style={{ fontWeight: 700, color: '#111827', marginBottom: '6px' }}>No services found</p>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {selectedType !== 'all' ? `No ${TYPE_META[selectedType]?.label} found within 5 km.` : 'No emergency services found in 5 km radius.'}
                </p>
                {selectedType !== 'all' && (
                  <button onClick={() => setSelectedType('all')} style={{
                    marginTop: '12px', fontSize: '13px', fontWeight: 600,
                    color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe',
                    borderRadius: '8px', padding: '7px 16px', cursor: 'pointer',
                  }}>
                    Show all types
                  </button>
                )}
              </div>
            )}

            {filtered.map((svc, idx) => {
              const meta = TYPE_META[svc.type] || TYPE_META.hospital;
              const isActive = activeId === svc.id;
              return (
                <div
                  key={svc.id}
                  id={`service-${svc.id}`}
                  className="service-card"
                  onClick={() => setActiveId(isActive ? null : svc.id)}
                  style={{
                    background: '#fff',
                    border: `1px solid ${isActive ? meta.color : '#e5e7eb'}`,
                    borderRadius: '14px', padding: '16px 18px', cursor: 'pointer',
                    transition: 'all 0.2s', marginBottom: '10px',
                    boxShadow: isActive ? `0 4px 20px rgba(0,0,0,0.1)` : '0 1px 4px rgba(0,0,0,0.04)',
                    animation: `fadeUp 0.3s ease ${idx * 0.04}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Icon */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: meta.bg, border: `1px solid ${meta.ring}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    }}>
                      {svc.type === 'police' ? '🚨' : svc.type === 'hospital' ? '🏥' : svc.type === 'clinic' ? '⚕️' : '💊'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {svc.name}
                        </h3>
                        <DistanceBadge km={svc.distance} />
                      </div>

                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                        borderRadius: '20px', background: meta.bg, color: meta.color,
                        display: 'inline-block', marginBottom: '6px',
                      }}>
                        {meta.label}
                      </span>

                      {/* Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {svc.phone ? (
                          <a href={`tel:${svc.phone}`} style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📞 {svc.phone}
                          </a>
                        ) : (
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>📞 No phone listed</p>
                        )}
                        {svc.hours && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>🕒 {svc.hours}</p>
                        )}
                        {svc.address && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            🗺️ {svc.address}
                          </p>
                        )}
                        {svc.website && (
                          <a href={svc.website} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}>
                            🌐 Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {services.length > 0 && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '4px', padding: '0 8px' }}>
                📡 Data from OpenStreetMap · Coverage may vary
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
