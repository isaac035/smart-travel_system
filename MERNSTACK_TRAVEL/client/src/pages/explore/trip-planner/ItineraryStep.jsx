import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { optimizeDayRoutes, getRouteDirections, calculateTripStats } from './autoGroup';

const DAY_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#f43f5e'];
const makeIcon = (color, label) => L.divIcon({ className: '', html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${label}</div>`, iconAnchor: [14, 14] });
const startMarkerIcon = L.divIcon({ className: '', html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`, iconAnchor: [9, 9] });

function MapFitter({ coords }) { const map = useMap(); useEffect(() => { if (coords.length > 1) map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] }); }, [coords, map]); return null; }
function fmtDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function fmtTime(s) { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function fmtDate(d) { if (!d) return ''; const ms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${d.getDate()} ${ms[d.getMonth()]} ${d.getFullYear()}`; }

/* ── Sortable Item ── */

function SortableItem({ item, dayColor, stopNum, onRemove, onNoteChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-3 p-3 rounded bg-white border border-gray-100 hover:border-gray-200 transition-colors group">
      <button {...attributes} {...listeners} className="mt-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" /></svg>
      </button>
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: dayColor }}>{stopNum}</span>
      <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-gray-100">
        {item.location?.images?.[0] ? <img src={item.location.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.location?.name}</p>
        <p className="text-[12px] text-gray-500">{item.location?.district}</p>
        <input type="text" placeholder="Add a note..." value={item.notes} onChange={e => onNoteChange(item.uid, e.target.value)}
          className="mt-2 w-full h-8 bg-gray-50 border border-gray-200 text-[12px] text-gray-700 rounded px-3 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-shadow" />
      </div>
      <button onClick={() => onRemove(item.uid)} className="text-gray-300 hover:text-red-500 p-1 mt-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

function RouteConnector({ distance, duration }) {
  return (
    <div className="flex items-center gap-2 py-1 px-8">
      <div className="flex-1 border-t border-dashed border-gray-200" />
      <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDist(distance)} · {fmtTime(duration)}</span>
      <div className="flex-1 border-t border-dashed border-gray-200" />
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
      // Build real road routes per day, connecting from previous day's last stop
      const geo = {};
      let prevEnd = config.startPoint; // start point for day 1
      for (let i = 0; i < ui.length; i++) {
        const items = ui[i].items.filter(it => it.location?.coordinates?.lat);
        if (items.length === 0) continue;
        // Build waypoints: previous endpoint → this day's locations
        const waypoints = [prevEnd, ...items.map(it => it.location.coordinates)];
        if (waypoints.length >= 2) {
          try {
            geo[i] = await getRouteDirections(waypoints);
          } catch (err) {
            console.warn(`Route directions failed for day ${i + 1}:`, err?.message || err);
          }
        }
        // Update prevEnd to this day's last location for next day's connection
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

  const markers = days.flatMap((d, di) => d.items.filter(it => it.location?.coordinates?.lat).map((it, i) => ({ lat: it.location.coordinates.lat, lng: it.location.coordinates.lng, name: it.location.name, label: `${i + 1}`, color: DAY_COLORS[di % DAY_COLORS.length] })));
  const coords = markers.map(m => [m.lat, m.lng]);
  if (config.startPoint) coords.unshift([config.startPoint.lat, config.startPoint.lng]);
  const totalStops = days.reduce((s, d) => s + d.items.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{config.tripName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{config.totalDays} days · {fmtDate(config.startDate)} — {fmtDate(config.endDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setIsAlt(p => !p); generate(!isAlt); }}
            className="h-10 px-4 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Alt route
          </button>
          <button onClick={onBack} className="h-10 px-4 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
          <button onClick={() => onSave(days, stats)} className="h-10 px-5 text-[13px] font-semibold rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors">Save & export</button>
        </div>
      </div>

      {warning && <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">{warning}</div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { v: config.totalDays, l: 'Days' },
            { v: totalStops, l: 'Stops' },
            { v: fmtDist(stats.totalDistance), l: 'Distance' },
            { v: fmtTime(stats.totalDuration), l: 'Drive time' },
          ].map(s => (
            <div key={s.l} className="bg-white rounded border border-gray-200 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-900">{s.v}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-[3px] border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700">Optimizing your route...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5" style={{ minHeight: 520 }}>
          {/* Day cards */}
          <div className="lg:col-span-2 overflow-y-auto space-y-4 pr-1" style={{ maxHeight: 640 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {days.map((day, di) => {
                const dc = DAY_COLORS[di % DAY_COLORS.length];
                const ds = stats?.dayStats?.find(s => s.dayNumber === day.dayNumber);
                return (
                  <div key={day.dayNumber} className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dc }} />
                        <span className="text-sm font-semibold text-gray-900">Day {day.dayNumber}</span>
                        <span className="text-[12px] text-gray-400">{day.items.length} stops</span>
                      </div>
                      {ds && ds.distance > 0 && <span className="text-[12px] text-gray-400">{fmtDist(ds.distance)} · {fmtTime(ds.duration)}</span>}
                    </div>
                    <div className="p-3">
                      <SortableContext items={day.items.map(i => i.uid)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-0">
                          {day.items.length === 0 ? (
                            <div className="border-2 border-dashed border-gray-200 rounded py-8 text-center text-gray-400 text-sm">No destinations — drag here</div>
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
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden h-full" style={{ minHeight: 520 }}>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-900">Route map</p>
                <div className="flex items-center gap-2 ml-auto">
                  {days.map((d, di) => <div key={d.dayNumber} className="flex items-center gap-1 text-[11px] text-gray-400"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: DAY_COLORS[di % DAY_COLORS.length] }} />Day {d.dayNumber}</div>)}
                </div>
              </div>
              <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: 'calc(100% - 44px)', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {coords.length > 1 && <MapFitter coords={coords} />}
                {config.startPoint && <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={startMarkerIcon}><Popup><strong>Start:</strong> {config.startPoint.name}</Popup></Marker>}
                {Object.entries(routeGeoJSON).map(([i, geo]) => <GeoJSON key={`r-${i}-${isAlt}`} data={geo} style={{ color: DAY_COLORS[parseInt(i) % DAY_COLORS.length], weight: 4, opacity: 0.7 }} />)}
                {(() => {
                  let fallbackPrev = config.startPoint;
                  return days.map((day, di) => {
                    if (routeGeoJSON[di]) {
                      // Update fallbackPrev even when GeoJSON exists
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
                {markers.map((m, i) => <Marker key={i} position={[m.lat, m.lng]} icon={makeIcon(m.color, m.label)}><Popup><strong>{m.name}</strong><br /><span style={{ color: '#6b7280', fontSize: 12 }}>Stop {m.label}</span></Popup></Marker>)}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
