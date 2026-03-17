import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

const DAY_COLORS = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#f43f5e'];
function fmtDist(m) { return m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function fmtTime(s) { const h = Math.floor(s/3600), m = Math.round((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m`; }
function fmtDate(d) { if (!d) return ''; const ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `${d.getDate()} ${ms[d.getMonth()]} ${d.getFullYear()}`; }

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
    doc.setFontSize(22); doc.setTextColor(30,30,30); doc.text(config.tripName, 14, 25);
    doc.setFontSize(10); doc.setTextColor(150,150,150);
    const ds = config.startDate && config.endDate ? `${fmtDate(config.startDate)} — ${fmtDate(config.endDate)}` : new Date().toLocaleDateString();
    doc.text(`Ceylon Travel · ${ds} · ${config.totalDays} days`, 14, 33);
    if (stats) { doc.setFontSize(10); doc.setTextColor(180,120,20); doc.text(`Total: ${fmtDist(stats.totalDistance)} · ${fmtTime(stats.totalDuration)} driving`, 14, 40); }
    doc.setDrawColor(230,230,230); doc.line(14, 44, pw-14, 44);
    let y = 52;
    days.forEach(d => {
      if (d.items.length === 0) return;
      if (y > 260) { doc.addPage(); y = 20; }
      const dstat = stats?.dayStats?.find(s => s.dayNumber === d.dayNumber);
      doc.setFontSize(14); doc.setTextColor(30,30,30); doc.text(`Day ${d.dayNumber}`, 14, y);
      if (dstat) { doc.setFontSize(9); doc.setTextColor(150,150,150); doc.text(`${dstat.stops} stops · ${fmtDist(dstat.distance)} · ${fmtTime(dstat.duration)}`, 50, y); }
      y += 8;
      d.items.forEach((item, i) => {
        if (y > 272) { doc.addPage(); y = 20; }
        if (i > 0 && item.distFromPrev > 0) { doc.setFontSize(8); doc.setTextColor(180,180,180); doc.text(`    >> ${fmtDist(item.distFromPrev)} · ${fmtTime(item.durationFromPrev)}`, 18, y); y += 5; }
        doc.setFontSize(11); doc.setTextColor(60,60,60); doc.text(`${i+1}. ${item.location?.name || 'Unknown'}`, 18, y);
        doc.setFontSize(9); doc.setTextColor(130,130,130); doc.text(`${item.location?.district || ''}`, 18, y + 4.5); y += 5;
        if (item.notes) { doc.setTextColor(160,160,160); doc.text(`  Note: ${item.notes}`, 22, y + 4); y += 5; }
        y += 5;
      });
      y += 4;
    });
    doc.save(`${config.tripName.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF exported!');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-900 px-8 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Your trip is ready</h2>
          <p className="text-gray-400 text-sm mt-1">{config.tripName}</p>
        </div>

        {/* Summary */}
        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Trip summary</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-2xl font-bold text-gray-900">{config.totalDays}</p>
              <p className="text-[13px] text-gray-500">{config.totalDays === 1 ? 'day' : 'days'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalStops}</p>
              <p className="text-[13px] text-gray-500">destinations</p>
            </div>
            {stats && (
              <div>
                <p className="text-2xl font-bold text-gray-900">{fmtDist(stats.totalDistance)}</p>
                <p className="text-[13px] text-gray-500">{fmtTime(stats.totalDuration)} driving</p>
              </div>
            )}
          </div>

          {config.startDate && config.endDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {fmtDate(config.startDate)} — {fmtDate(config.endDate)} · from {config.startPoint?.name}
            </div>
          )}

          {/* Day breakdown */}
          {stats?.dayStats?.filter(ds => ds.stops > 0).length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Day breakdown</p>
              <div className="space-y-2">
                {stats.dayStats.filter(ds => ds.stops > 0).map((ds, i) => (
                  <div key={ds.dayNumber} className="flex items-center gap-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DAY_COLORS[i % 10] }} />
                    <span className="text-sm font-medium text-gray-900 w-14">Day {ds.dayNumber}</span>
                    <span className="text-[13px] text-gray-500 flex-1">{ds.stops} stops</span>
                    <span className="text-[13px] text-gray-500">{fmtDist(ds.distance)}</span>
                    <span className="text-[13px] text-gray-400">{fmtTime(ds.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded border border-gray-200 shadow-sm p-6 sm:p-8">
        {user ? (
          <div className="space-y-3">
            <button onClick={saveTrip} disabled={saving}
              className={`w-full h-12 text-[15px] font-semibold rounded transition-all ${saving ? 'bg-gray-100 text-gray-400' : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'}`}>
              {saving ? 'Saving...' : tripId ? 'Update trip' : 'Save trip'}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={exportPDF} className="h-11 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Download PDF
              </button>
              <button onClick={() => window.print()} className="h-11 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Print
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-gray-900 mb-1">Sign in to save</p>
            <p className="text-sm text-gray-500 mb-5">Save and access your trip plans anytime</p>
            <button onClick={() => navigate('/login')} className="h-11 px-8 text-[14px] font-semibold rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors">Sign in</button>
            <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
              <button onClick={exportPDF} className="h-10 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Download PDF</button>
              <button onClick={() => window.print()} className="h-10 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Print</button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="h-10 px-4 text-[13px] font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Edit itinerary
        </button>
        <button onClick={onReset} className="text-[13px] text-gray-400 hover:text-gray-600 font-medium transition-colors">Plan another trip</button>
        {user && tripId && (
          <button onClick={() => navigate('/profile')} className="h-10 px-4 text-[13px] font-medium text-gray-900 hover:bg-gray-50 rounded transition-colors inline-flex items-center gap-1.5">
            View in profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
