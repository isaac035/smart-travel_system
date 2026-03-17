# Profile Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the profile page from dark mode basic UI to a modern light mode design with cover banner, overlapping avatar, underline tabs, upgraded booking cards, and slide-over edit panel.

**Architecture:** Single-file rewrite of `ProfilePage.jsx` for all frontend changes. Backend changes span 3 files: add `coverPhoto` field to User model, update `formatUser` to include it, update auth route to accept two file fields (avatar + coverPhoto). The frontend component keeps all existing state/logic but restructures JSX and swaps all dark classes to light-mode equivalents.

**Tech Stack:** React 19, Tailwind CSS v4, Node.js/Express, Mongoose, Cloudinary (multer-storage-cloudinary)

---

### Task 1: Add `coverPhoto` field to User model

**Files:**
- Modify: `server/models/User.js:9` (add field after `avatar`)

**Step 1: Add the coverPhoto field**

In `server/models/User.js`, add after the `avatar` line:

```js
  coverPhoto: { type: String, default: '' },
```

**Step 2: Commit**

```bash
git add server/models/User.js
git commit -m "feat: add coverPhoto field to User model"
```

---

### Task 2: Update auth controller and route to support cover photo upload

**Files:**
- Modify: `server/controllers/authController.js:7-14` (formatUser) and lines `69-86` (updateProfile)
- Modify: `server/routes/authRoutes.js:13` (change upload middleware)

**Step 1: Update `formatUser` to include `coverPhoto` and `createdAt`**

In `server/controllers/authController.js`, replace the `formatUser` function:

```js
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  coverPhoto: user.coverPhoto,
  phone: user.phone,
  createdAt: user.createdAt,
});
```

**Step 2: Update `updateProfile` to handle coverPhoto from file upload**

In `server/controllers/authController.js`, replace the `updateProfile` function:

```js
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Handle file uploads from multer
    if (req.files?.avatar?.[0]) {
      user.avatar = req.files.avatar[0].path;
    }
    if (req.files?.coverPhoto?.[0]) {
      user.coverPhoto = req.files.coverPhoto[0].path;
    }

    await user.save();
    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**Step 3: Update route to use `upload.fields` instead of `upload.single`**

In `server/routes/authRoutes.js`, change line 13 from:

```js
router.put('/profile', protect, upload.single('avatar'), updateProfile);
```

to:

```js
router.put('/profile', protect, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 },
]), updateProfile);
```

**Step 4: Commit**

```bash
git add server/controllers/authController.js server/routes/authRoutes.js
git commit -m "feat: support cover photo upload in profile update API"
```

---

### Task 3: Rewrite ProfilePage.jsx — State & Constants

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx` (full rewrite)

This task and Tasks 4-8 together constitute the full rewrite of `ProfilePage.jsx`. Each task covers a logical section. The final file is assembled by combining all sections in order.

**Step 1: Replace imports, constants, and state setup (lines 1-31)**

Replace the top of the file with:

```jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1586523969720-2af04887fef3?w=1200&q=80';

const statusColors = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const statusMessages = {
  pending:   { color: 'text-yellow-600', text: 'Your payment slip is under review. We will confirm your order shortly.' },
  confirmed: { color: 'text-green-600', text: 'Your order has been confirmed! Your items will be prepared for delivery.' },
  rejected:  { color: 'text-red-600', text: 'Your order was rejected. Please contact support or place a new order with a valid payment slip.' },
  cancelled: { color: 'text-gray-500', text: 'This order has been cancelled.' },
};

const TABS = ['Hotel Bookings', 'Guide Bookings', 'Tour Bookings', 'Travel Products', 'Trip Plans'];

const QUICK_LINKS = [
  { to: '/my-guides', label: 'My Guide Bookings' },
  { to: '/my-tours', label: 'My Tour Bookings' },
  { to: '/services/travel-products', label: 'Shop Products' },
  { to: '/explore', label: 'Explore Locations' },
  { to: '/explore?tab=tripplan', label: 'My Trip Plans' },
];
```

**Step 2: Replace component state (keep existing data-fetching logic intact)**

