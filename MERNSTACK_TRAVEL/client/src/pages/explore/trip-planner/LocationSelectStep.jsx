import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../../utils/api';

const CATEGORIES = [
  { name: 'All', icon: '🌍' }, { name: 'Nature', icon: '🌿' }, { name: 'Beach', icon: '🏖️' },
  { name: 'Wildlife', icon: '🦁' }, { name: 'Historical', icon: '🏛️' }, { name: 'Religious', icon: '🛕' },
  { name: 'Hill Country', icon: '🍃' }, { name: 'Adventure', icon: '⛺' }, { name: 'City', icon: '🏙️' },
  { name: 'Entertainment', icon: '🎡' },
];

const DAY_COLORS = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#f43f5e'];

const pinIcon = (selected, dayColor) =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="28" height="38">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.314 16 28 16 28s16-16.686 16-28C32 7.163 24.837 0 16 0z" fill="${selected ? (dayColor || '#f59e0b') : '#cbd5e1'}"/>
      <circle cx="16" cy="15" r="6" fill="white"/>
      ${selected ? '<text x="16" y="18" text-anchor="middle" fill="' + (dayColor || '#f59e0b') + '" font-size="10" font-weight="bold">✓</text>' : ''}
    </svg>`,
    iconAnchor: [14, 38], iconSize: [28, 38],
  });

const startIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`,
  iconAnchor: [8, 8],
});

function MapFitter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) { map.fitBounds(L.latLngBounds(coords.map(c => [c.lat, c.lng])), { padding: [40,40] }); }
  }, [coords, map]);
  return null;
}

export default function LocationSelectStep({ config, locationsByDay, setLocationsByDay, onNext, onBack }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => { api.get('/locations').then(r => setLocations(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (config.totalDays > 0) {
      setLocationsByDay(prev => {
        const u = { ...prev };
        for (let d = 1; d <= config.totalDays; d++) if (!u[d]) u[d] = [];
        return u;
      });
    }
  }, [config.totalDays, setLocationsByDay]);

  const filtered = useMemo(() => {
    let list = locations;
    if (category !== 'All') list = list.filter(l => l.category === category);
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(l => l.name.toLowerCase().includes(q) || l.district?.toLowerCase().includes(q)); }
    return list;
  }, [locations, category, search]);

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

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Select destinations</h2>
          <p className="text-sm text-gray-500 mt-0.5">Add locations to each day of your {config.totalDays}-day trip</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-8 px-3 inline-flex items-center text-[13px] font-semibold rounded-full bg-gray-100 text-gray-700">{total} selected</span>
          <button onClick={onBack} className="h-10 px-4 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
          <button onClick={onNext} disabled={total < 1}
            className={`h-10 px-5 text-[13px] font-semibold rounded transition-all ${total >= 1 ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            Generate itinerary
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: config.totalDays }, (_, i) => i + 1).map(d => {
          const n = (locationsByDay[d] || []).length;
          const active = activeDay === d;
          const color = DAY_COLORS[(d - 1) % DAY_COLORS.length];
          return (
            <button key={d} onClick={() => setActiveDay(d)}
              className={`shrink-0 h-10 px-4 flex items-center gap-2 text-[13px] font-semibold rounded transition-all ${
                active ? 'text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
              style={active ? { backgroundColor: color } : {}}
            >
              Day {d}
              {n > 0 && <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${active ? 'bg-white/25' : 'bg-gray-100'}`}>{n}</span>}
            </button>
          );
        })}
      </div>

      {/* Active day indicator */}
      <div className="flex items-center gap-2 text-sm" style={{ color: DAY_COLORS[(activeDay - 1) % DAY_COLORS.length] }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DAY_COLORS[(activeDay - 1) % DAY_COLORS.length] }} />
        <span className="font-semibold">Adding to Day {activeDay}</span>
        <span className="text-gray-400 font-normal">· {dayLocs.length} {dayLocs.length === 1 ? 'location' : 'locations'}</span>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5" style={{ minHeight: 560 }}>
        {/* Left panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Selected for this day */}
          {dayLocs.length > 0 && (
            <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Day {activeDay} locations</p>
              <div className="space-y-2">
                {dayLocs.map((loc, i) => (
                  <div key={loc._id} className="flex items-center gap-3 p-2.5 rounded bg-gray-50 group">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: DAY_COLORS[(activeDay - 1) % DAY_COLORS.length] }}>{i + 1}</span>
                    <div className="w-9 h-9 rounded overflow-hidden shrink-0 bg-gray-200">
                      {loc.images?.[0] ? <img src={loc.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate flex-1">{loc.name}</span>
                    <button onClick={() => removeFromDay(loc._id, activeDay)} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Search destinations..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow" />
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map(c => (
              <button key={c.name} onClick={() => setCategory(c.name)}
                className={`shrink-0 h-8 px-3 flex items-center gap-1 text-[12px] font-medium rounded-full transition-colors ${
                  category === c.name ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}>
                <span className="text-sm">{c.icon}</span> {c.name}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1" style={{ maxHeight: 400 }}>
            {loading ? (
              [...Array(6)].map((_, i) => <div key={i} className="h-[68px] bg-gray-100 rounded animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm font-medium">No locations found</p>
                <p className="text-[13px] mt-1">Try a different search or category</p>
              </div>
            ) : filtered.map(loc => {
              const ad = getDay(loc._id);
              const onActive = ad === activeDay;
              const assigned = ad !== null;
              const dc = assigned ? DAY_COLORS[(ad - 1) % DAY_COLORS.length] : null;
              return (
                <button key={loc._id} onClick={() => toggle(loc)}
                  className={`w-full flex items-center gap-3 p-3 rounded text-left transition-all duration-150 ${
                    onActive ? 'bg-gray-50 ring-2' : assigned ? 'bg-gray-50' : 'bg-white hover:bg-gray-50 border border-gray-100'
                  }`}
                  style={onActive ? { ringColor: dc, borderColor: dc } : assigned ? { borderLeft: `3px solid ${dc}` } : {}}
                >
                  <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-gray-100">
                    {loc.images?.[0] ? <img src={loc.images[0]} alt={loc.name} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{loc.name}</p>
                    <p className="text-[12px] text-gray-500 truncate">{loc.district} · {loc.category}</p>
                  </div>
                  {assigned ? (
                    <span className="h-6 px-2 text-[11px] font-bold text-white rounded shrink-0" style={{ backgroundColor: dc }}>Day {ad}</span>
                  ) : (
                    <span className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden h-full" style={{ minHeight: 560 }}>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Map</p>
              <p className="text-[12px] text-gray-400">Click pins to add/remove</p>
            </div>
            <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: 'calc(100% - 44px)', width: '100%' }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {config.startPoint && <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={startIcon}><Popup><strong>Start</strong><br/>{config.startPoint.name}</Popup></Marker>}
              {locations.filter(l => l.coordinates?.lat).map(loc => {
                const ad = getDay(loc._id);
                const dc = ad ? DAY_COLORS[(ad - 1) % DAY_COLORS.length] : null;
                return (
                  <Marker key={loc._id} position={[loc.coordinates.lat, loc.coordinates.lng]} icon={pinIcon(!!ad, dc)} eventHandlers={{ click: () => toggle(loc) }}>
                    <Popup>
                      <div style={{ width: 200 }}>
                        {loc.images?.[0] && <img src={loc.images[0]} alt={loc.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                        <strong style={{ fontSize: 13 }}>{loc.name}</strong><br/>
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
  );
}
