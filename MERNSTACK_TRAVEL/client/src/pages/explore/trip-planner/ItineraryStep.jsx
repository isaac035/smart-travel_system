import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { optimizeDayRoutes, getRouteDirections, calculateTripStats } from './autoGroup';

const DAY_COLORS = ['#d97706', '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#65a30d', '#e11d48'];
const makeIcon = (color, label) => L.divIcon({ className: '', html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${label}</div>`, iconAnchor: [14, 14] });
const startMarkerIcon = L.divIcon({ className: '', html: `<div style="width:18px;height:18px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.2),0 2px 8px rgba(0,0,0,0.2)"></div>`, iconAnchor: [9, 9] });

function MapFitter({ coords }) { const map = useMap(); useEffect(() => { if (coords.length > 1) map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] }); }, [coords, map]); return null; }
function fmtDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function fmtTime(s) { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function fmtDate(d) { if (!d) return ''; const ms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${d.getDate()} ${ms[d.getMonth()]} ${d.getFullYear()}`; }

/* ── Sortable Item ── */
function SortableItem({ item, dayColor, stopNum, onRemove, onNoteChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={{
      ...style, display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12,
      borderRadius: 12, background: '#fff', border: '1px solid #f3f4f6',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <button {...attributes} {...listeners} style={{
        marginTop: 8, color: '#d1d5db', cursor: 'grab', border: 'none', background: 'none', padding: 0, flexShrink: 0,
      }}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" /></svg>
      </button>
      <span style={{
        width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 2, background: dayColor,
      }}>{stopNum}</span>
      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
        {item.location?.images?.[0] ? <img src={item.location.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location?.name}</p>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{item.location?.district}</p>
        <input type="text" placeholder="Add a note..." value={item.notes} onChange={e => onNoteChange(item.uid, e.target.value)}
          style={{
            marginTop: 8, width: '100%', height: 32, padding: '0 12px', fontSize: 12,
            border: '1px solid #f3f4f6', borderRadius: 8, background: '#f9fafb',
            color: '#374151', outline: 'none', transition: 'border-color 0.15s',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#d1d5db'}
          onBlur={e => e.target.style.borderColor = '#f3f4f6'}
        />
      </div>
      <button onClick={() => onRemove(item.uid)} style={{
        width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#d1d5db', transition: 'all 0.15s', flexShrink: 0, marginTop: 2,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

function RouteConnector({ distance, duration }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 32px' }}>
      <div style={{ flex: 1, borderTop: '1.5px dashed #e5e7eb' }} />
      <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', fontWeight: 500 }}>
        {fmtDist(distance)} · {fmtTime(duration)}
      </span>
      <div style={{ flex: 1, borderTop: '1.5px dashed #e5e7eb' }} />
    </div>
  );
}

/* ── Main ── */
export default function ItineraryStep({ config, locationsByDay, onBack, onSave }) {
  const [days, setDays] = useState([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(null);
  const [isAlt, setIsAlt] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const generate = useCallback(async (reverse = false) => {
    setLoading(true);
    try {
      const result = await optimizeDayRoutes(config.startPoint, locationsByDay, config.totalDays, reverse);
      setWarning(result.warning);
      const ui = result.days.map(d => ({ dayNumber: d.dayNumber, items: d.locations.map((loc, i) => ({ uid: `${loc.location._id}-${d.dayNumber}-${i}`, location: loc.location, locationId: loc.location._id, notes: '', distFromPrev: loc.distFromPrev, durationFromPrev: loc.durationFromPrev })) }));
      setDays(ui);
      setStats(calculateTripStats(result.days));
      const geo = {};
      let prevEnd = config.startPoint;
      for (let i = 0; i < ui.length; i++) {
        const items = ui[i].items.filter(it => it.location?.coordinates?.lat);
        if (items.length === 0) continue;
        const waypoints = [prevEnd, ...items.map(it => it.location.coordinates)];
        if (waypoints.length >= 2) { try { geo[i] = await getRouteDirections(waypoints); } catch (err) { console.warn(`Route directions failed for day ${i + 1}:`, err?.message || err); } }
        prevEnd = items[items.length - 1].location.coordinates;
      }
      setRouteGeoJSON(geo);
    } catch { setWarning('Failed to generate plan.'); }
    finally { setLoading(false); }
  }, [config, locationsByDay]);

  useEffect(() => { generate(false); }, [generate]);

  const removeItem = uid => setDays(p => p.map(d => ({ ...d, items: d.items.filter(i => i.uid !== uid) })));
  const updateNote = (uid, n) => setDays(p => p.map(d => ({ ...d, items: d.items.map(i => i.uid === uid ? { ...i, notes: n } : i) })));
  const findDay = uid => days.find(d => d.items.some(i => i.uid === uid));
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const s = findDay(active.id), d = findDay(over.id);
    if (!s || !d) return;
    if (s.dayNumber === d.dayNumber) setDays(p => p.map(dd => dd.dayNumber !== s.dayNumber ? dd : { ...dd, items: arrayMove(dd.items, dd.items.findIndex(i => i.uid === active.id), dd.items.findIndex(i => i.uid === over.id)) }));
    else { const item = s.items.find(i => i.uid === active.id); setDays(p => p.map(dd => { if (dd.dayNumber === s.dayNumber) return { ...dd, items: dd.items.filter(i => i.uid !== active.id) }; if (dd.dayNumber === d.dayNumber) return { ...dd, items: [...dd.items, item] }; return dd; })); }
  };

  const markers = days.flatMap((d, di) => d.items.filter(it => it.location?.coordinates?.lat).map((it, i) => ({ lat: it.location.coordinates.lat, lng: it.location.coordinates.lng, name: it.location.name, mapImage: it.location.mapImage, district: it.location.district, category: it.location.category, label: `${i + 1}`, color: DAY_COLORS[di % DAY_COLORS.length] })));
  const coords = markers.map(m => [m.lat, m.lng]);
  if (config.startPoint) coords.unshift([config.startPoint.lat, config.startPoint.lng]);
  const totalStops = days.reduce((s, d) => s + d.items.length, 0);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
      {/* ── Header ── */}
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 28px', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>{config.tripName}</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>
            {config.totalDays} days · {fmtDate(config.startDate)} — {fmtDate(config.endDate)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { setIsAlt(p => !p); generate(!isAlt); }} style={{
            height: 40, padding: '0 18px', fontSize: 13, fontWeight: 600, borderRadius: 10,
            border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Alt route
          </button>
          <button onClick={onBack} style={{
            height: 40, padding: '0 20px', fontSize: 13, fontWeight: 600, borderRadius: 10,
            border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fff'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back
          </button>
          <button onClick={() => onSave(days, stats)} style={{
            height: 40, padding: '0 24px', fontSize: 13, fontWeight: 600, borderRadius: 10,
            border: 'none', background: '#111827', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
            onMouseLeave={e => e.currentTarget.style.background = '#111827'}
          >
            Save & export
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {warning && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', marginBottom: 20,
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, fontSize: 13, color: '#92400e',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path strokeLinecap="round" d="M12 9v4m0 4h.01M12 2L2 22h20L12 2z"/></svg>
          {warning}
        </div>
      )}

      {/* ── Stats ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { v: config.totalDays, l: 'Days', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
            { v: totalStops, l: 'Stops', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg> },
            { v: fmtDist(stats.totalDistance), l: 'Distance', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
            { v: fmtTime(stats.totalDuration), l: 'Drive time', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
          ].map(s => (
            <div key={s.l} style={{
              background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>{s.v}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', fontWeight: 500 }}>{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, border: '3px solid #111827', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>Optimizing your route...</p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>Finding the best path between stops</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5" style={{ minHeight: 520 }}>
          {/* Day cards */}
          <div className="lg:col-span-2" style={{ overflowY: 'auto', maxHeight: 640, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {days.map((day, di) => {
                const dc = DAY_COLORS[di % DAY_COLORS.length];
                const ds = stats?.dayStats?.find(s => s.dayNumber === day.dayNumber);
                return (
                  <div key={day.dayNumber} style={{
                    background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderBottom: '1px solid #f3f4f6',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dc }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Day {day.dayNumber}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: dc, background: `${dc}12`,
                          padding: '2px 8px', borderRadius: 6,
                        }}>{day.items.length} {day.items.length === 1 ? 'stop' : 'stops'}</span>
                      </div>
                      {ds && ds.distance > 0 && (
                        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                          {fmtDist(ds.distance)} · {fmtTime(ds.duration)}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: 12 }}>
                      <SortableContext items={day.items.map(i => i.uid)} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          {day.items.length === 0 ? (
                            <div style={{
                              border: '2px dashed #e5e7eb', borderRadius: 12, padding: '32px 0',
                              textAlign: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 500,
                            }}>No destinations — drag here</div>
                          ) : day.items.map((item, idx) => (
                            <div key={item.uid}>
                              {idx > 0 && item.distFromPrev > 0 && <RouteConnector distance={item.distFromPrev} duration={item.durationFromPrev} />}
                              <SortableItem item={item} dayColor={dc} stopNum={idx + 1} onRemove={removeItem} onNoteChange={updateNote} />
                            </div>
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                );
              })}
            </DndContext>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden',
              height: '100%', minHeight: 520, display: 'flex', flexDirection: 'column',
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
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Route map</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {days.map((d, di) => (
                    <div key={d.dayNumber} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280', fontWeight: 500 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: DAY_COLORS[di % DAY_COLORS.length] }} />
                      Day {d.dayNumber}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {coords.length > 1 && <MapFitter coords={coords} />}
                  {config.startPoint && <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={startMarkerIcon}><Popup><strong>Start:</strong> {config.startPoint.name}</Popup></Marker>}
                  {Object.entries(routeGeoJSON).map(([i, geo]) => <GeoJSON key={`r-${i}-${isAlt}`} data={geo} style={{ color: DAY_COLORS[parseInt(i) % DAY_COLORS.length], weight: 4, opacity: 0.7 }} />)}
                  {(() => {
                    let fallbackPrev = config.startPoint;
                    return days.map((day, di) => {
                      if (routeGeoJSON[di]) {
                        const validItems = day.items.filter(it => it.location?.coordinates?.lat);
                        if (validItems.length > 0) fallbackPrev = validItems[validItems.length - 1].location.coordinates;
                        return null;
                      }
                      const pos = day.items.filter(it => it.location?.coordinates?.lat).map(it => [it.location.coordinates.lat, it.location.coordinates.lng]);
                      if (fallbackPrev && pos.length > 0) pos.unshift([fallbackPrev.lat, fallbackPrev.lng]);
                      const validItems = day.items.filter(it => it.location?.coordinates?.lat);
                      if (validItems.length > 0) fallbackPrev = validItems[validItems.length - 1].location.coordinates;
                      return pos.length > 1 ? <Polyline key={`f-${di}`} positions={pos} color={DAY_COLORS[di % DAY_COLORS.length]} weight={3} opacity={0.6} dashArray="8 6" /> : null;
                    });
                  })()}
                  {markers.map((m, i) => <Marker key={i} position={[m.lat, m.lng]} icon={makeIcon(m.color, m.label)}><Popup><div style={{ width: 200, fontFamily: 'system-ui, sans-serif' }}>{m.mapImage && <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}><img src={m.mapImage} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} /></div>}<p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>{m.name}</p><p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{m.district} · {m.category}</p></div></Popup></Marker>)}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
