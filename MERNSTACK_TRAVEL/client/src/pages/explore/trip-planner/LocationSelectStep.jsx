import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../../utils/api';

/* ── SVG Category Icons ── */
const CAT_ICONS = {
  All: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  Nature: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 20h-5v-6l-4 4V8l9 6v-2l3 4h-3z"/><path d="M7 20H2"/><path d="M22 20h-5"/>
    </svg>
  ),
  Beach: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><path d="M2 20c2-2 4-3 6-3s4 1 6 3 4 3 6 3"/><path d="M12 8v4"/>
    </svg>
  ),
  Wildlife: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6 2 11c0 3 1.5 5.5 4 7l1 4h10l1-4c2.5-1.5 4-4 4-7 0-5-4.48-9-10-9z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/>
    </svg>
  ),
  Historical: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 10h1"/><path d="M14 10h1"/>
    </svg>
  ),
  Religious: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 22h20L12 2z"/><path d="M12 10v5"/><path d="M10 13h4"/>
    </svg>
  ),
  'Hill Country': (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21l4-10 4 10"/><path d="M2 21l6-14 4 6 4-8 6 16"/>
    </svg>
  ),
  Adventure: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 20h16L12 2z"/><path d="M12 10l-2 6h4l-2-6z"/>
    </svg>
  ),
  City: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="8" height="16"/><rect x="9" y="2" width="6" height="20"/><rect x="15" y="9" width="8" height="13"/><path d="M4 10h2m-2 4h2m4-10h2m-2 4h2m-2 4h2m4-4h2m-2 4h2"/>
    </svg>
  ),
  Entertainment: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/>
    </svg>
  ),
};

const CATEGORIES = [
  'All', 'Nature', 'Beach', 'Wildlife', 'Historical',
  'Religious', 'Hill Country', 'Adventure', 'City', 'Entertainment',
];

const DAY_COLORS = ['#d97706', '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#65a30d', '#e11d48'];

const pinIcon = (selected, dayColor) =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="28" height="38">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.314 16 28 16 28s16-16.686 16-28C32 7.163 24.837 0 16 0z" fill="${selected ? (dayColor || '#d97706') : '#94a3b8'}"/>
      <circle cx="16" cy="15" r="6" fill="white"/>
      ${selected ? '<path d="M12.5 15l2.5 2.5 4.5-4.5" stroke="' + (dayColor || '#d97706') + '" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </svg>`,
    iconAnchor: [14, 38], iconSize: [28, 38],
  });

const startIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.2)"></div>`,
  iconAnchor: [9, 9],
});

