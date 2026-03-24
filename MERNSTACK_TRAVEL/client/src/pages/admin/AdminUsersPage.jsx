import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';
import { formatLKR } from '../../utils/currency';
import {
  Search, Shield, ShieldOff, Trash2, Users, Compass, Hotel,
  CheckCircle, XCircle, Eye, UserPlus, ChevronDown,
  MapPin, Calendar, Clock, DollarSign, X, Pencil,
  PauseCircle, PlayCircle, Ban, Phone, Mail, Key, User
} from 'lucide-react';

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (edit in one place)
───────────────────────────────────────────── */
const TOKEN = {
  // Surfaces
  pageBg: '#f5f4f1',
  cardBg: '#ffffff',
  rowHover: '#fafaf8',

  // Ink
  ink1: '#111010',
  ink2: '#4b4a46',
  ink3: '#9b9894',
  ink4: '#c4c2be',

  // Accent (amber)
  accent: '#f59e0b',
  accentDark: '#d97706',
  accentGlow: 'rgba(245,158,11,0.18)',

  // Status palette
  greenBg: '#f0fdf4', greenText: '#15803d', greenBorder: '#bbf7d0',
  redBg: '#fef2f2', redText: '#b91c1c', redBorder: '#fecaca',
  amberBg: '#fffbeb', amberText: '#a16207', amberBorder: '#fde68a',
  blueBg: '#eff6ff', blueText: '#1d4ed8', blueBorder: '#bfdbfe',
  pinkBg: '#fdf2f8', pinkText: '#9d174d', pinkBorder: '#fbcfe8',
  grayBg: '#f3f4f6', grayText: '#374151', grayBorder: '#e5e7eb',

  // Radii
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,

  // Shadows
  shadowXs: '0 1px 3px rgba(0,0,0,0.06)',
  shadowSm: '0 2px 8px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 20px rgba(0,0,0,0.09)',
  shadowLg: '0 12px 48px rgba(0,0,0,0.14)',

  // Transitions
  t1: 'all 0.15s ease',
  t2: 'all 0.25s ease',
};

/* ─────────────────────────────────────────────
   CONFIGS  (unchanged from original)
───────────────────────────────────────────── */
const ROLE_CONFIG = {
  user: { label: 'User', bg: TOKEN.grayBg, color: TOKEN.grayText, border: TOKEN.grayBorder, icon: Users },
  guide: { label: 'Guide', bg: TOKEN.blueBg, color: TOKEN.blueText, border: TOKEN.blueBorder, icon: Compass },
  admin: { label: 'Admin', bg: TOKEN.amberBg, color: TOKEN.amberText, border: TOKEN.amberBorder, icon: Shield },
  hotelOwner: { label: 'Hotel Owner', bg: TOKEN.pinkBg, color: TOKEN.pinkText, border: TOKEN.pinkBorder, icon: Hotel },
};

const STATUS_CONFIG = {
  active: { label: 'Active', bg: TOKEN.greenBg, color: TOKEN.greenText, border: TOKEN.greenBorder, icon: CheckCircle },
  hold: { label: 'On Hold', bg: TOKEN.amberBg, color: TOKEN.amberText, border: TOKEN.amberBorder, icon: PauseCircle },
  deactivated: { label: 'Deactivated', bg: TOKEN.redBg, color: TOKEN.redText, border: TOKEN.redBorder, icon: Ban },
};

const APPROVAL_CONFIG = {
  pending: { label: 'Pending', bg: '#fefce8', color: TOKEN.amberText, border: TOKEN.amberBorder },
  approved: { label: 'Approved', bg: TOKEN.greenBg, color: TOKEN.greenText, border: TOKEN.greenBorder },
  rejected: { label: 'Rejected', bg: TOKEN.redBg, color: TOKEN.redText, border: TOKEN.redBorder },
};

