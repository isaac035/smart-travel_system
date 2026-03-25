import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/* ── Map Icons ── */
const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.25);animation:pulse 2s infinite"></div>`,
  iconAnchor: [9, 9],
});
const startIcon = L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`,
  iconAnchor: [11, 11],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

/* ── Helpers ── */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function fmt(date) {
  if (!date) return '';
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}
function calcDays(s, e) {
  if (!s || !e) return 0;
  return Math.ceil((e - s) / 86400000) + 1;
}
function same(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ─────────────────────────────────────────────
   DateRangePicker — Airbnb-inspired dual calendar
   ───────────────────────────────────────────── */
function DateRangePicker({ startDate, endDate, onDateChange }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [picking, setPicking] = useState(false);
  const [hover, setHover] = useState(null);

  const click = (date) => {
    if (!picking || !startDate) {
      onDateChange(date, null); setPicking(true);
    } else if (date < startDate) {
      onDateChange(date, null); setPicking(true);
    } else {
      onDateChange(startDate, date); setPicking(false);
    }
  };
  const quick = (n) => {
    const s = new Date(today), e = new Date(today);
    e.setDate(e.getDate() + n - 1);
    onDateChange(s, e); setPicking(false);
  };
  const prev = () => setView(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  const next = () => setView(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });
  const m2 = view.m === 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m: view.m + 1 };

  const renderMonth = (year, month) => {
    const dim = new Date(year, month + 1, 0).getDate();
    const fd = new Date(year, month, 1).getDay();
    const cells = [];
    for (let i = 0; i < fd; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= dim; d++) {
      const date = new Date(year, month, d); date.setHours(0, 0, 0, 0);
      const past = date < today;
      const isS = same(date, startDate), isE = same(date, endDate);
      const inRange = startDate && endDate && date > startDate && date < endDate;
      const inHover = picking && startDate && !endDate && hover && date > startDate && date <= hover;
      const isToday = same(date, today);

      let base = 'relative w-8 h-8 flex items-center justify-center text-[12px] transition-all duration-100 ';
      // Range background spans full cell width
      let rangeBg = '';
      if (inRange || inHover) rangeBg = 'before:absolute before:inset-0 before:bg-amber-50';
      // Start gets right-half bg, end gets left-half bg for connected range look
      if (isS && endDate) rangeBg = 'before:absolute before:inset-y-0 before:right-0 before:w-1/2 before:bg-amber-50';
      if (isE && startDate) rangeBg = 'before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-amber-50';

      let circle = 'relative z-10 w-8 h-8 flex items-center justify-center rounded-full ';
      if (isS || isE) circle += 'bg-amber-500 text-white font-semibold';
      else if (past) circle += 'text-gray-300 cursor-not-allowed';
      else if (isToday) circle += 'font-semibold text-gray-900 ring-1 ring-gray-300';
      else circle += 'text-gray-700 hover:bg-gray-100 font-normal';

      cells.push(
        <div key={d} className={base + rangeBg}>
          <button
            disabled={past}
            onClick={() => click(date)}
            onMouseEnter={() => setHover(date)}
            onMouseLeave={() => setHover(null)}
            className={circle}
          >{d}</button>
        </div>
      );
    }
    return (
      <div>
        <p className="text-[13px] font-semibold text-gray-900 text-center mb-3">{MONTHS[month]} {year}</p>
        <div className="grid grid-cols-7 place-items-center">
          {DAYS_SHORT.map(d => <div key={d} className="w-8 h-6 flex items-center justify-center text-[11px] font-medium text-gray-400">{d}</div>)}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8" >
      {/* Quick select */}
      <div className="flex items-center gap-2 flex-wrap">
        {[3, 5, 7, 10, 14].map(n => (
          <button key={n} onClick={() => quick(n)}
            className="h-9 px-5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:border-amber-400 hover:bg-amber-50 hover:text-gray-900 transition">
            {n} days
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="border border-gray-200 rounded overflow-hidden" style={{ marginTop: 18 }}>
        {/* Nav */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium text-gray-500">{MONTHS[view.m]} {view.y} — {MONTHS[m2.m]} {m2.y}</span>
          <button onClick={next} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {/* Months */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-gray-100">
          <div className="p-3 sm:p-4">{renderMonth(view.y, view.m)}</div>
          <div className="p-3 sm:p-4">{renderMonth(m2.y, m2.m)}</div>
        </div>
        {/* Footer */}
        {picking && startDate && !endDate && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">Select your check-out date</p>
          </div>
        )}
        {startDate && endDate && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-3 text-sm">
            <span className="font-semibold text-gray-900">{fmt(startDate)}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            <span className="font-semibold text-gray-900">{fmt(endDate)}</span>
            <span className="text-gray-400 ml-1">({calcDays(startDate, endDate)} days)</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main — TripSetupStep
   ───────────────────────────────────────────── */
const CITIES = [
  { lat: 6.9271, lng: 79.8612, name: 'Colombo' },
  { lat: 7.2906, lng: 80.6337, name: 'Kandy' },
  { lat: 6.0535, lng: 80.2210, name: 'Galle' },
];

export default function TripSetupStep({ config, setConfig, onNext }) {
  const [userLoc, setUserLoc] = useState(null);
  const [detecting, setDetecting] = useState(false);

  const detect = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { const loc = { lat: p.coords.latitude, lng: p.coords.longitude, name: 'My Location' }; setUserLoc(loc); setConfig(prev => ({ ...prev, startPoint: loc })); setDetecting(false); },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  const onMapClick = (ll) => setConfig(prev => ({ ...prev, startPoint: { lat: ll.lat, lng: ll.lng, name: 'Custom Location' } }));
  const onDateChange = (s, e) => setConfig(prev => ({ ...prev, startDate: s, endDate: e, totalDays: calcDays(s, e) }));

  const ready = config.tripName.trim() && config.startDate && config.endDate && config.totalDays > 0 && config.startPoint;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-stretch">
      {/* ─── LEFT: Form ─── */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(15, 15, 15, 0.2)' }}>

          {/* Section 1: Trip Name */}
          <div style={{ padding: '16px 40px 6px' }}>
            <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Plan your perfect trip</h2>
            <p className="text-[15px] text-gray-500 mt-1 mb-4">Set up the basics — we'll handle the rest.</p>

            <label className="block text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-3">Trip name</label>
            <input
              type="text"
              value={config.tripName}
              onChange={e => setConfig(prev => ({ ...prev, tripName: e.target.value }))}
              placeholder="e.g. Southern Coast Adventure"
              className="w-full h-8 px-4 bg-white border border-gray-300 rounded text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow"
            />
          </div>


          {/* Section 2: Dates */}
          <div style={{ padding: '6px 40px' }}>
            <label className="block text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-4">When are you traveling?</label>
            <DateRangePicker startDate={config.startDate} endDate={config.endDate} onDateChange={onDateChange} />
          </div>


          {/* Section 3: Starting Point */}
          <div style={{ padding: '6px 40px' }}>
            <label className="block text-[13px] font-semibold text-gray-900 uppercase tracking-wide mb-3">Where will you start?</label>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={detect}
                disabled={detecting}
                className="h-10 px-7 inline-flex items-center gap-3 text-[13px] font-medium rounded-full border border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-40"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4m10-10h-4M6 12H2" /></svg>
                {detecting ? 'Detecting...' : 'Current location'}
              </button>
            </div>

            {config.startPoint && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{config.startPoint.name}</p>
                  <p className="text-xs text-gray-500">{config.startPoint.lat.toFixed(4)}, {config.startPoint.lng.toFixed(4)}</p>
                </div>
              </div>
            )}

            <p className="text-[13px] text-gray-400 mt-4">Or click anywhere on the map to pick a custom start point.</p>
          </div>

          {/* Trip Summary — only when dates + start selected */}
          {config.startDate && config.endDate && config.startPoint && (
            <>
              <div className="bg-gray-50" style={{ padding: '6px 40px' }}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-5">Trip overview</p>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[28px] font-bold text-gray-900 leading-none">{config.totalDays}</p>
                    <p className="text-[13px] text-gray-500 mt-2">{config.totalDays === 1 ? 'day' : 'days'}</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900 leading-tight">{fmt(config.startDate)}</p>
                    <p className="text-[13px] text-gray-500 mt-2">to {fmt(config.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900 leading-tight">{config.startPoint.name}</p>
                    <p className="text-[13px] text-gray-500 mt-2">starting from</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="border-t border-gray-100" style={{ padding: '6px 40px' }}>
            <button
              onClick={onNext}
              disabled={!ready}
              className={`w-full h-14 flex items-center justify-center gap-2 text-[15px] font-semibold rounded transition-all duration-200 ${ready
                ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
              Continue to destinations
              {ready && <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
            </button>
            {!ready && (
              <p className="text-[13px] text-gray-400 text-center mt-3">
                {!config.tripName.trim() ? 'Give your trip a name' : !config.startDate || !config.endDate ? 'Pick your travel dates' : 'Choose a starting point'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Map ─── */}
      <div className="lg:col-span-2 flex flex-col">
        <div className="bg-white rounded border border-gray-200 overflow-hidden flex flex-col flex-1" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Starting location</p>
              <p className="text-[13px] text-gray-400 mt-0.5">Click the map to pick a point</p>
            </div>
            {config.startPoint && (
              <span className="h-7 px-3 inline-flex items-center text-[12px] font-semibold rounded-full bg-amber-50 text-amber-700">
                {config.startPoint.name}
              </span>
            )}
          </div>
          <div className="flex-1" style={{ minHeight: 300 }}>
            <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={onMapClick} />
              {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}><Popup><strong>Your Location</strong></Popup></Marker>}
              {config.startPoint && <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={startIcon}><Popup><strong>Start:</strong> {config.startPoint.name}</Popup></Marker>}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
