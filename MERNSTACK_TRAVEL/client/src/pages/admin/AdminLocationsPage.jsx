import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, MapPin, Upload, Search, ChevronDown, X } from 'lucide-react';

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} className="adm-input" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
        color: value ? '#111827' : '#9ca3af', textAlign: 'left', width: '100%',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        <ChevronDown size={15} style={{ flexShrink: 0, color: '#9ca3af', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', zIndex: 50,
          background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '185px', overflowY: 'auto',
        }}>
          {options.map((opt) => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} style={{
              padding: '9px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: value === opt ? 600 : 400,
              color: value === opt ? '#d97706' : '#374151', background: value === opt ? '#fffbeb' : 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
            >{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}


const PROVINCES = ['Central', 'Eastern', 'North Central', 'Northern', 'North Western', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'];
const DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
const CATEGORIES = ['Nature', 'Beach', 'Wildlife', 'Historical', 'Religious', 'Hill Country', 'Adventure', 'City', 'Entertainment'];
const SUBCATEGORIES = {
  Nature: ['Mountain', 'Waterfall', 'River', 'Forest', 'Cave', 'Botanical Garden', 'Farm'],
  Beach: ['Beach', 'Lagoon', 'Island'],
  Wildlife: ['National Park', 'Safari', 'Wildlife Sanctuary'],
  Historical: ['Fort', 'Archaeological Site', 'Museum'],
  Religious: ['Temple', 'Church', 'Mosque', 'Kovil'],
  'Hill Country': ['Tea Estate', 'View Point'],
  Adventure: ['Hiking', 'Camping', 'Diving', 'Boat Tour'],
  City: ['Urban Attractions', 'Street Food Area', 'Shopping'],
  Entertainment: ['Zoo', 'Water Park and Aquarium'],
};
const EMPTY = { name: '', description: '', category: 'Nature', subcategory: '', district: '', province: '', lat: '', lng: '', isActive: true };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [mapImage, setMapImage] = useState(null);
  const [existingMapImage, setExistingMapImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = () => api.get('/locations').then((r) => { setLocations(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setImages([]); setExistingImages([]); setMapImage(null); setExistingMapImage(''); setEditId(null); setShowForm(true); };
  const openEdit = (loc) => {
    setForm({ name: loc.name, description: loc.description, category: loc.category, subcategory: loc.subcategory || '', district: loc.district || '', province: loc.province || '', lat: loc.coordinates?.lat || '', lng: loc.coordinates?.lng || '', isActive: loc.isActive ?? true });
    setExistingImages(loc.images || []);
    setExistingMapImage(loc.mapImage || '');
    setImages([]); setMapImage(null); setEditId(loc._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      const data = { name: form.name, description: form.description, category: form.category, subcategory: form.subcategory, district: form.district, province: form.province, coordinates: JSON.stringify({ lat: parseFloat(form.lat), lng: parseFloat(form.lng) }), isActive: form.isActive };
      if (editId) {
        data.existingImages = existingImages;
        data.existingMapImage = existingMapImage;
      }
      fd.append('data', JSON.stringify(data));
      images.forEach((f) => fd.append('images', f));
      if (mapImage) fd.append('mapImage', mapImage);
      if (editId) {
        const r = await api.put(`/locations/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setLocations((prev) => prev.map((l) => l._id === editId ? r.data : l));
        toast.success('Location updated');
      } else {
        const r = await api.post('/locations', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setLocations((prev) => [r.data, ...prev]);
        toast.success('Location created');
      }
      closeForm();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this location?')) return;
    try { await api.delete(`/locations/${id}`); setLocations((prev) => prev.filter((l) => l._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const f = (k) => (e) => {
    const val = e.target.value;
    if (k === 'category') setForm((p) => ({ ...p, category: val, subcategory: '' }));
    else setForm((p) => ({ ...p, [k]: val }));
  };

  const provinces = [...new Set(locations.map(l => l.province).filter(Boolean))];
  const filtered = locations.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || (l.district || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || l.category === categoryFilter;
    const matchProvince = provinceFilter === 'all' || l.province === provinceFilter;
    return matchSearch && matchCategory && matchProvince;
  });
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: 0, overflow: 'hidden' }}>
        {/* Drawer */}
        <AdminDrawer open={showForm} onClose={closeForm} title={editId ? 'Edit Location' : 'Add New Location'} saving={saving} onSubmit={handleSave} submitLabel={editId ? 'Update Location' : 'Create Location'}>
          <div className="field-row cols-4">
            <div className="field"><label>Location Name *</label><input required value={form.name} onChange={f('name')} placeholder="Enter location name" className="adm-input" /></div>
            <div className="field"><label>Category</label><select value={form.category} onChange={f('category')} className="adm-select">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Subcategory</label><select value={form.subcategory} onChange={f('subcategory')} className="adm-select"><option value="">-- Select --</option>{(SUBCATEGORIES[form.category] || []).map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>District</label><CustomSelect value={form.district} onChange={(v) => setForm((p) => ({ ...p, district: v }))} options={DISTRICTS} placeholder="Select District" /></div>
          </div>
          <div className="field-row cols-3">
            <div className="field"><label>Province</label><CustomSelect value={form.province} onChange={(v) => setForm((p) => ({ ...p, province: v }))} options={PROVINCES} placeholder="Select Province" /></div>
            <div className="field"><label>Latitude</label><input type="number" step="any" value={form.lat} onChange={f('lat')} placeholder="7.2906" className="adm-input" /></div>
            <div className="field"><label>Longitude</label><input type="number" step="any" value={form.lng} onChange={f('lng')} placeholder="80.6337" className="adm-input" /></div>
          </div>
          <div className="field-row cols-3">
            <div className="field" style={{ gridColumn: 'span 2' }}><label>Description</label><textarea value={form.description} onChange={f('description')} rows={4} placeholder="Describe this location..." className="adm-textarea" /></div>
            <div className="field">
              <label>Images</label>
              {(existingImages.length > 0 || images.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                  {existingImages.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setExistingImages((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                    </div>
                  ))}
                  {images.map((file, i) => (
                    <div key={i} style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #f59e0b' }}>
                      <img src={URL.createObjectURL(file)} alt={`new-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="adm-upload"><Upload size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{existingImages.length > 0 || images.length > 0 ? 'Add more' : 'Upload'}</p><input type="file" multiple accept="image/*" onChange={(e) => setImages((prev) => [...prev, ...e.target.files])} className="hidden" /></label>
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Map Image</label>
                {existingMapImage && !mapImage && (
                  <div style={{ position: 'relative', width: '100%', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: '4px' }}>
                    <img src={existingMapImage} alt="map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setExistingMapImage('')} style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                  </div>
                )}
                {mapImage && (
                  <div style={{ position: 'relative', width: '100%', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #f59e0b', marginBottom: '4px' }}>
                    <img src={URL.createObjectURL(mapImage)} alt="new-map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setMapImage(null)} style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                  </div>
                )}
                <label className="adm-upload"><MapPin size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{existingMapImage || mapImage ? 'Replace' : 'Upload'}</p><input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setMapImage(e.target.files[0]); setExistingMapImage(''); } }} className="hidden" /></label>
              </div>
            </div>
          </div>
        </AdminDrawer>

        {/* Search + Filter */}
        <div className="adm-toolbar mb-6">
          <div className="adm-search-box">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search locations..." />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="adm-filter-select">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={provinceFilter} onChange={e => { setProvinceFilter(e.target.value); setPage(1); }} className="adm-filter-select">
            <option value="all">All Provinces</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          {!showForm && <button onClick={openCreate} className="adm-btn-primary" style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> Add Location</button>}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" style={{ border: '1px solid #e5e7eb' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="adm-table-wrap"><div className="text-center py-16"><MapPin className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="text-base text-gray-500 font-semibold">No locations found</p></div></div>
        ) : (
          <div className="adm-table-wrap">
            <div className="overflow-x-auto">
              <table>
                <thead><tr><th>Name</th><th>Category</th><th>District</th><th>Province</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {paginated.map((loc) => (
                    <tr key={loc._id}>
                      <td><div className="flex items-center gap-3">{loc.images?.[0] ? <img src={loc.images[0]} alt={loc.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-emerald-50"><MapPin size={18} className="text-emerald-600" /></div>}<span className="text-sm font-semibold text-gray-900">{loc.name}</span></div></td>
                      <td><span className="adm-badge adm-badge-neutral">{loc.category}</span></td>
                      <td className="text-sm text-gray-600">{loc.district}</td>
                      <td className="text-sm text-gray-600">{loc.province}</td>
                      <td><span className={`adm-badge ${loc.isActive ? 'adm-badge-active' : 'adm-badge-inactive'}`}>{loc.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td><div className="flex items-center justify-end gap-2"><button onClick={() => openEdit(loc)} className="adm-btn-edit"><Pencil size={14} /> Edit</button><button onClick={() => handleDelete(loc._id)} className="adm-btn-delete"><Trash2 size={14} /> Delete</button></div></td>
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
      </div>
    </AdminLayout>
  );
}