function SearchableDropdown({ value, onChange, options, placeholder, allLabel }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); setSearchError(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  return (
    <div ref={ref} style={{ flex: 1, position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: '100%', height: 38, padding: '0 30px 0 12', fontSize: 13, fontWeight: 500,
        border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff',
        color: value === 'All' ? '#9ca3af' : '#111827', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        textAlign: 'left', transition: 'border-color 0.15s',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value === 'All' ? placeholder : value}</span>
        <svg style={{ position: 'absolute', right: 10, color: '#9ca3af', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 60,
          background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
          boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: 8, border: searchError ? '1px solid #ef4444' : '1px solid #e5e7eb', background: '#f9fafb',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={searchError ? '#ef4444' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input ref={inputRef} type="text" value={search}
                onChange={(e) => { if (/[0-9]/.test(e.target.value)) { setSearchError('Numbers are not allowed'); return; } setSearchError(''); setSearch(e.target.value); }}
                placeholder="Search..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: '100%', color: '#111827' }}
              />
              {search && <button type="button" onClick={() => { setSearch(''); setSearchError(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>}
            </div>
            {searchError && <span style={{ color: '#ef4444', fontSize: 10, marginTop: 3, display: 'block', paddingLeft: 2 }}>{searchError}</span>}
          </div>
          <div style={{ maxHeight: 175, overflowY: 'auto' }}>
            <div onClick={() => { onChange('All'); setOpen(false); setSearch(''); }} style={{
              padding: '9px 14px', fontSize: 13, cursor: 'pointer',
              fontWeight: value === 'All' ? 600 : 400,
              color: value === 'All' ? '#d97706' : '#374151',
              background: value === 'All' ? '#fffbeb' : 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (value !== 'All') e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (value !== 'All') e.currentTarget.style.background = 'transparent'; }}
            >{allLabel}</div>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>No results found</div>
            ) : filtered.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); setSearch(''); }} style={{
                padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                fontWeight: value === opt ? 600 : 400,
                color: value === opt ? '#d97706' : '#374151',
                background: value === opt ? '#fffbeb' : 'transparent',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
              >{opt}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PROVINCES = ['Central', 'Eastern', 'North Central', 'Northern', 'North Western', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'];
const DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];

function MapFitter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) { map.fitBounds(L.latLngBounds(coords.map(c => [c.lat, c.lng])), { padding: [40, 40] }); }
  }, [coords, map]);
  return null;
}

function SuggestionCard({ loc, onAdd, dayColor }) {
  return (
    <div
      style={{
        flexShrink: 0, width: 220, borderRadius: 16, overflow: 'hidden', background: '#fff',
        border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease', cursor: 'pointer', position: 'relative', scrollSnapAlign: 'start',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
      onClick={() => onAdd(loc)}
    >
      <div style={{ position: 'relative', height: 120, background: '#f3f4f6' }}>
        {loc.images?.[0] ? (
          <img src={loc.images[0]} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg>
          </div>
        )}
        <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', backdropFilter: 'blur(4px)', letterSpacing: '0.02em' }}>
          {loc.category}
        </span>
        {loc.distance != null && (
          <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, background: 'rgba(255,255,255,0.9)', color: '#374151', backdropFilter: 'blur(4px)' }}>
            {loc.distance < 1 ? '<1' : loc.distance} km
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(loc); }}
          style={{
            position: 'absolute', bottom: -14, right: 12, width: 28, height: 28, borderRadius: '50%',
            border: '2px solid #fff', background: dayColor || '#d97706', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.15s', zIndex: 2,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14m7-7H5" /></svg>
        </button>
      </div>
      <div style={{ padding: '14px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{loc.name}</p>
        <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.district} · {loc.province}</p>
        {loc.weather && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '5px 8px', borderRadius: 8, background: '#f0f9ff' }}>
            <img src={`https://openweathermap.org/img/wn/${loc.weather.icon}.png`} alt={loc.weather.condition} style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>{loc.weather.temp}°C</span>
            <span style={{ fontSize: 11, color: '#0284c7' }}>{loc.weather.condition}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionSkeleton() {
  return <div style={{ flexShrink: 0, width: 220, height: 210, borderRadius: 16, background: '#f3f4f6', animation: 'pulse 1.5s ease-in-out infinite', scrollSnapAlign: 'start' }} />;
}

const RADIUS_OPTIONS = [10, 20, 30, 50, 100];

export default function LocationSelectStep({ config, locationsByDay, setLocationsByDay, onNext, onBack }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [province, setProvince] = useState('All');
  const [district, setDistrict] = useState('All');
  const [activeDay, setActiveDay] = useState(1);
  const [suggestions, setSuggestions] = useState({ recommended: [], nearby: [] });
  const [sugLoading, setSugLoading] = useState(false);
  const [radius, setRadius] = useState(30);

  useEffect(() => { api.get('/locations').then(r => setLocations(r.data)).catch(() => { }).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (config.totalDays > 0) {
      setLocationsByDay(prev => {
        const u = { ...prev };
        for (let d = 1; d <= config.totalDays; d++) if (!u[d]) u[d] = [];
        return u;
      });
    }
  }, [config.totalDays, setLocationsByDay]);

  // Fetch suggestions based on start point, selected locations, and radius
  useEffect(() => {
    const startLat = config.startPoint?.lat;
    const startLng = config.startPoint?.lng;
    if (!startLat || !startLng) return;

    const allSelected = Object.values(locationsByDay).flat();
    const selectedIds = allSelected.map((l) => l._id).join(',');
    const lastAdded = allSelected[allSelected.length - 1];
    const refLat = lastAdded?.coordinates?.lat || startLat;
    const refLng = lastAdded?.coordinates?.lng || startLng;

    setSugLoading(true);
    api
      .get('/locations/suggestions', {
        params: { lat: refLat, lng: refLng, radius, selectedIds, days: config.totalDays },
      })
      .then((r) => setSuggestions(r.data))
      .catch(() => setSuggestions({ recommended: [], nearby: [] }))
      .finally(() => setSugLoading(false));
  }, [config.startPoint, config.totalDays, locationsByDay, radius]);

  const provinces = PROVINCES;
  const districts = DISTRICTS;

  const filtered = useMemo(() => {
    let list = locations;
    if (category !== 'All') list = list.filter(l => l.category === category);
    if (province !== 'All') list = list.filter(l => l.province === province);
    if (district !== 'All') list = list.filter(l => l.district === district);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(l => l.name.toLowerCase().includes(q) || l.district?.toLowerCase().includes(q)); }
    return list;
  }, [locations, category, province, district, search]);

  const getDay = (id) => { for (const [d, locs] of Object.entries(locationsByDay)) if (locs.some(l => l._id === id)) return parseInt(d); return null; };

  const addToDay = (loc) => {
    const cur = getDay(loc._id);
    if (cur === activeDay) return;
    setLocationsByDay(prev => {
      const u = { ...prev };
      if (cur) u[cur] = u[cur].filter(l => l._id !== loc._id);
      u[activeDay] = [...(u[activeDay] || []), loc];
      return u;
    });
  };
  const removeFromDay = (id, d) => setLocationsByDay(prev => ({ ...prev, [d]: prev[d].filter(l => l._id !== id) }));
  const toggle = (loc) => { const d = getDay(loc._id); d === activeDay ? removeFromDay(loc._id, activeDay) : addToDay(loc); };

  const total = Object.values(locationsByDay).reduce((s, l) => s + l.length, 0);
  const dayLocs = locationsByDay[activeDay] || [];
  const allCoords = Object.values(locationsByDay).flat().filter(l => l.coordinates?.lat).map(l => l.coordinates);
  const dayColor = DAY_COLORS[(activeDay - 1) % DAY_COLORS.length];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      <style>{`
        .sug-scroll::-webkit-scrollbar { height: 4px; }
        .sug-scroll::-webkit-scrollbar-track { background: transparent; }
        .sug-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        .sug-scroll::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
      {/* ── Header ── */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
        padding: '20px 28px', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
            Select destinations
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
            Add locations to each day of your {config.totalDays}-day trip
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            height: 34, padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, borderRadius: 8,
            background: total > 0 ? '#fef3c7' : '#f3f4f6',
            color: total > 0 ? '#92400e' : '#6b7280',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {total} selected
          </span>
          <button onClick={onBack} style={{
            height: 40, padding: '0 20px', fontSize: 13, fontWeight: 600, borderRadius: 10,
            border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
              Back
            </span>
          </button>
          <button onClick={onNext} disabled={total < 1} style={{
            height: 40, padding: '0 24px', fontSize: 13, fontWeight: 600, borderRadius: 10,
            border: 'none', cursor: total >= 1 ? 'pointer' : 'not-allowed',
            background: total >= 1 ? '#111827' : '#e5e7eb',
            color: total >= 1 ? '#fff' : '#9ca3af',
            transition: 'all 0.15s',
            boxShadow: total >= 1 ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
          }}
            onMouseEnter={e => { if (total >= 1) e.currentTarget.style.background = '#1f2937'; }}
            onMouseLeave={e => { if (total >= 1) e.currentTarget.style.background = '#111827'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Generate itinerary
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
            </span>
          </button>
        </div>
      </div>

      {/* ── Day Tabs + Active Indicator ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {Array.from({ length: config.totalDays }, (_, i) => i + 1).map(d => {
            const n = (locationsByDay[d] || []).length;
            const active = activeDay === d;
            const color = DAY_COLORS[(d - 1) % DAY_COLORS.length];
            return (
              <button key={d} onClick={() => setActiveDay(d)} style={{
                flexShrink: 0, height: 40, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer',
                border: active ? 'none' : '1px solid #e5e7eb',
                background: active ? color : '#fff',
                color: active ? '#fff' : '#4b5563',
                boxShadow: active ? `0 2px 8px ${color}40` : 'none',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#4b5563'; } }}
              >
                Day {d}
                {n > 0 && (
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'rgba(255,255,255,0.25)' : `${color}15`,
                    color: active ? '#fff' : color,
                  }}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingLeft: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dayColor }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: dayColor }}>Adding to Day {activeDay}</span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>{dayLocs.length} {dayLocs.length === 1 ? 'location' : 'locations'}</span>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left — Locations Panel */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Suggested for you ── */}
          {(sugLoading || suggestions.recommended.length > 0) && (
            <div style={{ marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Suggested for you</span>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{suggestions.recommended.length} places</span>
              </div>
              <div className="sug-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {sugLoading
                  ? [...Array(3)].map((_, i) => <SuggestionSkeleton key={i} />)
                  : suggestions.recommended.map((loc) => (
                      <SuggestionCard key={loc._id} loc={loc} onAdd={addToDay} dayColor={dayColor} />
                    ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search destinations..." value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 44, paddingLeft: 40, paddingRight: 16, fontSize: 14,
                border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff',
                color: '#111827', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.boxShadow = '0 0 0 3px rgba(17,24,39,0.06)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Province & District Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            <SearchableDropdown value={province} onChange={(v) => { setProvince(v); setDistrict('All'); }} options={provinces} placeholder="All Provinces" allLabel="All Provinces" />
            <SearchableDropdown value={district} onChange={setDistrict} options={districts} placeholder="All Districts" allLabel="All Districts" />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {CATEGORIES.map(name => {
              const active = category === name;
              return (
                <button key={name} onClick={() => setCategory(name)} style={{
                  flexShrink: 0, height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                  border: active ? 'none' : '1px solid #e5e7eb',
                  background: active ? '#111827' : '#fff',
                  color: active ? '#fff' : '#4b5563',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; } }}
                >
                  {CAT_ICONS[name]}
                  {name}
                </button>
              );
            })}
          </div>

          {/* Selected locations for active day */}
          {dayLocs.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
                Day {activeDay} itinerary
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayLocs.map((loc, i) => (
                  <div key={loc._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px',
                    borderRadius: 10, background: '#f9fafb', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                  >
                    <span style={{
                      width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, background: dayColor,
                    }}>{i + 1}</span>
                    <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#e5e7eb' }}>
                      {loc.images?.[0] ? <img src={loc.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                    <button onClick={() => removeFromDay(loc._id, activeDay)} style={{
                      width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#d1d5db', transition: 'all 0.15s', flexShrink: 0,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Nearby locations ── */}
          {dayLocs.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Nearby</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {RADIUS_OPTIONS.map((r) => (
                    <button key={r} onClick={() => setRadius(r)} style={{
                      height: 26, padding: '0 8px', fontSize: 11, fontWeight: radius === r ? 700 : 500,
                      borderRadius: 6, border: radius === r ? 'none' : '1px solid #e5e7eb',
                      background: radius === r ? '#111827' : '#fff', color: radius === r ? '#fff' : '#6b7280',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>{r}km</button>
                  ))}
                </div>
              </div>
              <div className="sug-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                {sugLoading ? (
                  [...Array(3)].map((_, i) => <SuggestionSkeleton key={i} />)
                ) : suggestions.nearby.length === 0 ? (
                  <div style={{ width: '100%', textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 13 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', opacity: 0.4 }}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                    No locations within {radius}km
                  </div>
                ) : (
                  suggestions.nearby.map((loc) => (
                    <SuggestionCard key={loc._id} loc={loc} onAdd={addToDay} dayColor={dayColor} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Location List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 420, display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} style={{ height: 72, background: '#f3f4f6', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', opacity: 0.4 }}>
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                </svg>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No locations found</p>
                <p style={{ fontSize: 13, margin: '4px 0 0' }}>Try a different search or category</p>
              </div>
            ) : filtered.map(loc => {
              const ad = getDay(loc._id);
              const onActive = ad === activeDay;
              const assigned = ad !== null;
              const dc = assigned ? DAY_COLORS[(ad - 1) % DAY_COLORS.length] : null;
              return (
                <button key={loc._id} onClick={() => toggle(loc)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  borderRadius: 12, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  border: onActive ? `2px solid ${dc}` : assigned ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
                  background: onActive ? `${dc}08` : '#fff',
                  borderLeft: assigned && !onActive ? `3px solid ${dc}` : undefined,
                }}
                  onMouseEnter={e => { if (!onActive) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!onActive) e.currentTarget.style.background = onActive ? `${dc}08` : '#fff'; }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                    background: '#f3f4f6',
                  }}>
                    {loc.images?.[0] ? (
                      <img src={loc.images[0]} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.district} · {loc.category}</p>
                  </div>
                  {assigned ? (
                    <span style={{
                      height: 26, padding: '0 10px', fontSize: 11, fontWeight: 700, color: '#fff',
                      borderRadius: 6, display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                      background: dc,
                    }}>Day {ad}</span>
                  ) : (
                    <span style={{
                      width: 32, height: 32, borderRadius: 8, border: '2px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: '#d1d5db', transition: 'all 0.15s',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14m7-7H5"/></svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right — Map */}
        <div className="lg:col-span-3" style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden',
            height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Map</p>
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Click pins to add/remove</span>
            </div>
            <div style={{ flex: 1 }}>
              <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {config.startPoint && <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={startIcon}><Popup><strong>Start</strong><br />{config.startPoint.name}</Popup></Marker>}
                {locations.filter(l => l.coordinates?.lat).map(loc => {
                  const ad = getDay(loc._id);
                  const dc = ad ? DAY_COLORS[(ad - 1) % DAY_COLORS.length] : null;
                  return (
                    <Marker key={loc._id} position={[loc.coordinates.lat, loc.coordinates.lng]} icon={pinIcon(!!ad, dc)} eventHandlers={{ click: () => toggle(loc) }}>
                      <Popup>
                        <div style={{ width: 200 }}>
                          {loc.mapImage && <img src={loc.mapImage} alt={loc.name} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                          <strong style={{ fontSize: 13 }}>{loc.name}</strong><br />
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{loc.district} · {loc.category}</span>
                          {ad && <div style={{ marginTop: 4 }}><span style={{ fontSize: 11, fontWeight: 600, color: dc }}>Day {ad}</span></div>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                {allCoords.length > 0 && <MapFitter coords={allCoords} />}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