```jsx
export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef(null);

  const [hotelBookings, setHotelBookings] = useState([]);
  const [guideBookings, setGuideBookings] = useState([]);
  const [tourBookings, setTourBookings] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [tripPlans, setTripPlans] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/hotels/bookings/my'),
      api.get('/guides/bookings/my'),
      api.get('/tours/bookings/my'),
      api.get('/payments/my-orders'),
      api.get('/trips/my').catch(() => ({ data: [] })),
    ]).then(([h, g, t, p, tr]) => {
      setHotelBookings(h.data);
      setGuideBookings(g.data);
      setTourBookings(t.data);
      setProductOrders(p.data);
      setTripPlans(tr.data);
    }).catch(() => {}).finally(() => setLoadingBookings(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (coverFile) fd.append('coverPhoto', coverFile);
      const r = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(r.data);
      setEditOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const totalBookings = hotelBookings.length + guideBookings.length + tourBookings.length;
  const confirmedCount = [...hotelBookings, ...guideBookings, ...tourBookings].filter((b) => b.status === 'confirmed').length;
```

**Do not commit yet — continue to Task 4.**

---

### Task 4: Rewrite ProfilePage.jsx — Cover Banner + Avatar Header JSX

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx` (continuing from Task 3)

**Step 1: Write the return JSX — page wrapper, banner, avatar row, stats, quick links**

```jsx
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Cover Banner ── */}
          <div className="relative h-48 md:h-56 rounded-t-2xl overflow-hidden group">
            <img
              src={coverPreview || user?.coverPhoto || DEFAULT_COVER}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
            {/* Camera button on banner */}
            <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverBannerUpload} className="hidden" />
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              title="Change cover photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {coverPreview && (
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const fd = new FormData();
                    fd.append('name', user.name);
                    fd.append('coverPhoto', coverFile);
                    const r = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    updateUser(r.data);
                    setCoverFile(null);
                    setCoverPreview(null);
                    toast.success('Cover photo updated');
                  } catch { toast.error('Failed to update cover'); }
                  finally { setSaving(false); }
                }}
                disabled={saving}
                className="absolute bottom-3 right-14 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition-colors"
              >
                {saving ? 'Saving...' : 'Save Cover'}
              </button>
            )}
          </div>

          {/* ── Profile Info Card (below banner) ── */}
          <div className="bg-white border border-gray-200 border-t-0 rounded-b-2xl shadow-sm px-4 sm:px-6 pb-6">
            {/* Avatar + Name Row */}
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Avatar — overlapping banner */}
              <div className="flex-shrink-0 -mt-12 flex justify-center md:justify-start">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-md">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + Email */}
              <div className="flex-1 text-center md:text-left pt-2 md:pt-4 md:pb-1">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-0.5">
                  <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                  {user?.role === 'admin' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Edit Profile button */}
              <div className="flex-shrink-0 flex justify-center md:justify-end pb-1">
                <button
                  onClick={() => { setEditOpen(true); setName(user?.name || ''); }}
                  className="text-sm text-amber-600 hover:text-amber-700 border border-amber-300 hover:border-amber-400 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 mt-5 justify-center md:justify-start">
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-bold text-amber-600">{totalBookings}</p>
                <p className="text-xs text-gray-500 mt-0.5">Bookings</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Confirmed</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-center min-w-[90px]">
                <p className="text-2xl font-bold text-orange-500">{productOrders.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Orders</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-xs text-gray-600 hover:text-amber-600 border border-gray-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
```

**Do not commit yet — continue to Task 5.**

---

### Task 5: Rewrite ProfilePage.jsx — Underline Tabs + Tab Content (Bookings)

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx` (continuing)

**Step 1: Add the My Activity heading, underline tabs, and loading state**

```jsx
          {/* ── My Activity Section ── */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Activity</h2>

            {/* Underline Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
              {TABS.map((t, i) => (
                <button
                  key={t}
                  onClick={() => setTab(i)}
                  className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    tab === i
                      ? 'text-amber-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t}
                  {i === 3 && productOrders.length > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === i ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {productOrders.length}
                    </span>
                  )}
                  {tab === i && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {loadingBookings ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
```

**Step 2: Hotel Bookings tab**

```jsx
                {/* Hotel Bookings */}
                {tab === 0 && (
                  hotelBookings.length === 0 ? <EmptyState label="hotel bookings" to="/hotels" /> :
                  <div className="space-y-3">
                    {hotelBookings.map((b) => (
                      <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        {b.hotelId?.images?.[0] && <img src={b.hotelId.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">{b.hotelId?.name || 'Hotel'}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${statusColors[b.status]}`}>{b.status}</span>
                          </div>
                          <p className="text-sm text-gray-500">{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()} · {b.rooms} room{b.rooms !== 1 ? 's' : ''}</p>
                          <p className="text-amber-600 text-sm font-semibold">${b.totalPrice?.toFixed(2)}</p>
                        </div>
                        <Link to={`/hotels/${b.hotelId?._id}`} className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex-shrink-0">View →</Link>
                      </div>
                    ))}
                  </div>
                )}
