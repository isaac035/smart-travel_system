import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, Compass, Upload, Search, ClipboardList, CheckCircle, XCircle, Calendar, MapPin, Users, DollarSign, Clock, Eye, ShieldCheck, RefreshCw, ArrowRight, AlertTriangle, Ban, FileText, X, UserCheck, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import AdminTabs from '../../components/AdminTabs';
import { formatLKR } from '../../utils/currency';

const EMPTY = { name: '', bio: '', email: '', phone: '', languages: '', pricePerDay: '', services: '', location: '', isAvailable: true };

const STATUS_LABELS = {
  deposit_submitted: 'Deposit Submitted',
  pending_guide_review: 'Pending Guide Review',
  guide_accepted: 'Guide Accepted',
  guide_rejected: 'Guide Rejected',
  under_admin_review: 'Under Admin Review',
  admin_confirmed: 'Admin Confirmed',
  remaining_payment_pending: 'Remaining Payment Pending',
  remaining_payment_submitted: 'Remaining Submitted',
  fully_paid: 'Fully Paid',
  completed: 'Completed',
  cancelled_by_user: 'Cancelled by User',
  cancelled_by_admin: 'Cancelled by Admin',
  refund_pending: 'Refund Pending',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
  no_refund: 'No Refund',
  pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  deposit_submitted: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  pending_guide_review: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  guide_accepted: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  guide_rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  under_admin_review: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  admin_confirmed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  remaining_payment_pending: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  remaining_payment_submitted: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  fully_paid: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  completed: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  cancelled_by_user: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  cancelled_by_admin: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  refund_pending: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  partially_refunded: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
  refunded: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  no_refund: { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  pending: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  confirmed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const STATUS_ICONS = {
  deposit_submitted: Receipt,
  pending_guide_review: Clock,
  guide_accepted: UserCheck,
  guide_rejected: Ban,
  under_admin_review: Eye,
  admin_confirmed: ShieldCheck,
  remaining_payment_pending: Clock,
  remaining_payment_submitted: Receipt,
  fully_paid: CheckCircle,
  completed: CheckCircle,
  cancelled_by_user: XCircle,
  cancelled_by_admin: XCircle,
  refund_pending: RefreshCw,
  partially_refunded: RefreshCw,
  refunded: CheckCircle,
  no_refund: Ban,
};

export default function AdminGuidesPage() {
  const [tab, setTab] = useState(0);

  // === Guide Management State ===
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [existingAvatar, setExistingAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;


  // === Booking Management State ===
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [conflictData, setConflictData] = useState(null);
  const [reassignGuideId, setReassignGuideId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [guideRejectModal, setGuideRejectModal] = useState(null);
  const [guideRejectReason, setGuideRejectReason] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [slipPreview, setSlipPreview] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    api.get('/guides').then((r) => { setGuides(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 1 && bookings.length === 0) loadBookings();
  }, [tab]);

  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const { data } = await api.get('/guides/bookings/all');
      setBookings(data);
    } catch { toast.error('Failed to load bookings'); }
    finally { setBookingsLoading(false); }
  };

  // === Guide CRUD ===
  const openCreate = () => { setForm(EMPTY); setAvatar(null); setExistingAvatar(''); setEditId(null); setShowForm(true); };
  const openEdit = (g) => {
    setForm({ name: g.name, bio: g.bio || '', email: g.email || '', phone: g.phone || '', languages: (g.languages || []).join(', '), pricePerDay: g.pricePerDay || '', services: (g.services || []).join(', '), location: g.location || '', isAvailable: g.isAvailable ?? true });
    setExistingAvatar(g.image || ''); setAvatar(null); setEditId(g._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name); fd.append('bio', form.bio); fd.append('email', form.email);
      fd.append('phone', form.phone); fd.append('location', form.location);
      fd.append('pricePerDay', Number(form.pricePerDay)); fd.append('isAvailable', form.isAvailable);
      fd.append('languages', JSON.stringify(form.languages.split(',').map((s) => s.trim()).filter(Boolean)));
      fd.append('services', JSON.stringify(form.services.split(',').map((s) => s.trim()).filter(Boolean)));
      if (avatar) fd.append('image', avatar);
      else if (editId) fd.append('existingImage', existingAvatar);
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editId) { const r = await api.put(`/guides/${editId}`, fd, { headers }); setGuides((p) => p.map((g) => g._id === editId ? r.data : g)); toast.success('Guide updated'); }
      else { const r = await api.post('/guides', fd, { headers }); setGuides((p) => [r.data, ...p]); toast.success('Guide created'); }
      closeForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this guide?')) return;
    try { await api.delete(`/guides/${id}`); setGuides((p) => p.filter((g) => g._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  // === Guide Approval ===
  const approveGuide = async (id) => {
    try {
      const { data } = await api.put(`/guides/${id}/approve`);
      setGuides(p => p.map(g => g._id === id ? data.guide : g));
      toast.success('Guide approved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectGuideAction = async (id, reason) => {
    try {
      const { data } = await api.put(`/guides/${id}/reject`, { reason });
      setGuides(p => p.map(g => g._id === id ? data.guide : g));
      toast.success('Guide rejected');
      setGuideRejectModal(null);
      setGuideRejectReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // === Booking Admin Actions ===
  const verifyDeposit = async (id) => {
    try {
      await api.put(`/guides/bookings/${id}/verify-deposit`);
      toast.success('Deposit verified. Sent to guide for review.');
      loadBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const confirmBooking = async (id) => {
    try {
      await api.put(`/guides/bookings/${id}/admin-confirm`);
      toast.success('Booking confirmed. User notified to pay remaining balance.');
      setConflictData(null);
      loadBookings();
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictData({ bookingId: id, conflicts: err.response.data.conflicts, message: err.response.data.message });
        toast.error('Date conflict detected!');
      } else { toast.error(err.response?.data?.message || 'Failed'); }
    }
  };

  const rejectBooking = async (id, reason) => {
    try {
      await api.put(`/guides/bookings/${id}/admin-reject`, { reason });
      toast.success('Booking rejected. Deposit refund pending.');
      setRejectModal(null);
      setRejectReason('');
      setConflictData(null);
      loadBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const verifyRemaining = async (id) => {
    try {
      await api.put(`/guides/bookings/${id}/verify-remaining`);
      toast.success('Booking fully confirmed!');
      loadBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const processRefund = async (id, status) => {
    try {
      await api.put(`/guides/bookings/${id}/process-refund`, { refundStatus: status });
      toast.success('Refund processed.');
      loadBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reassignGuideAction = async (bookingId, newGuideId) => {
    if (!newGuideId) return toast.error('Select a guide');
    try {
      await api.put(`/guides/bookings/${bookingId}/reassign`, { newGuideId });
      toast.success('Guide reassigned.');
      setConflictData(null);
      setReassignGuideId('');
      loadBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Reassignment failed'); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const pendingCount = guides.filter(g => g.approvalStatus === 'pending').length;
  const filtered = guides.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.location || '').toLowerCase().includes(search.toLowerCase());
    if (availFilter === 'pending') return g.approvalStatus === 'pending' && matchSearch;
    if (availFilter === 'available') return g.isAvailable && matchSearch;
    if (availFilter === 'unavailable') return !g.isAvailable && matchSearch;
    return matchSearch;
  });
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const searchedBookings = bookings.filter(b => {
    if (!bookingSearch) return true;
    const q = bookingSearch.toLowerCase();
    return (b.travelerName || '').toLowerCase().includes(q)
      || (b.guideId?.name || '').toLowerCase().includes(q)
      || (b.location || '').toLowerCase().includes(q);
  });

  const filteredBookings = bookingFilter === 'all' ? searchedBookings
    : bookingFilter === 'action' ? searchedBookings.filter(b => ['deposit_submitted', 'guide_accepted', 'remaining_payment_submitted'].includes(b.status))
      : bookingFilter === 'active' ? searchedBookings.filter(b => ['pending_guide_review', 'under_admin_review', 'remaining_payment_pending', 'fully_paid'].includes(b.status))
        : searchedBookings.filter(b => ['completed', 'cancelled_by_user', 'cancelled_by_admin', 'guide_rejected', 'refunded', 'partially_refunded', 'no_refund'].includes(b.status));

  const actionCount = bookings.filter(b => ['deposit_submitted', 'guide_accepted', 'remaining_payment_submitted'].includes(b.status)).length;
  const activeCount = bookings.filter(b => ['pending_guide_review', 'under_admin_review', 'remaining_payment_pending', 'fully_paid'].includes(b.status)).length;
  const totalRevenue = bookings.filter(b => ['fully_paid', 'completed'].includes(b.status)).reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: 0, overflow: 'hidden' }}>

        <AdminTabs
          activeTab={tab}
          onChange={setTab}
          tabs={[
            { label: 'Guides', icon: Compass, badge: pendingCount },
            { label: 'Bookings', icon: ClipboardList, badge: actionCount },
          ]}
        />

        {/* =============== GUIDES TAB =============== */}
        {tab === 0 && (
          <>
            <AdminDrawer open={showForm} onClose={closeForm} title={editId ? 'Edit Guide' : 'Add New Guide'} saving={saving} onSubmit={handleSave} submitLabel={editId ? 'Update Guide' : 'Create Guide'}>
              <div className="field-row cols-4">
                <div className="field"><label>Guide Name *</label><input required value={form.name} onChange={f('name')} placeholder="Enter guide name" className="adm-input" /></div>
                <div className="field"><label>Email</label><input type="email" value={form.email} onChange={f('email')} placeholder="email@example.com" className="adm-input" /></div>
                <div className="field"><label>Phone</label><input value={form.phone} onChange={f('phone')} placeholder="+94 77 123 4567" className="adm-input" /></div>
                <div className="field"><label>Price/Day (LKR)</label><input type="number" value={form.pricePerDay} onChange={f('pricePerDay')} placeholder="5000" className="adm-input" /></div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label>Location *</label><input required value={form.location} onChange={f('location')} placeholder="e.g. Colombo" className="adm-input" /></div>
                <div className="field"><label>Languages (comma-separated)</label><input value={form.languages} onChange={f('languages')} placeholder="English, Sinhala, Tamil..." className="adm-input" /></div>
              </div>
              <div className="field"><label>Services (comma-separated)</label><input value={form.services} onChange={f('services')} placeholder="City Tours, Wildlife Safaris, Cultural Tours..." className="adm-input" /></div>
              <div style={{ height: 16 }} />
              <div className="field-row cols-2">
                <div className="field"><label>Bio</label><textarea value={form.bio} onChange={f('bio')} rows={4} placeholder="Tell us about this guide..." className="adm-textarea" /></div>
                <div>
                  <div className="field" style={{ marginBottom: 14 }}>
                    <label>Avatar Photo</label>
                    {(existingAvatar || avatar) && (
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {existingAvatar && !avatar && (
                          <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={existingAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setExistingAvatar('')} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                          </div>
                        )}
                        {avatar && (
                          <div style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #f59e0b' }}>
                            <img src={URL.createObjectURL(avatar)} alt="new-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setAvatar(null)} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                          </div>
                        )}
                      </div>
                    )}
                    <label className="adm-upload"><Upload size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{existingAvatar || avatar ? 'Replace' : 'Upload avatar'}</p><input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setAvatar(e.target.files[0]); setExistingAvatar(''); } }} className="hidden" /></label>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))} className={`adm-toggle ${form.isAvailable ? 'on' : 'off'}`}><span className="knob" /></button>
                    <span className="text-sm font-semibold text-gray-700">{form.isAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
                </div>
              </div>
            </AdminDrawer>

            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search guides..." /></div>
              <select value={availFilter} onChange={e => { setAvailFilter(e.target.value); setPage(1); }} className="adm-filter-select"><option value="all">All</option><option value="pending">Pending Approval</option><option value="available">Available</option><option value="unavailable">Unavailable</option></select>
              <div style={{ flex: 1 }} />
              {!showForm && <button onClick={openCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> Add Guide</button>}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
            ) : filtered.length === 0 ? (
              <div className="adm-table-wrap"><div className="text-center py-16"><Compass className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No guides found</p></div></div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Name</th><th>Languages</th><th>Price/Day</th><th>Rating</th><th>Approval</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {paginated.map((g) => (
                        <tr key={g._id}>
                          <td><div className="flex items-center gap-3">{g.image ? <img src={g.image} alt={g.name} className="adm-thumb" style={{ borderRadius: '50%' }} /> : <div className="adm-thumb-placeholder bg-amber-50" style={{ borderRadius: '50%' }}><Compass size={18} className="text-amber-600" /></div>}<span className="text-sm font-semibold text-gray-900">{g.name}</span></div></td>
                          <td><div className="flex flex-wrap gap-1">{(g.languages || []).map((lang) => <span key={lang} className="adm-badge adm-badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>{lang}</span>)}</div></td>
                          <td className="text-sm font-bold text-gray-900">{formatLKR(g.pricePerDay)}</td>
                          <td className="text-sm font-bold text-amber-500">{g.rating?.toFixed(1) || '--'}</td>
                          <td>
                            {g.approvalStatus === 'pending' ? (
                              <span className="adm-badge adm-badge-warning" style={{ fontSize: 10 }}>Pending</span>
                            ) : g.approvalStatus === 'rejected' ? (
                              <span className="adm-badge adm-badge-inactive" style={{ fontSize: 10 }}>Rejected</span>
                            ) : (
                              <span className="adm-badge adm-badge-active" style={{ fontSize: 10 }}>Approved</span>
                            )}
                          </td>
                          <td><span className={`adm-badge ${g.isAvailable ? 'adm-badge-active' : 'adm-badge-inactive'}`}>{g.isAvailable ? 'Available' : 'Busy'}</span></td>
                          <td><div className="flex items-center justify-end gap-2">
                            {g.approvalStatus === 'pending' && (
                              <>
                                <button onClick={() => approveGuide(g._id)} className="adm-btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}><CheckCircle size={13} /> Approve</button>
                                <button onClick={() => setGuideRejectModal(g._id)} className="adm-btn-delete" style={{ fontSize: 11, padding: '4px 10px' }}><XCircle size={13} /> Reject</button>
                              </>
                            )}
                            {g.approvalStatus === 'rejected' && (
                              <button onClick={() => approveGuide(g._id)} className="adm-btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}><CheckCircle size={13} /> Approve</button>
                            )}
                            <button onClick={() => openEdit(g)} className="adm-btn-edit"><Pencil size={14} /> Edit</button>
                            <button onClick={() => handleDelete(g._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <span className="text-sm text-gray-500">Showing {(page - 1) * perPage + 1}&ndash;{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
                    <div className="flex gap-1.5">{Array.from({ length: totalPages }, (_, i) => <button key={i + 1} onClick={() => setPage(i + 1)} className={`adm-page-btn ${page === i + 1 ? 'active' : ''}`}>{i + 1}</button>)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Guide Reject Modal */}
        {guideRejectModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Guide Registration</h3>
              <textarea value={guideRejectReason} onChange={e => setGuideRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 resize-none mb-4" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setGuideRejectModal(null); setGuideRejectReason(''); }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={() => rejectGuideAction(guideRejectModal, guideRejectReason)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">Confirm Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* =============== BOOKINGS TAB =============== */}
        {tab === 1 && (
          <>
            {/* ── Compact Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Total', value: bookings.length, icon: ClipboardList, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
                { label: 'Needs Action', value: actionCount, icon: AlertTriangle, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', pulse: actionCount > 0 },
                { label: 'Active', value: activeCount, icon: Clock, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
                { label: 'Revenue', value: formatLKR(totalRevenue), icon: DollarSign, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={18} color="#fff" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                  </div>
                  {s.pulse && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', marginLeft: 'auto', animation: 'pulse 2s infinite' }} />}
                </div>
              ))}
            </div>

            {/* ── Conflict Alert ── */}
            {conflictData && (
              <div style={{ marginBottom: '16px', borderRadius: '14px', border: '1px solid #fca5a5', overflow: 'hidden' }}>
                <div style={{ background: '#fef2f2', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <AlertTriangle size={15} color="#dc2626" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>Date Conflict Detected</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#b91c1c', margin: '0 0 10px' }}>{conflictData.message}</p>
                  {conflictData.conflicts.map(c => (
                    <div key={c._id} style={{ fontSize: '12px', color: '#dc2626', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={11} color="#f87171" />
                      <span style={{ fontWeight: 600 }}>{new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}</span>
                      <span style={{ color: '#fca5a5' }}>|</span>
                      <span>{c.travelerName}, {c.location}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff5f5', padding: '12px 20px', borderTop: '1px solid #fecaca', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={reassignGuideId} onChange={e => setReassignGuideId(e.target.value)}
                    style={{ fontSize: '12px', padding: '7px 12px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fff', color: '#374151', outline: 'none' }}>
                    <option value="">Reassign to another guide...</option>
                    {guides.filter(g => g.isAvailable).map(g => <option key={g._id} value={g._id}>{g.name} — {g.location}</option>)}
                  </select>
                  <button onClick={() => reassignGuideAction(conflictData.bookingId, reassignGuideId)} disabled={!reassignGuideId}
                    style={{ fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', border: 'none', background: reassignGuideId ? '#f59e0b' : '#e5e7eb', color: reassignGuideId ? '#000' : '#9ca3af', cursor: reassignGuideId ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <UserCheck size={13} /> Reassign
                  </button>
                  <button onClick={() => rejectBooking(conflictData.bookingId, 'Date conflict — guide unavailable')}
                    style={{ fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Ban size={13} /> Reject
                  </button>
                  <button onClick={() => setConflictData(null)} style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>Dismiss</button>
                </div>
              </div>
            )}

            {/* ── Toolbar: Search + Filters + Refresh ── */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '8px', padding: '7px 12px', flex: '1 1 200px', maxWidth: '320px', border: '1px solid #f1f5f9' }}>
                <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)}
                  placeholder="Search bookings..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#334155', width: '100%', fontFamily: 'inherit' }} />
                {bookingSearch && (
                  <button onClick={() => setBookingSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={13} color="#94a3b8" />
                  </button>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }} />

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'action', label: 'Needs Action', count: actionCount, dot: actionCount > 0 },
                  { key: 'active', label: 'Active', count: activeCount },
                  { key: 'past', label: 'Past' },
                ].map(fl => {
                  const isActive = bookingFilter === fl.key;
                  return (
                    <button key={fl.key} onClick={() => setBookingFilter(fl.key)}
                      style={{
                        fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: isActive ? '#f59e0b' : 'transparent', color: isActive ? '#000' : '#64748b',
                        display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                      }}>
                      {fl.label}
                      {fl.dot && !isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />}
                      {fl.count > 0 && !isActive && <span style={{ fontSize: '10px', color: '#94a3b8' }}>({fl.count})</span>}
                    </button>
                  );
                })}
              </div>

              {/* Refresh */}
              <button onClick={loadBookings}
                style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, color: '#64748b', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                <RefreshCw size={13} className={bookingsLoading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* ── Bookings List ── */}
            <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              {bookingsLoading ? (
                <div style={{ padding: '20px' }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ padding: '16px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f1f5f9' }} className="animate-pulse" />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '6px', width: '40%', marginBottom: '8px' }} className="animate-pulse" />
                        <div style={{ height: '10px', background: '#f8fafc', borderRadius: '6px', width: '65%' }} className="animate-pulse" />
                      </div>
                      <div style={{ width: '80px', height: '14px', background: '#f1f5f9', borderRadius: '6px' }} className="animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <ClipboardList size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>No bookings found</p>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                    {bookingSearch ? 'Try a different search term' : 'Bookings will appear here'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: '8px', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Booking</span>
                    <span>Schedule</span>
                    <span>Status</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                    <span style={{ textAlign: 'right', minWidth: '120px' }}>Actions</span>
                  </div>

                  {/* Booking Rows */}
                  {filteredBookings.map((b, idx) => {
                    const statusStyle = STATUS_COLORS[b.status] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
                    const StatusIcon = STATUS_ICONS[b.status] || Clock;
                    const hasActions = ['deposit_submitted', 'guide_accepted', 'remaining_payment_submitted', 'guide_rejected'].includes(b.status)
                      || ((b.status === 'cancelled_by_user' || b.status === 'cancelled_by_admin') && b.cancellation?.refundStatus === 'pending');
                    const initials = (b.travelerName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const isExpanded = expandedBooking === b._id;

                    return (
                      <div key={b._id}>
                        {/* Main Row */}
                        <div
                          onClick={() => setExpandedBooking(isExpanded ? null : b._id)}
                          style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: '8px', padding: '14px 20px',
                            alignItems: 'center', cursor: 'pointer', transition: 'background 0.1s',
                            borderBottom: '1px solid #f3f4f6',
                            background: hasActions ? `${statusStyle.bg}30` : 'transparent',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = hasActions ? `${statusStyle.bg}50` : '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = hasActions ? `${statusStyle.bg}30` : 'transparent'}
                        >
                          {/* Booking Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: statusStyle.bg, color: statusStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.travelerName}</span>
                                <ArrowRight size={10} color="#cbd5e1" />
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#d97706', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.guideId?.name || 'Unassigned'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                                <MapPin size={10} color="#cbd5e1" />
                                <span>{b.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Schedule */}
                          <div style={{ fontSize: '12px', color: '#475569' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                              <Calendar size={11} color="#94a3b8" />
                              <span style={{ fontWeight: 500 }}>
                                {b.startDate
                                  ? `${new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                  : new Date(b.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#94a3b8' }}>
                              <Users size={10} color="#cbd5e1" />
                              <span>{b.days} day{b.days > 1 ? 's' : ''} &middot; {b.travelers} traveler{b.travelers > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px',
                              background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`,
                              whiteSpace: 'nowrap',
                            }}>
                              <StatusIcon size={11} />
                              {STATUS_LABELS[b.status] || b.status}
                            </span>
                            {b.guideDecision?.status !== 'pending' && (
                              <div style={{ marginTop: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {b.guideDecision?.status === 'accepted'
                                  ? <><CheckCircle size={10} color="#16a34a" /><span style={{ color: '#16a34a', fontWeight: 600 }}>Guide OK</span></>
                                  : <><XCircle size={10} color="#dc2626" /><span style={{ color: '#dc2626', fontWeight: 600 }}>Guide Rejected</span></>
                                }
                              </div>
                            )}
                          </div>

                          {/* Amount */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{formatLKR(b.totalPrice)}</div>
                            {b.depositAmount > 0 && (
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                Dep: {formatLKR(b.depositAmount)} | Rem: {formatLKR(b.remainingAmount)}
                              </div>
                            )}
                          </div>

                          {/* Quick Actions / Expand */}
                          <div style={{ textAlign: 'right', minWidth: '120px', display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
                            {b.status === 'deposit_submitted' && (
                              <button onClick={e => { e.stopPropagation(); verifyDeposit(b._id); }}
                                style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#000', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <ShieldCheck size={12} /> Verify
                              </button>
                            )}
                            {b.status === 'guide_accepted' && (
                              <button onClick={e => { e.stopPropagation(); confirmBooking(b._id); }}
                                style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <CheckCircle size={12} /> Confirm
                              </button>
                            )}
                            {b.status === 'remaining_payment_submitted' && (
                              <button onClick={e => { e.stopPropagation(); verifyRemaining(b._id); }}
                                style={{ fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#000', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                <ShieldCheck size={12} /> Verify
                              </button>
                            )}
                            <ChevronDown size={14} color="#94a3b8" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                          </div>
                        </div>

                        {/* Expanded Details Panel */}
                        {isExpanded && (
                          <div style={{ padding: '16px 20px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>

                              {/* Left: Details */}
                              <div style={{ flex: '1 1 300px' }}>
                                {/* Guide decision detail */}
                                {b.guideDecision?.status !== 'pending' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px' }}>
                                    {b.guideDecision?.status === 'accepted'
                                      ? <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: '#d1fae5', borderRadius: '8px', color: '#065f46', fontWeight: 600 }}><CheckCircle size={13} /> Guide Accepted</div>
                                      : <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', fontWeight: 600 }}><XCircle size={13} /> Guide Rejected</div>
                                    }
                                    {b.guideDecision?.reason && <span style={{ color: '#94a3b8', fontSize: '11px' }}>— {b.guideDecision.reason}</span>}
                                  </div>
                                )}

                                {/* Cancellation info */}
                                {b.cancellation?.cancelledBy && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                    <Ban size={13} color="#ef4444" />
                                    <span style={{ color: '#dc2626', fontWeight: 600 }}>Cancelled by {b.cancellation.cancelledBy}</span>
                                    <span style={{ color: '#94a3b8' }}>|</span>
                                    <span style={{ color: '#64748b' }}>Refund: {formatLKR(b.cancellation.refundAmount)}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: b.cancellation.refundStatus === 'pending' ? '#fef3c7' : '#d1fae5', color: b.cancellation.refundStatus === 'pending' ? '#92400e' : '#065f46' }}>
                                      {b.cancellation.refundStatus}
                                    </span>
                                  </div>
                                )}

                                {/* Payment breakdown */}
                                {b.depositAmount > 0 && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Total</div>
                                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{formatLKR(b.totalPrice)}</div>
                                    </div>
                                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Deposit</div>
                                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>{formatLKR(b.depositAmount)}</div>
                                    </div>
                                    <div style={{ padding: '10px 14px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Remaining</div>
                                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#d97706' }}>{formatLKR(b.remainingAmount)}</div>
                                    </div>
                                  </div>
                                )}

                                {/* Payment Slips */}
                                {(b.depositSlip || b.remainingSlip) && (
                                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {b.depositSlip && (
                                      <button onClick={() => setSlipPreview(b.depositSlip)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#fbbf24'; e.currentTarget.style.background = '#fffbeb'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <FileText size={14} color="#d97706" />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Deposit Slip</div>
                                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Click to preview</div>
                                        </div>
                                        <Eye size={13} color="#cbd5e1" style={{ marginLeft: '8px' }} />
                                      </button>
                                    )}
                                    {b.remainingSlip && (
                                      <button onClick={() => setSlipPreview(b.remainingSlip)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#6ee7b7'; e.currentTarget.style.background = '#ecfdf5'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <FileText size={14} color="#059669" />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>Remaining Slip</div>
                                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Click to preview</div>
                                        </div>
                                        <Eye size={13} color="#cbd5e1" style={{ marginLeft: '8px' }} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right: Action Buttons */}
                              {hasActions && (
                                <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                                  {b.status === 'deposit_submitted' && (
                                    <button onClick={() => verifyDeposit(b._id)}
                                      style={{ fontSize: '12px', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.25)' }}>
                                      <ShieldCheck size={14} /> Verify Deposit
                                    </button>
                                  )}

                                  {b.status === 'guide_accepted' && (
                                    <>
                                      <button onClick={() => confirmBooking(b._id)}
                                        style={{ fontSize: '12px', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
                                        <CheckCircle size={14} /> Confirm Booking
                                      </button>
                                      <button onClick={() => setRejectModal(b._id)}
                                        style={{ fontSize: '12px', fontWeight: 600, padding: '9px 18px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <XCircle size={14} /> Reject
                                      </button>
                                    </>
                                  )}

                                  {b.status === 'remaining_payment_submitted' && (
                                    <button onClick={() => verifyRemaining(b._id)}
                                      style={{ fontSize: '12px', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.25)' }}>
                                      <ShieldCheck size={14} /> Verify Remaining
                                    </button>
                                  )}

                                  {(b.status === 'cancelled_by_user' || b.status === 'cancelled_by_admin') && b.cancellation?.refundStatus === 'pending' && (
                                    <>
                                      <button onClick={() => processRefund(b._id, 'processed')}
                                        style={{ fontSize: '12px', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
                                        <RefreshCw size={14} /> Refund {formatLKR(b.cancellation?.refundAmount)}
                                      </button>
                                      <button onClick={() => processRefund(b._id, 'none')}
                                        style={{ fontSize: '12px', fontWeight: 600, padding: '9px 18px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <Ban size={14} /> No Refund
                                      </button>
                                    </>
                                  )}

                                  {b.status === 'guide_rejected' && (
                                    <>
                                      <select value={reassignGuideId} onChange={e => setReassignGuideId(e.target.value)}
                                        style={{ fontSize: '12px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#334155', outline: 'none', width: '100%' }}>
                                        <option value="">Reassign guide...</option>
                                        {guides.filter(g => g.isAvailable).map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                                      </select>
                                      <button onClick={() => reassignGuideAction(b._id, reassignGuideId)} disabled={!reassignGuideId}
                                        style={{ fontSize: '12px', fontWeight: 700, padding: '10px 18px', borderRadius: '10px', border: 'none', background: reassignGuideId ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#e5e7eb', color: reassignGuideId ? '#fff' : '#9ca3af', cursor: reassignGuideId ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <UserCheck size={14} /> Reassign
                                      </button>
                                      <button onClick={() => rejectBooking(b._id, 'Guide rejected and no replacement available')}
                                        style={{ fontSize: '12px', fontWeight: 600, padding: '9px 18px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <Ban size={14} /> Reject & Refund
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Footer count */}
                  <div style={{ padding: '10px 20px', background: '#f8fafc', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                    Showing {filteredBookings.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                  </div>
                </>
              )}
            </div>

            {/* ── Slip Preview Modal ── */}
            {slipPreview && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSlipPreview(null)}>
                <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Payment Slip</span>
                    <button onClick={() => setSlipPreview(null)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#64748b" />
                    </button>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <img src={slipPreview} alt="Payment slip" style={{ width: '100%', borderRadius: '12px', maxHeight: '65vh', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                    <a href={slipPreview} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', background: '#f59e0b', color: '#000', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={13} /> Open Full Size
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ── Reject Modal ── */}
            {rejectModal && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ban size={18} color="#ef4444" />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Reject Booking</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>This action cannot be undone</div>
                    </div>
                  </div>
                  <div style={{ padding: '0 24px 20px' }}>
                    <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      rows={3}
                      style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', background: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ padding: '14px 24px', borderTop: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                      style={{ fontSize: '13px', fontWeight: 600, padding: '8px 18px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#64748b', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={() => rejectBooking(rejectModal, rejectReason)}
                      style={{ fontSize: '13px', fontWeight: 700, padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Ban size={13} /> Reject Booking
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
