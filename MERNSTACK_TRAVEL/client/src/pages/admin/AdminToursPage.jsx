import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, Map, Upload, Search, ChevronLeft, ChevronRight, Eye, CheckCircle, XCircle, Ban, CreditCard, X } from 'lucide-react';
import AdminTabs from '../../components/AdminTabs';
import { formatLKR } from '../../utils/currency';

const EMPTY = { name:'', description:'', duration:'', basePrice:'', vehicleOptions:['car','van','bus'], includes:'', excludes:'', isActive:true };

export default function AdminToursPage() {
  /* ── shared state ── */
  const [activeTab, setActiveTab] = useState(0);

  /* ── packages state (existing) ── */
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedGuides, setSelectedGuides] = useState([]);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [locSearch, setLocSearch] = useState('');
  const [guideSearch, setGuideSearch] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  /* ── bookings state ── */
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);
  const bookingPerPage = 8;
  const [slipModal, setSlipModal] = useState(null);

  /* ── fetch on mount ── */
  useEffect(() => {
    Promise.all([
      api.get('/tours').then((r) => { setPackages(r.data); setLoading(false); }),
      api.get('/locations').then((r) => setLocations(r.data)),
      api.get('/guides').then((r) => setGuides(r.data)),
      api.get('/admin/tour-bookings').then((r) => { setBookings(r.data); setBookingsLoading(false); }).catch(() => setBookingsLoading(false)),
    ]).catch(() => setLoading(false));
  }, []);

  /* ── packages logic (existing) ── */
  const filtered = packages.filter(pkg => {
    const matchSearch = pkg.name.toLowerCase().includes(search.toLowerCase());
    return (statusFilter === 'all' || (statusFilter === 'active' ? pkg.isActive : !pkg.isActive)) && matchSearch;
  });
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openCreate = () => { setForm(EMPTY); setSelectedLocations([]); setSelectedGuides([]); setImages([]); setExistingImages([]); setEditId(null); setLocSearch(''); setGuideSearch(''); setShowForm(true); };
  const openEdit = (pkg) => {
    setForm({ name: pkg.name, description: pkg.description, duration: pkg.duration, basePrice: pkg.basePrice, vehicleOptions: pkg.vehicleOptions || ['car','van','bus'], includes: (pkg.includes || []).join('\n'), excludes: (pkg.excludes || []).join('\n'), isActive: pkg.isActive ?? true });
    setSelectedLocations((pkg.locations || []).map((l) => l._id || l));
    setSelectedGuides((pkg.guideIds || []).map((g) => g._id || g));
    setExistingImages(pkg.images || []); setImages([]); setEditId(pkg._id); setLocSearch(''); setGuideSearch(''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const toggleVehicle = (v) => setForm((p) => ({ ...p, vehicleOptions: p.vehicleOptions.includes(v) ? p.vehicleOptions.filter((x) => x !== v) : [...p.vehicleOptions, v] }));
  const toggleLoc = (id) => setSelectedLocations((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleGuide = (id) => setSelectedGuides((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      const payload = { name: form.name, description: form.description, duration: Number(form.duration), basePrice: Number(form.basePrice), vehicleOptions: form.vehicleOptions, locations: selectedLocations, guideIds: selectedGuides, includes: form.includes.split('\n').map((s) => s.trim()).filter(Boolean), excludes: form.excludes.split('\n').map((s) => s.trim()).filter(Boolean), isActive: form.isActive };
      if (editId) payload.existingImages = existingImages;
      fd.append('data', JSON.stringify(payload));
      images.forEach((f) => fd.append('images', f));
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editId) { const r = await api.put(`/tours/${editId}`, fd, { headers }); setPackages((p) => p.map((pkg) => pkg._id === editId ? r.data : pkg)); toast.success('Package updated'); }
      else { const r = await api.post('/tours', fd, { headers }); setPackages((p) => [r.data, ...p]); toast.success('Package created'); }
      closeForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try { await api.delete(`/tours/${id}`); setPackages((p) => p.filter((pkg) => pkg._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  /* ── bookings logic ── */
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const rejectedCount = bookings.filter(b => b.status === 'rejected').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  const filteredBookings = bookings.filter(b => {
    const matchStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const travelerName = b.userId?.name || '';
    const packageName = b.packageId?.name || '';
    const q = bookingSearch.toLowerCase();
    const matchSearch = travelerName.toLowerCase().includes(q) || packageName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * bookingPerPage, bookingPage * bookingPerPage);
  const bookingTotalPages = Math.ceil(filteredBookings.length / bookingPerPage);

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const fmtCurrency = (v) => formatLKR(v);

  const statusBadge = (status) => {
    const map = { pending: 'bg-amber-50 text-amber-700', confirmed: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };
    return <span className={`adm-badge ${map[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const updateBookingStatus = async (id, status) => {
    const labels = { confirmed: 'Approve', rejected: 'Reject', cancelled: 'Cancel' };
    if (!window.confirm(`${labels[status] || 'Update'} this booking?`)) return;
    try {
      await api.put(`/admin/payments/tour/${id}/status`, { status });
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  /* ── bookings status filter tabs ── */
  const statusTabs = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'pending', label: 'Pending', count: pendingBookingsCount },
    { key: 'confirmed', label: 'Confirmed', count: confirmedCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
    { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: 0, overflow: 'hidden' }}>
        <AdminDrawer open={showForm} onClose={closeForm} title={editId ? 'Edit Package' : 'Add New Package'} saving={saving} onSubmit={handleSave} submitLabel={editId ? 'Update Package' : 'Create Package'}>
          <div className="field-row cols-4">
            <div className="field"><label>Package Name *</label><input required value={form.name} onChange={f('name')} placeholder="Enter package name" className="adm-input" /></div>
            <div className="field"><label>Duration (days)</label><input type="number" min={1} value={form.duration} onChange={f('duration')} placeholder="3" className="adm-input" /></div>
              <div className="field"><label>Base Price (LKR)</label><input type="number" value={form.basePrice} onChange={f('basePrice')} placeholder="299" className="adm-input" /></div>
            <div className="field">
              <label>Vehicles</label>
              <div className="flex gap-2">{['car', 'van', 'bus'].map((v) => (<button key={v} type="button" onClick={() => toggleVehicle(v)} className={`adm-vehicle-btn ${form.vehicleOptions.includes(v) ? 'active' : ''}`}>{v}</button>))}</div>
            </div>
          </div>
          <div className="field-row cols-2">
            <div className="field">
              <label>Locations ({selectedLocations.length})</label>
              {selectedLocations.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {selectedLocations.map(id => { const loc = locations.find(l => l._id === id); return loc ? (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>
                      {loc.name}
                      <button type="button" onClick={() => toggleLoc(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#b45309', fontSize: 13, fontWeight: 700 }}>&times;</button>
                    </span>
                  ) : null; })}
                </div>
              )}
              <input value={locSearch} onChange={e => setLocSearch(e.target.value)} placeholder="Search locations..." className="adm-input" style={{ marginBottom: 5, fontSize: 12 }} />
              <div className="adm-checklist" style={{ maxHeight: 100 }}>
                {locations.filter(l => l.name.toLowerCase().includes(locSearch.toLowerCase()) || (l.district || '').toLowerCase().includes(locSearch.toLowerCase())).map((l) => (
                  <label key={l._id} className={selectedLocations.includes(l._id) ? 'selected' : ''}><input type="checkbox" checked={selectedLocations.includes(l._id)} onChange={() => toggleLoc(l._id)} />{l.name}{l.district ? ` - ${l.district}` : ''}</label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Guides ({selectedGuides.length})</label>
              {selectedGuides.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {selectedGuides.map(id => { const g = guides.find(g => g._id === id); return g ? (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' }}>
                      {g.name}
                      <button type="button" onClick={() => toggleGuide(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#047857', fontSize: 13, fontWeight: 700 }}>&times;</button>
                    </span>
                  ) : null; })}
                </div>
              )}
              <input value={guideSearch} onChange={e => setGuideSearch(e.target.value)} placeholder="Search guides..." className="adm-input" style={{ marginBottom: 5, fontSize: 12 }} />
              <div className="adm-checklist" style={{ maxHeight: 100 }}>
                {guides.filter(g => g.name.toLowerCase().includes(guideSearch.toLowerCase())).map((g) => (
                  <label key={g._id} className={selectedGuides.includes(g._id) ? 'selected' : ''}><input type="checkbox" checked={selectedGuides.includes(g._id)} onChange={() => toggleGuide(g._id)} />{g.name}</label>
                ))}
              </div>
            </div>
          </div>
          <div className="field-row cols-3">
            <div className="field"><label>Includes (one per line)</label><textarea value={form.includes} onChange={f('includes')} rows={3} placeholder={"Accommodation\nMeals\nTransport"} className="adm-textarea" /></div>
            <div className="field"><label>Excludes (one per line)</label><textarea value={form.excludes} onChange={f('excludes')} rows={3} placeholder={"Air tickets\nPersonal expenses"} className="adm-textarea" /></div>
            <div className="field"><label>Description</label><textarea value={form.description} onChange={f('description')} rows={3} placeholder="Describe this tour package..." className="adm-textarea" /></div>
          </div>
          <div className="field-row cols-2">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))} className={`adm-toggle ${form.isActive ? 'on' : 'off'}`}><span className="knob" /></button>
              <span className="text-sm font-semibold text-gray-700">{form.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="field">
              <label>Images</label>
              {(existingImages.length > 0 || images.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                  {existingImages.map((url, i) => (
                    <div key={`ex-${i}`} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setExistingImages((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                    </div>
                  ))}
                  {images.map((file, i) => (
                    <div key={`new-${i}`} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #f59e0b' }}>
                      <img src={URL.createObjectURL(file)} alt={`new-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="adm-upload"><Upload size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{existingImages.length > 0 || images.length > 0 ? 'Add more' : 'Upload'}</p><input type="file" multiple accept="image/*" onChange={(e) => setImages((prev) => [...prev, ...e.target.files])} className="hidden" /></label>
            </div>
          </div>
        </AdminDrawer>

        <AdminTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { label: 'Packages', icon: Map },
            { label: 'Bookings & Payments', icon: CreditCard, badge: pendingBookingsCount },
          ]}
        />

        {/* ══════════════ PACKAGES TAB ══════════════ */}
        {activeTab === 0 && (
          <>
            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search packages..." /></div>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="adm-filter-select"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
              <div style={{ flex: 1 }} />
              {!showForm && <button onClick={openCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> Add Package</button>}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
            ) : filtered.length === 0 ? (
              <div className="adm-table-wrap"><div className="text-center py-16"><Map className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No packages found</p></div></div>
            ) : (
              <>
                <div className="adm-table-wrap">
                  <div className="overflow-x-auto">
                    <table>
                      <thead><tr><th>Name</th><th>Duration</th><th>Base Price</th><th>Locations</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                      <tbody>
                        {paginated.map((pkg) => (
                          <tr key={pkg._id}>
                            <td><div className="flex items-center gap-3">{pkg.images?.[0] ? <img src={pkg.images[0]} alt={pkg.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-amber-50"><Map size={18} className="text-amber-400" /></div>}<span className="text-sm font-semibold text-gray-900">{pkg.name}</span></div></td>
                            <td className="text-sm text-gray-500">{pkg.duration} days</td>
                            <td className="text-sm font-bold text-gray-900">{formatLKR(pkg.basePrice)}</td>
                            <td className="text-sm text-gray-500">{(pkg.locations || []).length}</td>
                            <td><span className={`adm-badge ${pkg.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>{pkg.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(pkg)} className="adm-btn-edit"><Pencil size={14} /> Edit</button><button onClick={() => handleDelete(pkg._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">Showing {(page-1)*perPage+1}&ndash;{Math.min(page*perPage, filtered.length)} of {filtered.length}</p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1} className="adm-btn-edit" style={{ opacity: page===1 ? 0.4 : 1 }}><ChevronLeft size={16} /> Prev</button>
                      {[...Array(totalPages)].map((_, i) => <button key={i} onClick={() => setPage(i+1)} className={`adm-page-btn ${page===i+1?'active':''}`}>{i+1}</button>)}
                      <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages} className="adm-btn-edit" style={{ opacity: page===totalPages ? 0.4 : 1 }}>Next <ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════ BOOKINGS & PAYMENTS TAB ══════════════ */}
        {activeTab === 1 && (
          <>
            {/* Summary Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Bookings', value: bookings.length, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                { label: 'Pending', value: pendingBookingsCount, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
                { label: 'Confirmed', value: confirmedCount, color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
                { label: 'Rejected', value: rejectedCount, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Map size={20} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {statusTabs.map(tab => (
                <button key={tab.key} onClick={() => { setBookingStatusFilter(tab.key); setBookingPage(1); }}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                    background: bookingStatusFilter === tab.key ? '#f59e0b' : '#f3f4f6',
                    color: bookingStatusFilter === tab.key ? '#fff' : '#6b7280',
                  }}>
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={bookingSearch} onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(1); }} placeholder="Search by traveler or package name..." /></div>
            </div>

            {/* Table */}
            {bookingsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ height: 56, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }} className="animate-pulse" />)}</div>
            ) : filteredBookings.length === 0 ? (
              <div className="adm-table-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Map size={48} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>No bookings found</p>
              </div>
            ) : (
              <>
                <div className="adm-table-wrap">
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Traveler</th><th>Package</th><th>Vehicle</th><th>Travelers</th><th>Start Date</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBookings.map((b) => (
                          <tr key={b._id}>
                            <td>
                              <div><p className="text-sm font-semibold text-gray-900">{b.userId?.name || 'Unknown'}</p><p className="text-xs text-gray-400">{b.userId?.email || ''}</p></div>
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                {b.packageId?.images?.[0] ? <img src={b.packageId.images[0]} alt={b.packageId.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-amber-50"><Map size={18} className="text-amber-400" /></div>}
                                <span className="text-sm font-semibold text-gray-900">{b.packageId?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="text-sm text-gray-500 capitalize">{b.vehicle}</td>
                            <td className="text-sm text-gray-500">{b.travelers}</td>
                            <td className="text-sm text-gray-500">{fmtDate(b.startDate)}</td>
                            <td className="text-sm font-bold text-gray-900">{fmtCurrency(b.totalPrice)}</td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                background: { pending: '#fef3c7', confirmed: '#d1fae5', rejected: '#fee2e2', cancelled: '#f3f4f6' }[b.status] || '#f3f4f6',
                                color: { pending: '#92400e', confirmed: '#065f46', rejected: '#991b1b', cancelled: '#4b5563' }[b.status] || '#4b5563',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: { pending: '#f59e0b', confirmed: '#10b981', rejected: '#ef4444', cancelled: '#9ca3af' }[b.status] }} />
                                {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                {b.slipUrl && <button onClick={() => setSlipModal(b.slipUrl)} className="adm-btn-edit"><Eye size={14} /> Slip</button>}
                                {b.status === 'pending' && (
                                  <>
                                    <button onClick={() => updateBookingStatus(b._id, 'confirmed')} className="adm-btn-edit" style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}><CheckCircle size={14} /> Approve</button>
                                    <button onClick={() => updateBookingStatus(b._id, 'rejected')} className="adm-btn-delete"><XCircle size={14} /> Reject</button>
                                  </>
                                )}
                                {b.status === 'confirmed' && <button onClick={() => updateBookingStatus(b._id, 'cancelled')} className="adm-btn-edit" style={{ color: '#6b7280', borderColor: '#d1d5db' }}><Ban size={14} /> Cancel</button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {bookingTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">Showing {(bookingPage-1)*bookingPerPage+1}&ndash;{Math.min(bookingPage*bookingPerPage, filteredBookings.length)} of {filteredBookings.length}</p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setBookingPage((p) => Math.max(1, p-1))} disabled={bookingPage===1} className="adm-btn-edit" style={{ opacity: bookingPage===1 ? 0.4 : 1 }}><ChevronLeft size={16} /> Prev</button>
                      {[...Array(bookingTotalPages)].map((_, i) => <button key={i} onClick={() => setBookingPage(i+1)} className={`adm-page-btn ${bookingPage===i+1?'active':''}`}>{i+1}</button>)}
                      <button onClick={() => setBookingPage((p) => Math.min(bookingTotalPages, p+1))} disabled={bookingPage===bookingTotalPages} className="adm-btn-edit" style={{ opacity: bookingPage===bookingTotalPages ? 0.4 : 1 }}>Next <ChevronRight size={16} /></button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Slip Preview Modal */}
            {slipModal && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSlipModal(null)}>
                <div style={{ background: '#fff', borderRadius: 16, padding: 8, maxWidth: '90vw', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px 12px' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Payment Slip</span>
                    <button onClick={() => setSlipModal(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#6b7280' }}>&times;</button>
                  </div>
                  <img src={slipModal} alt="Payment slip" style={{ maxWidth: '80vw', maxHeight: '75vh', borderRadius: 12, objectFit: 'contain' }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
