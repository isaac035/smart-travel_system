import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, Hotel, Star, Upload, Search, Eye, CheckCircle, XCircle, Ban, Calendar, CreditCard, X, Building2, ChevronDown, Save, Edit3 } from 'lucide-react';
import AdminTabs from '../../components/AdminTabs';
import { formatLKR } from '../../utils/currency';

const EMPTY = { name:'', description:'', location:'', district:'', province:'', stars:3, pricePerNight:'', amenities:'', lat:'', lng:'' };

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtCurrency = (v) => formatLKR(v);

export default function AdminHotelsPage() {
  /* ─── shared state ─── */
  const [activeTab, setActiveTab] = useState(0);

  /* ─── hotels state (existing) ─── */
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  /* ─── bookings state (new) ─── */
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);
  const bookingsPerPage = 8;
  const [slipModal, setSlipModal] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  /* ─── owner hotels tab state ─── */
  const [allOwnerHotels, setAllOwnerHotels] = useState([]); // full unfiltered list
  const [ownerHotelsLoading, setOwnerHotelsLoading] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerDistrict, setOwnerDistrict] = useState('');
  const [ownerStatusFilter, setOwnerStatusFilter] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState(null); // detail modal
  const [detailTab, setDetailTab] = useState('info'); // 'info' | 'rooms'
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingApproval, setSavingApproval] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [approvalDraft, setApprovalDraft] = useState('');

  // Compute filtered owner hotels client-side
  const ownerHotels = allOwnerHotels.filter(h => {
    const matchStatus = ownerStatusFilter === 'all' || h.approvalStatus === ownerStatusFilter;
    const q = ownerSearch.toLowerCase().trim();
    const matchSearch = !q || (h.name || '').toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q);
    const matchDistrict = !ownerDistrict.trim() || (h.location || '').toLowerCase().includes(ownerDistrict.toLowerCase().trim());
    return matchStatus && matchSearch && matchDistrict;
  });

  /* ─── fetch data on mount ─── */
  useEffect(() => {
    api.get('/hotels').then((r) => { setHotels(r.data); setLoading(false); }).catch(() => setLoading(false));
    api.get('/admin/hotel-bookings').then((r) => { setBookings(r.data); setBookingsLoading(false); }).catch(() => setBookingsLoading(false));
    // Fetch all owner hotels on mount for badge count
    api.get('/admin/owner-hotels').then((r) => setAllOwnerHotels(r.data)).catch(() => {});
  }, []);

  /* ─── fetch owner hotels (full list, no server-side filter) ─── */
  const fetchOwnerHotels = async () => {
    setOwnerHotelsLoading(true);
    try {
      const { data } = await api.get('/admin/owner-hotels');
      setAllOwnerHotels(data);
    } catch { toast.error('Failed to load owner hotels'); }
    finally { setOwnerHotelsLoading(false); }
  };

  // Refetch full list when tab becomes active
  useEffect(() => { if (activeTab === 2) fetchOwnerHotels(); }, [activeTab]);

  const openHotelDetail = (h) => {
    setSelectedHotel(h);
    setApprovalDraft(h.approvalStatus || 'pending_approval');
    setEditMode(false);
    setEditForm({});
    setDetailTab('info');
  };

  const handleApprovalSave = async () => {
    setSavingApproval(true);
    try {
      const { data } = await api.put(`/admin/owner-hotels/${selectedHotel._id}/approval`, { approvalStatus: approvalDraft });
      setSelectedHotel(data);
      setAllOwnerHotels(prev => prev.map(h => h._id === data._id ? data : h));
      toast.success('Approval status updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingApproval(false); }
  };

  const handleDetailsSave = async () => {
    setSavingDetails(true);
    try {
      const payload = { ...editForm };
      if (typeof payload.amenities === 'string') payload.amenities = payload.amenities.split(',').map(s => s.trim()).filter(Boolean);
      const { data } = await api.put(`/admin/owner-hotels/${selectedHotel._id}`, payload);
      setSelectedHotel(data);
      setAllOwnerHotels(prev => prev.map(h => h._id === data._id ? data : h));
      setEditMode(false);
      toast.success('Hotel details updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingDetails(false); }
  };

  const startEdit = () => {
    setEditForm({
      name: selectedHotel.name || '',
      description: selectedHotel.description || '',
      location: selectedHotel.location || '',
      address: selectedHotel.address || '',
      phone: selectedHotel.phone || '',
      email: selectedHotel.email || '',
      website: selectedHotel.website || '',
      starRating: selectedHotel.starRating || 3,
      pricePerNight: selectedHotel.pricePerNight || '',
      amenities: (selectedHotel.amenities || []).join(', '),
      checkInTime: selectedHotel.checkInTime || '14:00',
      checkOutTime: selectedHotel.checkOutTime || '12:00',
      policies: selectedHotel.policies || '',
      dining: selectedHotel.dining || '',
    });
    setEditMode(true);
  };

  // pending count is computed inline in the AdminTabs badge prop

  /* ─── hotels handlers (existing) ─── */
  const openCreate = () => { setForm(EMPTY); setImages([]); setExistingImages([]); setEditId(null); setShowForm(true); };
  const openEdit = (h) => {
    setForm({ name: h.name, description: h.description || '', location: h.location || '', district: h.district || '', province: h.province || '', stars: h.stars || 3, pricePerNight: h.pricePerNight || '', amenities: (h.amenities || []).join(', '), lat: h.coordinates?.lat || '', lng: h.coordinates?.lng || '' });
    setExistingImages(h.images || []); setImages([]); setEditId(h._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      const payload = { name: form.name, description: form.description, location: form.location, district: form.district, province: form.province, stars: Number(form.stars), pricePerNight: Number(form.pricePerNight), amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean), coordinates: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) } };
      if (editId) payload.existingImages = existingImages;
      fd.append('data', JSON.stringify(payload));
      images.forEach((f) => fd.append('images', f));
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editId) { const r = await api.put(`/hotels/${editId}`, fd, { headers }); setHotels((p) => p.map((h) => h._id === editId ? r.data : h)); toast.success('Hotel updated'); }
      else { const r = await api.post('/hotels', fd, { headers }); setHotels((p) => [r.data, ...p]); toast.success('Hotel created'); }
      closeForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hotel?')) return;
    try { await api.delete(`/hotels/${id}`); setHotels((p) => p.filter((h) => h._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const filtered = hotels.filter(h => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) || (h.location || '').toLowerCase().includes(search.toLowerCase());
    return (starFilter === 'all' || h.stars === Number(starFilter)) && matchSearch;
  });
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  /* ─── bookings handlers (new) ─── */
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const rejectedCount = bookings.filter(b => b.status === 'rejected').length;

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await api.put(`/admin/payments/hotel/${bookingId}/status`, { status: newStatus });
      setBookings((prev) => prev.map((b) => b._id === bookingId ? { ...b, status: newStatus } : b));
      toast.success(`Booking ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const guestName = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
    const hotelName = (b.hotelId?.name || '').toLowerCase();
    const q = bookingSearch.toLowerCase();
    const matchSearch = !q || guestName.includes(q) || hotelName.includes(q);
    return matchStatus && matchSearch;
  });
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * bookingsPerPage, bookingPage * bookingsPerPage);
  const totalBookingPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const statusTabs = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'pending', label: 'Pending', count: pendingBookingsCount },
    { key: 'confirmed', label: 'Confirmed', count: confirmedCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: 0, overflow: 'hidden' }}>
        {/* ─── Drawer (hotels form) ─── */}
        <AdminDrawer open={showForm} onClose={closeForm} title={editId ? 'Edit Hotel' : 'Add New Hotel'} saving={saving} onSubmit={handleSave} submitLabel={editId ? 'Update Hotel' : 'Create Hotel'}>
          <div className="field-row cols-4">
            <div className="field"><label>Hotel Name *</label><input required value={form.name} onChange={f('name')} placeholder="Enter hotel name" className="adm-input" /></div>
            <div className="field"><label>City / Location</label><input value={form.location} onChange={f('location')} placeholder="e.g. Colombo" className="adm-input" /></div>
            <div className="field"><label>District</label><input value={form.district} onChange={f('district')} placeholder="e.g. Colombo" className="adm-input" /></div>
            <div className="field"><label>Province</label><input value={form.province} onChange={f('province')} placeholder="e.g. Western" className="adm-input" /></div>
          </div>
          <div className="field-row cols-4">
            <div className="field"><label>Stars</label><select value={form.stars} onChange={f('stars')} className="adm-select">{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}</select></div>
              <div className="field"><label>Price/Night (LKR)</label><input type="number" value={form.pricePerNight} onChange={f('pricePerNight')} placeholder="150" className="adm-input" /></div>
            <div className="field"><label>Latitude</label><input type="number" step="any" value={form.lat} onChange={f('lat')} placeholder="6.9271" className="adm-input" /></div>
            <div className="field"><label>Longitude</label><input type="number" step="any" value={form.lng} onChange={f('lng')} placeholder="79.8612" className="adm-input" /></div>
          </div>
          <div className="field"><label>Amenities (comma-separated)</label><input value={form.amenities} onChange={f('amenities')} placeholder="Pool, WiFi, Spa, Restaurant, Gym, Parking..." className="adm-input" /></div>
          <div style={{ height: 16 }} />
          <div className="field-row cols-2">
            <div className="field"><label>Description</label><textarea value={form.description} onChange={f('description')} rows={4} placeholder="Describe this hotel..." className="adm-textarea" /></div>
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
            { label: 'Hotels', icon: Hotel },
            { label: 'Bookings & Payments', icon: CreditCard, badge: pendingBookingsCount },
            { label: 'Owner Submitted', icon: Building2, badge: allOwnerHotels.filter(h => h.approvalStatus === 'pending_approval').length || 0 },
          ]}
        />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 0 — Hotels (existing code, unchanged)                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <>
            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search hotels..." /></div>
              <select value={starFilter} onChange={e => { setStarFilter(e.target.value); setPage(1); }} className="adm-filter-select"><option value="all">All Stars</option>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}</select>
              <div style={{ flex: 1 }} />
              {!showForm && <button onClick={openCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> Add Hotel</button>}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
            ) : filtered.length === 0 ? (
              <div className="adm-table-wrap"><div className="text-center py-16"><Hotel className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No hotels found</p></div></div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Name</th><th>Location</th><th>Stars</th><th>Price/Night</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {paginated.map((h) => (
                        <tr key={h._id}>
                          <td><div className="flex items-center gap-3">{h.images?.[0] ? <img src={h.images[0]} alt={h.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-violet-50"><Hotel size={18} className="text-violet-600" /></div>}<span className="text-sm font-semibold text-gray-900">{h.name}</span></div></td>
                          <td className="text-sm text-gray-500">{h.location}</td>
                          <td><div className="flex items-center gap-0.5">{[...Array(h.stars || 0)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</div></td>
                          <td><span className="adm-badge adm-badge-active">{formatLKR(h.pricePerNight)}</span></td>
                          <td><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(h)} className="adm-btn-edit"><Pencil size={14} /> Edit</button><button onClick={() => handleDelete(h._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <span className="text-sm text-gray-500">Showing {(page-1)*perPage+1}&ndash;{Math.min(page*perPage, filtered.length)} of {filtered.length}</span>
                    <div className="flex gap-1.5">{Array.from({ length: totalPages }, (_, i) => <button key={i+1} onClick={() => setPage(i+1)} className={`adm-page-btn ${page === i+1 ? 'active' : ''}`}>{i+1}</button>)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 1 — Bookings & Payments (new)                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
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
                    <Hotel size={20} style={{ color: s.color }} />
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
              {statusTabs.map(st => (
                <button key={st.key} onClick={() => { setStatusFilter(st.key); setBookingPage(1); }}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                    background: statusFilter === st.key ? '#f59e0b' : '#f3f4f6',
                    color: statusFilter === st.key ? '#fff' : '#6b7280',
                  }}>
                  {st.label} ({st.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={bookingSearch} onChange={e => { setBookingSearch(e.target.value); setBookingPage(1); }} placeholder="Search by guest or hotel name..." /></div>
            </div>

            {/* Table */}
            {bookingsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ height: 56, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }} className="animate-pulse" />)}</div>
            ) : filteredBookings.length === 0 ? (
              <div className="adm-table-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Calendar size={48} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>No bookings found</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Guest</th><th>Hotel</th><th>Room Type</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {paginatedBookings.map((b) => {
                        const guestName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'N/A';
                        const isUpdating = updatingId === b._id;
                        return (
                          <tr key={b._id}>
                            <td><div><span className="text-sm font-semibold text-gray-900" style={{ display: 'block' }}>{guestName}</span><span className="text-xs text-gray-400">{b.email}</span></div></td>
                            <td>
                              <div className="flex items-center gap-3">
                                {b.hotelId?.images?.[0] ? <img src={b.hotelId.images[0]} alt={b.hotelId?.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-violet-50"><Hotel size={18} className="text-violet-600" /></div>}
                                <span className="text-sm text-gray-700">{b.hotelId?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="text-sm text-gray-600 capitalize">{b.roomType || '-'}</td>
                            <td className="text-sm text-gray-600">{b.checkIn ? fmtDate(b.checkIn) : '-'}</td>
                            <td className="text-sm text-gray-600">{b.checkOut ? fmtDate(b.checkOut) : '-'}</td>
                            <td className="text-sm text-gray-600" style={{ textAlign: 'center' }}>{b.nights || '-'}</td>
                            <td className="text-sm font-bold text-gray-900">{fmtCurrency(b.totalPrice)}</td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                background: { pending: '#fef3c7', confirmed: '#d1fae5', rejected: '#fee2e2', cancelled: '#f3f4f6' }[b.status] || '#f3f4f6',
                                color: { pending: '#92400e', confirmed: '#065f46', rejected: '#991b1b', cancelled: '#4b5563' }[b.status] || '#4b5563',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: { pending: '#f59e0b', confirmed: '#10b981', rejected: '#ef4444', cancelled: '#9ca3af' }[b.status] }} />
                                {b.status?.charAt(0).toUpperCase() + b.status?.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-1.5">
                                {b.paymentSlip && <button onClick={() => setSlipModal(b.paymentSlip)} className="adm-btn-edit"><Eye size={14} /> Slip</button>}
                                {b.status === 'pending' && (
                                  <>
                                    <button onClick={() => handleStatusUpdate(b._id, 'confirmed')} disabled={isUpdating} className="adm-btn-edit" style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}><CheckCircle size={14} /> Approve</button>
                                    <button onClick={() => handleStatusUpdate(b._id, 'rejected')} disabled={isUpdating} className="adm-btn-delete"><XCircle size={14} /> Reject</button>
                                  </>
                                )}
                                {(b.status === 'pending' || b.status === 'confirmed') && <button onClick={() => handleStatusUpdate(b._id, 'cancelled')} disabled={isUpdating} className="adm-btn-edit" style={{ color: '#6b7280', borderColor: '#d1d5db' }}><Ban size={14} /> Cancel</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalBookingPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <span className="text-sm text-gray-500">Showing {(bookingPage-1)*bookingsPerPage+1}&ndash;{Math.min(bookingPage*bookingsPerPage, filteredBookings.length)} of {filteredBookings.length}</span>
                    <div className="flex gap-1.5">{Array.from({ length: totalBookingPages }, (_, i) => <button key={i+1} onClick={() => setBookingPage(i+1)} className={`adm-page-btn ${bookingPage === i+1 ? 'active' : ''}`}>{i+1}</button>)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB 2 — Owner Submitted Hotels                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <>
            {/* Filters */}
            <div className="adm-toolbar mb-6" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="adm-search-box" style={{ flex: '1 1 200px' }}>
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} placeholder="Search hotel name or district..." />
              </div>
              <input value={ownerDistrict} onChange={e => setOwnerDistrict(e.target.value)}
                placeholder="Filter by district..."
                className="adm-input" style={{ flex: '0 1 180px', padding: '7px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13 }} />
              <select value={ownerStatusFilter} onChange={e => { setOwnerStatusFilter(e.target.value); setBookingPage(1); }} className="adm-filter-select">
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="hold">On Hold</option>
              </select>
            </div>

            {/* Status pill badges summary */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {[
                ['all', 'All', allOwnerHotels.length, '#6366f1', '#eef2ff'],
                ['pending_approval', 'Pending', allOwnerHotels.filter(h => h.approvalStatus === 'pending_approval').length, '#d97706', '#fffbeb'],
                ['approved', 'Approved', allOwnerHotels.filter(h => h.approvalStatus === 'approved').length, '#059669', '#ecfdf5'],
                ['hold', 'On Hold', allOwnerHotels.filter(h => h.approvalStatus === 'hold').length, '#dc2626', '#fef2f2']
              ].map(([k, lbl, cnt, clr, bg]) => (
                <button 
                  key={k} 
                  onClick={() => setOwnerStatusFilter(k)}
                  style={{ 
                    padding: '8px 18px', 
                    borderRadius: 24, 
                    fontSize: 13, 
                    fontWeight: 700, 
                    border: ownerStatusFilter === k ? `2px solid ${clr}` : '2px solid transparent',
                    cursor: 'pointer',
                    background: ownerStatusFilter === k ? clr : bg, 
                    color: ownerStatusFilter === k ? '#fff' : clr, 
                    transition: 'all .2s',
                    boxShadow: ownerStatusFilter === k ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    transform: ownerStatusFilter === k ? 'scale(1.05)' : 'scale(1)',
                  }}>
                  {lbl} ({cnt})
                </button>
              ))}
            </div>

            {/* Hotel list */}
            {ownerHotelsLoading ? (
              <div className="flex flex-col gap-3">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
            ) : ownerHotels.length === 0 ? (
              <div className="adm-table-wrap"><div className="text-center py-16"><Building2 className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No owner-submitted hotels found</p></div></div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr>
                      <th>Hotel</th><th>Owner</th><th>District</th><th>Submitted</th><th>Status</th><th className="text-right">Actions</th>
                    </tr></thead>
                    <tbody>
                      {ownerHotels.map(h => {
                        const statusMap = { pending_approval: { bg:'#fef3c7', color:'#92400e', label:'Pending Approval' }, approved: { bg:'#d1fae5', color:'#065f46', label:'Approved' }, hold: { bg:'#fee2e2', color:'#991b1b', label:'On Hold' } };
                        const st = statusMap[h.approvalStatus] || { bg:'#f3f4f6', color:'#6b7280', label: h.approvalStatus || '—' };
                        return (
                          <tr key={h._id}>
                            <td>
                              <div className="flex items-center gap-3">
                                {h.images?.[0] ? <img src={h.images[0]} alt={h.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-violet-50"><Hotel size={18} className="text-violet-600" /></div>}
                                <div><span className="text-sm font-semibold text-gray-900 block">{h.name}</span><span className="text-xs text-gray-400">{(h.starRating || 3)} ★</span></div>
                              </div>
                            </td>
                            <td><div><span className="text-sm font-semibold text-gray-800 block">{h.hotelOwnerId?.name || '—'}</span><span className="text-xs text-gray-400">{h.hotelOwnerId?.email || ''}</span></div></td>
                            <td className="text-sm text-gray-500">{h.location || '—'}</td>
                            <td className="text-sm text-gray-500">{h.publishedAt ? fmtDate(h.publishedAt) : fmtDate(h.createdAt)}</td>
                            <td><span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, background:st.bg, color:st.color }}>
                              <span style={{ width:6, height:6, borderRadius:'50%', background:st.color }} />{st.label}
                            </span></td>
                            <td><div className="flex items-center justify-end"><button onClick={() => openHotelDetail(h)} className="adm-btn-edit"><Eye size={14} /> View Details</button></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Hotel Detail Modal ── */}
            {selectedHotel && (
              <div style={{ position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}
                onClick={e => { if (e.target === e.currentTarget) { setSelectedHotel(null); setEditMode(false); } }}>
                <div style={{ width:'100%', maxWidth:760, height:'100vh', overflowY:'auto', background:'#fff', boxShadow:'-8px 0 40px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column' }}>
                  {/* Header */}
                  <div style={{ padding:'20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'sticky', top:0, background:'#fff', zIndex:10 }}>
                    <div>
                      <h2 style={{ fontSize:18, fontWeight:800, color:'#111827', margin:0 }}>{selectedHotel.name}</h2>
                      <p style={{ fontSize:12, color:'#6b7280', margin:'3px 0 0' }}>{selectedHotel.location} · Owner: {selectedHotel.hotelOwnerId?.name}</p>
                    </div>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      {!editMode && <button onClick={startEdit} className="adm-btn-edit"><Edit3 size={14} /> Edit</button>}
                      <button onClick={() => { setSelectedHotel(null); setEditMode(false); }} style={{ background:'#f3f4f6', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}><X size={16} /></button>
                    </div>
                  </div>

                  {/* Approval Status Control */}
                  <div style={{ padding:'16px 24px', background:'#f8fafc', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>Approval Status:</span>
                    <select value={approvalDraft} onChange={e => setApprovalDraft(e.target.value)}
                      style={{ padding:'7px 12px', borderRadius:8, border:'1.5px solid #d1d5db', fontSize:13, fontWeight:600, color:'#374151', background:'#fff', outline:'none', cursor:'pointer' }}>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="hold">On Hold</option>
                    </select>
                    <button onClick={handleApprovalSave} disabled={savingApproval} className="adm-btn-edit" style={{ background:'#6366f1', color:'#fff', borderColor:'#6366f1' }}>
                      <Save size={13} /> {savingApproval ? 'Saving…' : 'Save Status'}
                    </button>
                  </div>

                  {/* Tab switcher */}
                  <div style={{ display:'flex', borderBottom:'1px solid #f3f4f6', padding:'0 24px' }}>
                    {[['info','Hotel Info'],['rooms','Rooms (' + (selectedHotel.rooms?.length || 0) + ')']].map(([k,lbl]) => (
                      <button key={k} onClick={() => setDetailTab(k)}
                        style={{ padding:'12px 18px', fontSize:13, fontWeight:700, border:'none', background:'transparent', cursor:'pointer', color: detailTab===k ? '#6366f1' : '#9ca3af', borderBottom: detailTab===k ? '2px solid #6366f1' : '2px solid transparent', marginBottom:-1, transition:'all .15s' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>

                  {/* Content */}
                  <div style={{ padding:'24px', flex:1 }}>
                    {detailTab === 'info' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                        {/* Images */}
                        {selectedHotel.images?.length > 0 && (
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            {selectedHotel.images.map((img,i) => <img key={i} src={img} alt={`img-${i}`} style={{ width:120, height:80, objectFit:'cover', borderRadius:10, border:'1px solid #e5e7eb' }} />)}
                          </div>
                        )}
                        {editMode ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                            {[['name','Hotel Name'],['location','City / Location'],['address','Address'],['phone','Phone'],['email','Email'],['website','Website'],['checkInTime','Check-in Time'],['checkOutTime','Check-out Time']].map(([k,lbl]) => (
                              <div key={k}>
                                <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{lbl}</label>
                                <input value={editForm[k] || ''} onChange={e => setEditForm(p=>({...p,[k]:e.target.value}))}
                                  className="adm-input" style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, width:'100%', fontSize:13 }} />
                              </div>
                            ))}
                            <div>
                              <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Star Rating</label>
                              <select value={editForm.starRating || 3} onChange={e => setEditForm(p=>({...p,starRating:Number(e.target.value)}))}
                                style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, width:'100%', fontSize:13, background:'#fff' }}>
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Price / Night (LKR)</label>
                              <input type="number" value={editForm.pricePerNight || ''} onChange={e => setEditForm(p=>({...p,pricePerNight:e.target.value}))}
                                className="adm-input" style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, width:'100%', fontSize:13 }} />
                            </div>
                            <div>
                              <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Amenities (comma-separated)</label>
                              <input value={editForm.amenities || ''} onChange={e => setEditForm(p=>({...p,amenities:e.target.value}))}
                                className="adm-input" style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, width:'100%', fontSize:13 }} />
                            </div>
                            <div>
                              <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Description</label>
                              <textarea value={editForm.description || ''} onChange={e => setEditForm(p=>({...p,description:e.target.value}))}
                                rows={4} style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, width:'100%', fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
                            </div>
                            <div>
                              <label style={{ fontSize:11, fontWeight:700, color:'#6b7280', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Policies</label>
                              <textarea value={editForm.policies || ''} onChange={e => setEditForm(p=>({...p,policies:e.target.value}))}
                                rows={3} style={{ padding:'9px 12px', border:'1.5px solid #e5e7eb', borderRadius:8, width:'100%', fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
                            </div>
                            <div style={{ display:'flex', gap:10, paddingTop:8 }}>
                              <button onClick={handleDetailsSave} disabled={savingDetails}
                                style={{ background:'#6366f1', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                                <Save size={14} /> {savingDetails ? 'Saving…' : 'Save Changes'}
                              </button>
                              <button onClick={() => setEditMode(false)}
                                style={{ background:'#f3f4f6', color:'#374151', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                            {[['Name',selectedHotel.name],['Location',selectedHotel.location],['Address',selectedHotel.address],['Phone',selectedHotel.phone],['Email',selectedHotel.email],['Website',selectedHotel.website],['Stars',(selectedHotel.starRating||3)+' ★'],['Price/Night','LKR '+Number(selectedHotel.pricePerNight||0).toLocaleString()],['Check-in',selectedHotel.checkInTime],['Check-out',selectedHotel.checkOutTime],['Dining',selectedHotel.dining]].map(([lbl,val]) => val ? (
                              <div key={lbl} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                                <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>{lbl}</p>
                                <p style={{ fontSize:13, fontWeight:600, color:'#111827', margin:0 }}>{val}</p>
                              </div>
                            ) : null)}
                            {selectedHotel.amenities?.length > 0 && (
                              <div style={{ gridColumn:'1/-1', background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                                <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 8px' }}>Amenities</p>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                  {selectedHotel.amenities.map(a => <span key={a} style={{ padding:'4px 11px', borderRadius:99, background:'#e0e7ff', color:'#4338ca', fontSize:12, fontWeight:600 }}>{a}</span>)}
                                </div>
                              </div>
                            )}
                            {selectedHotel.description && (
                              <div style={{ gridColumn:'1/-1', background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                                <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>Description</p>
                                <p style={{ fontSize:13, color:'#374151', margin:0, lineHeight:1.6 }}>{selectedHotel.description}</p>
                              </div>
                            )}
                            {selectedHotel.policies && (
                              <div style={{ gridColumn:'1/-1', background:'#f8fafc', borderRadius:10, padding:'12px 14px', border:'1px solid #e5e7eb' }}>
                                <p style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>Policies</p>
                                <p style={{ fontSize:13, color:'#374151', margin:0, lineHeight:1.6 }}>{selectedHotel.policies}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {detailTab === 'rooms' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                        {!selectedHotel.rooms?.length ? (
                          <p style={{ color:'#9ca3af', textAlign:'center', padding:'40px 0' }}>No rooms defined.</p>
                        ) : selectedHotel.rooms.map((room, ri) => (
                          <div key={ri} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'18px 20px', background:'#fafafa' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                              <div>
                                <p style={{ fontSize:15, fontWeight:800, color:'#111827', margin:'0 0 3px' }}>{room.type || `Room ${ri+1}`}</p>
                                <p style={{ fontSize:12, color:'#6b7280', margin:0 }}>{room.bedType} · {room.bedCount} bed(s) · Capacity: {room.capacity}</p>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <p style={{ fontSize:15, fontWeight:800, color:'#6366f1', margin:0 }}>LKR {Number(room.pricePerNight||0).toLocaleString()}</p>
                                <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>per night · {room.count} unit(s)</p>
                                {room.roomSize && <p style={{ fontSize:11, color:'#9ca3af', margin:'2px 0 0' }}>{room.roomSize} m²</p>}
                              </div>
                            </div>
                            {room.hasHotDeal && (
                              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:99, background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700, marginBottom:10 }}>
                                🔥 Hot Deal — {room.discountPercentage ? room.discountPercentage+'% off' : 'LKR '+Number(room.discountValue||0).toLocaleString()+' off'}
                              </div>
                            )}
                            {room.amenities?.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                {room.amenities.map(a => <span key={a} style={{ padding:'3px 10px', borderRadius:99, background:'#e0e7ff', color:'#4338ca', fontSize:11, fontWeight:600 }}>{a}</span>)}
                              </div>
                            )}
                            {room.images?.length > 0 && (
                              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
                                {room.images.map((img,i) => <img key={i} src={img} alt={`room-${ri}-img-${i}`} style={{ width:100, height:68, objectFit:'cover', borderRadius:8, border:'1px solid #e5e7eb' }} />)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
      </div>
    </AdminLayout>
  );
}
