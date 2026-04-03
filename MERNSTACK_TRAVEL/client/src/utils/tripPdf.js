import { jsPDF } from 'jspdf';

function fmtDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }
function fmtTime(s) { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; }

/**
 * Generate and download a trip plan PDF.
 *
 * @param {Object} trip - Trip data (from API or TripSaveBar)
 *   trip.name, trip.days[], trip.totalDistance, trip.totalDuration, trip.pace
 *   Each day: { dayNumber, locations: [{ locationId: { name, district }, notes }] }
 *   OR (from TripSaveBar): { dayNumber, items: [{ location: { name, district }, notes, distFromPrev, durationFromPrev }] }
 */
export function exportTripPDF(trip) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // ── Brand header: compass logo + "Ceylon Compass" ──
  const cx = 24, cy = 18, r = 9;

  doc.setFillColor(255, 237, 213);
  doc.circle(cx, cy, r + 2.5, 'F');
  doc.setFillColor(255, 247, 237);
  doc.circle(cx, cy, r + 4, 'F');

  doc.setFillColor(234, 88, 12);
  doc.circle(cx, cy, r, 'F');
  doc.setFillColor(249, 115, 22);
  doc.circle(cx, cy, r - 1.2, 'F');

  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, r - 2.2, 'F');

  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    const inner = r - 3.8, outer = r - 2.4;
    doc.line(cx + Math.sin(rad) * inner, cy - Math.cos(rad) * inner, cx + Math.sin(rad) * outer, cy - Math.cos(rad) * outer);
  }

  doc.setFontSize(3.5); doc.setTextColor(150, 150, 150);
  doc.text('N', cx - 1, cy - r + 4.8);
  doc.text('S', cx - 0.8, cy + r - 3.2);
  doc.text('E', cx + r - 5, cy + 1);
  doc.text('W', cx - r + 3.2, cy + 1);

  doc.setFillColor(234, 88, 12);
  doc.triangle(cx, cy - r + 3, cx - 1.4, cy, cx + 1.4, cy, 'F');
  doc.setFillColor(75, 85, 99);
  doc.triangle(cx, cy + r - 3, cx - 1.4, cy, cx + 1.4, cy, 'F');

  doc.setFillColor(234, 88, 12);
  doc.circle(cx, cy, 1, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, 0.4, 'F');

  doc.setFontSize(20); doc.setTextColor(17, 24, 39);
  doc.text('Ceylon', 38, 15);
  doc.setTextColor(234, 88, 12);
  doc.text('Compass', 38 + doc.getTextWidth('Ceylon '), 15);
  doc.setFontSize(8.5); doc.setTextColor(156, 163, 175);
  doc.text('Your Sri Lanka Travel Guide', 38, 21);

  doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.6);
  doc.line(14, 29, 14 + 24, 29);
  doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2);
  doc.line(14 + 24, 29, pw - 14, 29);

  // ── Trip details ──
  const tripName = trip.name || 'My Trip';
  const totalDays = trip.days?.length || 0;
  const dateStr = new Date(trip.updatedAt || trip.createdAt || Date.now()).toLocaleDateString();

  doc.setFontSize(18); doc.setTextColor(17, 24, 39); doc.text(tripName, 14, 39);
  doc.setFontSize(10); doc.setTextColor(156, 163, 175);
  doc.text(`${dateStr} · ${totalDays} days`, 14, 45);
  if (trip.totalDistance > 0) {
    doc.setFontSize(10); doc.setTextColor(234, 88, 12);
    doc.text(`Total: ${fmtDist(trip.totalDistance)} · ${fmtTime(trip.totalDuration || 0)} driving`, 14, 51);
  }
  doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2); doc.line(14, 55, pw - 14, 55);

  let y = 63;
  (trip.days || []).forEach(d => {
    // Support both formats: API (locations) and TripSaveBar (items)
    const locs = d.items || d.locations || [];
    if (locs.length === 0) return;
    if (y > 260) { doc.addPage(); y = 20; }

    const stopCount = locs.length;
    doc.setFontSize(14); doc.setTextColor(30, 30, 30); doc.text(`Day ${d.dayNumber}`, 14, y);
    doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text(`${stopCount} stops`, 50, y);
    y += 8;

    locs.forEach((item, i) => {
      if (y > 272) { doc.addPage(); y = 20; }
      // Distance connector (TripSaveBar format)
      if (i > 0 && item.distFromPrev > 0) {
        doc.setFontSize(8); doc.setTextColor(180, 180, 180);
        doc.text(`    >> ${fmtDist(item.distFromPrev)} · ${fmtTime(item.durationFromPrev)}`, 18, y);
        y += 5;
      }
      // Location name — support both formats
      const loc = item.location || item.locationId || {};
      const name = loc.name || 'Unknown';
      const district = loc.district || '';
      const notes = item.notes || '';

      doc.setFontSize(11); doc.setTextColor(60, 60, 60); doc.text(`${i + 1}. ${name}`, 18, y);
      doc.setFontSize(9); doc.setTextColor(130, 130, 130); doc.text(district, 18, y + 4.5); y += 5;
      if (notes) { doc.setTextColor(160, 160, 160); doc.text(`  Note: ${notes}`, 22, y + 4); y += 5; }
      y += 5;
    });
    y += 4;
  });

  doc.save(`${tripName.replace(/\s+/g, '-')}.pdf`);
}