```

**Step 3: Guide Bookings tab**

```jsx
                {/* Guide Bookings */}
                {tab === 1 && (
                  guideBookings.length === 0 ? <EmptyState label="guide bookings" to="/services/guides" /> :
                  <div className="space-y-3">
                    {guideBookings.map((b) => (
                      <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        {b.guideId?.avatar ? (
                          <img src={b.guideId.avatar} alt="" className="w-16 h-16 object-cover rounded-full flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{b.guideId?.name?.[0]}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">{b.guideId?.name || 'Guide'}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${statusColors[b.status]}`}>{b.status}</span>
                          </div>
                          <p className="text-sm text-gray-500">{new Date(b.startDate).toLocaleDateString()} · {b.days} day{b.days !== 1 ? 's' : ''}</p>
                          <p className="text-amber-600 text-sm font-semibold">${b.totalPrice?.toFixed(2)}</p>
                        </div>
                        <Link to="/my-guides" className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex-shrink-0">View →</Link>
                      </div>
                    ))}
                  </div>
                )}
```

**Step 4: Tour Bookings tab**

```jsx
                {/* Tour Bookings */}
                {tab === 2 && (
                  tourBookings.length === 0 ? <EmptyState label="tour bookings" to="/tours" /> :
                  <div className="space-y-3">
                    {tourBookings.map((b) => (
                      <div key={b._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        {b.packageId?.images?.[0] && <img src={b.packageId.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">{b.packageId?.name || 'Tour Package'}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${statusColors[b.status]}`}>{b.status}</span>
                          </div>
                          <p className="text-sm text-gray-500">{new Date(b.startDate).toLocaleDateString()} · {b.travelers} traveler{b.travelers !== 1 ? 's' : ''} · <span className="capitalize">{b.vehicle}</span></p>
                          <p className="text-amber-600 text-sm font-semibold">${b.totalPrice?.toFixed(2)}</p>
                        </div>
                        <Link to="/my-tours" className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex-shrink-0">View →</Link>
                      </div>
                    ))}
                  </div>
                )}
```

**Do not commit yet — continue to Task 6.**

---

### Task 6: Rewrite ProfilePage.jsx — Product Orders + Trip Plans Tabs

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx` (continuing)

**Step 1: Travel Product Orders tab**

```jsx
                {/* Travel Product Orders */}
                {tab === 3 && (
                  productOrders.length === 0
                    ? <EmptyState label="product orders" to="/services/travel-products" />
                    : (
                      <div className="space-y-3">
                        {productOrders.map((order) => {
                          const statusKey = order.status || 'pending';
                          const msg = statusMessages[statusKey];
                          return (
                            <div key={order._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                              {/* Order header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 font-mono">#{order._id.slice(-8).toUpperCase()}</span>
                                  <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-medium ${statusColors[statusKey]}`}>
                                    {statusKey}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-amber-600 font-bold text-sm">LKR {Math.round(order.amount).toLocaleString()}</p>
                                  <p className="text-gray-400 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                              </div>

                              {/* Items list */}
                              <div className="space-y-1.5">
                                {(order.items || []).map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.type === 'bundle' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {item.type === 'bundle' ? 'Bundle' : 'Product'}
                                      </span>
                                      <span className="text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500">
                                      <span>x{item.qty}</span>
                                      <span className="text-gray-700">LKR {Math.round((item.price || 0) * item.qty).toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Status message */}
                              {msg && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className={`text-xs ${msg.color}`}>{msg.text}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )
                )}
