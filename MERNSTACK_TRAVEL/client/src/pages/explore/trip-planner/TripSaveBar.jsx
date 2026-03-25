import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

const DAY_COLORS = ['#d97706', '#2563eb', '#059669', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#65a30d', '#e11d48'];
function fmtDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function fmtTime(s) { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function fmtDate(d) { if (!d) return ''; const ms = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return `${d.getDate()} ${ms[d.getMonth()]} ${d.getFullYear()}`; }

export default function TripSaveBar({ config, days, stats, tripId, setTripId, onBack, onReset }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const totalStops = days.reduce((s, d) => s + d.items.length, 0);

  const saveTrip = async () => {
    if (!user) return toast.error('Please login to save trips');
    setSaving(true);
    try {
      const payload = { name: config.tripName, startPoint: config.startPoint, pace: 'moderate', totalDistance: stats?.totalDistance || 0, totalDuration: stats?.totalDuration || 0, days: days.map(d => ({ dayNumber: d.dayNumber, locations: d.items.map((item, order) => ({ locationId: item.locationId || item.location?._id, notes: item.notes, order })) })) };
      if (tripId) { await api.put(`/trips/${tripId}`, payload); toast.success('Trip updated!'); }
      else { const r = await api.post('/trips', payload); setTripId(r.data._id); toast.success('Trip saved!'); }
    } catch { toast.error('Failed to save trip'); }
    finally { setSaving(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // ── Brand header: compass logo + "Ceylon Compass" ──
    const cx = 24, cy = 18, r = 9;

    // Shadow ring (soft orange glow)
    doc.setFillColor(255, 237, 213); // orange-100
    doc.circle(cx, cy, r + 2.5, 'F');
    doc.setFillColor(255, 247, 237); // orange-50
    doc.circle(cx, cy, r + 4, 'F');

    // Outer ring — orange gradient effect
    doc.setFillColor(234, 88, 12); // orange-600
    doc.circle(cx, cy, r, 'F');
    doc.setFillColor(249, 115, 22); // orange-500 inner
    doc.circle(cx, cy, r - 1.2, 'F');

    // White compass face
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r - 2.2, 'F');

    // Degree ring marks (8 ticks)
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    for (let a = 0; a < 360; a += 45) {
      const rad = (a * Math.PI) / 180;
      const inner = r - 3.8, outer = r - 2.4;
      doc.line(cx + Math.sin(rad) * inner, cy - Math.cos(rad) * inner, cx + Math.sin(rad) * outer, cy - Math.cos(rad) * outer);
    }

    // Cardinal letters
    doc.setFontSize(3.5); doc.setTextColor(150, 150, 150);
    doc.text('N', cx - 1, cy - r + 4.8);
    doc.text('S', cx - 0.8, cy + r - 3.2);
    doc.text('E', cx + r - 5, cy + 1);
    doc.text('W', cx - r + 3.2, cy + 1);

    // Compass needle — North (orange)
    doc.setFillColor(234, 88, 12);
    doc.triangle(cx, cy - r + 3, cx - 1.4, cy, cx + 1.4, cy, 'F');
    // Compass needle — South (dark gray)
    doc.setFillColor(75, 85, 99);
    doc.triangle(cx, cy + r - 3, cx - 1.4, cy, cx + 1.4, cy, 'F');

    // Center dot
    doc.setFillColor(234, 88, 12);
    doc.circle(cx, cy, 1, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, 0.4, 'F');

    // Brand text
    doc.setFontSize(20); doc.setTextColor(17, 24, 39);
    doc.text('Ceylon', 38, 15);
    doc.setTextColor(234, 88, 12); // orange
    doc.text('Compass', 38 + doc.getTextWidth('Ceylon '), 15);
    doc.setFontSize(8.5); doc.setTextColor(156, 163, 175);
    doc.text('Your Sri Lanka Travel Guide', 38, 21);

    // Divider with orange accent
    doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.6);
    doc.line(14, 29, 14 + 24, 29);
    doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2);
    doc.line(14 + 24, 29, pw - 14, 29);

    // ── Trip details ──
    doc.setFontSize(18); doc.setTextColor(17, 24, 39); doc.text(config.tripName, 14, 39);
    doc.setFontSize(10); doc.setTextColor(156, 163, 175);
    const ds = config.startDate && config.endDate ? `${fmtDate(config.startDate)} — ${fmtDate(config.endDate)}` : new Date().toLocaleDateString();
    doc.text(`${ds} · ${config.totalDays} days`, 14, 45);
    if (stats) { doc.setFontSize(10); doc.setTextColor(234, 88, 12); doc.text(`Total: ${fmtDist(stats.totalDistance)} · ${fmtTime(stats.totalDuration)} driving`, 14, 51); }
    doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2); doc.line(14, 55, pw - 14, 55);
    let y = 63;
    days.forEach(d => {
      if (d.items.length === 0) return;
      if (y > 260) { doc.addPage(); y = 20; }
      const dstat = stats?.dayStats?.find(s => s.dayNumber === d.dayNumber);
      doc.setFontSize(14); doc.setTextColor(30, 30, 30); doc.text(`Day ${d.dayNumber}`, 14, y);
      if (dstat) { doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text(`${dstat.stops} stops · ${fmtDist(dstat.distance)} · ${fmtTime(dstat.duration)}`, 50, y); }
      y += 8;
      d.items.forEach((item, i) => {
        if (y > 272) { doc.addPage(); y = 20; }
        if (i > 0 && item.distFromPrev > 0) { doc.setFontSize(8); doc.setTextColor(180, 180, 180); doc.text(`    >> ${fmtDist(item.distFromPrev)} · ${fmtTime(item.durationFromPrev)}`, 18, y); y += 5; }
        doc.setFontSize(11); doc.setTextColor(60, 60, 60); doc.text(`${i + 1}. ${item.location?.name || 'Unknown'}`, 18, y);
        doc.setFontSize(9); doc.setTextColor(130, 130, 130); doc.text(`${item.location?.district || ''}`, 18, y + 4.5); y += 5;
        if (item.notes) { doc.setTextColor(160, 160, 160); doc.text(`  Note: ${item.notes}`, 22, y + 4); y += 5; }
        y += 5;
      });
      y += 4;
    });
    doc.save(`${config.tripName.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF exported!');
  };

  const activeDayStats = stats?.dayStats?.filter(ds => ds.stops > 0) || [];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px' }}>

      {/* ── Hero Card ── */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>
        {/* Header */}
        <div style={{
          background: '#f9fafb', borderBottom: '1px solid #f3f4f6',
          padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#ecfdf5',
            border: '1px solid #d1fae5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              Your trip is ready
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0' }}>
              {config.tripName}
            </p>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{ padding: '28px 28px 0' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: '#9ca3af', margin: '0 0 16px',
          }}>Trip summary</p>

          <div style={{ display: 'grid', gridTemplateColumns: stats ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
            {/* Days */}
            <div style={{
              padding: '16px 18px', borderRadius: 12, background: '#fffbeb',
              border: '1px solid #fef3c7',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Days</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{config.totalDays}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{config.totalDays === 1 ? 'day' : 'days'}</p>
            </div>

            {/* Destinations */}
            <div style={{
              padding: '16px 18px', borderRadius: 12, background: '#eff6ff',
              border: '1px solid #dbeafe',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stops</span>
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{totalStops}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>destinations</p>
            </div>

            {/* Distance */}
            {stats && (
              <div style={{
                padding: '16px 18px', borderRadius: 12, background: '#f0fdf4',
                border: '1px solid #dcfce7',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Distance</span>
                </div>
                <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{fmtDist(stats.totalDistance)}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>{fmtTime(stats.totalDuration)} driving</p>
              </div>
            )}
          </div>

          {/* Date bar */}
          {config.startDate && config.endDate && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 16,
              padding: '10px 14px', borderRadius: 10, background: '#f9fafb',
              border: '1px solid #f3f4f6', fontSize: 13, color: '#6b7280',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>{fmtDate(config.startDate)} — {fmtDate(config.endDate)}</span>
              {config.startPoint?.name && (
                <>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span>from {config.startPoint.name}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Day Breakdown ── */}
        {activeDayStats.length > 0 && (
          <div style={{ padding: '24px 28px 28px' }}>
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#9ca3af', margin: '0 0 14px',
              }}>Day breakdown</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeDayStats.map((ds, i) => (
                  <div key={ds.dayNumber} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 10, background: '#fafafa', border: '1px solid #f3f4f6',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.background = '#fafafa'; }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                      background: DAY_COLORS[i % 10],
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', width: 52 }}>Day {ds.dayNumber}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#6b7280', background: '#f3f4f6',
                      padding: '2px 8px', borderRadius: 6,
                    }}>{ds.stops} stops</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{fmtDist(ds.distance)}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{fmtTime(ds.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Actions Card ── */}
      <div style={{
        marginTop: 16, borderRadius: 16, border: '1px solid #e5e7eb',
        background: '#fff', padding: 28, overflow: 'hidden',
      }}>
        {user ? (
          <div>
            {/* Save button */}
            <button onClick={saveTrip} disabled={saving} style={{
              width: '100%', height: 48, borderRadius: 12, border: 'none', fontSize: 15,
              fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              background: saving ? '#f3f4f6' : '#111827', color: saving ? '#9ca3af' : '#fff',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#1f2937'; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#111827'; }}
            >
              {saving ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-3.93 7.07l-2.83-2.83M7.76 7.76L4.93 4.93" strokeLinecap="round" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {tripId ? <><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></> : <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}
                  </svg>
                  {tripId ? 'Update trip' : 'Save trip'}
                </>
              )}
            </button>

            {/* Secondary actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <button onClick={exportPDF} style={{
                height: 44, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
                </svg>
                Download PDF
              </button>
              <button onClick={() => window.print()} style={{
                height: 44, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Sign in to save</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Save and access your trip plans anytime</p>
            <button onClick={() => navigate('/login')} style={{
              height: 44, padding: '0 32px', borderRadius: 10, border: 'none',
              background: '#111827', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#1f2937'}
              onMouseLeave={e => e.currentTarget.style.background = '#111827'}
            >
              Sign in
            </button>

            <div style={{
              marginTop: 20, paddingTop: 20, borderTop: '1px solid #f3f4f6',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            }}>
              <button onClick={exportPDF} style={{
                height: 40, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
                </svg>
                Download PDF
              </button>
              <button onClick={() => window.print()} style={{
                height: 40, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation Footer ── */}
      <div style={{
        marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <button onClick={onBack} style={{
          height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid #e5e7eb',
          background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Edit itinerary
        </button>

        <button onClick={onReset} style={{
          height: 40, padding: '0 16px', borderRadius: 10, border: 'none',
          background: 'transparent', fontSize: 13, fontWeight: 500, color: '#9ca3af',
          cursor: 'pointer', transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#6b7280'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
        >
          Plan another trip
        </button>

        {user && tripId && (
          <button onClick={() => navigate('/profile')} style={{
            height: 40, padding: '0 16px', borderRadius: 10, border: 'none',
            background: '#f9fafb', fontSize: 13, fontWeight: 600, color: '#111827',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
          >
            View in profile
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
