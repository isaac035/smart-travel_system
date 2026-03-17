import { MapPin, Mail, Phone, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="t2l-footer">
      <div className="t2l-footer__inner">

        <div className="t2l-footer__col">
          <h3 className="t2l-footer__title">Ceylon Compass</h3>
          <p className="t2l-footer__text">
            Discover the beauty of Sri Lanka with our trusted travel guide. Explore
            destinations, culture, and unforgettable experiences.
          </p>
        </div>

        <div className="t2l-footer__col">
          <h3 className="t2l-footer__title">SITE MAP</h3>
          <a className="t2l-footer__link" href="/">Home</a>
          <a className="t2l-footer__link" href="/about">About</a>
          <a className="t2l-footer__link" href="/explore">Explore</a>
        </div>

        <div className="t2l-footer__col">
          <h3 className="t2l-footer__title">USEFUL LINKS</h3>
          <a className="t2l-footer__link" href="/explore">Travel Tips</a>
          <a className="t2l-footer__link" href="/services/weather">Weather Updates</a>
          <a className="t2l-footer__link" href="/hotels">Hotels</a>
          <a className="t2l-footer__link" href="/explore">Transport</a>
        </div>

        <div className="t2l-footer__col">
          <h3 className="t2l-footer__title">CONTACT</h3>

          <div className="t2l-footer__row">
            <MapPin size={18} />
            <span>Colombo, Sri Lanka</span>
          </div>

          <div className="t2l-footer__row">
            <Mail size={18} />
            <span>info@travel2lanka.com</span>
          </div>

          <div className="t2l-footer__row">
            <Phone size={18} />
            <span>+94 71 234 5678</span>
          </div>
        </div>

      </div>

      <div className="t2l-footer__divider"></div>

      <div className="t2l-footer__bottom">
        <p className="t2l-footer__copy">
          &copy;Copyright {new Date().getFullYear()} CeylonCompass.lk | All Rights Reserved
        </p>

        <div className="t2l-footer__social">
          <a className="t2l-footer__icon" href="#" aria-label="Facebook"><Facebook size={16} /></a>
          <a className="t2l-footer__icon" href="#" aria-label="Instagram"><Instagram size={16} /></a>
          <a className="t2l-footer__icon" href="#" aria-label="Twitter"><Twitter size={16} /></a>
          <a className="t2l-footer__icon" href="#" aria-label="YouTube"><Youtube size={16} /></a>
        </div>
      </div>
    </footer>
  );
}
