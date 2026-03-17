import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import LocationCard from '../../components/LocationCard';

const CATEGORIES = [
  { slug: 'nature', name: 'Nature', subs: ['Mountain', 'Waterfall', 'River', 'Forest', 'Cave', 'Botanical Garden', 'Farm'] },
  { slug: 'beach', name: 'Beach', subs: ['Beach', 'Lagoon', 'Island'] },
  { slug: 'wildlife', name: 'Wildlife', subs: ['National Park', 'Safari', 'Wildlife Sanctuary'] },
  { slug: 'historical', name: 'Historical', subs: ['Fort', 'Archaeological Site', 'Museum'] },
  { slug: 'religious', name: 'Religious', subs: ['Temple', 'Church', 'Mosque', 'Kovil'] },
  { slug: 'hill-country', name: 'Hill Country', subs: ['Tea Estate', 'View Point'] },
  { slug: 'adventure', name: 'Adventure', subs: ['Hiking', 'Camping', 'Diving', 'Boat Tour'] },
  { slug: 'city', name: 'City', subs: ['Urban Attractions', 'Street Food Area', 'Shopping'] },
  { slug: 'entertainment', name: 'Entertainment', subs: ['Zoo', 'Water Park and Aquarium'] },
];

export default function CategoryPage() {
  const { category: param } = useParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Match by slug OR by name (handles both /explore/city and /explore/City)
  const catInfo = CATEGORIES.find(
    (c) => c.slug === param || c.name.toLowerCase() === param.toLowerCase()
  );
  const categoryName = catInfo?.name || param;
  const subcategories = catInfo?.subs || [];
  const [activeSubcat, setActiveSubcat] = useState(() => subcategories[0] || '');

  // Reset active subcategory when param changes
  useEffect(() => {
    const info = CATEGORIES.find(
      (c) => c.slug === param || c.name.toLowerCase() === param.toLowerCase()
    );
    if (info?.subs?.length) {
      setActiveSubcat(info.subs[0]);
    }
  }, [param]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/locations?category=${encodeURIComponent(categoryName)}`)
      .then((res) => setLocations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryName]);

  const filtered = activeSubcat
    ? locations.filter((l) => l.subcategory === activeSubcat)
    : locations;

  return (
    <Layout>
      {/* Dark top bar */}
      <div style={{ background: '#4a4a4a', padding: '20px 24px', display: 'flex', alignItems: 'center', position: 'relative' }}>
        <Link
          to="/explore"
          style={{ fontSize: '14px', color: '#e5e7eb', background: '#555', padding: '8px 16px', borderRadius: '9999px', textDecoration: 'none' }}
        >
          ← Back to Explore
        </Link>
        <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 }}>
          {categoryName}
        </h1>
      </div>

      {/* Subcategory pill tabs */}
      {subcategories.length > 0 && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 24px', position: 'sticky', top: '56px', zIndex: 40 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => setActiveSubcat(sub)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: activeSubcat === sub ? '1px solid #111' : '1px solid #d1d5db',
                  background: activeSubcat === sub ? '#111' : '#fff',
                  color: activeSubcat === sub ? '#fff' : '#4b5563',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '48px 16px' }}>

          {/* Subcategory title + description */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '700', color: '#111', marginBottom: '12px' }}>
              {activeSubcat || categoryName}
            </h2>
            <p style={{ color: '#6b7280', maxWidth: '448px', margin: '0 auto', lineHeight: '1.6' }}>
              Explore the best {(activeSubcat || categoryName).toLowerCase()} destinations in Sri Lanka. Discover amazing places, plan your visit, and create unforgettable memories.
            </p>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid #e5e7eb' }}>
                  <div style={{ height: '192px', background: '#e5e7eb' }} />
                  <div style={{ padding: '16px' }}>
                    <div style={{ height: '16px', background: '#e5e7eb', borderRadius: '4px', width: '75%', marginBottom: '8px' }} />
                    <div style={{ height: '12px', background: '#e5e7eb', borderRadius: '4px', width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <svg style={{ width: '64px', height: '64px', marginBottom: '16px', color: '#d1d5db' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 13l4.553 2.276A1 1 0 0021 21.382V10.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0L9 7" />
              </svg>
              <p style={{ color: '#9ca3af' }}>No places found for this subcategory.</p>
            </div>
          )}

          {/* Location grid */}
          {!loading && filtered.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '28px', paddingBottom: '48px' }}>
              {filtered.map((loc) => (
                <LocationCard key={loc._id} location={loc} />
              ))}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
