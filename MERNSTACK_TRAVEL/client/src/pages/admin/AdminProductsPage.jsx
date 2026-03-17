import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, ShoppingBag, Upload, Search, Eye, CheckCircle, XCircle, Ban, Package, CreditCard, X } from 'lucide-react';
import AdminTabs from '../../components/AdminTabs';

const CATEGORIES = ['Clothing','Gear','Accessories','Food','Souvenirs','Other'];
const EMPTY = { name:'', description:'', price:'', stock:'', category:'Clothing', weatherType:'BOTH' };

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatCurrency = (n) => `LKR ${Number(n).toLocaleString()}`;

export default function AdminProductsPage() {
  /* ───── shared ───── */
  const [activeTab, setActiveTab] = useState(0);

  /* ───── products state (unchanged) ───── */
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [weatherFilter, setWeatherFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  /* ───── orders state ───── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 8;
  const [slipModal, setSlipModal] = useState(null);

  /* ───── fetch on mount ───── */
  useEffect(() => {
    api.get('/products').then((r) => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
    api.get('/admin/product-orders').then((r) => { setOrders(r.data); setOrdersLoading(false); }).catch(() => setOrdersLoading(false));
  }, []);

  /* ───── products logic (unchanged) ───── */
  const openCreate = () => { setForm(EMPTY); setImages([]); setExistingImages([]); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category, weatherType: p.weatherType || 'BOTH' });
    setExistingImages(p.images || []); setImages([]); setEditId(p._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      const payload = { name: form.name, description: form.description, price: Number(form.price), stock: Number(form.stock), category: form.category, weatherType: form.weatherType };
      if (editId) payload.existingImages = existingImages;
      fd.append('data', JSON.stringify(payload));
      images.forEach((f) => fd.append('images', f));
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editId) { const r = await api.put(`/products/${editId}`, fd, { headers }); setProducts((p) => p.map((prod) => prod._id === editId ? r.data : prod)); toast.success('Product updated'); }
      else { const r = await api.post('/products', fd, { headers }); setProducts((p) => [r.data, ...p]); toast.success('Product created'); }
      closeForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); setProducts((p) => p.filter((prod) => prod._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return (categoryFilter === 'all' || p.category === categoryFilter) && (weatherFilter === 'all' || p.weatherType === weatherFilter) && matchSearch;
  });
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  /* ───── orders logic ───── */
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const orderCounts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const q = orderSearch.toLowerCase();
    const customerName = o.userId?.name?.toLowerCase() || '';
    const itemNames = (o.items || []).map(i => i.name?.toLowerCase() || '').join(' ');
    const matchSearch = !q || customerName.includes(q) || itemNames.includes(q);
    return matchStatus && matchSearch;
  });

  const paginatedOrders = filteredOrders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage);
  const orderTotalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/payments/product/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success(`Order ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: 0, overflow: 'hidden' }}>
        <AdminDrawer open={showForm} onClose={closeForm} title={editId ? 'Edit Product' : 'Add New Product'} saving={saving} onSubmit={handleSave} submitLabel={editId ? 'Update Product' : 'Create Product'}>
          <div className="field-row cols-4">
            <div className="field"><label>Product Name *</label><input required value={form.name} onChange={f('name')} placeholder="Enter product name" className="adm-input" /></div>
            <div className="field"><label>Category</label><select value={form.category} onChange={f('category')} className="adm-select">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Weather</label><select value={form.weatherType} onChange={f('weatherType')} className="adm-select"><option value="DRY">DRY</option><option value="RAINY">RAINY</option><option value="BOTH">BOTH</option></select></div>
            <div className="field"><label>Price ($)</label><input type="number" step="0.01" value={form.price} onChange={f('price')} placeholder="29.99" className="adm-input" /></div>
          </div>
          <div className="field-row cols-2">
            <div className="field"><label>Description</label><textarea value={form.description} onChange={f('description')} rows={3} placeholder="Describe this product..." className="adm-textarea" /></div>
            <div className="field-row cols-2" style={{ marginBottom: 0, alignSelf: 'start' }}>
              <div className="field"><label>Stock</label><input type="number" min={0} value={form.stock} onChange={f('stock')} placeholder="100" className="adm-input" /></div>
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
          </div>
        </AdminDrawer>

        <AdminTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { label: 'Products', icon: ShoppingBag },
            { label: 'Orders & Payments', icon: CreditCard, badge: pendingOrdersCount },
          ]}
        />

        {/* ═══════════════ TAB 0 — Products ═══════════════ */}
        {activeTab === 0 && (
          <>
            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." /></div>
              <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="adm-filter-select"><option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={weatherFilter} onChange={e => { setWeatherFilter(e.target.value); setPage(1); }} className="adm-filter-select"><option value="all">All Weather</option><option value="DRY">DRY</option><option value="RAINY">RAINY</option><option value="BOTH">BOTH</option></select>
              <div style={{ flex: 1 }} />
              {!showForm && <button onClick={openCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> Add Product</button>}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
            ) : filtered.length === 0 ? (
              <div className="adm-table-wrap"><div className="text-center py-16"><ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No products found</p></div></div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Weather</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {paginated.map((p) => (
                        <tr key={p._id}>
                          <td><div className="flex items-center gap-3">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-indigo-50"><ShoppingBag size={18} className="text-indigo-600" /></div>}<span className="text-sm font-semibold text-gray-900">{p.name}</span></div></td>
                          <td><span className="adm-badge adm-badge-neutral">{p.category}</span></td>
                          <td className="text-sm font-bold text-gray-900">${p.price}</td>
                          <td>
                            <span className={`text-sm font-bold ${p.stock <= 5 ? 'text-red-600' : 'text-gray-600'}`}>{p.stock}</span>
                            {p.stock <= 5 && <span className="adm-badge adm-badge-inactive ml-1.5" style={{ color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca', fontSize: '10px', padding: '1px 6px' }}>Low</span>}
                          </td>
                          <td><span className="adm-badge adm-badge-neutral">{p.weatherType}</span></td>
                          <td><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(p)} className="adm-btn-edit"><Pencil size={14} /> Edit</button><button onClick={() => handleDelete(p._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button></div></td>
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

        {/* ═══════════════ TAB 1 — Orders & Payments ═══════════════ */}
        {activeTab === 1 && (
          <>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Total Orders', value: orderCounts.total, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
                { label: 'Pending', value: orderCounts.pending, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
                { label: 'Confirmed', value: orderCounts.confirmed, color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
                { label: 'Rejected', value: orderCounts.rejected, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {['all', 'pending', 'confirmed', 'rejected', 'cancelled'].map(s => (
                <button key={s} onClick={() => { setOrderStatusFilter(s); setOrderPage(1); }}
                  style={{
                    padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                    background: orderStatusFilter === s ? '#f59e0b' : '#f3f4f6',
                    color: orderStatusFilter === s ? '#fff' : '#6b7280',
                  }}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={orderSearch} onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }} placeholder="Search by customer or item name..." /></div>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ height: 56, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb' }} className="animate-pulse" />)}</div>
            ) : filteredOrders.length === 0 ? (
              <div className="adm-table-wrap" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Package size={48} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#6b7280' }}>No orders found</p>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {paginatedOrders.map((o) => {
                        const itemNames = (o.items || []).map(i => i.name).join(', ');
                        return (
                          <tr key={o._id}>
                            <td><div><span className="text-sm font-semibold text-gray-900" style={{ display: 'block' }}>{o.userId?.name || 'Unknown'}</span><span className="text-xs text-gray-400">{o.userId?.email || ''}</span></div></td>
                            <td><span className="text-sm text-gray-700" title={itemNames}>{itemNames.length > 40 ? itemNames.slice(0, 40) + '...' : itemNames}</span></td>
                            <td className="text-sm font-bold text-gray-900">{formatCurrency(o.amount)}</td>
                            <td className="text-sm text-gray-500">{formatDate(o.createdAt)}</td>
                            <td>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                background: { pending: '#fef3c7', confirmed: '#d1fae5', rejected: '#fee2e2', cancelled: '#f3f4f6' }[o.status] || '#f3f4f6',
                                color: { pending: '#92400e', confirmed: '#065f46', rejected: '#991b1b', cancelled: '#4b5563' }[o.status] || '#4b5563',
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: { pending: '#f59e0b', confirmed: '#10b981', rejected: '#ef4444', cancelled: '#9ca3af' }[o.status] }} />
                                {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                {o.slipUrl && <button onClick={() => setSlipModal(o.slipUrl)} className="adm-btn-edit"><Eye size={14} /> Slip</button>}
                                {o.status === 'pending' && (
                                  <>
                                    <button onClick={() => updateOrderStatus(o._id, 'confirmed')} className="adm-btn-edit" style={{ color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4' }}><CheckCircle size={14} /> Approve</button>
                                    <button onClick={() => updateOrderStatus(o._id, 'rejected')} className="adm-btn-delete"><XCircle size={14} /> Reject</button>
                                  </>
                                )}
                                {(o.status === 'pending' || o.status === 'confirmed') && <button onClick={() => updateOrderStatus(o._id, 'cancelled')} className="adm-btn-edit" style={{ color: '#6b7280', borderColor: '#d1d5db' }}><Ban size={14} /> Cancel</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {orderTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <span className="text-sm text-gray-500">Showing {(orderPage-1)*ordersPerPage+1}&ndash;{Math.min(orderPage*ordersPerPage, filteredOrders.length)} of {filteredOrders.length}</span>
                    <div className="flex gap-1.5">{Array.from({ length: orderTotalPages }, (_, i) => <button key={i+1} onClick={() => setOrderPage(i+1)} className={`adm-page-btn ${orderPage === i+1 ? 'active' : ''}`}>{i+1}</button>)}</div>
                  </div>
                )}
              </div>
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
