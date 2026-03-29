import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import {
  LayoutDashboard,
  MapPin,
  Hotel,
  Compass,
  Map,
  ShoppingBag,
  Users,
  LogOut,
  Search,
  Bell,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { label: 'Locations', to: '/admin/locations', icon: MapPin },
      { label: 'Hotels', to: '/admin/hotels', icon: Hotel },
      { label: 'Guides', to: '/admin/guides', icon: Compass },
      { label: 'Tour Packages', to: '/admin/tours', icon: Map },
      { label: 'Products', to: '/admin/products', icon: ShoppingBag },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { label: 'Users', to: '/admin/users', icon: Users },
      { label: 'Emergency Support', to: '/admin/support', icon: AlertTriangle },
    ],
  },
];

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/locations': 'Locations',
  '/admin/hotels': 'Hotels',
  '/admin/guides': 'Guides',
  '/admin/tours': 'Tour Packages',
  '/admin/products': 'Products',
  '/admin/users': 'Users',
  '/admin/support': 'Emergency Support',
};

/* ── Inline style objects (guaranteed to render) ── */
const sidebarBg = '#0c1222';
const sidebarBorder = 'rgba(148,163,184,0.08)';

const styles = {
  sidebar: {
    background: sidebarBg,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  logoBar: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: `1px solid ${sidebarBorder}`,
    flexShrink: 0,
  },
  logoMark: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 800,
    fontSize: '13px',
    flexShrink: 0,
    letterSpacing: '-0.02em',
  },
  logoText: {
    color: '#f1f5f9',
    fontWeight: 700,
    fontSize: '20px',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  logoAccent: {
    color: '#f59e0b',
  },
  collapseBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 12px',
  },
  groupLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#475569',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '0 12px',
    marginBottom: '8px',
  },
  groupWrap: {
    marginBottom: '20px',
  },
  navItem: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 12px',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#ffffff' : '#94a3b8',
    background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    marginBottom: '2px',
    position: 'relative',
  }),
  navItemHover: {
    background: 'rgba(148, 163, 184, 0.08)',
    color: '#e2e8f0',
  },
  navIcon: (isActive) => ({
    width: '20px',
    height: '20px',
    flexShrink: 0,
    color: isActive ? '#f59e0b' : '#64748b',
    transition: 'color 0.2s ease',
  }),
  activeIndicator: {
    position: 'absolute',
    left: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    borderRadius: '0 4px 4px 0',
    background: 'linear-gradient(180deg, #fbbf24, #d97706)',
  },
};

function SidebarNavItem({ item, collapsed, onMobileClose }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onMobileClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        ...styles.navItem(isActive),
        ...(hovered && !isActive ? styles.navItemHover : {}),
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px' : '9px 12px',
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && <div style={styles.activeIndicator} />}
          <Icon style={{
            ...styles.navIcon(isActive),
            ...(hovered && !isActive ? { color: '#cbd5e1' } : {}),
          }} />
          {!collapsed && <span>{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Logo */}
      <div style={styles.logoBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {!collapsed && (
            <span style={styles.logoText}>
              Ceylon<span style={styles.logoAccent}> Compass</span>
            </span>
          )}
        </div>
        {!isMobile ? (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={styles.collapseBtn}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px', transition: 'transform 0.3s', transform: collapsed ? 'rotate(180deg)' : 'none' }} />
          </button>
        ) : (
          <button
            onClick={() => setMobileOpen(false)}
            style={{ ...styles.collapseBtn, color: '#94a3b8' }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navGroups.map((group) => (
          <div key={group.label} style={styles.groupWrap}>
            {!collapsed && <p style={styles.groupLabel}>{group.label}</p>}
            <div>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  onMobileClose={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', zIndex: 50,
        ...styles.sidebar,
        position: 'fixed',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        display: 'flex',
      }}
        className="lg:hidden"
      >
        <SidebarContent isMobile />
      </aside>

      {/* Desktop sidebar */}
      <aside
        style={{
          ...styles.sidebar,
          width: collapsed ? '72px' : '256px',
          transition: 'width 0.3s cubic-bezier(0.32,0.72,0,1)',
          flexShrink: 0,
        }}
        className="hidden lg:flex"
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header style={{
          height: '64px', background: '#ffffff', borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <Menu style={{ width: '20px', height: '20px' }} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
              {pageTitles[location.pathname] || 'Admin Panel'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: '8px', background: '#f1f5f9', borderRadius: '10px', padding: '8px 14px', width: '240px', border: '2px solid transparent', transition: 'all 0.2s' }}>
              <Search style={{ width: '16px', height: '16px', color: '#94a3b8', flexShrink: 0 }} />
              <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#334155', width: '100%', fontFamily: 'inherit' }} />
            </div>

            {/* Notifications */}
            <button style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Bell style={{ width: '20px', height: '20px' }} />
              <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
            </button>

            {/* Profile dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '10px', border: 'none', background: profileOpen ? '#f1f5f9' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!profileOpen) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block" style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>{user?.name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Admin</p>
                </div>
                <ChevronDown className="hidden sm:block" style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
              </button>

              {profileOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setProfileOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '256px', zIndex: 50,
                    background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e5ea',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                      </div>
                    </div>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#92400e', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '999px', padding: '3px 10px' }}>Admin</span>
                    </div>
                    <div style={{ padding: '6px' }}>
                      <button
                        onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#ef4444', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut style={{ width: '16px', height: '16px' }} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
