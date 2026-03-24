import { useState, useEffect } from 'react'; 
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, ShoppingBag, Upload, Search, Eye, CheckCircle, XCircle, Ban, Package, CreditCard, X, Layers, Landmark } from 'lucide-react';
import AdminTabs from '../../components/AdminTabs';

const CATEGORIES = ['Clothing','Gear','Accessories','Food','Souvenirs','Other'];
const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'coming_soon', label: 'Coming Soon' },
  { value: 'pre_order', label: 'Pre Order' },
];
const EMPTY = { name:'', description:'', price:'', stock:'', category:'Clothing', weatherType:'BOTH', availability:'in_stock', location: ['All Locations'] };
const EMPTY_BUNDLE = { name: '', description: '', totalPrice: '', discount: 0, products: [], location: ['All Locations'] };

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatCurrency = (n) => `LKR ${Number(n).toLocaleString()}`;

export default function AdminProductsPage() {
  /* ───── shared ───── */
  const [activeTab, setActiveTab] = useState(0);

  /* ───── products state (unchanged) ───── */
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
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

  /* ───── bundles state ───── */
  const [bundles, setBundles] = useState([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [bundleForm, setBundleForm] = useState(EMPTY_BUNDLE);
  const [bundleEditId, setBundleEditId] = useState(null);
  const [bundleImages, setBundleImages] = useState([]);
  const [bundleExistingImages, setBundleExistingImages] = useState([]);
  const [savingBundle, setSavingBundle] = useState(false);
  const [bundleSearch, setBundleSearch] = useState('');
  const [bundlePage, setBundlePage] = useState(1);

  /* ───── orders state ───── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 8;
  const [slipModal, setSlipModal] = useState(null);

  /* ───── bank accounts state ───── */
  const EMPTY_BANK = { bankName: '', accountNumber: '', branch: '' };
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankForm, setBankForm] = useState(EMPTY_BANK);
  const [bankEditId, setBankEditId] = useState(null);
  const [savingBank, setSavingBank] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);

  /* ───── fetch on mount ───── */
  useEffect(() => {
    api.get('/locations').then((r) => setLocations(r.data)).catch(() => {});
    api.get('/products').then((r) => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
    api.get('/bundles').then((r) => { setBundles(r.data); setBundlesLoading(false); }).catch(() => setBundlesLoading(false));
    api.get('/admin/product-orders').then((r) => { setOrders(r.data); setOrdersLoading(false); }).catch(() => setOrdersLoading(false));
    api.get('/bank-accounts').then((r) => { setBankAccounts(r.data); setBankLoading(false); }).catch(() => setBankLoading(false));
  }, []);

  /* ───── bank accounts logic ───── */
  const openBankCreate = () => { setBankForm(EMPTY_BANK); setBankEditId(null); setShowBankForm(true); };
  const openBankEdit = (acc) => { setBankForm({ bankName: acc.bankName, accountNumber: acc.accountNumber, branch: acc.branch }); setBankEditId(acc._id); setShowBankForm(true); };
  const closeBankForm = () => { setShowBankForm(false); setBankEditId(null); setBankForm(EMPTY_BANK); };

  const handleBankSave = async (e) => {
    e.preventDefault();
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.branch) return toast.error('All fields required');
    setSavingBank(true);
    try {
      if (bankEditId) {
        const r = await api.put(`/bank-accounts/${bankEditId}`, bankForm);
        setBankAccounts(prev => prev.map(a => a._id === bankEditId ? r.data : a));
        toast.success('Bank account updated');
      } else {
        const r = await api.post('/bank-accounts', bankForm);
        setBankAccounts(prev => [r.data, ...prev]);
        toast.success('Bank account added');
      }
      closeBankForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingBank(false); }
  };

  const handleBankDelete = async (id) => {
    if (!window.confirm('Delete this bank account?')) return;
    try { await api.delete(`/bank-accounts/${id}`); setBankAccounts(prev => prev.filter(a => a._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  /* ───── products logic (unchanged) ───── */
  const openCreate = () => { setForm(EMPTY); setImages([]); setExistingImages([]); setEditId(null); setShowForm(true); };
  const openEdit = (p) => {
    const locArray = Array.isArray(p.location) ? p.location : (p.location ? [p.location] : ['All Locations']);
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category, weatherType: p.weatherType || 'BOTH', availability: p.availability || 'in_stock', location: locArray });
    setExistingImages(p.images || []); setImages([]); setEditId(p._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      const payload = { name: form.name, description: form.description, price: Number(form.price), stock: Number(form.stock), category: form.category, weatherType: form.weatherType, availability: form.availability || 'in_stock', location: form.location && form.location.length > 0 ? form.location : ['All Locations'] };
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

  /* ───── bundles logic ───── */
  const openBundleCreate = () => { setBundleForm(EMPTY_BUNDLE); setBundleImages([]); setBundleExistingImages([]); setBundleEditId(null); setShowBundleForm(true); };
  const openBundleEdit = (b) => {
    const locArray = Array.isArray(b.location) ? b.location : (b.location ? [b.location] : ['All Locations']);
    setBundleForm({
      name: b.name, description: b.description || '', totalPrice: b.totalPrice,
      discount: b.discount || 0,
      products: b.products ? b.products.map(p => p._id || p) : [],
      location: locArray
    });
    setBundleExistingImages(b.images || []); setBundleImages([]); setBundleEditId(b._id); setShowBundleForm(true);
  };
  const closeBundleForm = () => { setShowBundleForm(false); setBundleEditId(null); };

  const handleBundleSave = async (e) => {
    e.preventDefault(); setSavingBundle(true);
    try {
      const fd = new FormData();
      const payload = { ...bundleForm, totalPrice: Number(bundleForm.totalPrice), discount: Number(bundleForm.discount) };
      payload.location = payload.location && payload.location.length > 0 ? payload.location : ['All Locations'];
      if (bundleEditId) payload.existingImages = bundleExistingImages;
      fd.append('data', JSON.stringify(payload));
      bundleImages.forEach((f) => fd.append('images', f));
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (bundleEditId) {
        const r = await api.put(`/bundles/${bundleEditId}`, fd, { headers });
        setBundles((b) => b.map((bun) => bun._id === bundleEditId ? r.data : bun));
        toast.success('Bundle updated');
      } else {
        const r = await api.post('/bundles', fd, { headers });
        setBundles((b) => [r.data, ...b]);
        toast.success('Bundle created');
      }
      closeBundleForm();
      // Refetch bundles to populate products properly
      api.get('/bundles').then((r) => setBundles(r.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingBundle(false); }
  };

  const handleBundleDelete = async (id) => {
    if (!window.confirm('Delete this bundle?')) return;
    try { await api.delete(`/bundles/${id}`); setBundles((b) => b.filter((bun) => bun._id !== id)); toast.success('Deleted'); } catch { toast.error('Failed'); }
  };

  const bf = (k) => (e) => setBundleForm((p) => ({ ...p, [k]: e.target.value }));
  const filteredBundles = bundles.filter(b => b.name.toLowerCase().includes(bundleSearch.toLowerCase()));
  const paginatedBundles = filteredBundles.slice((bundlePage - 1) * perPage, bundlePage * perPage);
  const bundleTotalPages = Math.ceil(filteredBundles.length / perPage);

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
          <div className="field" style={{ marginBottom: 16 }}><label>Product Name *</label><input required value={form.name} onChange={f('name')} placeholder="Enter product name" className="adm-input" /></div>
          <div className="field-row cols-2">
            <div className="field-row cols-2" style={{ marginBottom: 0 }}>
              <div className="field"><label>Category</label><select value={form.category} onChange={f('category')} className="adm-select">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="field"><label>Weather</label><select value={form.weatherType} onChange={f('weatherType')} className="adm-select"><option value="DRY">DRY</option><option value="RAINY">RAINY</option><option value="BOTH">BOTH</option></select></div>
              <div className="field"><label>Price ($)</label><input type="number" step="0.01" value={form.price} onChange={f('price')} placeholder="29.99" className="adm-input" /></div>
              <div className="field"><label>Stock</label><input type="number" min={0} value={form.stock} onChange={f('stock')} placeholder="100" className="adm-input" /></div>
              <div className="field"><label>Availability</label><select value={form.availability || 'in_stock'} onChange={f('availability')} className="adm-select">{AVAILABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            </div>
            <div className="field">
              <label>Locations</label>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#f9fafb' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 13, color: '#374151', borderRadius: 6, '&:hover': { background: '#f3f4f6' } }}>
                  <input type="checkbox" checked={form.location?.includes('All Locations')} onChange={(e) => { const arr = form.location || []; setForm(p => ({...p, location: e.target.checked ? [...arr, 'All Locations'] : arr.filter(x => x !== 'All Locations')})); }} style={{ accentColor: '#f59e0b' }} /> All Locations
                </label>
                {locations.map((l) => (
                  <label key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 13, color: '#374151', borderRadius: 6 }}>
                    <input type="checkbox" checked={form.location?.includes(l.name)} onChange={(e) => { const arr = form.location || []; setForm(p => ({...p, location: e.target.checked ? [...arr, l.name] : arr.filter(x => x !== l.name)})); }} style={{ accentColor: '#f59e0b' }} /> {l.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="field-row cols-2">
            <div className="field"><label>Description</label><textarea value={form.description} onChange={f('description')} rows={3} placeholder="Describe this product..." className="adm-textarea" style={{ height: '100%' }} /></div>
            <div className="field-row cols-1" style={{ marginBottom: 0, alignSelf: 'start' }}>
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
            { label: 'Travel Bundles', icon: Layers },
            { label: 'Orders & Payments', icon: CreditCard, badge: pendingOrdersCount },
            { label: 'Bank Details', icon: Landmark },
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



        {/* ═══════════════ TAB 1 — Bundles ═══════════════ */}
        {activeTab === 1 && (
          <>
            <AdminDrawer open={showBundleForm} onClose={closeBundleForm} title={bundleEditId ? 'Edit Travel Bundle' : 'Create Travel Bundle'} saving={savingBundle} onSubmit={handleBundleSave} submitLabel={bundleEditId ? 'Update Bundle' : 'Create Bundle'}>
              <div className="field" style={{ marginBottom: 16 }}><label>Bundle Name *</label><input required value={bundleForm.name} onChange={bf('name')} placeholder="Enter bundle name" className="adm-input" /></div>
              <div className="field-row cols-2">
                <div className="field-row cols-2" style={{ marginBottom: 0 }}>
                  <div className="field"><label>Total Price (LKR) *</label><input required type="number" step="0.01" value={bundleForm.totalPrice} onChange={bf('totalPrice')} placeholder="150.00" className="adm-input" /></div>
                  <div className="field"><label>Discount (%)</label><input type="number" min={0} max={100} value={bundleForm.discount} onChange={bf('discount')} placeholder="10" className="adm-input" /></div>
                  
                  <div className="field" style={{ gridColumn: 'span 2' }}>
                    <label>Included Products</label>
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#f9fafb' }}>
                      {products.map((p) => (
                        <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 13, color: '#374151', borderRadius: 6, '&:hover': { background: '#f3f4f6' } }}>
                          <input type="checkbox" checked={bundleForm.products?.includes(p._id)} onChange={(e) => {
                            const arr = bundleForm.products || [];
                            setBundleForm(prev => ({...prev, products: e.target.checked ? [...arr, p._id] : arr.filter(x => x !== p._id)}));
                          }} style={{ accentColor: '#f59e0b' }} /> 
                          {p.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Locations</label>
                  <div style={{ maxHeight: '100%', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#f9fafb' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 13, color: '#374151', borderRadius: 6, '&:hover': { background: '#f3f4f6' } }}>
                      <input type="checkbox" checked={bundleForm.location?.includes('All Locations')} onChange={(e) => { const arr = bundleForm.location || []; setBundleForm(p => ({...p, location: e.target.checked ? [...arr, 'All Locations'] : arr.filter(x => x !== 'All Locations')})); }} style={{ accentColor: '#f59e0b' }} /> All Locations
                    </label>
                    {locations.map((l) => (
                      <label key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 13, color: '#374151', borderRadius: 6 }}>
                        <input type="checkbox" checked={bundleForm.location?.includes(l.name)} onChange={(e) => { const arr = bundleForm.location || []; setBundleForm(p => ({...p, location: e.target.checked ? [...arr, l.name] : arr.filter(x => x !== l.name)})); }} style={{ accentColor: '#f59e0b' }} /> {l.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="field-row cols-2">
                <div className="field"><label>Description</label><textarea value={bundleForm.description} onChange={bf('description')} rows={4} placeholder="Describe this bundle..." className="adm-textarea" style={{ height: '100%' }} /></div>
                <div className="field-row cols-1" style={{ marginBottom: 0, alignSelf: 'start' }}>
                  <div className="field">
                    <label>Main Picture (Images)</label>
                    {(bundleExistingImages.length > 0 || bundleImages.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                        {bundleExistingImages.map((url, i) => (
                          <div key={`ex-${i}`} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                            <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setBundleExistingImages((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                          </div>
                        ))}
                        {bundleImages.map((file, i) => (
                          <div key={`new-${i}`} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #f59e0b' }}>
                            <img src={URL.createObjectURL(file)} alt={`new-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => setBundleImages((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="adm-upload"><Upload size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{bundleExistingImages.length > 0 || bundleImages.length > 0 ? 'Add more' : 'Upload'}</p><input type="file" multiple accept="image/*" onChange={(e) => setBundleImages((prev) => [...prev, ...e.target.files])} className="hidden" /></label>
                  </div>
                </div>
              </div>
            </AdminDrawer>

            <div className="adm-toolbar mb-6">
              <div className="adm-search-box"><Search className="w-4 h-4 text-gray-400 flex-shrink-0" /><input value={bundleSearch} onChange={e => { setBundleSearch(e.target.value); setBundlePage(1); }} placeholder="Search bundles..." /></div>
              <div style={{ flex: 1 }} />
              {!showBundleForm && <button onClick={openBundleCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> Add Bundle</button>}
            </div>

            {bundlesLoading ? (
              <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
            ) : filteredBundles.length === 0 ? (
              <div className="adm-table-wrap"><div className="text-center py-16"><Layers className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No travel bundles found</p></div></div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead><tr><th>Name</th><th>Price</th><th>Included Products</th><th>Locations</th><th className="text-right">Actions</th></tr></thead>
                    <tbody>
                      {paginatedBundles.map((b) => (
                        <tr key={b._id}>
                          <td><div className="flex items-center gap-3">{b.images?.[0] ? <img src={b.images[0]} alt={b.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-orange-50"><Layers size={18} className="text-orange-600" /></div>}<span className="text-sm font-semibold text-gray-900">{b.name}</span></div></td>
                          <td className="text-sm font-bold text-gray-900">${b.totalPrice} {b.discount > 0 && <span className="text-xs font-normal text-red-500 ml-1">(-{b.discount}%)</span>}</td>
                          <td><span className="text-sm font-medium text-gray-600">{b.products?.length || 0} items</span></td>
                          <td><span className="text-sm text-gray-600">{Array.isArray(b.location) ? (b.location.length > 2 ? b.location.slice(0,2).join(', ') + '...' : b.location.join(', ')) : b.location}</span></td>
                          <td><div className="flex items-center justify-end gap-2"><button onClick={() => openBundleEdit(b)} className="adm-btn-edit"><Pencil size={14} /> Edit</button><button onClick={() => handleBundleDelete(b._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bundleTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                    <span className="text-sm text-gray-500">Showing {(bundlePage-1)*perPage+1}&ndash;{Math.min(bundlePage*perPage, filteredBundles.length)} of {filteredBundles.length}</span>
                    <div className="flex gap-1.5">{Array.from({ length: bundleTotalPages }, (_, i) => <button key={i+1} onClick={() => setBundlePage(i+1)} className={`adm-page-btn ${bundlePage === i+1 ? 'active' : ''}`}>{i+1}</button>)}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* ═══════════════ TAB 2 — Orders & Payments ═══════════════ */}
        {activeTab === 2 && (
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

        {/* ═══════════════ TAB 3 — Bank Details ═══════════════ */}
        {activeTab === 3 && (
          <>
            <div className="adm-toolbar mb-6" style={{ alignItems: 'center' }}>
              <h2 className="text-base font-bold text-gray-800" style={{ margin: 0 }}>Bank Transfer Accounts</h2>
              <div style={{ flex: 1 }} />
              {!showBankForm && (
                <button onClick={openBankCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  <Plus size={18} /> Add Bank Account
                </button>
              )}
            </div>

            {/* Inline Add / Edit Form */}
            {showBankForm && (
              <div style={{
                background: '#fff', border: '1.5px solid #fcd34d', borderRadius: 16,
                padding: '24px 28px', marginBottom: 24,
                boxShadow: '0 4px 16px rgba(245,158,11,0.08)',
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 }}>
                  {bankEditId ? 'Edit Bank Account' : 'Add New Bank Account'}
                </h3>
                <form onSubmit={handleBankSave}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Bank Name *</label>
                      <input required className="adm-input" placeholder="e.g. Bank of Ceylon" value={bankForm.bankName}
                        onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Account Number *</label>
                      <input required className="adm-input" placeholder="e.g. 0001234567890" value={bankForm.accountNumber}
                        onChange={e => setBankForm(p => ({ ...p, accountNumber: e.target.value }))} />
                    </div>
                    <div className="field" style={{ margin: 0 }}>
                      <label>Branch *</label>
                      <input required className="adm-input" placeholder="e.g. Colombo" value={bankForm.branch}
                        onChange={e => setBankForm(p => ({ ...p, branch: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="adm-btn-primary" disabled={savingBank}>
                      {savingBank ? 'Saving...' : (bankEditId ? 'Update Account' : 'Save Account')}
                    </button>
                    <button type="button" onClick={closeBankForm}
                      style={{ padding: '8px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Account List */}
            {bankLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="adm-table-wrap">
                <div className="text-center py-16">
                  <Landmark className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                  <p className="text-base text-gray-500 font-semibold">No bank accounts added yet</p>
                  <p className="text-sm text-gray-400">Add accounts so users know where to transfer payment</p>
                </div>
              </div>
            ) : (
              <div className="adm-table-wrap">
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>Bank Name</th>
                        <th>Account Number</th>
                        <th>Branch</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankAccounts.map(acc => (
                        <tr key={acc._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="adm-thumb-placeholder" style={{ background: '#eff6ff' }}>
                                <Landmark size={18} style={{ color: '#3b82f6' }} />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{acc.bankName}</span>
                            </div>
                          </td>
                          <td><span className="text-sm font-mono text-gray-700">{acc.accountNumber}</span></td>
                          <td><span className="adm-badge adm-badge-neutral">{acc.branch}</span></td>
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openBankEdit(acc)} className="adm-btn-edit"><Pencil size={14} /> Edit</button>
                              <button onClick={() => handleBankDelete(acc._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

