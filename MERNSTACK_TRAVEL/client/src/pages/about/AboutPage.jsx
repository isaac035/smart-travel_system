import Layout from '../../components/Layout';
import { MapPin, Mail, Phone, CalendarDays } from 'lucide-react';
import "../../styles/about.css";
import profile from "../../assets/images/profile.jpg";

export default function About() {
  return (
    <Layout>
      <div style={{ background: '#F5F5F5' }}>

        {/* Hero Banner */}
        <div className="about-hero" style={{
          position: 'relative', width: '100%', height: '220px',
          backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80')",
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}>
          {/* Light gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.25) 100%)',
          }} />

          {/* Content */}
          <div style={{
            position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto',
            padding: '0 24px', height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <p style={{
              fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.75)',
              textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px',
            }}>
              About Ceylon Compass
            </p>
            <h1 style={{
              fontSize: '42px', fontWeight: '800', color: '#fff',
              lineHeight: 1.15, margin: '0 0 14px', maxWidth: '580px',
            }}>
              Discover Sri Lanka<br />
              With <span style={{ color: '#fbbf24' }}>Ceylon Compass</span>
            </h1>

          </div>
        </div>

        <div className="about" style={{ marginTop: '48px' }}>
          <div className="image-section">
            <img src={profile} alt="about us" />
          </div>

          <div className="content-section">

            <h3 className="subtitle">Your Local Sri Lanka Travel Guide</h3>
            <p className="description">
              Welcome to Lanka Travel Guide, your trusted companion for exploring the beauty of Sri Lanka.
              Our mission is to help travelers discover the island's most amazing destinations,
              from ancient cultural sites and misty mountains to golden beaches and wildlife adventures.
              We provide accurate location details, travel tips, weather updates, and personalized recommendations to make your journey safe and enjoyable. Whether you are planning a relaxing beach holiday,
              an exciting safari,
              or a cultural tour, our platform is designed to guide you every step of the way.
              At Lanka Travel Guide, we believe every journey should be a different discovery.
            </p>
          </div>
        </div>
        <br></br>
        <br></br>

        {/* Contact Us Section */}
        <div className="contact-section">
          <h2 className="contact-section__title">Contact Us</h2>
          <div className="contact-form">
            <div className="form-left">
              <div className="form-group">
                <input type="text" placeholder="Your Name" />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Your Phone Number" />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Email" />
              </div>
              <div className="form-group">
                <textarea placeholder="Message Here"></textarea>
              </div>
              <button className="contact-btn" type="button">Enter</button>
            </div>

            <div className="form-right">
              <h3>Reach Us</h3>

              <div className="contact-info">
                <h4><MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> ADDRESS</h4>
                <p>Lotus Tower, Colombo, Sri Lanka</p>
              </div>

              <div className="contact-info">
                <h4><Mail size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> info@example.com</h4>
                <p>If you have questions about our website, please contact us through our mail.</p>
              </div>

              <div className="contact-info">
                <h4><Phone size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> +(0000) 123 456789</h4>
                <p>10:00 am - 7:00pm</p>
              </div>

              <div className="contact-info">
                <h4><CalendarDays size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> MONDAY – THURSDAY : 11AM – 5PM</h4>
                <p>FRIDAY – SUNDAY : 10AM – 5PM LAST HOUR : 4:30PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
