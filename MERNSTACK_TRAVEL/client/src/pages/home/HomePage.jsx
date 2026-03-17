
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';


import { useEffect, useState } from "react";
import "../../styles/home.css";

import homeSlide1 from "../../assets/images/home-slide-1.jpg";
import homeSlide2 from "../../assets/images/home-slide-2.jpg";
import homeSlide3 from "../../assets/images/home-slide-3.jpg";
import lanka1 from "../../assets/images/lanka1.png";
import bookFlight from "../../assets/images/book-flight.png";
import touristVisa from "../../assets/images/tourist-visa.png";
import tourismAuthority from "../../assets/images/tourism-authority.png";
import history from "../../assets/images/history.png";
import languageReligion from "../../assets/images/language-religion.png";
import economy from "../../assets/images/economy.png";
import wildlife from "../../assets/images/wildlife.jpg";

export default function Home() {
  const slides = [homeSlide1, homeSlide2, homeSlide3];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <Layout>
      {/* HERO SLIDER ) */}
      <div className="slider-container">
        {slides.map((src, i) => (
          <div
            key={src}
            className={`slide ${i === current ? "active" : ""}`}
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}

        <div className="overlay"></div>

        <div className="content">
          <h1 id="title">WELCOME TO<br />SRI LANKA TRAVEL GUIDE</h1>
          <p id="description">
            Discover the enchanting beauty and rich heritage of Sri Lanka.<br />  From pristine beaches and lush rainforests
            to ancient temples and <br />  vibrant culture, embark on an unforgettable journey.
          </p>
          <a href="/about"><button>Read More</button></a>
        </div>

        <div className="circle-container">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`circle ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>

      {/* ================= ABOUT SRI LANKA ================= */}
      <div className="srilanka-about-wrapper">
        <div className="srilanka-about">
          <div className="lanka-details">
            <p>
              <b style={{ fontSize: '22px', color: '#d97706' }}>Sri Lanka </b>is one of the most exotic getaways in the world. Surrounded by the azure Indian Ocean,
              this island paradise has contrasting landscapes, stretches of golden sandy beaches
              and a wealth of wildlife and culture to discover.
            </p>
            <p style={{ marginTop: "10px" }}>
              A physical environment of wide-ranging diversity makes Sri Lanka one of the world's most
              exotic countries, as the home of several ethnic groups, each with its own cultural heritage.
              Sri Lanka also has a highly varied cultural landscape.
            </p>
            <p className="details-srilanka">
              <b>Capital City:</b> <span style={{ color: "#6b7280" }}>Colombo</span><br />
              <b>Currency:</b> <span style={{ color: "#6b7280" }}>Sri Lankan Rupee (LKR)</span><br />
              <b>Population:</b> <span style={{ color: "#6b7280" }}>21 Million</span><br />
              <b>Language:</b> <span style={{ color: "#6b7280" }}>Tamil, Sinhala, English</span><br />
              <b>Capital:</b> <span style={{ color: "#6b7280" }}>Sri Jayawardenapura Kotte</span>
            </p>
          </div>

          <div className="lanka-iamge">
            <img src={lanka1} alt="Sri Lanka Map" />
          </div>
        </div>
      </div>

      {/* ================= TRAVEL SERVICES ================= */}
      <div className="travel-services">
        <h1>Travel Services for Visiting Sri Lanka</h1>

        <div className="ts-cards">
          <a
            href="https://www.srilankan.com/en_uk/lk?utm_source=EC-LK-TouristBoard-Online&utm_medium=EC-LK-TouristBoard-StaticBanner&utm_campaign=EC-LK-TouristBoard"
            className="ts-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="ts-img-wrap">
              <img src={bookFlight} alt="Book Your Flight" />
            </div>
            <h2>Book Your Flight</h2>
            <p>Book your flight to Sri Lanka quickly and easily.</p>
            <span className="ts-link-label">Visit Site →</span>
          </a>

          <a
            href="https://eta.gov.lk/slvisa/"
            className="ts-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="ts-img-wrap">
              <img src={touristVisa} alt="Tourist Visa" />
            </div>
            <h2>Tourist Visa</h2>
            <p>Apply for a Sri Lanka tourist visa online.</p>
            <span className="ts-link-label">Visit Site →</span>
          </a>


          <a
            href="https://www.sltda.gov.lk/en"
            className="ts-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="ts-img-wrap">
              <img src={tourismAuthority} alt="Tourism Authority" />
            </div>
            <h2>Tourism Authority</h2>
            <p>Official tourism authority supporting Sri Lanka's travel.</p>
            <span className="ts-link-label">Visit Site →</span>
          </a>


        </div>
      </div>

      {/* ================= SRI LANKA INFO SECTIONS ================= */}
      <div className="sl-sections">
        <div className="sl-wrap">

          {/* --- History of Sri Lanka --- */}
          <div className="sl-card">
            <div className="sl-body">
              <div className="sl-kicker">
                <span className="sl-dot"></span> SRI LANKA
              </div>
              <h2 className="sl-title">History of Sri Lanka</h2>
              <p className="sl-text">
                Sri Lanka has a very rich and long history of over 3,000 years. Early
                civilizations began in ancient cities like Anuradhapura and Polonnaruwa,
                where great kings built large forts, temples, and reservoirs. Buddhism
                was introduced in the 3rd century BCE and became a central part of Sri
                Lankan culture. Over time, the country was influenced by South Indian
                kingdoms and then colonized by the Portuguese, Dutch, and British.
                Sri Lanka gained its independence from Britain in 1948. Today, it is
                a proud nation known for its cultural heritage, ancient ruins,
                beautiful beaches, and natural beauty.
              </p>
            </div>
            <div className="sl-media">
              <img src={history} alt="History of Sri Lanka" />
            </div>
          </div>

          {/* --- Language & Religion --- */}
          <div className="sl-card reverse">
            <div className="sl-body">
              <div className="sl-kicker">
                <span className="sl-dot"></span> CULTURE
              </div>
              <h2 className="sl-title">Language &amp; Religion</h2>
              <p className="sl-text">
                Sri Lanka is a multicultural country with different languages and
                religions. The main languages are Sinhala and Tamil, and English is
                also widely used in education and business. The major religion is
                Buddhism, followed by Hinduism, Islam, and Christianity. These
                religions and languages reflect the country's diversity and help
                shape its rich cultural traditions and peaceful coexistence.
              </p>
            </div>
            <div className="sl-media">
              <img src={languageReligion} alt="Language and Religion" />
            </div>
          </div>

          {/* --- Economy of Sri Lanka --- */}
          <div className="sl-card">
            <div className="sl-body">
              <div className="sl-kicker">
                <span className="sl-dot"></span> DEVELOPMENT
              </div>
              <h2 className="sl-title">Economy of Sri Lanka</h2>
              <p className="sl-text">
                Sri Lanka has a developing economy mostly based on agriculture,
                industry, and services. Tea, rubber, and coconut are important
                agricultural exports, especially Ceylon tea. The country also earns
                money from garments manufacturing, tourism, and overseas
                employment. The service sector, including banking, trade, and
                transport, plays a major role in the economy. In recent years, Sri
                Lanka has faced economic challenges such as inflation and foreign
                debt, but the country continues to work on economic recovery and
                development.
              </p>
            </div>
            <div className="sl-media">
              <img src={economy} alt="Economy of Sri Lanka" />
            </div>
          </div>

          {/* --- Wildlife & Nature --- */}
          <div className="sl-card reverse">
            <div className="sl-body">
              <div className="sl-kicker">
                <span className="sl-dot"></span> NATURE
              </div>
              <h2 className="sl-title">Wildlife &amp; Nature</h2>
              <p className="sl-text">
                Sri Lanka is famous for its rich wildlife and beautiful nature. The
                country has many national parks like Yala and Udawalawe, where
                you can see elephants, leopards, deer, and many birds. The
                Sinharaja Rainforest is a UNESCO World Heritage site with rare
                plants and animals. From green tea plantations in the hill country to
                golden beaches and coral reefs, Sri Lanka offers amazing natural
                beauty and biodiversity in a small island.
              </p>
            </div>
            <div className="sl-media">
              <img src={wildlife} alt="Wildlife and Nature" />
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
