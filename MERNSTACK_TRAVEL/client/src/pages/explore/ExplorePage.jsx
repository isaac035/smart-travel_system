import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import TripPlannerPage from "./TripPlannerPage";
import api from "../../utils/api";
import "../../styles/explore.css";

import exploreBanner from "../../assets/images/explore-banner.jpg";
import catNature from "../../assets/images/cat-nature.png";
import catBeach from "../../assets/images/cat-beach.png";
import catWildlife from "../../assets/images/cat-wildlife.png";
import catHistorical from "../../assets/images/cat-historical.png";
import catReligious from "../../assets/images/cat-religious.png";
import catHillcountry from "../../assets/images/cat-hillcountry.png";
import catAdventure from "../../assets/images/cat-adventure.png";
import catCity from "../../assets/images/cat-city.png";
import catEntertainment from "../../assets/images/cat-entertainment.png";

const categories = [
  { name: "Nature", slug: "nature", img: catNature, color: "#e8f5e9" },
  { name: "Beach", slug: "beach", img: catBeach, color: "#e0f7fa" },
  { name: "Wildlife", slug: "wildlife", img: catWildlife, color: "#fff3e0" },
  { name: "Historical", slug: "historical", img: catHistorical, color: "#fce4ec" },
  { name: "Religious", slug: "religious", img: catReligious, color: "#fff9c4" },
  { name: "Hill Country", slug: "hill-country", img: catHillcountry, color: "#e8eaf6" },
  { name: "Adventure", slug: "adventure", img: catAdventure, color: "#fbe9e7" },
  { name: "City", slug: "city", img: catCity, color: "#e0f2f1" },
  { name: "Entertainment", slug: "entertainment", img: catEntertainment, color: "#f3e5f5" },
];

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("tab") === "tripplan" ? "plan" : "explore";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [editTrip, setEditTrip] = useState(null);

  // Fetch trip data when editTripId is in URL (coming from profile "Edit Plan")
  const editTripId = searchParams.get("editTripId");
  useEffect(() => {
    if (!editTripId) { setEditTrip(null); return; }
    api.get(`/trips/${editTripId}`)
      .then((r) => setEditTrip(r.data))
      .catch(() => setEditTrip(null));
  }, [editTripId]);

  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      api.get('/locations', { params: { search: search.trim() } })
        .then((r) => setSearchResults(r.data.slice(0, 8)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Layout>
      <div className="explore-page">
        {/* ── Hero Banner ── */}
        <div style={{
          position: 'relative', width: '100%', height: '240px',
          backgroundImage: `url(${exploreBanner})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.25) 100%)',
          }} />
          <div style={{
            position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto',
            padding: '0 24px', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <p style={{
              fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.75)',
              textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px',
            }}>
              Explore Sri Lanka
            </p>
            <h1 style={{
              fontSize: '42px', fontWeight: '800', color: '#fff',
              lineHeight: 1.15, margin: 0, maxWidth: '580px',
            }}>
              Your Next<br />
              <span style={{ color: '#fbbf24' }}>Adventure Awaits</span>
            </h1>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="explore-tabs">
          <button
            className={`explore-tabs__btn${activeTab === "explore" ? " explore-tabs__btn--active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            Explore Location
          </button>
          <button
            className={`explore-tabs__btn${activeTab === "plan" ? " explore-tabs__btn--active" : ""}`}
            onClick={() => setActiveTab("plan")}
          >
            Plan Your Trip
          </button>
        </div>


        {/* ── Tab Content ── */}
        {activeTab === "explore" && (
          <section className="explore-categories">
            {/* ── Search Bar ── */}
            <div style={{ maxWidth: 520, margin: '0 auto 32px', position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, height: 48, padding: '0 18px',
                borderRadius: 14, border: searchFocused ? '2px solid #111827' : '1px solid #e5e7eb',
                background: '#fff', boxShadow: searchFocused ? '0 0 0 4px rgba(17,24,39,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? '#111827' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search locations, categories..."
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 15, color: '#111827', fontWeight: 500,
                  }}
                />
                {search && (
                  <button onClick={() => { setSearch(''); setSearchResults([]); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
                {searchLoading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M4 12a8 8 0 018-8" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              {/* ── Search Results Dropdown ── */}
              {search.trim().length >= 2 && searchResults.length > 0 && searchFocused && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 50,
                  background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)', maxHeight: 360, overflowY: 'auto',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 16px 6px', margin: 0 }}>
                    Locations
                  </p>
                  {searchResults.map((loc) => (
                    <button
                      key={loc._id}
                      onClick={() => { navigate(`/explore/location/${loc._id}`); setSearch(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', width: '100%',
                        background: 'transparent', border: 'none', borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                        {loc.images?.[0] ? (
                          <img src={loc.images[0]} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{loc.district} · {loc.category}</p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                  ))}
                </div>
              )}

              {/* ── No results message ── */}
              {search.trim().length >= 2 && !searchLoading && searchResults.length === 0 && searchFocused && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 50,
                  background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: '24px 16px', textAlign: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ margin: '0 auto 8px' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', margin: 0 }}>No results found</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>Try a different search term</p>
                </div>
              )}
            </div>

            {/* ── Category Cards ── */}
            <div className="explore-categories__grid">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/explore/${cat.slug}`}
                  className="category-card"
                  style={{ backgroundColor: cat.color }}
                >
                  <div className="category-card__img-wrap">
                    <img src={cat.img} alt={cat.name} className="category-card__img" />
                  </div>
                  <h3 className="category-card__name">{cat.name}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {activeTab === "plan" && (
          <section className="explore-plan">
            {editTripId && !editTrip ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, border: '3px solid #111827', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                  }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Loading trip...</p>
                </div>
              </div>
            ) : (
              <TripPlannerPage key={editTripId || 'new'} editTrip={editTrip} />
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}
