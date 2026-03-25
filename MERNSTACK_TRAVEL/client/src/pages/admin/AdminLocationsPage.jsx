import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import AdminLayout from '../../components/AdminLayout';
import AdminDrawer from '../../components/AdminDrawer';
import api from '../../utils/api';
import { Plus, Pencil, Trash2, MapPin, Upload, Search, ChevronDown, X } from 'lucide-react';

/* ── Sri Lanka bounds & map config ── */
const SL_BOUNDS = { south: 5.916, north: 9.851, west: 79.521, east: 81.879 };
const SL_CENTER = [7.8731, 80.7718];
const SL_VIEWBOX = `${SL_BOUNDS.west},${SL_BOUNDS.north},${SL_BOUNDS.east},${SL_BOUNDS.south}`;

const adminMarkerIcon = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:#d97706;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(217,119,6,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`,
  iconAnchor: [12, 12],
});

/* ── Map click handler ── */
function AdminMapClick({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

/* ── Fly map to position ── */
function FlyToPoint({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 15, { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

/* ── Admin Location Search (multi-strategy, Sri Lanka focused) ── */
function AdminLocationSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [searchMsg, setSearchMsg] = useState('');

  const doSearch = useCallback((q) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); setSearchMsg(''); return; }
    setLoading(true);
    setSearchMsg('');
    // Use backend proxy to avoid Nominatim browser rate limits
    api.get(`/locations/geocode?q=${encodeURIComponent(q)}`)
      .then(res => {
        const data = res.data;
        const items = data.map(item => {
          const addr = item.address || {};
          const parts = item.display_name.split(',').map(s => s.trim());
          return {
            name: parts[0],
            area: addr.county || addr.state_district || addr.city || addr.town || addr.village || parts[1] || '',
            district: addr.state_district || addr.county || '',
            province: addr.state || '',
            fullName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
        setResults(items);
        setOpen(items.length > 0);
        if (items.length === 0) setSearchMsg('No locations found');
        setLoading(false);
      })
      .catch(err => {
        console.error('Search error:', err);
        setLoading(false);
        setSearchMsg('Search failed - please try again');
        setOpen(false);
      });
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 500);
  };

  const pick = (item) => {
    onSelect({ lat: item.lat, lng: item.lng, name: item.name, district: item.district, province: item.province });
    setQuery(item.name);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 38,
        padding: '0 12px', borderRadius: 10, border: '1px solid #e5e7eb',
        background: '#f9fafb', transition: 'border-color 0.2s',
      }}>
        <Search size={14} style={{ color: '#9ca3af', flexShrink: 0 }} />
        <input
          type="text" value={query} onChange={handleChange}
          placeholder="Search location in Sri Lanka..."
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#111827' }}
        />
        {loading && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3" opacity="0.3" />
            <path d="M4 12a8 8 0 018-8" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {query && !loading && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <X size={13} style={{ color: '#9ca3af' }} />
          </button>
        )}
      </div>
      {searchMsg && !open && (
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{searchMsg}</p>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 9999,
          background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 260, overflowY: 'auto',
        }}>
          {results.map((item, i) => (
            <button key={i} type="button" onClick={() => pick(item)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', width: '100%',
              background: 'transparent', border: 'none', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none',
              cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <MapPin size={14} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[item.area, item.district, item.province].filter(Boolean).join(', ')}
                </p>
                <p style={{ fontSize: 10, color: '#9ca3af', margin: '1px 0 0' }}>{item.lat.toFixed(6)}, {item.lng.toFixed(6)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function SearchableSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); setSearchError(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);
  const filtered = options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
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
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', border: searchError ? '1px solid #ef4444' : '1px solid #e5e7eb', background: '#f9fafb' }}>
              <Search size={13} style={{ color: searchError ? '#ef4444' : '#9ca3af', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => { if (/[0-9]/.test(e.target.value)) { setSearchError('Numbers are not allowed'); return; } setSearchError(''); setSearch(e.target.value); }}
                placeholder="Search..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '100%', color: '#111827' }}
              />
              {search && <button type="button" onClick={() => { setSearch(''); setSearchError(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} style={{ color: '#9ca3af' }} /></button>}
            </div>
            {searchError && <span style={{ color: '#ef4444', fontSize: '10px', marginTop: '3px', display: 'block', paddingLeft: '2px' }}>{searchError}</span>}
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>No results found</div>
            ) : filtered.map((opt) => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); setSearch(''); }} style={{
                padding: '9px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: value === opt ? 600 : 400,
                color: value === opt ? '#d97706' : '#374151', background: value === opt ? '#fffbeb' : 'transparent',
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = 'transparent'; }}
              >{opt}</div>
            ))}
          </div>
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
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ align: '' }, { align: 'center' }, { align: 'right' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};
const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'align', 'list', 'link', 'image'];
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = () => api.get('/locations').then((r) => { setLocations(r.data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setImages([]); setExistingImages([]); setMapImage(null); setExistingMapImage(''); setEditId(null); setFieldErrors({}); setShowForm(true); };
  const openEdit = (loc) => {
    setForm({ name: loc.name, description: loc.description, category: loc.category, subcategory: loc.subcategory || '', district: loc.district || '', province: loc.province || '', lat: loc.coordinates?.lat || '', lng: loc.coordinates?.lng || '', isActive: loc.isActive ?? true });
    setExistingImages(loc.images || []);
    setExistingMapImage(loc.mapImage || '');
    setImages([]); setMapImage(null); setEditId(loc._id); setFieldErrors({}); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const validateImageFiles = (files, errorKey = 'images') => {
    const invalid = [];
    const oversized = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) invalid.push(file.name);
      if (file.size > MAX_IMAGE_SIZE) oversized.push(file.name);
    }
    if (invalid.length > 0) { setFieldErrors((p) => ({ ...p, [errorKey]: `Invalid format: ${invalid.join(', ')}. Only JPG, PNG, WEBP allowed` })); return false; }
    if (oversized.length > 0) { setFieldErrors((p) => ({ ...p, [errorKey]: `File too large: ${oversized.join(', ')}. Max 5MB per image` })); return false; }
    setFieldErrors((p) => ({ ...p, [errorKey]: '' }));
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (/[0-9]/.test(form.name)) errors.name = 'Numbers are not allowed in location name';
    const totalImages = existingImages.length + images.length;
    if (!editId && totalImages === 0) errors.images = 'Please upload at least one image';
    if (totalImages > MAX_IMAGES) errors.images = `Maximum ${MAX_IMAGES} images allowed. You have ${totalImages}`;
    if (Object.keys(errors).length > 0) {
      setFieldErrors((p) => ({ ...p, ...errors }));
      return;
    }
    setSaving(true);
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
    const matchProvince = provinceFilter === 'all' || (l.province || '').toLowerCase() === provinceFilter.toLowerCase();
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
            <div className="field"><label>Location Name *</label><input required value={form.name} onChange={(e) => { if (/[0-9]/.test(e.target.value)) { setFieldErrors((p) => ({ ...p, name: 'Numbers are not allowed in location name' })); return; } setFieldErrors((p) => ({ ...p, name: '' })); f('name')(e); }} placeholder="Enter location name" className="adm-input" style={fieldErrors.name ? { borderColor: '#ef4444' } : {}} />{fieldErrors.name && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{fieldErrors.name}</span>}</div>
            <div className="field"><label>Category</label><select value={form.category} onChange={f('category')} className="adm-select">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Subcategory</label><select value={form.subcategory} onChange={f('subcategory')} className="adm-select"><option value="">-- Select --</option>{(SUBCATEGORIES[form.category] || []).map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>District</label><SearchableSelect value={form.district} onChange={(v) => setForm((p) => ({ ...p, district: v }))} options={DISTRICTS} placeholder="Select District" /></div>
          </div>
          <div className="field-row cols-3">
            <div className="field"><label>Province</label><CustomSelect value={form.province} onChange={(v) => setForm((p) => ({ ...p, province: v }))} options={PROVINCES} placeholder="Select Province" /></div>
            <div className="field"><label>Latitude</label><input type="text" value={form.lat} onChange={(e) => { if (e.target.value !== '' && !/^-?\d*\.?\d*$/.test(e.target.value)) { setFieldErrors((p) => ({ ...p, lat: 'Only numbers and decimal point allowed' })); return; } setFieldErrors((p) => ({ ...p, lat: '' })); f('lat')(e); }} placeholder="7.2906" className="adm-input" style={fieldErrors.lat ? { borderColor: '#ef4444' } : {}} />{fieldErrors.lat && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{fieldErrors.lat}</span>}</div>
            <div className="field"><label>Longitude</label><input type="text" value={form.lng} onChange={(e) => { if (e.target.value !== '' && !/^-?\d*\.?\d*$/.test(e.target.value)) { setFieldErrors((p) => ({ ...p, lng: 'Only numbers and decimal point allowed' })); return; } setFieldErrors((p) => ({ ...p, lng: '' })); f('lng')(e); }} placeholder="80.6337" className="adm-input" style={fieldErrors.lng ? { borderColor: '#ef4444' } : {}} />{fieldErrors.lng && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{fieldErrors.lng}</span>}</div>
          </div>
          {/* ── Location Picker: Search + Map ── */}
          <div className="field-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} style={{ color: '#d97706' }} />
                Pick Location from Map
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <AdminLocationSearch onSelect={(loc) => {
                    setForm(p => ({ ...p, lat: loc.lat.toFixed(6), lng: loc.lng.toFixed(6), ...(loc.district && !p.district ? { district: loc.district } : {}), ...(loc.province && !p.province ? { province: loc.province } : {}) }));
                    setFieldErrors(p => ({ ...p, lat: '', lng: '' }));
                  }} />
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>or click on the map below</span>
              </div>
              <div style={{ height: 350, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <MapContainer center={form.lat && form.lng ? [parseFloat(form.lat), parseFloat(form.lng)] : SL_CENTER} zoom={form.lat && form.lng ? 13 : 8} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' />
                  <AdminMapClick onClick={(latlng) => {
                    setForm(p => ({ ...p, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) }));
                    setFieldErrors(p => ({ ...p, lat: '', lng: '' }));
                  }} />
                  {form.lat && form.lng && parseFloat(form.lat) && parseFloat(form.lng) && (
                    <>
                      <Marker position={[parseFloat(form.lat), parseFloat(form.lng)]} icon={adminMarkerIcon} />
                      <FlyToPoint lat={parseFloat(form.lat)} lng={parseFloat(form.lng)} />
                    </>
                  )}
                </MapContainer>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '10px', marginTop: 4, display: 'block' }}>
                Search a place name or click on the map to auto-fill coordinates. You can also type lat/lng manually above.
              </span>
            </div>
          </div>
          <div className="field-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="field">
              <label>Description</label>
              <div className="loc-quill-wrap">
                <ReactQuill theme="snow" value={form.description} onChange={(val) => setForm((p) => ({ ...p, description: val }))} modules={QUILL_MODULES} formats={QUILL_FORMATS} placeholder="Describe this location..." />
              </div>
            </div>
          </div>
          <div className="field-row cols-2">
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
              <label className="adm-upload"><Upload size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{existingImages.length > 0 || images.length > 0 ? 'Add more' : 'Upload'}</p><input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { const files = [...e.target.files]; if (!validateImageFiles(files, 'images')) { e.target.value = ''; return; } const total = existingImages.length + images.length + files.length; if (total > MAX_IMAGES) { setFieldErrors((p) => ({ ...p, images: `Maximum ${MAX_IMAGES} images allowed. You already have ${existingImages.length + images.length}` })); e.target.value = ''; return; } setFieldErrors((p) => ({ ...p, images: '' })); setImages((prev) => [...prev, ...files]); e.target.value = ''; }} className="hidden" /></label>
              <span style={{ color: '#9ca3af', fontSize: '10px', marginTop: '4px', display: 'block' }}>JPG, JPEG, PNG, WEBP (max 5MB each, up to 10 images)</span>
              {fieldErrors.images && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{fieldErrors.images}</span>}
            </div>
            <div className="field">
              <label>Map Image</label>
              {existingMapImage && !mapImage && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={existingMapImage} alt="map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setExistingMapImage('')} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                  </div>
                </div>
              )}
              {mapImage && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                  <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #f59e0b' }}>
                    <img src={URL.createObjectURL(mapImage)} alt="new-map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setMapImage(null)} style={{ position: 'absolute', top: '1px', right: '1px', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}><X size={8} style={{ color: '#fff' }} /></button>
                  </div>
                </div>
              )}
              <label className="adm-upload"><MapPin size={14} className="text-gray-400" /><p className="text-xs text-gray-500">{existingMapImage || mapImage ? 'Replace' : 'Upload'}</p><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { if (e.target.files[0]) { if (!validateImageFiles([e.target.files[0]], 'mapImage')) { e.target.value = ''; return; } setFieldErrors((p) => ({ ...p, mapImage: '' })); setMapImage(e.target.files[0]); setExistingMapImage(''); } e.target.value = ''; }} className="hidden" /></label>
              <span style={{ color: '#9ca3af', fontSize: '10px', marginTop: '4px', display: 'block' }}>JPG, JPEG, PNG, WEBP (max 5MB)</span>
              {fieldErrors.mapImage && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '3px', display: 'block' }}>{fieldErrors.mapImage}</span>}
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
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
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
                <thead><tr><th>Name</th><th>Category</th><th>District</th><th>Province</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {paginated.map((loc) => (
                    <tr key={loc._id}>
                      <td><div className="flex items-center gap-3">{loc.images?.[0] ? <img src={loc.images[0]} alt={loc.name} className="adm-thumb" /> : <div className="adm-thumb-placeholder bg-emerald-50"><MapPin size={18} className="text-emerald-600" /></div>}<span className="text-sm font-semibold text-gray-900">{loc.name}</span></div></td>
                      <td><span className="adm-badge adm-badge-neutral">{loc.category}</span></td>
                      <td className="text-sm text-gray-600">{loc.district}</td>
                      <td className="text-sm text-gray-600">{loc.province}</td>
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
