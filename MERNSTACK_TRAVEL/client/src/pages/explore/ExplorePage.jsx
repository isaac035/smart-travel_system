import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout";
import TripPlannerPage from "./TripPlannerPage";
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
  const defaultTab = searchParams.get("tab") === "tripplan" ? "plan" : "explore";
  const [activeTab, setActiveTab] = useState(defaultTab);

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
            <TripPlannerPage />
          </section>
        )}
      </div>
    </Layout>
  );
}
