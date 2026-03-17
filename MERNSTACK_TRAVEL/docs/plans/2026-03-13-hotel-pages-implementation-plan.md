# Hotel Pages Light Mode Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert all 5 hotel user-facing files from dark mode to light mode with a clean, minimal + modern bold aesthetic matching the tour pages.

**Architecture:** Each file is rewritten in-place. HotelCard gets a `variant` prop ("vertical"/"horizontal"). All pages use bg-gray-50 wrapper with white cards, gray-200 borders, amber-500/600 accents. Tour pages (TourPackagesPage.jsx) serve as the styling reference.

**Tech Stack:** React 19, Tailwind CSS v4, react-leaflet, react-router-dom, react-hot-toast

---

### Task 1: HotelCard — Add variant prop (vertical + horizontal modes)

**Files:**
- Modify: `client/src/components/HotelCard.jsx`

**Step 1: Rewrite HotelCard.jsx**

Replace the entire file with a component that supports two variants:

```jsx
import { Link } from 'react-router-dom';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

export default function HotelCard({ hotel, highlight, onHover, variant = 'horizontal' }) {
  const discountedPrice = hotel.pricePerNight * (1 - (hotel.discount || 0) / 100);

  const image = (
    <div className={`overflow-hidden flex-shrink-0 ${
      variant === 'vertical' ? 'h-52 w-full' : 'w-40 sm:w-48'
    }`}>
      <img
        src={hotel.images?.[0] || PLACEHOLDER}
        alt={hotel.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
      />
    </div>
  );

  const details = (
    <div className={`flex flex-col ${variant === 'vertical' ? 'p-4' : 'flex-1 p-4 min-w-0'}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-gray-900 font-semibold text-sm group-hover:text-amber-600 transition-colors line-clamp-1">
          {hotel.name}
        </h3>
        {hotel.starRating && (
          <span className={`flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
            highlight === 'rating'
              ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300'
              : 'text-amber-500'
          }`}>
            {'★'.repeat(hotel.starRating)}
          </span>
        )}
      </div>

      <p className={`text-xs mt-1 flex items-center gap-1 ${
        highlight === 'location' ? 'text-amber-600 font-medium' : 'text-gray-500'
      }`}>
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        {hotel.location}
      </p>

      {hotel.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hotel.amenities.slice(0, 3).map((a) => (
            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
          ))}
          {hotel.amenities.length > 3 && (
            <span className="text-xs text-gray-400">+{hotel.amenities.length - 3}</span>
          )}
        </div>
      )}

      <div className={`mt-auto pt-3 flex items-center gap-2 ${
        highlight === 'price' ? 'ring-1 ring-amber-300 bg-amber-50 rounded px-2 py-1 w-fit' : ''
      }`}>
        {hotel.discount > 0 && (
          <>
            <span className="text-xs text-gray-400 line-through">
              LKR {hotel.pricePerNight?.toLocaleString()}
            </span>
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-medium">
              -{hotel.discount}%
            </span>
          </>
        )}
        <span className={`font-bold text-sm ${highlight === 'price' ? 'text-amber-600' : 'text-gray-900'}`}>
          LKR {Math.round(discountedPrice).toLocaleString()}
        </span>
        <span className="text-xs text-gray-400">/night</span>
      </div>

      {hotel.reviewCount > 0 && (
        <p className={`text-xs mt-1 ${highlight === 'rating' ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
          ★ {hotel.averageRating} ({hotel.reviewCount} reviews)
        </p>
      )}
    </div>
  );

  return (
    <Link
      to={`/hotels/${hotel._id}`}
      onMouseEnter={() => onHover && onHover(hotel._id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 ${
        variant === 'vertical'
          ? 'flex flex-col rounded-2xl'
          : 'flex rounded-xl'
      }`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      onMouseEnter2={(e) => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
    >
      {image}
      {details}
    </Link>
  );
}
```

Note: The `onMouseEnter2` above is a placeholder — we'll handle hover shadow via Tailwind classes `shadow-sm hover:shadow-xl` instead:

```jsx
className={`group bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-xl ${
  variant === 'vertical' ? 'flex flex-col rounded-2xl' : 'flex rounded-xl'
}`}
```

**Step 2: Verify by running dev server**

Run: `cd client && npm run dev`
Check: HotelCard renders in light mode on both landing and search pages.

**Step 3: Commit**

```bash
git add client/src/components/HotelCard.jsx
git commit -m "feat: redesign HotelCard with light mode and vertical/horizontal variants"
```

---

### Task 2: HotelLandingPage — Split hero + vertical cards + light mode

**Files:**
- Modify: `client/src/pages/hotels/HotelLandingPage.jsx`

**Step 1: Rewrite HotelLandingPage.jsx**

Key changes:
- Wrap content in `bg-gray-50 text-gray-900 min-h-screen`
- **Hero:** Split layout — left side (headline + search form on white bg), right side (2x2 image collage)
- **SkeletonCard:** Light mode (bg-white border-gray-200, gray-200 pulse)
- **HotelSection:** Use vertical HotelCard variant; white section bg; gray-900 headings; gray-500 subtitles
- **Map Section:** White card wrapper, same Leaflet map

Full rewrite:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import HotelCard from '../../components/HotelCard';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-52 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  </div>
);

const HotelSection = ({ title, subtitle, hotels, loading, queryParam }) => {
  const navigate = useNavigate();
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => navigate(`/hotels/search?${queryParam}`)}
          className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1"
        >
          View All
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : hotels.slice(0, 4).map((h) => (
              <HotelCard key={h._id} hotel={h} variant="vertical" />
            ))}
      </div>
    </section>
  );
};

export default function HotelLandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ location: '', checkIn: '', checkOut: '', adults: 1, children: 0 });
  const [deals, setDeals] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [mapHotels, setMapHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [d, p, t, all] = await Promise.all([
          api.get('/hotels?filter=hot-deals'),
          api.get('/hotels?filter=popular'),
          api.get('/hotels?sort=rating_desc'),
          api.get('/hotels'),
        ]);
        setDeals(d.data);
        setPopular(p.data);
        setTopRated(t.data);
        setMapHotels(all.data.filter((h) => h.coordinates?.lat));
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      ...(search.location && { location: search.location }),
      ...(search.checkIn && { checkIn: search.checkIn }),
      ...(search.checkOut && { checkOut: search.checkOut }),
      adults: search.adults,
      children: search.children,
      search_type: 'location',
    });
    navigate(`/hotels/search?${params.toString()}`);
  };

  const inputClass = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent';

  return (
    <Layout>
      <div className="bg-gray-50 text-gray-900 min-h-screen">
        {/* Hero — Split Layout */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left — Text + Search */}
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  Find Your Perfect <span className="text-amber-500">Stay</span> in Sri Lanka
                </h1>
                <p className="text-gray-500 text-lg mb-8 max-w-lg">
                  Discover handpicked hotels across Sri Lanka's most stunning destinations — from coastal retreats to hillside hideaways.
                </p>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Where are you going?</label>
                      <input type="text" placeholder="Colombo, Kandy, Ella..."
                        value={search.location} onChange={(e) => setSearch({ ...search, location: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Check-in</label>
                      <input type="date" value={search.checkIn}
                        onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Check-out</label>
                      <input type="date" value={search.checkOut}
                        onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Adults</label>
                      <input type="number" min="1" max="10" value={search.adults}
                        onChange={(e) => setSearch({ ...search, adults: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Children</label>
                      <input type="number" min="0" max="10" value={search.children}
                        onChange={(e) => setSearch({ ...search, children: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition shadow-lg shadow-amber-500/20 text-sm">
                    Search Hotels
                  </button>
                </form>
              </div>

              {/* Right — 2x2 Image Collage */}
              <div className="hidden lg:grid grid-cols-2 gap-3">
                <img src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600" alt=""
                  className="w-full h-48 object-cover rounded-2xl" />
                <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600" alt=""
                  className="w-full h-48 object-cover rounded-2xl" />
                <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600" alt=""
                  className="w-full h-48 object-cover rounded-2xl" />
                <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600" alt=""
                  className="w-full h-48 object-cover rounded-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Hotel Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <HotelSection title="Hot Deals" subtitle="Limited-time offers — book before they're gone" hotels={deals} loading={loading} queryParam="filter=hot-deals&source=hot-deals" />
          <HotelSection title="Popular Destinations" subtitle="Most booked hotels by our travellers" hotels={popular} loading={loading} queryParam="filter=popular&search_type=popular" />
          <HotelSection title="Top Rated" subtitle="Highest rated hotels across Sri Lanka" hotels={topRated} loading={loading} queryParam="sort=rating_desc&sort=rating" />

          {/* Map Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotels on Map</h2>
            <p className="text-gray-500 text-sm mb-5">Explore hotel locations across Sri Lanka</p>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-96">
              <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapHotels.map((h) => (
                  <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{h.name}</p>
                        <p className="text-gray-500 text-xs">{h.location}</p>
                        <p className="text-amber-600 font-bold text-xs mt-1">LKR {h.pricePerNight?.toLocaleString()}/night</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
```

**Step 2: Verify visually**

Run: `cd client && npm run dev`
Navigate to `/hotels` and confirm:
- Split hero with search on left, image collage on right
- Light bg throughout
- Vertical hotel cards in sections
- Map in white card wrapper

**Step 3: Commit**

```bash
git add client/src/pages/hotels/HotelLandingPage.jsx
git commit -m "feat: redesign HotelLandingPage with split hero and light mode"
```

---

### Task 3: HotelSearchPage — Top filter bar + horizontal cards + toggleable map

**Files:**
- Modify: `client/src/pages/hotels/HotelSearchPage.jsx`

**Step 1: Rewrite HotelSearchPage.jsx**

Key changes:
- bg-gray-50 wrapper
- Replace left sidebar filters with sticky top horizontal filter bar
- Hotel list uses horizontal HotelCard variant
- Map toggle button; map slides in as right panel or overlay
- Light skeletons, light pagination

```jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import HotelCard from '../../components/HotelCard';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});
const highlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41],
});

export default function HotelSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const source = searchParams.get('source');
  const searchType = searchParams.get('search_type');
  const sortParam = searchParams.get('sort');
  const locationParam = searchParams.get('location');

  const highlight = source === 'hot-deals' ? 'price' : sortParam === 'rating' ? 'rating' : searchType === 'location' ? 'location' : null;

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const [filters, setFilters] = useState({
    minPrice: '', maxPrice: '', rating: '', location: locationParam || '',
  });

  useEffect(() => { fetchHotels(); }, [searchParams]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (locationParam) params.set('location', locationParam);
      if (searchParams.get('filter')) params.set('filter', searchParams.get('filter'));
      if (searchParams.get('sort')) params.set('sort', searchParams.get('sort'));
      const { data } = await api.get(`/hotels?${params}`);
      setHotels(data);
    } catch {} finally { setLoading(false); }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.location) params.set('location', filters.location);
      if (filters.rating) params.set('rating', filters.rating);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      const { data } = await api.get(`/hotels?${params}`);
      setHotels(data);
      setPage(1);
    } catch {} finally { setLoading(false); }
  };

  const paginated = hotels.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(hotels.length / PER_PAGE);
  const mapHotels = hotels.filter((h) => h.coordinates?.lat);

  const inputClass = 'bg-white border border-gray-200 text-gray-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent';

  return (
    <Layout>
      <div className="bg-gray-50 text-gray-900 min-h-screen">
        {/* Top Filter Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Page title */}
              <div className="mr-auto">
                <h1 className="text-lg font-bold text-gray-900">
                  {locationParam ? `Hotels in ${locationParam}` : 'All Hotels'}
                </h1>
                <p className="text-gray-500 text-xs">{hotels.length} hotels found</p>
              </div>

              {/* Filters */}
              <input type="text" placeholder="Location" value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className={`${inputClass} w-36`} />
              <select value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                className={`${inputClass} w-32`}>
                <option value="">Stars</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r}★ & above</option>
                ))}
              </select>
              <input type="number" placeholder="Min LKR" value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className={`${inputClass} w-28`} />
              <input type="number" placeholder="Max LKR" value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className={`${inputClass} w-28`} />
              <button onClick={applyFilters}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition">
                Apply
              </button>
              <button onClick={() => { setFilters({ minPrice: '', maxPrice: '', rating: '', location: '' }); fetchHotels(); }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
                Clear
              </button>

              {/* Map toggle */}
              <button onClick={() => setShowMap((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition ${
                  showMap ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {showMap ? 'Hide Map' : 'Map'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Hotel List */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                      <div className="w-48 h-32 bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">No hotels found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginated.map((hotel) => (
                    <HotelCard key={hotel._id} hotel={hotel} highlight={highlight} onHover={setHoveredId} variant="horizontal" />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${page === i + 1 ? 'bg-amber-500 text-white font-semibold shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Map Panel — desktop, toggleable */}
            {showMap && (
              <div className="hidden md:block w-80 xl:w-[420px] flex-shrink-0">
                <div className="sticky top-24 h-[calc(100vh-7rem)] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {mapHotels.map((h) => (
                      <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}
                        icon={hoveredId === h._id ? highlightIcon : defaultIcon}>
                        <Popup>
                          <div className="text-sm min-w-[160px]">
                            {h.images?.[0] && <img src={h.images[0]} alt={h.name} className="w-full h-24 object-cover rounded mb-2" />}
                            <p className="font-semibold">{h.name}</p>
                            <p className="text-gray-500 text-xs">{h.location}</p>
                            <p className="text-amber-600 font-bold text-xs mt-1">LKR {h.pricePerNight?.toLocaleString()}/night</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Map Modal */}
        {showMap && (
          <div className="fixed inset-0 z-50 bg-black/50 flex flex-col md:hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
              <h3 className="text-gray-900 font-semibold">Map View</h3>
              <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex-1">
              <MapContainer center={[7.8731, 80.7718]} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapHotels.map((h) => (
                  <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}>
                    <Popup><p className="font-semibold text-sm">{h.name}</p></Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
```

**Step 2: Verify visually**

Navigate to `/hotels/search` and confirm:
- Top sticky filter bar
- Horizontal hotel cards
- Map toggle button works
- Light mode throughout

**Step 3: Commit**

```bash
git add client/src/pages/hotels/HotelSearchPage.jsx
git commit -m "feat: redesign HotelSearchPage with top filter bar and toggleable map"
```

---

### Task 4: HotelDetailsPage — Image grid header + 2-column layout + sticky booking card

**Files:**
- Modify: `client/src/pages/hotels/HotelDetailsPage.jsx`

**Step 1: Rewrite HotelDetailsPage.jsx**

Key changes:
- Replace single hero image with 1 large + 4 small image grid
- Lightbox modal for "Show all photos"
- Two-column layout: details left (col-span-2), sticky booking card right (col-span-1)
- All sections in light mode

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AMENITY_ICONS = {
  'Free WiFi': '📶', Pool: '🏊', Parking: '🅿️', Gym: '💪',
  Spa: '💆', Restaurant: '🍽️', AC: '❄️', Bar: '🍸',
};
const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

export default function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/hotels/${id}`)
      .then((res) => setHotel(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to leave a review');
    setSubmitting(true);
    try {
      await api.post(`/hotels/${id}/reviews`, review);
      toast.success('Review submitted!');
      const { data } = await api.get(`/hotels/${id}`);
      setHotel(data);
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <Layout>
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!hotel) return (
    <Layout>
      <div className="bg-gray-50 min-h-screen flex items-center justify-center text-gray-500">
        Hotel not found. <Link to="/hotels" className="text-amber-600 ml-1">← Back to Hotels</Link>
      </div>
    </Layout>
  );

  const discountedPrice = hotel.pricePerNight * (1 - (hotel.discount || 0) / 100);
  const images = hotel.images?.length > 0 ? hotel.images : [PLACEHOLDER];

  return (
    <Layout>
      <div className="bg-gray-50 text-gray-900 min-h-screen">
        {/* Image Grid Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-72 md:h-96 rounded-2xl overflow-hidden">
            {/* Large image */}
            <button onClick={() => { setLightboxIdx(0); setLightboxOpen(true); }}
              className="md:col-span-2 md:row-span-2 overflow-hidden relative group">
              <img src={images[0]} alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </button>
            {/* 4 small images */}
            {[1, 2, 3, 4].map((i) => (
              <button key={i} onClick={() => { setLightboxIdx(i); setLightboxOpen(true); }}
                className="hidden md:block overflow-hidden relative group">
                {images[i] ? (
                  <img src={images[i]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
                {/* Show all photos overlay on last tile */}
                {i === 4 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+{images.length - 5} photos</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content — 2 columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column — Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {hotel.starRating && (
                    <span className="text-amber-500 text-sm font-bold">{'★'.repeat(hotel.starRating)}</span>
                  )}
                  {hotel.starRating && (
                    <span className="text-xs bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                      {hotel.starRating}-Star Hotel
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{hotel.name}</h1>
                <p className="text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {hotel.location}{hotel.district ? `, ${hotel.district}` : ''}
                </p>
              </div>

              {/* About */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{hotel.description}</p>
              </div>

              {/* Amenities */}
              {hotel.amenities?.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {hotel.amenities.map((a) => (
                      <div key={a} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                        <span>{AMENITY_ICONS[a] || '✓'}</span>
                        <span className="text-gray-700 text-sm">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events & Weddings */}
              {(hotel.weddings?.available || hotel.events?.available) && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Events & Weddings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hotel.weddings?.available && (
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        {hotel.weddings.image && <img src={hotel.weddings.image} alt="Weddings" className="w-full h-44 object-cover" />}
                        <div className="p-5">
                          <h3 className="text-gray-900 font-semibold text-lg mb-2">Weddings</h3>
                          <p className="text-gray-500 text-sm">{hotel.weddings.description || 'Make your special day unforgettable.'}</p>
                        </div>
                      </div>
                    )}
                    {hotel.events?.available && (
                      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        {hotel.events.image && <img src={hotel.events.image} alt="Events" className="w-full h-44 object-cover" />}
                        <div className="p-5">
                          <h3 className="text-gray-900 font-semibold text-lg mb-2">Events & Meetings</h3>
                          <p className="text-gray-500 text-sm">{hotel.events.description || 'Professional event spaces.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dining */}
              {hotel.dining && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Dining & Menus</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{hotel.dining}</p>
                </div>
              )}

              {/* Policies */}
              {hotel.policies && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Important Information</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{hotel.policies}</p>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Guest Reviews</h2>
                    {hotel.reviewCount > 0 && (
                      <p className="text-gray-500 text-sm mt-1">★ {hotel.averageRating} average from {hotel.reviewCount} reviews</p>
                    )}
                  </div>
                </div>

                {hotel.reviews?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {hotel.reviews.slice(-6).map((r, i) => (
                      <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {r.userName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{r.userName}</p>
                            <p className="text-amber-500 text-xs">{'★'.repeat(r.rating)}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mb-6">No reviews yet. Be the first to review!</p>
                )}

                {user ? (
                  <form onSubmit={handleReview} className="border-t border-gray-200 pt-6">
                    <h3 className="text-gray-900 font-semibold mb-4">Leave a Review</h3>
                    <div className="flex gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReview({ ...review, rating: s })}
                          className={`text-2xl transition ${s <= review.rating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })}
                      placeholder="Share your experience..." required rows={3}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none" />
                    <button type="submit" disabled={submitting}
                      className="mt-3 px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition">
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <p className="text-gray-500 text-sm border-t border-gray-200 pt-4">
                    <Link to="/login" className="text-amber-600 hover:underline">Login</Link> to leave a review.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column — Sticky Booking Card */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24 shadow-sm">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900">LKR {Math.round(discountedPrice).toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">/night</span>
                </div>
                {hotel.discount > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-400 line-through">LKR {hotel.pricePerNight?.toLocaleString()}</span>
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">-{hotel.discount}%</span>
                  </div>
                )}
                {!hotel.discount && <div className="mb-4" />}

                {hotel.reviewCount > 0 && (
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                    <span className="text-amber-500 font-bold">★ {hotel.averageRating}</span>
                    <span className="text-gray-400 text-sm">({hotel.reviewCount} reviews)</span>
                  </div>
                )}

                <button onClick={() => navigate(`/hotels/${id}/book`)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-sm shadow-lg shadow-amber-500/20">
                  Book Now
                </button>

                {/* Contact info */}
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                  {hotel.phone && <div className="flex items-center gap-3"><span className="text-gray-400">📞</span>{hotel.phone}</div>}
                  {hotel.email && <div className="flex items-center gap-3"><span className="text-gray-400">✉️</span>{hotel.email}</div>}
                  {hotel.address && <div className="flex items-center gap-3"><span className="text-gray-400">📍</span>{hotel.address}</div>}
                  {hotel.website && (
                    <div className="flex items-center gap-3"><span className="text-gray-400">🌐</span>
                      <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline truncate">{hotel.website}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-3"><span className="text-gray-400">🕐</span>In: {hotel.checkInTime} / Out: {hotel.checkOutTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10">✕</button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p - 1 + images.length) % images.length); }}
              className="absolute left-4 text-white/70 hover:text-white text-4xl z-10">‹</button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIdx((p) => (p + 1) % images.length); }}
              className="absolute right-4 text-white/70 hover:text-white text-4xl z-10">›</button>
            <img src={images[lightboxIdx]} alt="" className="max-h-[85vh] max-w-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
            <p className="absolute bottom-4 text-white/60 text-sm">{lightboxIdx + 1} / {images.length}</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
```

**Step 2: Verify visually**

Navigate to `/hotels/:id` and confirm:
- Image grid at top (1 large + 4 small)
- Lightbox opens on click
- Two-column layout with sticky booking card
- Light mode throughout

**Step 3: Commit**

```bash
git add client/src/pages/hotels/HotelDetailsPage.jsx
git commit -m "feat: redesign HotelDetailsPage with image grid and 2-column layout"
```

---

### Task 5: HotelBookingPage — Stepper wizard flow + light mode

**Files:**
- Modify: `client/src/pages/hotels/HotelBookingPage.jsx`

**Step 1: Rewrite HotelBookingPage.jsx**

Key changes:
- 3-step wizard: Dates & Room → Guest Details → Payment
- Progress bar at top with step indicators
- Back/Continue navigation buttons
- Light mode styling throughout
- Sticky summary sidebar retained

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STEPS = [
  { label: 'Dates & Room', icon: '📅' },
  { label: 'Guest Details', icon: '👤' },
  { label: 'Payment', icon: '💳' },
];

export default function HotelBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    specialRequests: '',
    checkIn: '',
    checkOut: '',
    roomType: '',
    roomCount: 1,
    adults: 1,
    children: 0,
  });

  const TAX_RATE = 0.10;

  useEffect(() => {
    api.get(`/hotels/${id}`)
      .then((res) => {
        setHotel(res.data);
        if (res.data.rooms?.length > 0) {
          setForm((f) => ({ ...f, roomType: res.data.rooms[0].type }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;

  const selectedRoom = hotel?.rooms?.find((r) => r.type === form.roomType);
  const pricePerNight = selectedRoom?.pricePerNight || hotel?.pricePerNight || 0;
  const discountedPrice = pricePerNight * (1 - (hotel?.discount || 0) / 100);
  const subtotal = discountedPrice * form.roomCount * nights;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const totalGuests = Number(form.adults) + Number(form.children);
  const maxCapacity = (selectedRoom?.capacity || 2) * form.roomCount;
  const capacityWarning = totalGuests > maxCapacity;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to book');
    if (nights <= 0) return toast.error('Please select valid dates');
    if (!slipFile) return toast.error('Please upload your payment slip');

    setSubmitting(true);
    try {
      const bookingData = {
        hotelId: id, roomType: form.roomType, roomCount: form.roomCount,
        checkIn: form.checkIn, checkOut: form.checkOut,
        guests: { adults: form.adults, children: form.children },
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone, specialRequests: form.specialRequests,
        pricePerNight: discountedPrice, subtotal, tax, totalPrice: total,
      };
      const { data: booking } = await api.post('/hotels/bookings/create', bookingData);

      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('source', 'hotel');
      formData.append('referenceId', booking._id);
      formData.append('amount', total);
      await api.post('/payments/upload-slip', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      toast.success('Booking confirmed! Payment slip submitted for approval.');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally { setSubmitting(false); }
  };

  const canProceed = () => {
    if (step === 0) return form.checkIn && form.checkOut && nights > 0 && !capacityWarning;
    if (step === 1) return form.firstName && form.lastName && form.email && form.phone;
    return true;
  };

  if (loading) return (
    <Layout><div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div></Layout>
  );

  if (!hotel) return (
    <Layout><div className="bg-gray-50 min-h-screen flex items-center justify-center text-gray-500">
      Hotel not found. <Link to="/hotels" className="text-amber-600 ml-1">← Back</Link>
    </div></Layout>
  );

  const inputClass = 'w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent';

  return (
    <Layout>
      <div className="bg-gray-50 text-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back link + Title */}
          <div className="mb-6">
            <Link to={`/hotels/${id}`} className="text-gray-500 hover:text-amber-600 text-sm transition">← Back to {hotel.name}</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Complete Your Booking</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-10">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${i === step ? 'text-amber-600' : 'text-gray-400'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 mt-[-1rem] ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left — Step Content */}
              <div className="lg:col-span-3">
                {/* Step 1: Dates & Room */}
                {step === 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Dates & Room</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Check-in</label>
                        <input name="checkIn" type="date" value={form.checkIn} onChange={handleChange} required
                          min={new Date().toISOString().split('T')[0]} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Check-out</label>
                        <input name="checkOut" type="date" value={form.checkOut} onChange={handleChange} required
                          min={form.checkIn || new Date().toISOString().split('T')[0]} className={inputClass} />
                      </div>
                      {hotel.rooms?.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Room Type</label>
                          <select name="roomType" value={form.roomType} onChange={handleChange} className={inputClass}>
                            {hotel.rooms.map((r) => (
                              <option key={r.type} value={r.type}>{r.type} — LKR {r.pricePerNight?.toLocaleString()}/night</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Rooms</label>
                        <input name="roomCount" type="number" min="1" max="10" value={form.roomCount} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Adults</label>
                        <input name="adults" type="number" min="1" value={form.adults} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Children</label>
                        <input name="children" type="number" min="0" value={form.children} onChange={handleChange} className={inputClass} />
                      </div>
                    </div>
                    {capacityWarning && (
                      <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Guest count exceeds room capacity ({maxCapacity}). Please add more rooms.
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Guest Details */}
                {step === 1 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Guest Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">First Name</label>
                        <input name="firstName" value={form.firstName} onChange={handleChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Last Name</label>
                        <input name="lastName" value={form.lastName} onChange={handleChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                        <input name="phone" value={form.phone} onChange={handleChange} required className={inputClass} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Special Requests (Optional)</label>
                      <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3}
                        placeholder="Late check-in, dietary requirements..."
                        className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {step === 2 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Payment</h2>
                    <p className="text-gray-500 text-sm mb-5">Upload your bank transfer or payment slip. Our team will verify and confirm within 24 hours.</p>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Payment Slip Image *</label>
                    <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-amber-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-amber-600 file:transition" />
                    {slipFile && <p className="text-xs text-green-600 mt-2 font-medium">✓ Selected: {slipFile.name}</p>}
                    <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-4 py-3 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Free cancellation within 24 hours of booking.
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6">
                  <button type="button" onClick={() => setStep((s) => s - 1)}
                    className={`px-6 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl text-sm hover:bg-gray-50 transition ${step === 0 ? 'invisible' : ''}`}>
                    ← Back
                  </button>
                  {step < 2 ? (
                    <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-500/20">
                      Continue →
                    </button>
                  ) : (
                    <button type="submit" disabled={submitting || !slipFile}
                      className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20">
                      {submitting ? 'Processing...' : `Pay & Book — LKR ${Math.round(total).toLocaleString()}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Right — Sticky Summary */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-24 shadow-sm">
                  <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                    alt={hotel.name} className="w-full h-36 object-cover rounded-xl mb-4" />
                  <h3 className="text-gray-900 font-bold text-lg">{hotel.name}</h3>
                  <p className="text-amber-500 text-sm mb-1">{'★'.repeat(hotel.starRating || 3)}</p>
                  <p className="text-gray-500 text-xs mb-5">{hotel.location}</p>

                  <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-gray-500">
                      <span>Room Type</span>
                      <span className="text-gray-900 font-medium">{form.roomType || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>LKR {Math.round(discountedPrice).toLocaleString()} x {form.roomCount} room{form.roomCount > 1 ? 's' : ''} x {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span className="text-gray-900 font-medium">LKR {Math.round(subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Service Charge (10%)</span>
                      <span className="text-gray-900 font-medium">LKR {Math.round(tax).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3 mt-3">
                      <span className="text-gray-900">Total</span>
                      <span className="text-amber-600">LKR {Math.round(total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
```

**Step 2: Verify visually**

Navigate to `/hotels/:id/book` and confirm:
- 3-step progress bar at top
- Step navigation works (Back/Continue)
- Sticky summary card on right
- Light mode throughout
- Submit on final step

**Step 3: Commit**

```bash
git add client/src/pages/hotels/HotelBookingPage.jsx
git commit -m "feat: redesign HotelBookingPage with stepper wizard and light mode"
```

---

### Task 6: Final visual QA pass

**Step 1: Test all pages end-to-end**

Run: `cd client && npm run dev`

Check each page:
1. `/hotels` — split hero, vertical cards, map section
2. `/hotels/search` — top filter bar, horizontal cards, map toggle
3. `/hotels/:id` — image grid, 2-column layout, lightbox, reviews
4. `/hotels/:id/book` — stepper wizard, summary card, form submission

Verify:
- Consistent light mode (bg-gray-50, white cards, gray-200 borders)
- Amber accents on CTAs, prices, active states
- Responsive behavior on mobile (stack to single column)
- No dark mode remnants

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete hotel pages light mode redesign"
```
