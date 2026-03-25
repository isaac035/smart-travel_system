import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Search, Cloud, Droplets, Wind, Eye, Thermometer, MapPin, Clock, ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../../styles/weather.css';


/* ─── 25 Districts ─── */
const DISTRICTS = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Gampaha', lat: 7.0873, lng: 79.9994 },
  { name: 'Kalutara', lat: 6.5854, lng: 79.9607 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Matale', lat: 7.4675, lng: 80.6234 },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
  { name: 'Matara', lat: 5.9549, lng: 80.5550 },
  { name: 'Hambantota', lat: 6.1241, lng: 81.1185 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { name: 'Kilinochchi', lat: 9.3961, lng: 80.3982 },
  { name: 'Mannar', lat: 8.9770, lng: 79.9042 },
  { name: 'Vavuniya', lat: 8.7514, lng: 80.4971 },
  { name: 'Mullaitivu', lat: 9.2671, lng: 80.8128 },
  { name: 'Batticaloa', lat: 7.7102, lng: 81.6924 },
  { name: 'Ampara', lat: 7.2917, lng: 81.6737 },
  { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3623 },
  { name: 'Puttalam', lat: 8.0362, lng: 79.8283 },
  { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { name: 'Polonnaruwa', lat: 7.9396, lng: 81.0000 },
  { name: 'Badulla', lat: 6.9934, lng: 81.0550 },
  { name: 'Monaragala', lat: 6.8721, lng: 81.3507 },
  { name: 'Ratnapura', lat: 6.7056, lng: 80.3847 },
  { name: 'Kegalle', lat: 7.2513, lng: 80.3464 },
];

/* ─── Weather Helpers ─── */
const getWeatherIcon = (id, isNight) => {
  if (id >= 200 && id < 300) return { emoji: '⛈️', label: 'Thunderstorm' };
  if (id >= 300 && id < 400) return { emoji: '🌦️', label: 'Drizzle' };
  if (id >= 500 && id < 600) return { emoji: '🌧️', label: 'Rain' };
  if (id >= 600 && id < 700) return { emoji: '❄️', label: 'Snow' };
  if (id >= 700 && id < 800) return { emoji: '🌫️', label: 'Fog' };
  if (id === 800) return isNight ? { emoji: '🌙', label: 'Clear Night' } : { emoji: '☀️', label: 'Sunny' };
  if (id === 801 || id === 802) return isNight ? { emoji: '☁️', label: 'Partly Cloudy' } : { emoji: '⛅', label: 'Partly Cloudy' };
  if (id >= 803) return { emoji: '☁️', label: 'Cloudy' };
  return { emoji: '🌤️', label: 'Fair' };
};

const getTempColor = (temp) => {
  if (temp <= 20) return '#3b82f6';
  if (temp <= 28) return '#f59e0b';
  if (temp <= 33) return '#f97316';
  return '#ef4444';
};

const getTempLabel = (temp) => {
  if (temp <= 20) return 'Cool';
  if (temp <= 28) return 'Warm';
  if (temp <= 33) return 'Hot';
  return 'Very Hot';
};

const createWeatherMarkerIcon = (temp, weatherId, isNight) => {
  const color = getTempColor(temp);
  const { emoji } = getWeatherIcon(weatherId, isNight);
  return L.divIcon({
    className: '',
    iconSize: [52, 62],
    iconAnchor: [26, 62],
    popupAnchor: [0, -56],
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;
        filter:drop-shadow(0 2px 6px rgba(0,0,0,0.18));
      ">
        <div style="
          background:#fff;border-radius:12px;padding:4px 8px;
          border:2px solid ${color};text-align:center;min-width:44px;
        ">
          <div style="font-size:16px;line-height:1">${emoji}</div>
          <div style="font-size:12px;font-weight:700;color:${color};margin-top:2px">${Math.round(temp)}°</div>
        </div>
        <div style="
          width:0;height:0;border-left:6px solid transparent;
          border-right:6px solid transparent;border-top:8px solid ${color};
        "></div>
      </div>
    `,
  });
};

const createRedMarkerIcon = () => {
  return L.divIcon({
    className: '',
    iconSize: [36, 50],
    iconAnchor: [18, 50],
    popupAnchor: [0, -46],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(220,38,38,0.4));">
        <div style="
          width:36px;height:36px;background:#dc2626;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
          border:3px solid #fff;
        ">
          <div style="transform:rotate(45deg);color:#fff;font-size:16px;line-height:1;">📍</div>
        </div>
      </div>
    `,
  });
};

/* ─── Map Controller ─── */
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 11, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

/* ─── Forecast processor ─── */
const processForecast = (list) => {
  const days = {};
  list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const key = date.toDateString();
    if (!days[key]) days[key] = [];
    days[key].push(item);
  });
  return Object.entries(days).slice(0, 5).map(([key, items]) => {
    const midday = items.find((i) => new Date(i.dt * 1000).getHours() >= 12) || items[0];
    const temps = items.map((i) => i.main.temp);
    const rains = items.map((i) => (i.pop || 0) * 100);
    return {
      dayName: new Date(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      icon: midday.weather[0].icon,
      weatherId: midday.weather[0].id,
      desc: midday.weather[0].description,
      maxTemp: Math.round(Math.max(...temps)),
      minTemp: Math.round(Math.min(...temps)),
      rain: Math.round(Math.max(...rains)),
      humidity: midday.main.humidity,
    };
  });
};

/* ─── Main Page ─── */
export default function WeatherPage() {
  const [districtWeather, setDistrictWeather] = useState({});
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWeather, setSelectedWeather] = useState(null);
  const [selectedForecast, setSelectedForecast] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null); // { name, lat, lng, weather }
  const searchedMarkerRef = useRef(null);

  // Location search
  const [adminLocations, setAdminLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Fetch all district weather on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoadingDistricts(true);
      const results = {};
      const promises = DISTRICTS.map(async (d) => {
        try {
          const { data } = await api.get(`/weather/coords?lat=${d.lat}&lng=${d.lng}`);
          results[d.name] = data;
        } catch { /* skip failed */ }
      });
      await Promise.all(promises);
      setDistrictWeather(results);
      setLoadingDistricts(false);
    };
    fetchAll();
  }, []);

  // Fetch admin locations
  useEffect(() => {
    api.get('/locations').then((r) => setAdminLocations(r.data)).catch(() => { });
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return adminLocations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.district?.toLowerCase().includes(q) || l.province?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery, adminLocations]);

  const selectDistrict = async (name, lat, lng) => {
    setSelectedDistrict(name);
    setLoadingDetail(true);
    setSearchedLocation(null);
    setMapCenter([lat, lng]);
    setMapZoom(11);
    try {
      const [w, f] = await Promise.all([
        api.get(`/weather/coords?lat=${lat}&lng=${lng}`),
        api.get(`/weather/coords/forecast?lat=${lat}&lng=${lng}`),
      ]);
      setSelectedWeather(w.data);
      setSelectedForecast(processForecast(f.data.list));
    } catch {
      setSelectedWeather(null);
      setSelectedForecast([]);
    } finally { setLoadingDetail(false); }
  };

  const selectLocation = async (loc) => {
    const lat = loc.coordinates?.lat;
    const lng = loc.coordinates?.lng;
    if (!lat || !lng) return;
    setSearchQuery(loc.name);
    setShowSuggestions(false);

    // Set map view
    setMapCenter([lat, lng]);
    setMapZoom(13);
    setSelectedDistrict(loc.name);
    setLoadingDetail(true);

    try {
      const [w, f] = await Promise.all([
        api.get(`/weather/coords?lat=${lat}&lng=${lng}`),
        api.get(`/weather/coords/forecast?lat=${lat}&lng=${lng}`),
      ]);
      setSelectedWeather(w.data);
      setSelectedForecast(processForecast(f.data.list));

      // Set red marker with weather data
      setSearchedLocation({
        name: loc.name,
        district: loc.district,
        province: loc.province,
        lat, lng,
        weather: w.data,
      });

      // Auto-open popup after marker renders
      setTimeout(() => {
        if (searchedMarkerRef.current) {
          searchedMarkerRef.current.openPopup();
        }
      }, 600);
    } catch {
      setSelectedWeather(null);
      setSelectedForecast([]);
      setSearchedLocation(null);
    } finally { setLoadingDetail(false); }
  };

  const resetToDistricts = () => {
    setSearchedLocation(null);
    setSelectedDistrict(null);
    setSelectedWeather(null);
    setSelectedForecast([]);
    setSearchQuery('');
    setMapCenter([7.8731, 80.7718]);
    setMapZoom(7.5);
  };

  const lastUpdated = useMemo(() => {
    const first = Object.values(districtWeather)[0];
    return first ? new Date(first.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
  }, [districtWeather]);

  return (
    <Layout>
      <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

        {/* Hero Banner */}
        <div className="weather-hero" style={{
          position: 'relative', width: '100%', minHeight: '300px',
          backgroundImage: "url('https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80')",
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
          borderRadius: '0 0 24px 24px', overflow: 'visible',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        }}>
          {/* Gradient Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.25) 50%, rgba(0,0,0,0.10) 100%)',
            borderRadius: '0 0 24px 24px',
          }} />

          {/* Banner Content */}
          <div style={{
            position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto',
            padding: '48px 24px 44px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap',
          }}>
            {/* Left: Title + Search */}
            <div style={{ flex: '1 1 420px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Cloud size={26} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  Live Weather
                </span>
              </div>
              <h1 style={{
                fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 10px',
                lineHeight: 1.15, letterSpacing: '-0.5px',
              }}>
                Sri Lanka Weather<br />
                <span style={{ color: '#fbbf24' }}>Forecast</span>
              </h1>
              <p style={{
                fontSize: '16px', color: 'rgba(255,255,255,0.85)', margin: '0 0 22px',
                maxWidth: '460px', lineHeight: 1.6,
              }}>
                Check real-time weather conditions and forecasts across Sri Lanka before planning your trip.
              </p>

              {/* Search Bar */}
              <div ref={searchRef} style={{ position: 'relative', maxWidth: '460px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#fff', borderRadius: '50px',
                  padding: '12px 20px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  transition: 'box-shadow 0.3s',
                }}>
                  <Search size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search districts or travel locations..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    style={{
                      border: 'none', outline: 'none', width: '100%', fontSize: '15px',
                      color: '#374151', background: 'transparent',
                    }}
                  />
                  <button
                    onClick={() => { if (searchQuery.trim() && filteredLocations.length > 0) selectLocation(filteredLocations[0]); }}
                    style={{
                      background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '50px',
                      padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                      whiteSpace: 'nowrap', transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#d97706')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#f59e0b')}
                  >
                    Search
                  </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredLocations.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                    background: '#fff', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                    border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 50,
                  }}>
                    {filteredLocations.map((loc) => (
                      <button
                        key={loc._id}
                        onClick={() => selectLocation(loc)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 18px', border: 'none', background: 'transparent',
                          cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <MapPin size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: '#111', margin: 0 }}>{loc.name}</p>
                          <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>
                            {loc.district}{loc.province ? `, ${loc.province}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions && searchQuery.trim() && filteredLocations.length === 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                    background: '#fff', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                    border: '1px solid #e5e7eb', padding: '24px', textAlign: 'center', zIndex: 50,
                  }}>
                    <MapPin size={28} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>No locations found</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 48px' }}>

          {/* Back to Districts button */}
          {searchedLocation && (
            <button
              onClick={resetToDistricts}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', fontSize: '14px', fontWeight: '600',
                background: '#fff', color: '#374151', border: '1px solid #e5e7eb',
                borderRadius: '12px', cursor: 'pointer', marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#f59e0b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              <ArrowLeft size={16} />
              Back to All Districts
            </button>
          )}

          {/* Map + Detail Grid */}
          <div className="weather-map-grid" style={{ display: 'grid', gridTemplateColumns: selectedWeather ? '1fr 340px' : '1fr', gap: '20px', alignItems: 'stretch' }}>

            {/* Map */}
            <div style={{
              background: '#fff', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
              position: 'relative', zIndex: 1,
            }}>
              <div style={{ height: '500px' }}>
                {loadingDistricts ? (
                  <div style={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', border: '4px solid #3b82f6',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ fontSize: '14px', color: '#888' }}>Loading weather data...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <MapContainer
                    center={[7.8731, 80.7718]}
                    zoom={7.5}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    {mapCenter && <MapController center={mapCenter} zoom={mapZoom} />}

                    {DISTRICTS.map((d) => {
                      const w = districtWeather[d.name];
                      if (!w) return null;
                      const temp = w.main.temp;
                      const wId = w.weather[0].id;
                      return (
                        <Marker
                          key={d.name}
                          position={[d.lat, d.lng]}
                          icon={createWeatherMarkerIcon(temp, wId, false)}
                          eventHandlers={{
                            click: () => selectDistrict(d.name, d.lat, d.lng),
                          }}
                        >
                          <Popup>
                            <div style={{ minWidth: '180px', fontFamily: 'inherit' }}>
                              <p style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>{d.name}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '28px' }}>{getWeatherIcon(wId, false).emoji}</span>
                                <div>
                                  <p style={{ fontSize: '22px', fontWeight: '700', color: getTempColor(temp), margin: 0 }}>
                                    {Math.round(temp)}°C
                                  </p>
                                  <p style={{ fontSize: '12px', color: '#888', margin: 0, textTransform: 'capitalize' }}>
                                    {w.weather[0].description}
                                  </p>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', color: '#555' }}>
                                <span>💧 Humidity: {w.main.humidity}%</span>
                                <span>💨 Wind: {w.wind?.speed} m/s</span>
                                <span>🌧️ Rain: {w.rain?.['1h'] || 0} mm</span>
                                <span>🕐 {new Date(w.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                    {/* Red marker for searched admin location */}
                    {searchedLocation && searchedLocation.weather && (
                      <Marker
                        position={[searchedLocation.lat, searchedLocation.lng]}
                        icon={createRedMarkerIcon()}
                        ref={searchedMarkerRef}
                      >
                        <Popup>
                          <div style={{ minWidth: '220px', fontFamily: 'inherit' }}>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                              borderBottom: '1px solid #f1f5f9', paddingBottom: '10px',
                            }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <span style={{ fontSize: '16px' }}>📍</span>
                              </div>
                              <div>
                                <p style={{ fontSize: '15px', fontWeight: '700', color: '#111', margin: 0 }}>
                                  {searchedLocation.name}
                                </p>
                                <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>
                                  {searchedLocation.district}{searchedLocation.province ? `, ${searchedLocation.province}` : ''}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <span style={{ fontSize: '32px' }}>
                                {getWeatherIcon(searchedLocation.weather.weather[0].id, false).emoji}
                              </span>
                              <div>
                                <p style={{
                                  fontSize: '26px', fontWeight: '700', margin: 0,
                                  color: getTempColor(searchedLocation.weather.main.temp),
                                }}>
                                  {Math.round(searchedLocation.weather.main.temp)}°C
                                </p>
                                <p style={{ fontSize: '12px', color: '#555', textTransform: 'capitalize', margin: 0 }}>
                                  {searchedLocation.weather.weather[0].description}
                                </p>
                              </div>
                            </div>

                            <div style={{
                              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
                              background: '#f8fafc', borderRadius: '8px', padding: '8px 10px',
                              fontSize: '11px', color: '#555',
                            }}>
                              <span>💧 Humidity: {searchedLocation.weather.main.humidity}%</span>
                              <span>💨 Wind: {searchedLocation.weather.wind?.speed} m/s</span>
                              <span>🌡️ Feels: {Math.round(searchedLocation.weather.main.feels_like)}°C</span>
                              <span>👁️ Vis: {((searchedLocation.weather.visibility || 10000) / 1000).toFixed(1)} km</span>
                              <span>🌧️ Rain: {searchedLocation.weather.rain?.['1h'] || 0} mm</span>
                              <span>🕐 {new Date(searchedLocation.weather.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Weather Detail Card */}
            {selectedWeather && (
              <div style={{
                background: '#fff', borderRadius: '16px', padding: '20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb',
                overflowY: 'auto',
              }}>
                {loadingDetail ? (
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div style={{
                      width: '32px', height: '32px', border: '3px solid #3b82f6',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
                    }} />
                    <p style={{ fontSize: '13px', color: '#888' }}>Loading...</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#111', margin: 0 }}>
                          {selectedDistrict}
                        </h3>
                        <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>
                          {selectedWeather.sys?.country} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span style={{ fontSize: '32px' }}>
                        {getWeatherIcon(selectedWeather.weather[0].id, false).emoji}
                      </span>
                    </div>

                    {/* Temperature */}
                    <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                      <p style={{
                        fontSize: '42px', fontWeight: '200', margin: 0,
                        color: getTempColor(selectedWeather.main.temp),
                      }}>
                        {Math.round(selectedWeather.main.temp)}°
                      </p>
                      <p style={{ fontSize: '13px', color: '#555', textTransform: 'capitalize', margin: '2px 0 0' }}>
                        {selectedWeather.weather[0].description}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>
                        Feels like {Math.round(selectedWeather.main.feels_like)}°C
                      </p>
                      <span style={{
                        display: 'inline-block', marginTop: '6px', padding: '3px 10px',
                        borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: getTempColor(selectedWeather.main.temp) + '18',
                        color: getTempColor(selectedWeather.main.temp),
                      }}>
                        {getTempLabel(selectedWeather.main.temp)}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                      marginBottom: '12px',
                    }}>
                      {[
                        { icon: <Droplets size={14} style={{ color: '#3b82f6' }} />, label: 'Humidity', value: `${selectedWeather.main.humidity}%` },
                        { icon: <Wind size={14} style={{ color: '#8b5cf6' }} />, label: 'Wind', value: `${selectedWeather.wind?.speed} m/s` },
                        { icon: <Eye size={14} style={{ color: '#06b6d4' }} />, label: 'Visibility', value: `${((selectedWeather.visibility || 10000) / 1000).toFixed(1)} km` },
                        { icon: <Thermometer size={14} style={{ color: '#f97316' }} />, label: 'Pressure', value: `${selectedWeather.main.pressure} hPa` },
                      ].map((stat) => (
                        <div key={stat.label} style={{
                          background: '#f8fafc', borderRadius: '10px', padding: '10px',
                          textAlign: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                            {stat.icon}
                            <span style={{ fontSize: '11px', color: '#888' }}>{stat.label}</span>
                          </div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: 0 }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Sunrise / Sunset + Rainfall row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {selectedWeather.sys && (
                        <>
                          <div style={{
                            background: '#fffbeb', borderRadius: '10px', padding: '10px',
                            textAlign: 'center',
                          }}>
                            <p style={{ fontSize: '16px', margin: '0 0 2px' }}>🌅</p>
                            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>Sunrise</p>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', margin: '2px 0 0' }}>
                              {new Date(selectedWeather.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div style={{
                            background: '#fef3c7', borderRadius: '10px', padding: '10px',
                            textAlign: 'center',
                          }}>
                            <p style={{ fontSize: '16px', margin: '0 0 2px' }}>🌇</p>
                            <p style={{ fontSize: '10px', color: '#888', margin: 0 }}>Sunset</p>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', margin: '2px 0 0' }}>
                              {new Date(selectedWeather.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </>
                      )}
                      <div style={{
                        background: '#eff6ff', borderRadius: '10px', padding: '10px',
                        textAlign: 'center',
                      }}>
                        <p style={{ fontSize: '16px', margin: '0 0 2px' }}>🌧️</p>
                        <p style={{ fontSize: '10px', color: '#3b82f6', margin: 0, fontWeight: '600' }}>Rainfall</p>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af', margin: '2px 0 0' }}>
                          {selectedWeather.rain?.['1h'] || selectedWeather.rain?.['3h'] || 0} mm
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 5-Day Forecast */}
          {selectedForecast.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>
                5-Day Forecast for {selectedDistrict}
              </h2>
              <div className="weather-forecast-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
                {selectedForecast.map((day, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: '16px', padding: '24px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
                    textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'; }}
                  >
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#555', margin: '0 0 12px' }}>
                      {day.dayName}
                    </p>
                    <span style={{ fontSize: '40px', display: 'block', textAlign: 'center' }}>
                      {getWeatherIcon(day.weatherId, false).emoji}
                    </span>
                    <p style={{ fontSize: '13px', color: '#666', textTransform: 'capitalize', margin: '8px 0 12px' }}>
                      {day.desc}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '10px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>High</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: '#f97316', margin: 0 }}>{day.maxTemp}°</p>
                      </div>
                      <div style={{ width: '1px', background: '#e5e7eb' }} />
                      <div>
                        <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>Low</p>
                        <p style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6', margin: 0 }}>{day.minTemp}°</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', color: '#888' }}>
                      <span>💧 {day.rain}%</span>
                      <span>💦 {day.humidity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather Legend + Info */}
          <div className="weather-legend-grid" style={{
            marginTop: '36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
          }}>
            {/* Weather Icons Legend */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>
                Weather Icons
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { emoji: '☀️', label: 'Sunny' },
                  { emoji: '⛅', label: 'Partly Cloudy' },
                  { emoji: '☁️', label: 'Cloudy' },
                  { emoji: '🌧️', label: 'Rain' },
                  { emoji: '⛈️', label: 'Thunderstorm' },
                  { emoji: '🌙', label: 'Clear Night' },
                  { emoji: '🌫️', label: 'Fog / Mist' },
                  { emoji: '🌦️', label: 'Drizzle' },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', background: '#f8fafc', borderRadius: '10px',
                  }}>
                    <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Temperature Legend */}
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', margin: '0 0 16px' }}>
                Temperature Guide
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { color: '#3b82f6', label: 'Cool', range: '≤ 20°C', desc: 'Hill country, night time' },
                  { color: '#f59e0b', label: 'Warm', range: '21-28°C', desc: 'Comfortable for travel' },
                  { color: '#f97316', label: 'Hot', range: '29-33°C', desc: 'Coastal and low areas' },
                  { color: '#ef4444', label: 'Very Hot', range: '> 33°C', desc: 'Dry zone peaks' },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 14px', background: '#f8fafc', borderRadius: '12px',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: item.color + '18', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        background: item.color,
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: item.color }}>{item.label}</span>
                        <span style={{ fontSize: '12px', color: '#999' }}>{item.range}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 0' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Last Updated */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginTop: '20px', padding: '10px 14px', background: '#f1f5f9',
                borderRadius: '10px',
              }}>
                <Clock size={14} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Last updated: {lastUpdated}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