const TABS = [
  { key: 'all', label: 'All Users', icon: Users },
  { key: 'user', label: 'Users', icon: Users },
  { key: 'guide', label: 'Guides', icon: Compass },
  { key: 'hotelOwner', label: 'Hotel Owners', icon: Hotel },
  { key: 'admin', label: 'Admins', icon: Shield },
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

/* Role → avatar gradient */
const ROLE_GRADIENT = {
  admin: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  guide: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  hotelOwner: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  user: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bookingsModal, setBookingsModal] = useState(null);
  const [bookingsData, setBookingsData] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [promoteModal, setPromoteModal] = useState(null);
  const [promoteLocation, setPromoteLocation] = useState('');
  const [actionDropdown, setActionDropdown] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [viewModal, setViewModal] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [addAdminModal, setAddAdminModal] = useState(false);
  const [addAdminForm, setAddAdminForm] = useState({ name: '', email: '', password: '' });
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const handler = () => setActionDropdown(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  /* ── Data loaders ── */
  const loadUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  /* ── Actions (all unchanged) ── */
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

  const changeStatus = async (userId, newStatus) => {
    const user = users.find(u => u._id === userId);
    const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
    if (!window.confirm(`Set ${user.name}'s status to "${statusLabel}"?`)) return;
    try {
      const { data } = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(p => p.map(u => u._id === userId ? { ...u, ...data } : u));
      toast.success(`Status updated to ${statusLabel}`);
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

  const viewUserDetails = async (userId) => {
    setViewModal(userId);
    setViewLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${userId}`);
      setViewData(data);
    } catch { toast.error('Failed to load user details'); setViewData(null); }
    finally { setViewLoading(false); }
    setActionDropdown(null);
  };

  const openEdit = (user) => {
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '', password: '' });
    setEditModal(user._id);
    setActionDropdown(null);
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return toast.error('Name and email are required');
    try {
      const payload = { name: editForm.name, email: editForm.email, phone: editForm.phone };
      if (editForm.password.trim()) payload.password = editForm.password;
      const { data } = await api.put(`/admin/users/${editModal}`, payload);
      setUsers(p => p.map(u => u._id === editModal ? { ...u, ...data } : u));
      toast.success('User updated successfully');
      setEditModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update user'); }
  };

  const handleAddAdmin = async () => {
    if (!addAdminForm.name.trim() || !addAdminForm.email.trim() || !addAdminForm.password.trim()) {
      return toast.error('All fields are required');
    }
    if (addAdminForm.password.length < 6) return toast.error('Password must be at least 6 characters');
    setAddAdminLoading(true);
    try {
      const { data } = await api.post('/admin/users/create-admin', addAdminForm);
      setUsers(p => [data, ...p]);
      toast.success('Admin created successfully');
      setAddAdminModal(false);
      setAddAdminForm({ name: '', email: '', password: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create admin'); }
    finally { setAddAdminLoading(false); }
  };

  /* ── Filtering ── */
  const filtered = users.filter(u => {
    const matchTab = activeTab === 'all' || u.role === activeTab;
    const matchSearch = !search
      || u.name.toLowerCase().includes(search.toLowerCase())
      || u.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const counts = {
    all: users.length,
    user: users.filter(u => u.role === 'user').length,
    guide: users.filter(u => u.role === 'guide').length,
    hotelOwner: users.filter(u => u.role === 'hotelOwner').length,
    admin: users.filter(u => u.role === 'admin').length,
  };
  const pendingGuides = users.filter(u => u.role === 'guide' && u.guideProfile?.approvalStatus === 'pending').length;

  /* ── Badge components ── */
  const RoleBadge = ({ role }) => {
    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    const Icon = cfg.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.02em',
        background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      }}>
        <Icon size={11} strokeWidth={2.5} />
        {cfg.label}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    const Icon = cfg.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.02em',
        background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: cfg.color,
          boxShadow: status === 'active' ? `0 0 0 2px ${cfg.bg}, 0 0 0 3px ${cfg.color}` : 'none',
          flexShrink: 0,
        }} />
        {cfg.label}
      </span>
    );
  };

  const ApprovalBadge = ({ status }) => {
    const cfg = APPROVAL_CONFIG[status] || APPROVAL_CONFIG.pending;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.02em',
        background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      }}>
        {status === 'approved' && <CheckCircle size={11} strokeWidth={2.5} />}
        {status === 'rejected' && <XCircle size={11} strokeWidth={2.5} />}
        {status === 'pending' && <Clock size={11} strokeWidth={2.5} />}
        {cfg.label}
      </span>
    );
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <AdminLayout>

      {/* ── Font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --accent:      #f59e0b;
          --accent-dark: #d97706;
          --accent-glow: rgba(245,158,11,0.15);
        }

        /* Page shell */
        .aup-wrap {
          font-family: 'DM Sans', sans-serif;
          padding: 36px 40px 60px;
          max-width: 1320px;
          margin: 0 auto;
          background: ${TOKEN.pageBg};
          min-height: 100vh;
          background-image:
            radial-gradient(circle at 8% 8%, rgba(245,158,11,0.05) 0%, transparent 50%),
            radial-gradient(circle at 92% 92%, rgba(59,130,246,0.04) 0%, transparent 50%);
        }

        /* Heading font */
        .aup-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: ${TOKEN.ink1};
          margin: 0;
          letter-spacing: -0.5px;
        }
        .aup-subtitle {
          font-size: 13px;
          color: ${TOKEN.ink3};
          margin: 5px 0 0;
          font-weight: 400;
        }

        /* ── Stat cards ── */
        .aup-stat-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .aup-stat-card {
          position: relative;
          background: ${TOKEN.cardBg};
          border: 1.5px solid #ede9e0;
          border-radius: ${TOKEN.radiusXl}px;
          padding: 20px 20px 18px;
          cursor: pointer;
          transition: ${TOKEN.t2};
          overflow: hidden;
          text-align: left;
          outline: none;
        }
        .aup-stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          opacity: 0;
          transition: opacity 0.25s ease;
          border-radius: inherit;
        }
        .aup-stat-card:hover { transform: translateY(-2px); box-shadow: ${TOKEN.shadowMd}; }
        .aup-stat-card:hover::before { opacity: 0; }
        .aup-stat-card.active {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-color: transparent;
          box-shadow: 0 8px 28px rgba(245,158,11,0.32);
          transform: translateY(-2px);
        }
        .aup-stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 6px;
          transition: color 0.2s;
        }
        .aup-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
          margin: 0;
          transition: color 0.2s;
        }
        .aup-stat-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .aup-pending-pill {
          position: absolute;
          top: 12px; right: 12px;
          font-size: 9px; font-weight: 800;
          padding: 2px 7px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Search bar ── */
        .aup-searchbar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: ${TOKEN.cardBg};
          border: 1.5px solid #ede9e0;
          border-radius: 14px;
          padding: 0 16px;
          height: 46px;
          flex: 1;
          max-width: 400px;
          transition: ${TOKEN.t1};
          box-shadow: ${TOKEN.shadowXs};
        }
        .aup-searchbar:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .aup-searchbar input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13.5px;
          color: ${TOKEN.ink1};
          font-family: 'DM Sans', sans-serif;
          flex: 1;
          min-width: 0;
        }
        .aup-searchbar input::placeholder { color: ${TOKEN.ink4}; }

        /* ── Table card ── */
        .aup-table-card {
          background: ${TOKEN.cardBg};
          border: 1.5px solid #ede9e0;
          border-radius: ${TOKEN.radiusXl}px;
          overflow: hidden;
          box-shadow: ${TOKEN.shadowXs};
        }
        .aup-table-card table {
          width: 100%;
          border-collapse: collapse;
        }
        .aup-table-card thead th {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: ${TOKEN.ink3};
          padding: 14px 20px;
          background: #faf9f7;
          border-bottom: 1.5px solid #f0ede6;
          text-align: left;
          white-space: nowrap;
        }
        .aup-table-card thead th:last-child { text-align: right; }
        .aup-table-card tbody tr {
          border-bottom: 1px solid #f5f3ef;
          transition: background 0.12s;
        }
        .aup-table-card tbody tr:last-child { border-bottom: none; }
        .aup-table-card tbody tr:hover { background: ${TOKEN.rowHover}; }
        .aup-table-card tbody td {
          padding: 15px 20px;
          vertical-align: middle;
        }

        /* ── Avatar ── */
        .aup-avatar {
          width: 38px; height: 38px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .aup-avatar-placeholder {
          width: 38px; height: 38px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 800; color: #fff;
          flex-shrink: 0;
          letter-spacing: -0.5px;
        }

        /* ── Quick action buttons (approve/reject) ── */
        .aup-qa-approve {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 10px;
          font-size: 12px; font-weight: 700;
          background: ${TOKEN.greenBg}; color: ${TOKEN.greenText};
          border: 1.5px solid ${TOKEN.greenBorder};
          cursor: pointer; transition: ${TOKEN.t1};
          font-family: 'DM Sans', sans-serif;
        }
        .aup-qa-approve:hover { background: #dcfce7; transform: translateY(-1px); }

        .aup-qa-reject {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 10px;
          font-size: 12px; font-weight: 700;
          background: ${TOKEN.redBg}; color: ${TOKEN.redText};
          border: 1.5px solid ${TOKEN.redBorder};
          cursor: pointer; transition: ${TOKEN.t1};
          font-family: 'DM Sans', sans-serif;
        }
        .aup-qa-reject:hover { background: #fee2e2; transform: translateY(-1px); }

        /* ── Dropdown trigger ── */
        .aup-dd-trigger {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 10px;
          font-size: 12px; font-weight: 600;
          background: #f5f3ef; color: ${TOKEN.ink2};
          border: 1.5px solid #e8e4dc;
          cursor: pointer; transition: ${TOKEN.t1};
          font-family: 'DM Sans', sans-serif;
        }
        .aup-dd-trigger:hover { background: #eceae4; }
        .aup-dd-trigger.open { background: #eceae4; border-color: #d5d0c6; }

        /* ── Dropdown menu ── */
        .aup-dd-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: ${TOKEN.cardBg};
          border: 1.5px solid #e8e4dc;
          border-radius: 16px;
          padding: 6px;
          min-width: 210px;
          z-index: 50;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          animation: ddFadeIn 0.15s ease;
        }
        @keyframes ddFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .aup-dd-section-label {
          padding: 6px 12px 4px;
          font-size: 9.5px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: ${TOKEN.ink4};
          font-family: 'DM Sans', sans-serif;
        }
        .aup-dd-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 12px;
          font-size: 13px; font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          border: none; background: none;
          cursor: pointer; border-radius: 10px;
          transition: ${TOKEN.t1};
          color: ${TOKEN.ink1}; text-align: left;
        }
        .aup-dd-item:hover { background: #f5f3ef; }
        .aup-dd-item.danger { color: #dc2626; }
        .aup-dd-item.danger:hover { background: #fef2f2; }
        .aup-dd-divider {
          height: 1px; background: #f0ede6;
          margin: 5px 6px;
        }

        /* ── Pagination ── */
        .aup-pg-btn {
          width: 34px; height: 34px;
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          border: 1.5px solid #e8e4dc;
          background: ${TOKEN.cardBg};
          color: ${TOKEN.ink2};
          cursor: pointer; transition: ${TOKEN.t1};
          display: flex; align-items: center; justify-content: center;
        }
        .aup-pg-btn:hover { background: #f5f3ef; border-color: #d5d0c6; }
        .aup-pg-btn.active {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 3px 10px rgba(245,158,11,0.35);
        }

        /* ── Add Admin button ── */
        .aup-add-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 22px;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff; border: none; cursor: pointer;
          box-shadow: 0 4px 16px rgba(245,158,11,0.28);
          transition: ${TOKEN.t2};
          white-space: nowrap;
        }
        .aup-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(245,158,11,0.38);
        }
        .aup-add-btn:active { transform: translateY(0); }

        /* ── Alert banner ── */
        .aup-alert {
          display: flex; align-items: center; gap: 14px;
          background: ${TOKEN.amberBg};
          border: 1.5px solid ${TOKEN.amberBorder};
          border-radius: ${TOKEN.radiusLg}px;
          padding: 14px 18px;
          margin-bottom: 18px;
        }
        .aup-alert-icon {
          width: 38px; height: 38px; border-radius: 11px;
          background: #fef3c7;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── Modals ── */
        .aup-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(10,8,6,0.5);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .aup-modal {
          background: ${TOKEN.cardBg};
          border: 1.5px solid #e8e4dc;
          border-radius: 22px;
          width: 100%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
          overflow: hidden;
          animation: modalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .aup-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1.5px solid #f0ede6;
          background: #faf9f7;
        }
        .aup-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 800;
          color: ${TOKEN.ink1}; margin: 0;
          letter-spacing: -0.3px;
        }
        .aup-modal-close {
          width: 30px; height: 30px; border-radius: 8px;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: ${TOKEN.ink3}; transition: ${TOKEN.t1};
        }
        .aup-modal-close:hover { background: #f0ede6; color: ${TOKEN.ink1}; }
        .aup-modal-body { padding: 22px 24px; }
        .aup-modal-footer {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 24px;
          border-top: 1.5px solid #f0ede6;
          background: #faf9f7;
        }

        /* ── Form elements in modals ── */
        .aup-label {
          display: block;
          font-size: 12px; font-weight: 700;
          color: ${TOKEN.ink2}; margin-bottom: 7px;
          letter-spacing: 0.02em;
          font-family: 'DM Sans', sans-serif;
        }
        .aup-input {
          width: 100%; height: 42px;
          border: 1.5px solid #e2ddd5;
          border-radius: 11px;
          padding: 0 14px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          color: ${TOKEN.ink1};
          background: #fff;
          outline: none;
          transition: ${TOKEN.t1};
          box-sizing: border-box;
        }
        .aup-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .aup-input::placeholder { color: ${TOKEN.ink4}; }
        .aup-textarea {
          width: 100%; min-height: 90px;
          border: 1.5px solid #e2ddd5;
          border-radius: 11px;
          padding: 12px 14px;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          color: ${TOKEN.ink1};
          background: #fff;
          outline: none;
          resize: vertical;
          transition: ${TOKEN.t1};
          box-sizing: border-box;
        }
        .aup-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .aup-textarea::placeholder { color: ${TOKEN.ink4}; }

        /* ── Modal buttons ── */
        .aup-btn-primary {
          padding: 9px 22px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff; border: none; cursor: pointer;
          transition: ${TOKEN.t1};
          box-shadow: 0 3px 10px rgba(245,158,11,0.25);
        }
        .aup-btn-primary:hover { box-shadow: 0 5px 16px rgba(245,158,11,0.4); transform: translateY(-1px); }
        .aup-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .aup-btn-secondary {
          padding: 9px 20px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600;
          background: ${TOKEN.cardBg};
          color: ${TOKEN.ink2};
          border: 1.5px solid #e2ddd5;
          cursor: pointer; transition: ${TOKEN.t1};
        }
        .aup-btn-secondary:hover { background: #f5f3ef; border-color: #d5d0c6; }

        .aup-btn-danger {
          padding: 9px 20px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 700;
          background: #ef4444; color: #fff;
          border: none; cursor: pointer; transition: ${TOKEN.t1};
        }
        .aup-btn-danger:hover { background: #dc2626; box-shadow: 0 4px 14px rgba(239,68,68,0.35); transform: translateY(-1px); }

        /* ── Booking card ── */
        .aup-booking-card {
          background: #faf9f7;
          border: 1.5px solid #f0ede6;
          border-radius: 14px;
          padding: 14px 16px;
          transition: border-color 0.15s;
        }
        .aup-booking-card:hover { border-color: #e2ddd5; }

        /* ── Detail item (view modal) ── */
        .aup-detail-item {}
        .aup-detail-label {
          font-size: 10px; font-weight: 700;
          color: ${TOKEN.ink3}; text-transform: uppercase;
          letter-spacing: 0.07em; margin: 0 0 3px;
          display: flex; align-items: center; gap: 4px;
          font-family: 'DM Sans', sans-serif;
        }
        .aup-detail-value {
          font-size: 13px; font-weight: 500;
          color: ${TOKEN.ink1}; margin: 0;
          word-break: break-all;
          font-family: 'DM Sans', sans-serif;
        }
        .aup-detail-value.small { font-size: 12px; }

        /* ── Spinner ── */
        .aup-spinner {
          width: 32px; height: 32px;
          border: 3px solid #f0ede6;
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Loading skeleton ── */
        .aup-skeleton {
          height: 62px;
          background: linear-gradient(90deg, #f5f3ef 25%, #eceae4 50%, #f5f3ef 75%);
          background-size: 200% 100%;
          border-radius: 12px;
          animation: shimmer 1.4s infinite;
          border: 1.5px solid #ede9e0;
        }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .aup-wrap { padding: 24px 20px 48px; }
          .aup-stat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .aup-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .aup-stat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="aup-wrap">

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
          <div>
            <h1 className="aup-title">User Management</h1>
            <p className="aup-subtitle">Manage all users, guides, hotel owners, and administrators</p>
          </div>
          <button className="aup-add-btn"
            onClick={() => { setAddAdminModal(true); setAddAdminForm({ name: '', email: '', password: '' }); }}>
            <UserPlus size={15} strokeWidth={2.5} />
            Add Admin
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="aup-stat-grid">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} className={`aup-stat-card ${isActive ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}>

                {/* Pending pill */}
                {tab.key === 'guide' && pendingGuides > 0 && (
                  <span className="aup-pending-pill" style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#ef4444',
                    color: isActive ? '#fff' : '#fff',
                  }}>
                    {pendingGuides} pending
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="aup-stat-label" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : TOKEN.ink3 }}>
                      {tab.label}
                    </p>
                    <p className="aup-stat-num" style={{ color: isActive ? '#fff' : TOKEN.ink1 }}>
                      {counts[tab.key]}
                    </p>
                  </div>
                  <div className="aup-stat-icon" style={{
                    background: isActive ? 'rgba(255,255,255,0.2)' : '#f5f3ef',
                  }}>
                    <Icon size={20} style={{ color: isActive ? '#fff' : TOKEN.accent }} strokeWidth={2} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          {/* Search */}
          <div className="aup-searchbar">
            <Search size={15} style={{ color: TOKEN.ink3, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email…"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TOKEN.ink4, display: 'flex', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ flex: 1 }} />

          <span style={{
            fontSize: 12, fontWeight: 600, color: TOKEN.ink3,
            background: '#f0ede6', padding: '5px 13px',
            borderRadius: 20, border: '1px solid #e5e0d6',
            whiteSpace: 'nowrap',
          }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Pending Guides Alert ── */}
        {activeTab !== 'admin' && activeTab !== 'user' && activeTab !== 'hotelOwner' && pendingGuides > 0 && (
          <div className="aup-alert">
            <div className="aup-alert-icon">
              <Clock size={17} style={{ color: TOKEN.accentDark }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0 }}>
                {pendingGuides} guide registration{pendingGuides > 1 ? 's' : ''} pending approval
              </p>
              <p style={{ fontSize: 12, color: TOKEN.amberText, margin: '2px 0 0', fontWeight: 400 }}>
                Review and approve or reject pending guide registrations below
              </p>
            </div>
            {activeTab !== 'guide' && (
              <button className="aup-btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}
                onClick={() => { setActiveTab('guide'); setPage(1); }}>
                View Guides
              </button>
            )}
          </div>
        )}

        {/* ── Table / Loading / Empty ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="aup-skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="aup-table-card">
            <div style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: '#f5f3ef', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Users size={28} style={{ color: TOKEN.ink4 }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: TOKEN.ink2, margin: '0 0 4px' }}>No users found</p>
              <p style={{ fontSize: 13, color: TOKEN.ink3, margin: 0 }}>Try adjusting your search or tab filter</p>
            </div>
          </div>
        ) : (
          <div className="aup-table-card">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  {(activeTab === 'all' || activeTab === 'guide') && <th>Approval</th>}
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(u => (
                  <tr key={u._id}>

                    {/* Avatar + Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="aup-avatar" />
                        ) : (
                          <div className="aup-avatar-placeholder"
                            style={{ background: ROLE_GRADIENT[u.role] || ROLE_GRADIENT.user }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: TOKEN.ink1, display: 'block', letterSpacing: '-0.1px' }}>
                            {u.name}
                          </span>
                          {u.role === 'guide' && u.guideProfile?.location && (
                            <span style={{ fontSize: 11, color: TOKEN.ink3, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                              <MapPin size={9} /> {u.guideProfile.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td>
                      <span style={{ fontSize: 13, color: TOKEN.ink2, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                        {u.email}
                      </span>
                    </td>

                    {/* Role */}
                    <td><RoleBadge role={u.role} /></td>

                    {/* Status */}
                    <td><StatusBadge status={u.status || 'active'} /></td>

                    {/* Approval */}
                    {(activeTab === 'all' || activeTab === 'guide') && (
                      <td>
                        {u.role === 'guide'
                          ? <ApprovalBadge status={u.guideProfile?.approvalStatus || 'pending'} />
                          : <span style={{ fontSize: 13, color: TOKEN.ink4 }}>—</span>}
                      </td>
                    )}

                    {/* Joined */}
                    <td>
                      <span style={{ fontSize: 12.5, color: TOKEN.ink3, fontWeight: 500 }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, position: 'relative' }}>

                        {/* Quick approve/reject for pending guides */}
                        {u.role === 'guide' && u.guideProfile?.approvalStatus === 'pending' && (
                          <>
                            <button className="aup-qa-approve" onClick={() => approveGuide(u._id)}>
                              <CheckCircle size={12} strokeWidth={2.5} /> Approve
                            </button>
                            <button className="aup-qa-reject" onClick={() => { setRejectModal(u._id); setRejectReason(''); }}>
                              <XCircle size={12} strokeWidth={2.5} /> Reject
                            </button>
                          </>
                        )}

                        {/* Actions dropdown */}
                        <div style={{ position: 'relative' }}>
                          <button
                            className={`aup-dd-trigger ${actionDropdown === u._id ? 'open' : ''}`}
                            onClick={e => { e.stopPropagation(); setActionDropdown(actionDropdown === u._id ? null : u._id); }}>
                            Actions <ChevronDown size={11} strokeWidth={2.5} style={{
                              transform: actionDropdown === u._id ? 'rotate(180deg)' : 'rotate(0)',
                              transition: 'transform 0.2s ease',
                            }} />
                          </button>

                          {actionDropdown === u._id && (
                            <div className="aup-dd-menu" onClick={e => e.stopPropagation()}>

                              <button className="aup-dd-item" onClick={() => viewUserDetails(u._id)}>
                                <Eye size={14} style={{ color: TOKEN.blueText }} /> View Details
                              </button>
                              <button className="aup-dd-item" onClick={() => openEdit(u)}>
                                <Pencil size={14} style={{ color: TOKEN.amberText }} /> Edit User
                              </button>

                              <div className="aup-dd-divider" />
                              <div className="aup-dd-section-label">Account Status</div>

                              {(u.status || 'active') !== 'active' && (
                                <button className="aup-dd-item" onClick={() => changeStatus(u._id, 'active')}>
                                  <PlayCircle size={14} style={{ color: TOKEN.greenText }} /> Set Active
                                </button>
                              )}
                              {(u.status || 'active') !== 'hold' && (
                                <button className="aup-dd-item" onClick={() => changeStatus(u._id, 'hold')}>
                                  <PauseCircle size={14} style={{ color: TOKEN.amberText }} /> Set On Hold
                                </button>
                              )}
                              {(u.status || 'active') !== 'deactivated' && (
                                <button className="aup-dd-item" onClick={() => changeStatus(u._id, 'deactivated')}>
                                  <Ban size={14} style={{ color: TOKEN.redText }} /> Deactivate
                                </button>
                              )}

                              <div className="aup-dd-divider" />
                              <div className="aup-dd-section-label">Change Role</div>

                              {u.role === 'user' && (
                                <>
                                  <button className="aup-dd-item" onClick={() => { setPromoteModal(u._id); setPromoteLocation(''); setActionDropdown(null); }}>
                                    <UserPlus size={14} style={{ color: TOKEN.blueText }} /> Promote to Guide
                                  </button>
                                  <button className="aup-dd-item" onClick={() => changeRole(u._id, 'admin')}>
                                    <Shield size={14} style={{ color: TOKEN.amberText }} /> Make Admin
                                  </button>
                                </>
                              )}
                              {u.role === 'guide' && (
                                <>
                                  {u.guideProfile?.approvalStatus === 'rejected' && (
                                    <button className="aup-dd-item" onClick={() => approveGuide(u._id)}>
                                      <CheckCircle size={14} style={{ color: TOKEN.greenText }} /> Re-approve Guide
                                    </button>
                                  )}
                                  <button className="aup-dd-item" onClick={() => { viewBookings(u._id); setActionDropdown(null); }}>
                                    <Eye size={14} style={{ color: TOKEN.blueText }} /> View Bookings
                                  </button>
                                  <button className="aup-dd-item" onClick={() => changeRole(u._id, 'user')}>
                                    <ShieldOff size={14} style={{ color: TOKEN.ink3 }} /> Demote to User
                                  </button>
                                </>
                              )}
                              {u.role === 'admin' && (
                                <button className="aup-dd-item" onClick={() => changeRole(u._id, 'user')}>
                                  <ShieldOff size={14} style={{ color: TOKEN.ink3 }} /> Demote to User
                                </button>
                              )}
                              {u.role === 'hotelOwner' && (
                                <button className="aup-dd-item" onClick={() => changeRole(u._id, 'user')}>
                                  <ShieldOff size={14} style={{ color: TOKEN.ink3 }} /> Demote to User
                                </button>
                              )}

                              <div className="aup-dd-divider" />
                              <button className="aup-dd-item danger" onClick={() => handleDelete(u._id)}>
                                <Trash2 size={14} /> Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderTop: '1.5px solid #f0ede6',
                background: '#faf9f7',
              }}>
                <span style={{ fontSize: 12.5, color: TOKEN.ink3, fontWeight: 500 }}>
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1}
                      className={`aup-pg-btn ${page === i + 1 ? 'active' : ''}`}
                      onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════ */}

      {/* Reject Guide */}
      {rejectModal && (
        <div className="aup-overlay" onClick={() => setRejectModal(null)}>
          <div className="aup-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="aup-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: TOKEN.redBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${TOKEN.redBorder}`,
                }}>
                  <XCircle size={17} style={{ color: TOKEN.redText }} />
                </div>
                <h3 className="aup-modal-title">Reject Guide Registration</h3>
              </div>
              <button className="aup-modal-close" onClick={() => setRejectModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="aup-modal-body">
              <p style={{ fontSize: 13, color: TOKEN.ink2, margin: '0 0 16px', lineHeight: 1.6 }}>
                This will prevent the guide from logging in. You can optionally provide a reason.
              </p>
              <label className="aup-label">Reason for rejection <span style={{ fontWeight: 400, color: TOKEN.ink4 }}>(optional)</span></label>
              <textarea
                className="aup-textarea"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this guide registration is being rejected…"
                rows={3}
              />
            </div>
            <div className="aup-modal-footer">
              <button className="aup-btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="aup-btn-danger" onClick={rejectGuide}>Reject Guide</button>
            </div>
          </div>
        </div>
      )}

      {/* Promote to Guide */}
      {promoteModal && (
        <div className="aup-overlay" onClick={() => setPromoteModal(null)}>
          <div className="aup-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="aup-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: TOKEN.amberBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${TOKEN.amberBorder}`,
                }}>
                  <UserPlus size={17} style={{ color: TOKEN.accentDark }} />
                </div>
                <h3 className="aup-modal-title">Promote to Guide</h3>
              </div>
              <button className="aup-modal-close" onClick={() => setPromoteModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="aup-modal-body">
              <p style={{ fontSize: 13, color: TOKEN.ink2, margin: '0 0 18px', lineHeight: 1.6 }}>
                This user will be promoted to a travel guide. A guide profile will be created automatically.
              </p>
              <label className="aup-label">Primary Location <span style={{ color: TOKEN.redText }}>*</span></label>
              <input
                className="aup-input"
                value={promoteLocation}
                onChange={e => setPromoteLocation(e.target.value)}
                placeholder="e.g. Colombo, Kandy, Ella…"
              />
            </div>
            <div className="aup-modal-footer">
              <button className="aup-btn-secondary" onClick={() => setPromoteModal(null)}>Cancel</button>
              <button className="aup-btn-primary" onClick={promoteToGuide}>Promote to Guide</button>
            </div>
          </div>
        </div>
      )}

      {/* View Bookings */}
      {bookingsModal && (
        <div className="aup-overlay" onClick={() => setBookingsModal(null)}>
          <div className="aup-modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
            <div className="aup-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: TOKEN.blueBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${TOKEN.blueBorder}`,
                }}>
                  <Calendar size={17} style={{ color: TOKEN.blueText }} />
                </div>
                <h3 className="aup-modal-title">
                  Guide Bookings — {users.find(u => u._id === bookingsModal)?.name || 'Guide'}
                </h3>
              </div>
              <button className="aup-modal-close" onClick={() => setBookingsModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="aup-modal-body" style={{ maxHeight: 440, overflowY: 'auto' }}>
              {bookingsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div className="aup-spinner" />
                </div>
              ) : bookingsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: '#f0ede6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <Calendar size={24} style={{ color: TOKEN.ink4 }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: TOKEN.ink3, margin: 0 }}>No bookings found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {bookingsData.map(b => (
                    <div key={b._id} className="aup-booking-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: TOKEN.ink1 }}>{b.travelerName}</span>
                          <span style={{ fontSize: 11.5, color: TOKEN.ink3, marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>
                            {b.userId?.email || b.email}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 20,
                          background: `${BOOKING_STATUS_COLORS[b.status] || '#6b7280'}15`,
                          color: BOOKING_STATUS_COLORS[b.status] || '#6b7280',
                          border: `1.5px solid ${BOOKING_STATUS_COLORS[b.status] || '#6b7280'}30`,
                          textTransform: 'capitalize', whiteSpace: 'nowrap',
                          letterSpacing: '0.03em',
                        }}>
                          {b.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 18, fontSize: 12, color: TOKEN.ink3, flexWrap: 'wrap' }}>
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
                    </div >
                  ))
}
                </div >
              )}
            </div >
  <div className="aup-modal-footer">
    <button className="aup-btn-secondary" onClick={() => setBookingsModal(null)}>Close</button>
  </div>
          </div >
        </div >
      )}

