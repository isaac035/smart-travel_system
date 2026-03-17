import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);
  const profileRef = useRef(null);

  // navbar scroll effect
  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector(".nav-container");
      if (!nav) return;
      if (window.scrollY > 50) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close dropdowns on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setServiceOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = () => {
    const wasGuide = user?.role === 'guide';
    logout();
    toast.success("Logged out successfully");
    navigate(wasGuide ? '/guide/login' : '/');
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setMobileServiceOpen(false);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className="header">
      <div className="nav-container">
        <Link to="/" className="brand brand-text">
          <span style={{ color: '#fff' }}>Ceylon</span><span style={{ color: '#fff', marginLeft: 6 }}>Compass</span>
        </Link>

        <nav className="desktop-nav" ref={menuRef}>
          <NavLink to="/" end>HOME</NavLink>
          <NavLink to="/about">ABOUT US</NavLink>
          <NavLink to="/explore">EXPLORE</NavLink>
          <NavLink to="/services/weather">WEATHER</NavLink>

          <div className="dropdown">
            <button
              type="button"
              className="dropbtn"
              onClick={() => setServiceOpen((v) => !v)}
              aria-expanded={serviceOpen}
            >
              SERVICE
              <svg
                style={{
                  width: "10px", height: "10px",
                  transition: "transform 0.2s",
                  transform: serviceOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`dropdown-content ${serviceOpen ? "show" : ""}`}>
              <NavLink to="/tours">Tour Packages</NavLink>
              <NavLink to="/services/travel-products">Travel Product</NavLink>
              <NavLink to="/services/guides">Travel Guider</NavLink>
              <NavLink to="/hotels">Hotel</NavLink>
            </div>
          </div>
        </nav>

        {/* Desktop Auth */}
        {user ? (
          <div className="desktop-auth">
            {user.role === "admin" && (
              <Link to="/admin">ADMIN</Link>
            )}
            {user.role === "guide" && (
              <Link to="/guide/dashboard" style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Guide Dashboard</Link>
            )}
            <div ref={profileRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={{
                    width: 38, height: 38, borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.3)', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                  />
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: '#f59e0b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#000', fontSize: 15, fontWeight: 700,
                    border: '2px solid rgba(255,255,255,0.2)', transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 200,
                  background: '#fff', borderRadius: 14, overflow: 'hidden',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb', zIndex: 100,
                  animation: 'profileDropIn 0.18s ease-out',
                }}>
                  {/* User info header */}
                  <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} style={{
                          width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                          border: '2px solid #f59e0b', flexShrink: 0,
                        }} />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', background: '#f59e0b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#000', fontSize: 16, fontWeight: 700, flexShrink: 0,
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '6px 8px' }}>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                        color: '#374151', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link to={user.role === 'guide' ? '/guide/dashboard' : '/profile'} onClick={() => setProfileOpen(false)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                        color: '#374151', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        My Profile
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div style={{ padding: '4px 8px 8px', borderTop: '1px solid #f3f4f6' }}>
                    <button onClick={() => { setProfileOpen(false); handleLogout(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                      color: '#ef4444', fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
                      cursor: 'pointer', width: '100%', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NavLink to="/login" className="desktop-login">Login</NavLink>
          </div>
        )}

        <button
          className="hamburger"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Mobile Backdrop */}
      <div
        className={`mobile-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={closeMobile}
      />

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileOpen ? "open" : ""}`}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <Link to="/" className="drawer-brand" onClick={closeMobile}>
            <span>Ceylon</span><span style={{ marginLeft: 6 }}>Compass</span>
          </Link>
          <button className="drawer-close" onClick={closeMobile} aria-label="Close menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="drawer-nav">
          <NavLink to="/" end onClick={closeMobile} className="drawer-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </NavLink>
          <NavLink to="/about" onClick={closeMobile} className="drawer-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            About Us
          </NavLink>
          <NavLink to="/explore" onClick={closeMobile} className="drawer-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Explore
          </NavLink>
          <NavLink to="/services/weather" onClick={closeMobile} className="drawer-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
            Weather
          </NavLink>

          {/* Services Accordion */}
          <div className="drawer-accordion">
            <button
              className="drawer-link drawer-accordion-btn"
              onClick={() => setMobileServiceOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Services
              <svg
                className="drawer-chevron"
                style={{ transform: mobileServiceOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className={`drawer-submenu ${mobileServiceOpen ? "expanded" : ""}`}>
              <NavLink to="/tours" onClick={closeMobile} className="drawer-sublink">Tour Packages</NavLink>
              <NavLink to="/services/travel-products" onClick={closeMobile} className="drawer-sublink">Travel Product</NavLink>
              <NavLink to="/services/guides" onClick={closeMobile} className="drawer-sublink">Travel Guider</NavLink>
              <NavLink to="/hotels" onClick={closeMobile} className="drawer-sublink">Hotel</NavLink>
            </div>
          </div>
        </nav>

        {/* Drawer Footer / Auth */}
        <div className="drawer-footer">
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'guide' ? '/guide/dashboard' : '/profile'}
                className="drawer-profile"
                onClick={closeMobile}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="drawer-avatar-img" />
                ) : (
                  <div className="drawer-avatar">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="drawer-profile-info">
                  <span className="drawer-profile-name">{user.name}</span>
                  <span className="drawer-profile-role">
                    {user.role === 'admin' ? 'Administrator' : user.role === 'guide' ? 'Travel Guide' : 'Traveler'}
                  </span>
                </div>
              </Link>
              {user.role === "admin" && (
                <NavLink to="/admin" onClick={closeMobile} className="drawer-link drawer-dash-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Admin Dashboard
                </NavLink>
              )}
              {user.role === "guide" && (
                <NavLink to="/guide/dashboard" onClick={closeMobile} className="drawer-link drawer-dash-link" style={{ color: '#f59e0b' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Guide Dashboard
                </NavLink>
              )}
              <button onClick={() => { handleLogout(); closeMobile(); }} className="drawer-logout-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="drawer-login-btn" onClick={closeMobile}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
