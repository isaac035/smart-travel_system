import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  Users,
  MapPin,
  Hotel,
  Compass,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Eye,
  CreditCard,
  Map,
  ShoppingBag,
  Package,
  BarChart3,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const PIE_COLORS = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

const TYPE_CONFIG = {
  hotel: { label: 'Hotel', color: '#8b5cf6', bg: '#f5f3ff', icon: Hotel, link: '/admin/hotels' },
  tour: { label: 'Tour', color: '#f59e0b', bg: '#fffbeb', icon: Map, link: '/admin/tours' },
  guide: { label: 'Guide', color: '#06b6d4', bg: '#ecfeff', icon: Compass, link: '/admin/guides' },
  product: { label: 'Product', color: '#ec4899', bg: '#fdf2f8', icon: ShoppingBag, link: '/admin/products' },
};

const STATUS_BADGE = {
  pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  pending_deposit: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  deposit_submitted: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  confirmed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  admin_confirmed: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  fully_paid: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  completed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  guide_rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  cancelled: { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
  cancelled_by_user: { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
  cancelled_by_admin: { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
};

const ACTIVITY_DOTS = {
  hotel: '#8b5cf6',
  tour: '#f59e0b',
  guide: '#06b6d4',
  product: '#ec4899',
  user: '#3b82f6',
};

const DEST_COLORS = [
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#d1fae5', color: '#059669' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#fee2e2', color: '#dc2626' },
  { bg: '#cffafe', color: '#0891b2' },
];

function formatDate(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtShortDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtLKR(amount) {
  if (!amount && amount !== 0) return 'LKR 0';
  return `LKR ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return fmtShortDate(dateStr);
}

// Shared card style
const CARD = {
  background: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slipModal, setSlipModal] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/payments'),
    ]).then(([statsRes, paymentsRes]) => {
      setStats(statsRes.data);
      setRecentPayments(paymentsRes.data.slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalBookings =
    (stats?.hotelBookings ?? 0) +
    (stats?.tourBookings ?? 0) +
    (stats?.guideBookings ?? 0) +
    (stats?.productOrders ?? 0);

  const kpiCards = [
    { key: 'users', label: 'Total Users', icon: Users, to: '/admin/users', iconBg: '#eff6ff', iconColor: '#3b82f6' },
    { key: '_totalBookings', label: 'Total Bookings', icon: CreditCard, to: null, iconBg: '#fef3c7', iconColor: '#d97706' },
    { key: '_revenue', label: 'Total Revenue', icon: BarChart3, to: null, iconBg: '#d1fae5', iconColor: '#059669' },
    { key: 'locations', label: 'Locations', icon: MapPin, to: '/admin/locations', iconBg: '#fce7f3', iconColor: '#db2777' },
    { key: 'hotels', label: 'Hotels', icon: Hotel, to: '/admin/hotels', iconBg: '#ede9fe', iconColor: '#7c3aed' },
    { key: 'guides', label: 'Guides', icon: Compass, to: '/admin/guides', iconBg: '#cffafe', iconColor: '#0891b2' },
  ];

  const pieData = [
    { name: 'Hotel', value: stats?.hotelBookings ?? 0 },
    { name: 'Tour', value: stats?.tourBookings ?? 0 },
    { name: 'Guide', value: stats?.guideBookings ?? 0 },
    { name: 'Product', value: stats?.productOrders ?? 0 },
  ].filter(d => d.value > 0);

  const monthlyRevenue = stats?.monthlyRevenue || [];
  const popularDestinations = stats?.popularDestinations || [];
  const recentActivity = stats?.recentActivity || [];

  function getKpiValue(card) {
    if (card.key === '_totalBookings') return totalBookings;
    if (card.key === '_revenue') return stats?.totalRevenue ?? 0;
    return stats?.[card.key] ?? 0;
  }

  function formatKpiValue(card, value) {
    if (card.key === '_revenue') return fmtLKR(value);
    return value.toLocaleString();
  }

  // Skeleton block
  const Skeleton = ({ w, h, r = 8 }) => (
    <div style={{ width: w, height: h, background: '#f3f4f6', borderRadius: r, animation: 'pulse 1.5s ease-in-out infinite' }} />
  );

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1320, margin: '0 auto' }}>

        {/* Welcome Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Welcome back{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
              Here's what's happening with Ceylon Compass today
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569',
            fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 12,
          }}>
            <Calendar size={15} style={{ color: '#94a3b8' }} />
            {formatDate(new Date())}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 20, marginBottom: 28 }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ ...CARD, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <Skeleton w={48} h={48} r={14} />
                  <Skeleton w={50} h={22} r={12} />
                </div>
                <Skeleton w={80} h={32} r={8} />
                <div style={{ marginTop: 8 }}><Skeleton w={90} h={16} /></div>
              </div>
            ))
          ) : (
            kpiCards.map((card) => {
              const Icon = card.icon;
              const value = getKpiValue(card);
              const inner = (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: card.iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} style={{ color: card.iconColor }} />
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                      background: '#f0fdf4', color: '#16a34a',
                    }}>
                      <TrendingUp size={12} />
                      Live
                    </div>
                  </div>
                  <div style={{ fontSize: card.key === '_revenue' ? 22 : 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {formatKpiValue(card, value)}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, fontWeight: 500 }}>{card.label}</div>
                </>
              );
              if (card.to) {
                return (
                  <Link key={card.key} to={card.to} style={{
                    ...CARD, padding: 24, textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = CARD.boxShadow; e.currentTarget.style.transform = 'none'; }}
                  >
                    {inner}
                  </Link>
                );
              }
              return <div key={card.key} style={{ ...CARD, padding: 24 }}>{inner}</div>;
            })
          )}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* Revenue Overview */}
          <div style={{ ...CARD, padding: '22px 24px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Revenue Overview</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{new Date().getFullYear()} monthly breakdown (LKR)</p>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#059669',
                background: '#f0fdf4', padding: '6px 14px', borderRadius: 10,
              }}>
                {fmtLKR(stats?.totalRevenue || 0)}
              </div>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={8} />
                  <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} dx={-4} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '10px 16px' }}
                    formatter={(value) => [fmtLKR(value), 'Revenue']}
                    labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#amberGradient)" dot={false} activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bookings by Type */}
          <div style={{ ...CARD, padding: '22px 24px 16px' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Bookings by Type</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px' }}>{totalBookings} total bookings</p>
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData.length > 0 ? pieData : [{ name: 'None', value: 1 }]} cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={pieData.length > 1 ? 4 : 0} dataKey="value" stroke="none">
                    {(pieData.length > 0 ? pieData : [{ name: 'None', value: 1 }]).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieData.length > 0 ? PIE_COLORS[index % PIE_COLORS.length] : '#e5e7eb'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '8px 14px' }}
                    formatter={(value, name) => [`${value} bookings`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 4 }}>
              {pieData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[index % PIE_COLORS.length], display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>{entry.name}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Row — Destinations + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* Popular Destinations */}
          <div style={{ ...CARD, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Popular Destinations</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Top locations by bookings</p>
              </div>
              <Link to="/admin/locations" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, fontWeight: 600, color: '#d97706', textDecoration: 'none',
                padding: '6px 14px', borderRadius: 10, background: '#fffbeb',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'}
              onMouseLeave={e => e.currentTarget.style.background = '#fffbeb'}
              >
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {popularDestinations.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <MapPin size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>No destination data yet</p>
                </div>
              )}
              {popularDestinations.map((dest, index) => {
                const dc = DEST_COLORS[index % DEST_COLORS.length];
                return (
                  <div key={dest.name || index} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                    borderRadius: 12, transition: 'background 0.15s', cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, width: 20, textAlign: 'right' }}>{index + 1}</span>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: dc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <MapPin size={18} style={{ color: dc.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{dest.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{dest.district ? `${dest.district} District` : dest.province || ''}</div>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#475569',
                      background: '#f1f5f9', padding: '5px 12px', borderRadius: 20,
                    }}>
                      {dest.bookings} {dest.bookings === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...CARD, padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Activity</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Latest actions across the platform</p>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Clock size={16} style={{ color: '#94a3b8' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentActivity.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Clock size={36} style={{ color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>No recent activity</p>
                </div>
              )}
              {recentActivity.map((item, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 14px',
                  borderRadius: 12, transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: ACTIVITY_DOTS[item.type] || '#94a3b8',
                    marginTop: 5, flexShrink: 0,
                    boxShadow: `0 0 0 3px ${(ACTIVITY_DOTS[item.type] || '#94a3b8')}22`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, margin: 0 }}>{item.text}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      {item.sub && <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{item.sub}</span>}
                      {item.sub && <span style={{ fontSize: 11, color: '#d1d5db' }}>·</span>}
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payments Section */}
        <div style={{ ...CARD, padding: '28px 28px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CreditCard size={22} style={{ color: '#d97706' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Recent Payments</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>Latest payment slips across all modules</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => <div key={i} style={{ height: 56, background: '#f8fafc', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : recentPayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <CreditCard size={48} style={{ color: '#e2e8f0', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>No payment slips yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                  <tr>
                    {['Type', 'Customer', 'Reference', 'Amount', 'Date', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i === 6 ? 'right' : 'left',
                        fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase',
                        letterSpacing: '0.06em', padding: '12px 16px', borderBottom: '2px solid #f1f5f9',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => {
                    const typeConf = TYPE_CONFIG[p.type] || TYPE_CONFIG.hotel;
                    const TypeIcon = typeConf.icon;
                    const statusConf = STATUS_BADGE[p.status] || STATUS_BADGE.pending;
                    const statusLabel = (p.status || 'pending').replace(/_/g, ' ');
                    return (
                      <tr key={`${p.type}-${p._id}`} style={{ transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <Link to={typeConf.link} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <span style={{
                              width: 32, height: 32, borderRadius: 10,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: typeConf.bg,
                            }}>
                              <TypeIcon size={15} style={{ color: typeConf.color }} />
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: typeConf.color }}>{typeConf.label}</span>
                          </Link>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{p.user?.name || 'Unknown'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.user?.email}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.reference}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#111827' }}>{fmtLKR(p.amount)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280' }}>{fmtShortDate(p.createdAt)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                            background: statusConf.bg, color: statusConf.text, border: `1px solid ${statusConf.border}`,
                            textTransform: 'capitalize', whiteSpace: 'nowrap',
                          }}>
                            {statusLabel}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            {p.slipUrl && (
                              <button onClick={() => setSlipModal(p.slipUrl)} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 12, fontWeight: 600, color: '#6b7280',
                                padding: '6px 12px', borderRadius: 8,
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#374151'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#6b7280'; }}
                              >
                                <Eye size={13} /> Slip
                              </button>
                            )}
                            <Link to={typeConf.link} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 12, fontWeight: 600, color: '#d97706',
                              padding: '6px 12px', borderRadius: 8,
                              background: '#fffbeb', border: '1px solid #fde68a',
                              textDecoration: 'none', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef3c7'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; }}
                            >
                              Manage
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slip Preview Modal */}
      {slipModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }}
        onClick={() => setSlipModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 10,
            maxWidth: '90vw', maxHeight: '90vh',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          }}
          onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px 14px' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Payment Slip</span>
              <button onClick={() => setSlipModal(null)} style={{
                background: '#f1f5f9', border: 'none', borderRadius: 10,
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#64748b', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >&times;</button>
            </div>
            <img src={slipModal} alt="Payment slip" style={{ maxWidth: '80vw', maxHeight: '75vh', borderRadius: 14, objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
