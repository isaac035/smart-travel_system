import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Hotel,
  Compass,
  Map,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  Search,
} from 'lucide-react';
import { formatLKR } from '../../utils/currency';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

const statusConfig = {
  pending: { color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20', icon: Clock },
  confirmed: { color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20', icon: CheckCircle2 },
  rejected: { color: 'bg-red-50 text-red-700 ring-1 ring-red-600/20', icon: XCircle },
  cancelled: { color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', icon: XCircle },
};

const typeConfig = {
  hotel:   { color: 'bg-violet-50 text-violet-700', icon: Hotel,       label: 'Hotel' },
  guide:   { color: 'bg-cyan-50 text-cyan-700',     icon: Compass,     label: 'Guide' },
  tour:    { color: 'bg-rose-50 text-rose-700',     icon: Map,         label: 'Tour' },
  product: { color: 'bg-orange-50 text-orange-700', icon: ShoppingBag, label: 'Travel Product' },
};

const defaultType = { color: 'bg-slate-100 text-slate-600', icon: CreditCard, label: 'Order' };

const monthlyBookingsData = [
  { month: 'Jan', bookings: 45 }, { month: 'Feb', bookings: 52 }, { month: 'Mar', bookings: 61 },
  { month: 'Apr', bookings: 78 }, { month: 'May', bookings: 95 }, { month: 'Jun', bookings: 110 },
  { month: 'Jul', bookings: 125 }, { month: 'Aug', bookings: 118 }, { month: 'Sep', bookings: 92 },
  { month: 'Oct', bookings: 85 }, { month: 'Nov', bookings: 70 }, { month: 'Dec', bookings: 98 },
];

const monthlyRevenueData = [
  { month: 'Jan', revenue: 12500 }, { month: 'Feb', revenue: 15200 }, { month: 'Mar', revenue: 18900 },
  { month: 'Apr', revenue: 22400 }, { month: 'May', revenue: 28500 }, { month: 'Jun', revenue: 34200 },
  { month: 'Jul', revenue: 38900 }, { month: 'Aug', revenue: 35600 }, { month: 'Sep', revenue: 27800 },
  { month: 'Oct', revenue: 24500 }, { month: 'Nov', revenue: 19800 }, { month: 'Dec', revenue: 31200 },
];

const CustomTooltip = ({ active, payload, label, isCurrency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-sm text-amber-600 font-medium mt-0.5">
        {isCurrency ? formatLKR(payload[0].value) : payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    api.get('/admin/payments').then((r) => { setPayments(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const updateStatus = async (type, id, status) => {
    setUpdating(id);
    try {
      await api.put(`/admin/payments/${type}/${id}/status`, { status });
      setPayments((prev) => prev.map((p) => p._id === id ? { ...p, status } : p));
      toast.success(`Booking ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const searchFiltered = payments.filter((p) => {
    const matchSearch = !search || (p.reference || '').toLowerCase().includes(search.toLowerCase()) || (p.user?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter || p.type === filter;
    return matchSearch && matchFilter;
  });
  const filtered = searchFiltered;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const counts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    confirmed: payments.filter((p) => p.status === 'confirmed').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  };

  const totalRevenue = payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + (p.amount || 0), 0);

  const summaryCards = [
    { label: 'Total Bookings', value: payments.length, icon: BarChart3, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { label: 'Total Revenue', value: formatLKR(totalRevenue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
    { label: 'Pending', value: counts.pending, icon: Clock, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
    { label: 'Confirmed', value: counts.confirmed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
  ];

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-sm text-gray-500 mt-1">Review payment slips and manage booking statuses</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by reference or name..." className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900">{card.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{card.label}</div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bookings Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Bookings Per Month</h3>
                <p className="text-sm text-slate-500 mt-0.5">Monthly booking trends</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                +12.5%
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyBookingsData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="bookings" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Revenue Per Month</h3>
                <p className="text-sm text-slate-500 mt-0.5">Monthly revenue overview</p>
              </div>
              <div className="text-lg font-bold text-slate-900">{formatLKR(monthlyRevenueData.reduce((s, d) => s + d.revenue, 0))}</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatLKR(v)} />
                <Tooltip content={<CustomTooltip isCurrency />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                filter === key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === key ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No payments found</p>
            <p className="text-slate-400 text-sm mt-1">Payments will appear here once bookings are made</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((p) => {
              const type = typeConfig[p.type] || defaultType;
              const status = statusConfig[p.status] || statusConfig.pending;
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;
              return (
                <div key={p._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Type badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${type.color} flex-shrink-0 self-start`}>
                    <TypeIcon className="w-3.5 h-3.5" />
                    {type.label}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{p.reference}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                      <span>{p.user?.name} ({p.user?.email})</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-amber-600 font-bold">{formatLKR(p.amount?.toFixed(2))}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Slip */}
                  {p.slipUrl ? (
                    <button
                      onClick={() => setPreview(p.slipUrl)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Slip
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex-shrink-0">No slip</span>
                  )}

                  {/* Actions */}
                  {p.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateStatus(p.type, p._id, 'confirmed')}
                        disabled={updating === p._id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(p.type, p._id, 'rejected')}
                        disabled={updating === p._id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === i + 1 ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slip Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-12 right-0 flex items-center justify-center w-9 h-9 bg-white rounded-full shadow-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={preview} alt="Payment slip" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
