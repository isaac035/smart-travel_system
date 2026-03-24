import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';
import { formatLKR } from '../../utils/currency';
import {
  Search, Shield, ShieldOff, Trash2, Users, Compass,
  CheckCircle, XCircle, Eye, UserPlus, ChevronDown,
  MapPin, Calendar, Clock, DollarSign, X, Pencil
} from 'lucide-react';

const ROLE_CONFIG = {
  user:  { label: 'User',  bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', icon: Users },
  guide: { label: 'Guide', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: Compass },
  admin: { label: 'Admin', bg: '#fffbeb', color: '#92400e', border: '#fcd34d', icon: Shield },
};

const APPROVAL_CONFIG = {
  pending:  { label: 'Pending',  bg: '#fefce8', color: '#a16207', border: '#fde68a' },
  approved: { label: 'Approved', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  rejected: { label: 'Rejected', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
};

const TABS = [
  { key: 'all',    label: 'All Users', icon: Users },
  { key: 'user',   label: 'Users',     icon: Users },
  { key: 'guide',  label: 'Guides',    icon: Compass },
  { key: 'admin',  label: 'Admins',    icon: Shield },
];

const BOOKING_STATUS_COLORS = {
  deposit_submitted: '#f59e0b',
  pending_guide_review: '#f59e0b',
  guide_accepted: '#22c55e',
  guide_rejected: '#ef4444',
  remaining_payment_pending: '#f59e0b',
  remaining_payment_submitted: '#3b82f6',
  fully_paid: '#22c55e',
  completed: '#22c55e',
  cancelled_by_user: '#ef4444',
  cancelled_by_admin: '#ef4444',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bookingsModal, setBookingsModal] = useState(null);
  const [bookingsData, setBookingsData] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [promoteModal, setPromoteModal] = useState(null);
  const [promoteLocation, setPromoteLocation] = useState('');
  const [actionDropdown, setActionDropdown] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => setActionDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  // ── Actions ──

  const changeRole = async (userId, newRole) => {
    const user = users.find(u => u._id === userId);
    if (!window.confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    try {
      const { data } = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(p => p.map(u => u._id === userId ? { ...u, ...data } : u));
      toast.success(`Role updated to ${newRole}`);
      setActionDropdown(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const promoteToGuide = async () => {
    if (!promoteLocation.trim()) return toast.error('Please enter a location');
    try {
      const { data } = await api.put(`/admin/users/${promoteModal}/promote-guide`, { location: promoteLocation });
      setUsers(p => p.map(u => u._id === promoteModal ? data : u));
      toast.success('User promoted to guide');
      setPromoteModal(null);
      setPromoteLocation('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    const user = users.find(u => u._id === id);
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(p => p.filter(u => u._id !== id));
      toast.success('User deleted');
      setActionDropdown(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const approveGuide = async (userId) => {
    const user = users.find(u => u._id === userId);
    const guideId = user?.guideProfile?._id;
    if (!guideId) return toast.error('Guide profile not found');
    try {
      await api.put(`/guides/${guideId}/approve`);
      setUsers(p => p.map(u => u._id === userId
        ? { ...u, guideProfile: { ...u.guideProfile, approvalStatus: 'approved' } }
        : u
      ));
      toast.success(`${user.name} approved as guide`);
      setActionDropdown(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const rejectGuide = async () => {
    const user = users.find(u => u._id === rejectModal);
    const guideId = user?.guideProfile?._id;
    if (!guideId) return toast.error('Guide profile not found');
    try {
      await api.put(`/guides/${guideId}/reject`, { reason: rejectReason });
      setUsers(p => p.map(u => u._id === rejectModal
        ? { ...u, guideProfile: { ...u.guideProfile, approvalStatus: 'rejected', rejectionReason: rejectReason } }
        : u
      ));
      toast.success('Guide registration rejected');
      setRejectModal(null);
      setRejectReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const viewBookings = async (userId) => {
    setBookingsModal(userId);
    setBookingsLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}/guide-bookings`);
      setBookingsData(data);
    } catch { toast.error('Failed to load bookings'); setBookingsData([]); }
    finally { setBookingsLoading(false); }
  };

  const openEdit = (user) => {
    setEditForm({ name: user.name, email: user.email });
    setEditModal(user._id);
    setActionDropdown(null);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return toast.error('Name and email are required');
    try {
      const { data } = await api.put(`/admin/users/${editModal}`, editForm);
      setUsers(p => p.map(u => u._id === editModal ? { ...u, ...data } : u));
      toast.success('User updated successfully');
      setEditModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update user'); }
  };

  // ── Filtering ──

  const filtered = users.filter(u => {
    const matchTab = activeTab === 'all' || u.role === activeTab;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  // ── Stats ──

  const counts = {
    all: users.length,
    user: users.filter(u => u.role === 'user').length,
    guide: users.filter(u => u.role === 'guide').length,
    admin: users.filter(u => u.role === 'admin').length,
  };
  const pendingGuides = users.filter(u => u.role === 'guide' && u.guideProfile?.approvalStatus === 'pending').length;

  // ── Render helpers ──

  const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    const Icon = cfg.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      }}>
        <Icon size={12} />
        {cfg.label}
      </span>
    );
  };

  const ApprovalBadge = ({ status }) => {
    const cfg = APPROVAL_CONFIG[status] || APPROVAL_CONFIG.pending;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      }}>
        {status === 'approved' && <CheckCircle size={11} />}
        {status === 'rejected' && <XCircle size={11} />}
        {status === 'pending' && <Clock size={11} />}
        {cfg.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto">

        {/* ── Header with Stats ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>User Management</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Manage all users, guides, and administrators</p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }} className="stat-grid">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#fff',
                  border: isActive ? 'none' : '1px solid #e5e7eb',
                  borderRadius: 16, padding: '18px 20px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 14px rgba(245,158,11,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                  textAlign: 'left', position: 'relative', overflow: 'hidden',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: isActive ? 'rgba(255,255,255,0.8)' : '#9ca3af', margin: 0 }}>
                      {tab.label}
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: isActive ? '#fff' : '#111827', margin: '4px 0 0', lineHeight: 1 }}>
                      {counts[tab.key]}
                    </p>
                  </div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#f9fafb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} style={{ color: isActive ? '#fff' : '#d97706' }} />
                  </div>
                </div>
                {tab.key === 'guide' && pendingGuides > 0 && (
                  <span style={{
                    position: 'absolute', top: 10, right: 10,
                    background: isActive ? '#fff' : '#ef4444',
                    color: isActive ? '#d97706' : '#fff',
                    fontSize: 10, fontWeight: 700, borderRadius: 10,
                    padding: '2px 7px', lineHeight: '16px',
                  }}>
                    {pendingGuides} pending
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Search Bar ── */}
        <div className="adm-toolbar mb-5">
          <div className="adm-search-box" style={{ flex: 1, maxWidth: 400 }}>
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
            />
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: '#9ca3af', whiteSpace: 'nowrap' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Pending Guides Alert ── */}
        {activeTab !== 'admin' && activeTab !== 'user' && pendingGuides > 0 && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14,
            padding: '14px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Clock size={18} style={{ color: '#d97706' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>
                {pendingGuides} guide registration{pendingGuides > 1 ? 's' : ''} pending approval
              </p>
              <p style={{ fontSize: 12, color: '#a16207', margin: '2px 0 0' }}>
                Review and approve or reject pending guide registrations below
              </p>
            </div>
            {activeTab !== 'guide' && (
              <button onClick={() => { setActiveTab('guide'); setPage(1); }}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                View Guides
              </button>
            )}
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-table-wrap">
            <div className="text-center py-16">
              <Users className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-base text-gray-500 font-semibold">No users found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or tab filter</p>
            </div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <div>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    {(activeTab === 'all' || activeTab === 'guide') && <th>Status</th>}
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u._id}>
                      {/* Avatar + Name */}
                      <td>
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="adm-thumb" style={{ borderRadius: '50%' }} />
                          ) : (
                            <div className="adm-thumb-placeholder" style={{
                              borderRadius: '50%', border: 'none', fontWeight: 700, fontSize: 14, color: '#fff',
                              background: u.role === 'admin'
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : u.role === 'guide'
                                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                  : 'linear-gradient(135deg, #6b7280, #4b5563)',
                            }}>
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-semibold text-gray-900" style={{ display: 'block' }}>{u.name}</span>
                            {u.role === 'guide' && u.guideProfile?.location && (
                              <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                <MapPin size={10} /> {u.guideProfile.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="text-sm text-gray-600">{u.email}</td>

                      {/* Role Badge */}
                      <td><RoleBadge role={u.role} /></td>

                      {/* Approval Status (guides only) */}
                      {(activeTab === 'all' || activeTab === 'guide') && (
                        <td>
                          {u.role === 'guide' ? (
                            <ApprovalBadge status={u.guideProfile?.approvalStatus || 'pending'} />
                          ) : (
                            <span style={{ fontSize: 12, color: '#d1d5db' }}>--</span>
                          )}
                        </td>
                      )}

                      {/* Joined */}
                      <td>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-2" style={{ position: 'relative' }}>
                          {/* Quick actions for pending guides */}
                          {u.role === 'guide' && u.guideProfile?.approvalStatus === 'pending' && (
                            <>
                              <button onClick={() => approveGuide(u._id)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                  background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                                  cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                              <button onClick={() => { setRejectModal(u._id); setRejectReason(''); }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                  background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca',
                                  cursor: 'pointer', transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}

                          {/* Dropdown trigger */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={e => { e.stopPropagation(); setActionDropdown(actionDropdown === u._id ? null : u._id); }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                                background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; }}
                            >
                              Actions <ChevronDown size={12} />
                            </button>

                            {/* Dropdown menu */}
                            {actionDropdown === u._id && (
                              <div onClick={e => e.stopPropagation()} style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                                background: '#fff', borderRadius: 12, padding: '6px 0',
                                border: '1px solid #e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                minWidth: 190, zIndex: 50,
                              }}>
                                {/* User-specific actions */}
                                {u.role === 'user' && (
                                  <>
                                    <DropdownItem icon={<Pencil size={14} />} label="Edit User"
                                      onClick={() => openEdit(u)} />
                                    <DropdownItem icon={<UserPlus size={14} />} label="Promote to Guide"
                                      onClick={() => { setPromoteModal(u._id); setPromoteLocation(''); setActionDropdown(null); }} />
                                    <DropdownItem icon={<Shield size={14} />} label="Make Admin"
                                      onClick={() => changeRole(u._id, 'admin')} />
                                    <DropdownDivider />
                                    <DropdownItem icon={<Trash2 size={14} />} label="Delete User" danger
                                      onClick={() => handleDelete(u._id)} />
                                  </>
                                )}

                                {/* Guide-specific actions */}
                                {u.role === 'guide' && (
                                  <>
                                    <DropdownItem icon={<Pencil size={14} />} label="Edit Guide"
                                      onClick={() => openEdit(u)} />
                                    {u.guideProfile?.approvalStatus === 'rejected' && (
                                      <DropdownItem icon={<CheckCircle size={14} />} label="Re-approve Guide"
                                        onClick={() => approveGuide(u._id)} />
                                    )}
                                    <DropdownItem icon={<Eye size={14} />} label="View Bookings"
                                      onClick={() => { viewBookings(u._id); setActionDropdown(null); }} />
                                    <DropdownDivider />
                                    <DropdownItem icon={<ShieldOff size={14} />} label="Demote to User"
                                      onClick={() => changeRole(u._id, 'user')} />
                                    <DropdownItem icon={<Trash2 size={14} />} label="Delete" danger
                                      onClick={() => handleDelete(u._id)} />
                                  </>
                                )}

                                {/* Admin-specific actions */}
                                {u.role === 'admin' && (
                                  <>
                                    <DropdownItem icon={<Pencil size={14} />} label="Edit Admin"
                                      onClick={() => openEdit(u)} />
                                    <DropdownItem icon={<ShieldOff size={14} />} label="Demote to User"
                                      onClick={() => changeRole(u._id, 'user')} />
                                    <DropdownDivider />
                                    <DropdownItem icon={<Trash2 size={14} />} label="Delete" danger
                                      onClick={() => handleDelete(u._id)} />
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * perPage + 1}&ndash;{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} onClick={() => setPage(i + 1)} className={`adm-page-btn ${page === i + 1 ? 'active' : ''}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Reject Guide Modal */}
      {rejectModal && (
        <ModalOverlay onClose={() => setRejectModal(null)}>
          <div style={{ maxWidth: 440 }}>
            <ModalHeader icon={<XCircle size={20} style={{ color: '#ef4444' }} />} title="Reject Guide Registration"
              onClose={() => setRejectModal(null)} />
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                This will prevent the guide from logging in. You can optionally provide a reason.
              </p>
              <textarea
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..." rows={3}
                className="adm-textarea" style={{ width: '100%', marginBottom: 0 }}
              />
            </div>
            <ModalFooter>
              <button onClick={() => setRejectModal(null)} className="adm-btn-secondary">Cancel</button>
              <button onClick={rejectGuide}
                style={{
                  padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer',
                }}>
                Reject Guide
              </button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Promote to Guide Modal */}
      {promoteModal && (
        <ModalOverlay onClose={() => setPromoteModal(null)}>
          <div style={{ maxWidth: 440 }}>
            <ModalHeader icon={<UserPlus size={20} style={{ color: '#f59e0b' }} />} title="Promote to Guide"
              onClose={() => setPromoteModal(null)} />
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
                This user will be promoted to a travel guide. A guide profile will be created automatically.
              </p>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Primary Location *
              </label>
              <input
                value={promoteLocation} onChange={e => setPromoteLocation(e.target.value)}
                placeholder="e.g. Colombo, Kandy, Ella..."
                className="adm-input"
              />
            </div>
            <ModalFooter>
              <button onClick={() => setPromoteModal(null)} className="adm-btn-secondary">Cancel</button>
              <button onClick={promoteToGuide} className="adm-btn-primary">Promote to Guide</button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* View Bookings Modal */}
      {bookingsModal && (
        <ModalOverlay onClose={() => setBookingsModal(null)}>
          <div style={{ maxWidth: 640 }}>
            <ModalHeader icon={<Calendar size={20} style={{ color: '#3b82f6' }} />}
              title={`Guide Bookings — ${users.find(u => u._id === bookingsModal)?.name || 'Guide'}`}
              onClose={() => setBookingsModal(null)} />
            <div style={{ padding: '20px 24px', maxHeight: 420, overflowY: 'auto' }}>
              {bookingsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }} className="animate-spin" />
                </div>
              ) : bookingsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Calendar size={36} style={{ color: '#e5e7eb', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>No bookings found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bookingsData.map(b => (
                    <div key={b._id} style={{
                      background: '#f9fafb', borderRadius: 12, padding: '14px 16px',
                      border: '1px solid #f3f4f6',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{b.travelerName}</span>
                          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>{b.userId?.email || b.email}</span>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          background: `${BOOKING_STATUS_COLORS[b.status] || '#6b7280'}15`,
                          color: BOOKING_STATUS_COLORS[b.status] || '#6b7280',
                          border: `1px solid ${BOOKING_STATUS_COLORS[b.status] || '#6b7280'}30`,
                          textTransform: 'capitalize', whiteSpace: 'nowrap',
                        }}>
                          {b.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={11} /> {b.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} /> {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DollarSign size={11} /> {formatLKR(b.totalPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <ModalFooter>
              <button onClick={() => setBookingsModal(null)} className="adm-btn-secondary">Close</button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Edit User Modal */}
      {editModal && (
        <ModalOverlay onClose={() => setEditModal(null)}>
          <div style={{ maxWidth: 440 }}>
            <ModalHeader icon={<Pencil size={20} style={{ color: '#f59e0b' }} />} title="Edit User"
              onClose={() => setEditModal(null)} />
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter name"
                  className="adm-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email"
                  className="adm-input"
                />
              </div>
            </div>
            <ModalFooter>
              <button onClick={() => setEditModal(null)} className="adm-btn-secondary">Cancel</button>
              <button onClick={saveEdit} className="adm-btn-primary">Save Changes</button>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AdminLayout>
  );
}


// ── Reusable sub-components ──

function DropdownItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '9px 16px', fontSize: 13, fontWeight: 500, border: 'none',
      background: 'none', cursor: 'pointer', transition: 'background 0.12s',
      color: danger ? '#dc2626' : '#374151', textAlign: 'left',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? '#fef2f2' : '#f9fafb'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
    >
      {icon} {label}
    </button>
  );
}

function DropdownDivider() {
  return <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />;
}

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon, title, onClose }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
      </div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 4, borderRadius: 6, color: '#9ca3af',
      }}>
        <X size={18} />
      </button>
    </div>
  );
}

function ModalFooter({ children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: 10,
      padding: '16px 24px', borderTop: '1px solid #f3f4f6',
    }}>
      {children}
    </div>
  );
}