{/* Edit User */ }
{
  editModal && (
    <div className="aup-overlay" onClick={() => setEditModal(null)}>
      <div className="aup-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="aup-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: TOKEN.amberBg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${TOKEN.amberBorder}`,
            }}>
              <Pencil size={16} style={{ color: TOKEN.accentDark }} />
            </div>
            <h3 className="aup-modal-title">Edit User Details</h3>
          </div>
          <button className="aup-modal-close" onClick={() => setEditModal(null)}>
            <X size={16} />
          </button>
        </div>
        <div className="aup-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="aup-label">Full Name</label>
            <input className="aup-input" value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Enter full name" />
          </div>
          <div>
            <label className="aup-label">Email Address</label>
            <input className="aup-input" type="email" value={editForm.email}
              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="Enter email address" />
          </div>
          <div>
            <label className="aup-label">Phone Number</label>
            <input className="aup-input" type="tel" value={editForm.phone}
              onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="Enter phone number" />
          </div>
          <div>
            <label className="aup-label">
              New Password{' '}
              <span style={{ fontWeight: 400, color: TOKEN.ink4, textTransform: 'none', letterSpacing: 0 }}>
                — leave blank to keep current
              </span>
            </label>
            <input className="aup-input" type="password" value={editForm.password}
              onChange={e => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="Enter new password (min 6 characters)" />
          </div>
        </div>
        <div className="aup-modal-footer">
          <button className="aup-btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
          <button className="aup-btn-primary" onClick={saveEdit}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

{/* View User Details */ }
{
  viewModal && (
    <div className="aup-overlay" onClick={() => { setViewModal(null); setViewData(null); }}>
      <div className="aup-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="aup-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: TOKEN.blueBg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${TOKEN.blueBorder}`,
            }}>
              <Eye size={16} style={{ color: TOKEN.blueText }} />
            </div>
            <h3 className="aup-modal-title">User Details</h3>
          </div>
          <button className="aup-modal-close" onClick={() => { setViewModal(null); setViewData(null); }}>
            <X size={16} />
          </button>
        </div>
        <div className="aup-modal-body" style={{ maxHeight: 520, overflowY: 'auto' }}>
          {viewLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="aup-spinner" />
            </div>
          ) : viewData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Avatar + name row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 18,
                paddingBottom: 18, borderBottom: '1.5px solid #f0ede6',
              }}>
                {viewData.avatar ? (
                  <img src={viewData.avatar} alt={viewData.name}
                    style={{ width: 68, height: 68, borderRadius: 18, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 68, height: 68, borderRadius: 18, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 800, color: '#fff',
                    background: ROLE_GRADIENT[viewData.role] || ROLE_GRADIENT.user,
                    fontFamily: "'Syne', sans-serif",
                  }}>
                    {viewData.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, color: TOKEN.ink1, margin: '0 0 8px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.3px' }}>
                    {viewData.name}
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <RoleBadge role={viewData.role} />
                    <StatusBadge status={viewData.status || 'active'} />
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DetailItem icon={<Mail size={12} />} label="Email" value={viewData.email} />
                <DetailItem icon={<Phone size={12} />} label="Phone" value={viewData.phone || 'Not set'} />
                <DetailItem icon={<Shield size={12} />} label="Role" value={ROLE_CONFIG[viewData.role]?.label || viewData.role} />
                <DetailItem icon={<Key size={12} />} label="Password" value="••••••••" />
                <DetailItem icon={<Calendar size={12} />} label="Joined" value={new Date(viewData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                <DetailItem icon={<Clock size={12} />} label="Last Updated" value={new Date(viewData.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
              </div>

              {/* Guide Profile */}
              {viewData.guideProfile && (
                <div style={{
                  background: '#f9f8f5', borderRadius: 14,
                  padding: '16px 18px', border: '1.5px solid #f0ede6',
                }}>
                  <h4 style={{
                    fontSize: 12, fontWeight: 800, color: TOKEN.ink2,
                    margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <Compass size={13} style={{ color: TOKEN.blueText }} /> Guide Profile
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <DetailItem label="Location" value={viewData.guideProfile.location} small />
                    <DetailItem label="Experience" value={`${viewData.guideProfile.experience || 0} years`} small />
                    <DetailItem label="Price/Day" value={`LKR ${viewData.guideProfile.pricePerDay || 0}`} small />
                    <DetailItem label="Approval" value={viewData.guideProfile.approvalStatus} small />
                    {viewData.guideProfile.languages?.length > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <DetailItem label="Languages" value={viewData.guideProfile.languages.join(', ')} small />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hotel Owner Profile */}
              {viewData.hotelOwnerProfile && (
                <div style={{
                  background: '#f9f8f5', borderRadius: 14,
                  padding: '16px 18px', border: '1.5px solid #f0ede6',
                }}>
                  <h4 style={{
                    fontSize: 12, fontWeight: 800, color: TOKEN.ink2,
                    margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    <Hotel size={13} style={{ color: TOKEN.pinkText }} /> Hotel Owner Profile
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <DetailItem label="Full Name" value={viewData.hotelOwnerProfile.fullName} small />
                    <DetailItem label="Location" value={viewData.hotelOwnerProfile.location} small />
                    <DetailItem label="Phone" value={viewData.hotelOwnerProfile.phone || 'Not set'} small />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: TOKEN.ink3, textAlign: 'center', padding: '32px 0' }}>Failed to load user details</p>
          )}
        </div>
        <div className="aup-modal-footer">
          <button className="aup-btn-secondary" onClick={() => { setViewModal(null); setViewData(null); }}>Close</button>
          {viewData && (
            <button className="aup-btn-primary"
              onClick={() => { openEdit(viewData); setViewModal(null); setViewData(null); }}>
              Edit User
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

{/* Add Admin */ }
{
  addAdminModal && (
    <div className="aup-overlay" onClick={() => setAddAdminModal(false)}>
      <div className="aup-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="aup-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: TOKEN.amberBg, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${TOKEN.amberBorder}`,
            }}>
              <Shield size={17} style={{ color: TOKEN.accentDark }} />
            </div>
            <h3 className="aup-modal-title">Add New Admin</h3>
          </div>
          <button className="aup-modal-close" onClick={() => setAddAdminModal(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="aup-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{
            fontSize: 13, color: TOKEN.ink2, margin: 0, lineHeight: 1.6,
            background: '#f5f3ef', borderRadius: 10, padding: '10px 14px',
            border: '1.5px solid #ede9e0',
          }}>
            Create a new administrator account with full system access.
          </p>
          <div>
            <label className="aup-label">Full Name <span style={{ color: TOKEN.redText }}>*</span></label>
            <input className="aup-input" value={addAdminForm.name}
              onChange={e => setAddAdminForm({ ...addAdminForm, name: e.target.value })}
              placeholder="Enter admin name" />
          </div>
          <div>
            <label className="aup-label">Email Address <span style={{ color: TOKEN.redText }}>*</span></label>
            <input className="aup-input" type="email" value={addAdminForm.email}
              onChange={e => setAddAdminForm({ ...addAdminForm, email: e.target.value })}
              placeholder="Enter admin email" />
          </div>
          <div>
            <label className="aup-label">Password <span style={{ color: TOKEN.redText }}>*</span></label>
            <input className="aup-input" type="password" value={addAdminForm.password}
              onChange={e => setAddAdminForm({ ...addAdminForm, password: e.target.value })}
              placeholder="Min 6 characters" />
          </div>
        </div>
        <div className="aup-modal-footer">
          <button className="aup-btn-secondary" onClick={() => setAddAdminModal(false)}>Cancel</button>
          <button className="aup-btn-primary" onClick={handleAddAdmin} disabled={addAdminLoading}>
            {addAdminLoading ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </div>
    </div>
  )
}

    </AdminLayout >
  );
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function DetailItem({ icon, label, value, small }) {
  return (
    <div className="aup-detail-item">
      <p className="aup-detail-label">{icon} {label}</p>
      <p className={`aup-detail-value ${small ? 'small' : ''}`}>{value}</p>
    </div>
  );
}