```

**Step 2: Trip Plans tab**

```jsx
                {/* Trip Plans */}
                {tab === 4 && (
                  tripPlans.length === 0 ? <EmptyState label="trip plans" to="/explore?tab=tripplan" /> :
                  <div className="space-y-3">
                    {tripPlans.map((trip) => (
                      <div key={trip._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">🗺️</div>
                            <div>
                              <h3 className="font-medium text-gray-900">{trip.name}</h3>
                              <p className="text-xs text-gray-500">
                                {trip.days?.length || 0} days · {trip.days?.reduce((s, d) => s + (d.locations?.length || 0), 0) || 0} stops
                                {trip.totalDistance > 0 && ` · ${(trip.totalDistance / 1000).toFixed(0)} km`}
                                {trip.pace && ` · ${trip.pace}`}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(trip.updatedAt || trip.createdAt).toLocaleDateString()}</p>
                        </div>

                        {trip.days?.some((d) => d.locations?.some((l) => l.locationId?.images?.[0])) && (
                          <div className="flex gap-1.5 mb-3 overflow-hidden">
                            {trip.days.flatMap((d) => d.locations).filter((l) => l.locationId?.images?.[0]).slice(0, 4).map((l, i) => (
                              <img key={i} src={l.locationId.images[0]} alt={l.locationId.name} className="w-16 h-12 object-cover rounded-lg" />
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link to="/explore?tab=tripplan" className="text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium">
                            Edit
                          </Link>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this trip?')) return;
                              try {
                                await api.delete(`/trips/${trip._id}`);
                                setTripPlans((prev) => prev.filter((t) => t._id !== trip._id));
                                toast.success('Trip deleted');
                              } catch { toast.error('Failed to delete'); }
                            }}
                            className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
```

**Do not commit yet — continue to Task 7.**

---

### Task 7: Rewrite ProfilePage.jsx — Slide-over Edit Panel

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx` (continuing)

**Step 1: Add slide-over panel JSX after the activity section, before closing Layout**

```jsx
          {/* ── Slide-over Edit Panel ── */}
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${editOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setEditOpen(false)}
          />
          {/* Panel */}
          <div
            className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
              editOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {avatarPreview || user?.avatar ? (
                      <img src={avatarPreview || user.avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center text-white text-xl font-bold ring-2 ring-gray-200">
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <label className="text-sm text-amber-600 hover:text-amber-700 cursor-pointer font-medium border border-amber-200 hover:border-amber-300 px-3 py-1.5 rounded-lg transition-colors">
                      Change Photo
                      <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Cover Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Photo</label>
                  <div className="relative h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={coverPreview || user?.coverPhoto || DEFAULT_COVER}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-lg">Change Cover</span>
                      <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    value={user?.email || ''}
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-all"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 text-sm border border-gray-200 hover:border-gray-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
```

**Do not commit yet — continue to Task 8.**

---

### Task 8: Rewrite ProfilePage.jsx — EmptyState Component + Final Assembly

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx` (final piece)

**Step 1: Update the EmptyState component at bottom of file**

```jsx
function EmptyState({ label, to }) {
  return (
    <div className="text-center py-16">
      <p className="text-lg text-gray-400 mb-3">No {label} yet.</p>
      <Link to={to} className="text-amber-600 hover:text-amber-700 hover:underline text-sm font-medium">Browse now →</Link>
    </div>
  );
}
```

**Step 2: Write the complete file**

Assemble all sections from Tasks 3-8 into a single complete file. Write the entire file to `client/src/pages/profile/ProfilePage.jsx`.

**Step 3: Verify the app compiles**

Run: `cd client && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add client/src/pages/profile/ProfilePage.jsx
git commit -m "feat: redesign profile page with light mode, cover banner, underline tabs, and slide-over edit panel"
```

---

### Task 9: Update AuthContext to persist coverPhoto

**Files:**
- Modify: `client/src/context/AuthContext.jsx` (if `coverPhoto` is not already forwarded)

**Step 1: Check if AuthContext stores the full user object from API**

Read `AuthContext.jsx` and verify the `updateUser` function stores all fields including `coverPhoto`. If it already stores the full user object (e.g., `setUser(data)` or `setUser(prev => ({...prev, ...data}))`), no changes needed.

**Step 2: If needed, ensure `coverPhoto` and `createdAt` are persisted**

Make sure the user object stored in localStorage / state includes `coverPhoto` and `createdAt` from the API response.

**Step 3: Commit if changes were made**

```bash
git add client/src/context/AuthContext.jsx
git commit -m "feat: persist coverPhoto and createdAt in auth context"
```

---

### Task Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add `coverPhoto` to User model | `server/models/User.js` |
| 2 | Update auth API for cover photo upload | `server/controllers/authController.js`, `server/routes/authRoutes.js` |
| 3 | ProfilePage — state & constants rewrite | `client/src/pages/profile/ProfilePage.jsx` |
| 4 | ProfilePage — cover banner + avatar header | (same file, continued) |
| 5 | ProfilePage — underline tabs + booking cards | (same file, continued) |
| 6 | ProfilePage — product orders + trip plans | (same file, continued) |
| 7 | ProfilePage — slide-over edit panel | (same file, continued) |
| 8 | ProfilePage — EmptyState + build verification | (same file, continued) |
| 9 | AuthContext — persist coverPhoto | `client/src/context/AuthContext.jsx` |
