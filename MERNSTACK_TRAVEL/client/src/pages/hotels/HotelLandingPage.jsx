import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';

/* ─────────────────────────────────────────────────────
   INJECT GLOBAL STYLES + KEYFRAMES
───────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes slideDown {
    from { opacity:0; transform:translateY(-10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes slideRight {
    from { opacity:0; transform:translateX(-18px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes toastIn {
    from { opacity:0; transform:translateX(120%); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes toastOut {
    from { opacity:1; transform:translateX(0); }
    to   { opacity:0; transform:translateX(120%); }
  }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity:.6; }
    100% { transform: scale(1.55); opacity:0; }
  }
  @keyframes heroFloat {
    0%,100% { transform: translateY(0);   }
    50%      { transform: translateY(-8px); }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes badgePop {
    0%   { transform: scale(0.4); opacity:0; }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1);   opacity:1; }
  }
  @keyframes heartBeat {
    0%,100% { transform: scale(1);    }
    30%      { transform: scale(1.35); }
    60%      { transform: scale(0.9);  }
  }
  @keyframes progressBar {
    from { width: 100%; }
    to   { width: 0%;   }
  }

  .hide-scrollbar::-webkit-scrollbar { display:none; }
  .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }

  .card-enter { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }

  .skeleton-shine {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 600px 100%;
    animation: shimmer 1.5s infinite;
  }

  .section-animate { animation: fadeUp 0.6s cubic-bezier(.22,1,.36,1) both; }
`;

/* ─────────────────────────────────────────────────────
   THEME
───────────────────────────────────────────────────── */
const T = {
  bg:'#f8f9fa', bgCard:'#ffffff', bgSection:'#ffffff',
  navy:'#1a1a2e', navyMid:'#16213e',
  gold:'#f59e0b', goldDk:'#d97706', goldLt:'#fbbf24',
  goldBg:'#fffbeb', goldBorder:'#fcd34d',
  emerald:'#059669', emeraldBg:'#ecfdf5',
  red:'#ef4444', redBg:'#fff1f2',
  text:'#111827', textMid:'#374151', textLight:'#6b7280',
  border:'#e5e7eb', borderMid:'#d1d5db',
  shadow:'0 2px 14px rgba(0,0,0,0.07)',
  shadowHov:'0 20px 50px rgba(0,0,0,0.15)',
  shadowCard:'0 4px 20px rgba(0,0,0,0.09)',
};

/* ─────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────── */
const RECENTLY_VIEWED = [
  { _id:'rv1', name:'Cinnamon Grand Colombo', location:'Colombo 3',  starRating:5, pricePerNight:28000, images:['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'] },
  { _id:'rv2', name:'Heritance Kandalama',    location:'Dambulla',   starRating:5, pricePerNight:22000, images:['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600'] },
  { _id:'rv3', name:'Cape Weligama',          location:'Weligama',   starRating:5, pricePerNight:45000, images:['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600'] },
  { _id:'rv4', name:'Jetwing Yala',           location:'Yala',       starRating:4, pricePerNight:18500, images:['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600'] },
  { _id:'rv5', name:'Amanwella Resort',       location:'Tangalle',   starRating:5, pricePerNight:52000, images:['https://images.unsplash.com/photo-1551882547-ff40c4a49ce7?w=600'] },
];

const POPULAR_SEARCHES = [
  { id:'ps1', name:'Mirissa Beach',     query:'mirissa',      img:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', tag:'Beach Bliss', hotels:148 },
  { id:'ps2', name:'Sigiriya Rock',     query:'sigiriya',     img:'https://images.unsplash.com/photo-1586016413664-864c0dd76f53?w=600', tag:'Heritage',    hotels:92  },
  { id:'ps3', name:'Ella Hill Country',query:'ella',          img:'https://images.unsplash.com/photo-1546961342-ea5f62d549f2?w=600', tag:'Mountains',   hotels:110 },
  { id:'ps4', name:'Nuwara Eliya',      query:'nuwara eliya', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', tag:'Tea Country',  hotels:74  },
  { id:'ps5', name:'Galle Fort',        query:'galle',        img:'https://images.unsplash.com/photo-1519922639192-e73293ca430e?w=600', tag:'Colonial',    hotels:63  },
  { id:'ps6', name:'Arugam Bay',        query:'arugam bay',   img:'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600', tag:'Surf',        hotels:55  },
];

const TYPE_LABELS = { resort:'Resort', boutique:'Boutique', business:'Business', budget:'Budget', villa:'Villa', heritage:'Heritage' };

/* ─────────────────────────────────────────────────────
   TOAST NOTIFICATION SYSTEM
───────────────────────────────────────────────────── */
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position:'fixed', top:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:10, pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:12,
          background: t.type === 'success' ? '#fff' : '#fff',
          border: `1.5px solid ${t.type === 'success' ? '#a7f3d0' : t.type === 'wishlist' ? '#fcd34d' : '#e5e7eb'}`,
          borderLeft: `4px solid ${t.type === 'success' ? T.emerald : t.type === 'wishlist' ? T.gold : T.text}`,
          borderRadius:14, padding:'13px 18px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.13)',
          minWidth:260, maxWidth:320,
          animation: t.exiting ? 'toastOut 0.35s ease forwards' : 'toastIn 0.4s cubic-bezier(.22,1,.36,1) forwards',
          pointerEvents:'auto',
          position:'relative', overflow:'hidden',
        }}>
          <span style={{ fontSize:20, flexShrink:0 }}>
            {t.type === 'success' ? '✅' : t.type === 'wishlist' ? '❤️' : 'ℹ️'}
          </span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:700, color: T.text, margin:0 }}>{t.title}</p>
            {t.msg && <p style={{ fontSize:12, color: T.textLight, margin:'2px 0 0', lineHeight:1.4 }}>{t.msg}</p>}
          </div>
          {/* Progress bar */}
          <div style={{
            position:'absolute', bottom:0, left:0, height:3,
            background: t.type === 'success' ? T.emerald : t.type === 'wishlist' ? T.gold : T.text,
            borderRadius:99,
            animation: `progressBar ${t.duration || 3000}ms linear forwards`,
          }} />
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, msg = '', type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(p => [...p, { id, title, msg, type, duration, exiting: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, exiting:true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 380);
    }, duration);
  }, []);
  return { toasts, add };
}

/* ─────────────────────────────────────────────────────
   QUICK VIEW MODAL
───────────────────────────────────────────────────── */
function QuickViewModal({ hotel, onClose, navigate }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = hotel?.images || [];

  useEffect(() => {
    const handle = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  if (!hotel) return null;
  const disc = Math.round(hotel.pricePerNight * (1 - (hotel.discount || 0) / 100));

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:'fixed', inset:0, zIndex:8888,
        background:'rgba(0,0,0,0.6)',
        backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fadeIn 0.25s ease',
        padding:24,
      }}
    >
      <div style={{
        background:'#fff', borderRadius:24, overflow:'hidden',
        width:'100%', maxWidth:760,
        animation:'fadeUp 0.35s cubic-bezier(.22,1,.36,1)',
        boxShadow:'0 32px 80px rgba(0,0,0,0.25)',
        display:'flex', flexDirection:'row', maxHeight:'85vh',
      }}>
        {/* Left: image */}
        <div style={{ width:'46%', flexShrink:0, position:'relative', background:'#111' }}>
          <img
            src={imgs[imgIdx] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'}
            alt={hotel.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'opacity 0.3s' }}
            onError={e => { e.currentTarget.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'; }}
          />
          {imgs.length > 1 && (
            <div style={{ position:'absolute', bottom:12, left:0, right:0, display:'flex', justifyContent:'center', gap:6 }}>
              {imgs.map((_, i) => (
                <button key={i} onClick={() => setImgIdx(i)} style={{
                  width: i === imgIdx ? 22 : 8, height:8,
                  borderRadius:99, background: i === imgIdx ? T.gold : 'rgba(255,255,255,0.55)',
                  border:'none', cursor:'pointer', transition:'all 0.25s', padding:0,
                }} />
              ))}
            </div>
          )}
          {hotel.discount > 0 && (
            <span style={{
              position:'absolute', top:14, left:14,
              background: T.red, color:'#fff',
              fontSize:11, fontWeight:800,
              padding:'4px 10px', borderRadius:99,
              animation:'badgePop 0.4s ease',
            }}>
              -{hotel.discount}% OFF
            </span>
          )}
        </div>

        {/* Right: details */}
        <div style={{ flex:1, padding:'28px 28px 24px', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position:'absolute', top:16, right:16,
            width:32, height:32, borderRadius:'50%',
            background:'#f3f4f6', border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            color: T.textLight, transition:'all 0.2s', zIndex:10,
          }}
            onMouseOver={e => { e.currentTarget.style.background='#fee2e2'; e.currentTarget.style.color=T.red; }}
            onMouseOut={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color=T.textLight; }}
          >
            ✕
          </button>

          <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:11, fontWeight:700, background: T.goldBg, color: T.goldDk, padding:'3px 10px', borderRadius:99, border:`1px solid ${T.goldBorder}`, flexShrink:0 }}>
              {TYPE_LABELS[hotel.hotelType] || hotel.hotelType || 'Hotel'}
            </span>
          </div>

          <h2 style={{ fontSize:20, fontWeight:900, color: T.text, margin:'0 0 6px', lineHeight:1.25, fontFamily:"'Playfair Display', serif" }}>
            {hotel.name}
          </h2>

          <p style={{ fontSize:13, color: T.textLight, margin:'0 0 14px', display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" style={{ color:T.gold, flexShrink:0 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {hotel.location}
          </p>

          {/* Stars & rating */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <span style={{ color: T.gold, fontSize:14 }}>{'★'.repeat(hotel.starRating || 0)}</span>
            {hotel.averageRating > 0 && (
              <span style={{ fontSize:12, color: T.textLight }}>
                <strong style={{ color: T.goldDk }}>★ {hotel.averageRating}</strong> ({hotel.reviewCount || 0} reviews)
              </span>
            )}
          </div>

          {/* Amenities */}
          {hotel.amenities?.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <p style={{ fontSize:11, fontWeight:700, color: T.textLight, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Amenities</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {hotel.amenities.slice(0, 8).map(a => (
                  <span key={a} style={{ fontSize:11, padding:'4px 10px', borderRadius:8, background:'#f9fafb', color: T.textMid, border:`1px solid ${T.border}` }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div style={{ marginTop:'auto', paddingTop:18, borderTop:`1px solid ${T.border}` }}>
            {hotel.discount > 0 && (
              <span style={{ fontSize:12, textDecoration:'line-through', color: T.textLight, display:'block' }}>
                LKR {hotel.pricePerNight?.toLocaleString()}
              </span>
            )}
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:16 }}>
              <span style={{ fontSize:26, fontWeight:900, color: T.goldDk }}>LKR {disc.toLocaleString()}</span>
              <span style={{ fontSize:12, color: T.textLight }}>/night</span>
            </div>
            <button
              onClick={() => { onClose(); navigate(`/hotels/${hotel._id}`); }}
              style={{
                width:'100%', padding:'13px', borderRadius:14, border:'none',
                background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,
                color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer',
                boxShadow:`0 6px 20px rgba(245,158,11,0.35)`,
                transition:'transform 0.2s, box-shadow 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
              onMouseOver={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 28px rgba(245,158,11,0.45)`; }}
              onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 20px rgba(245,158,11,0.35)`; }}
            >
              View Full Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
const Stars = ({ count }) => (
  <span style={{ fontSize:12, color: T.gold }}>
    {'★'.repeat(Math.min(count || 0, 5))}
    <span style={{ color:'rgba(255,255,255,0.3)' }}>{'★'.repeat(Math.max(0, 5 - (count || 0)))}</span>
  </span>
);

function Tooltip({ text, children }) {
  const [vis, setVis] = useState(false);
  return (
    <span style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      <span style={{
        position:'absolute', bottom:'calc(100% + 9px)', left:'50%',
        transform: vis ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0.85)',
        background: T.navy, color:'#fff',
        fontSize:11, fontWeight:600,
        padding:'6px 12px', borderRadius:9, whiteSpace:'nowrap',
        pointerEvents:'none',
        boxShadow:'0 6px 18px rgba(0,0,0,0.25)',
        opacity: vis ? 1 : 0,
        transition:'opacity 0.2s, transform 0.2s',
        zIndex:99,
      }}>
        {text}
        <span style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:`5px solid ${T.navy}` }} />
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────── */
const SkeletonCard = ({ flexShrink0 = true }) => (
  <div className={`rounded-2xl overflow-hidden bg-white${flexShrink0 ? ' flex-shrink-0' : ''}`}
    style={{ width: flexShrink0 ? 264 : undefined, border:`1px solid ${T.border}`, boxShadow: T.shadow }}>
    <div className="skeleton-shine" style={{ height:190 }} />
    <div style={{ padding:16 }}>
      {[['75%',14],['50%',12],['65%',12],['40%',16]].map(([w, h], i) => (
        <div key={i} className="skeleton-shine" style={{ height:h, borderRadius:6, width:w, marginBottom: i < 3 ? 10 : 0, marginTop: i === 3 ? 14 : 0 }} />
      ))}
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────
   RECENTLY VIEWED CARD
───────────────────────────────────────────────────── */
function RecentCard({ hotel, onQuickView, style: extStyle }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        width:224, flexShrink:0, borderRadius:20, overflow:'hidden',
        background: T.bgCard, border:`1px solid ${hov ? T.goldBorder : T.border}`,
        boxShadow: hov ? T.shadowHov : T.shadow,
        transform: hov ? 'translateY(-8px)' : 'translateY(0)',
        transition:'transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.25s',
        display:'flex', flexDirection:'column', cursor:'pointer',
        ...extStyle,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Link to={`/hotels/${hotel._id}`} style={{ textDecoration:'none', display:'contents' }}>
        <div style={{ height:145, position:'relative', overflow:'hidden' }}>
          <img
            src={hotel.images?.[0]}
            alt={hotel.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', transform: hov ? 'scale(1.1)' : 'scale(1)', transition:'transform 0.55s cubic-bezier(.22,1,.36,1)', display:'block' }}
            onError={e => { e.currentTarget.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
          />
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)` }} />
          <span style={{ position:'absolute', top:10, right:10, fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:99, background:'rgba(0,0,0,0.5)', color: T.goldLt, backdropFilter:'blur(4px)' }}>
            {'★'.repeat(hotel.starRating || 0)}
          </span>
        </div>

        <div style={{ padding:'14px 14px 12px', flex:1, display:'flex', flexDirection:'column' }}>
          <h4 style={{
            fontWeight:800, fontSize:13, color: T.text,
            margin:'0 0 5px', lineHeight:1.4,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
            minHeight:'2.8em',
          }}>{hotel.name}</h4>
          <p style={{ fontSize:11, color: T.textLight, margin:0, display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}>
            <svg width="11" height="11" fill="currentColor" style={{ color:T.gold, flexShrink:0 }} viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{hotel.location}</span>
          </p>
          <div style={{ marginTop:'auto', paddingTop:10, borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <span style={{ fontWeight:900, fontSize:14, color: T.goldDk }}>LKR {hotel.pricePerNight?.toLocaleString()}</span>
              <span style={{ fontSize:10, color: T.textLight, marginLeft:3 }}>/night</span>
            </div>
            <Tooltip text="Quick View">
              <span
                onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView(hotel); }}
                style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: hov ? T.gold : T.goldBg, color: hov ? '#fff' : T.goldDk,
                  border:`1.5px solid ${T.goldBorder}`, cursor:'pointer', fontSize:12,
                  transition:'all 0.25s', transform: hov ? 'scale(1.1)' : 'scale(1)',
                }}
              >→</span>
            </Tooltip>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   DEAL CARD
───────────────────────────────────────────────────── */
function DealCard({ hotel, onQuickView, onWishlist, style: extStyle }) {
  const [hov, setHov] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const disc = hotel.pricePerNight * (1 - (hotel.discount || 0) / 100);
  const typeLabel = TYPE_LABELS[hotel.hotelType] || hotel.hotelType || 'Hotel';

  const handleWishlist = e => {
    e.preventDefault();
    e.stopPropagation();
    const next = !wishlisted;
    setWishlisted(next);
    onWishlist?.(hotel, next);
  };

  return (
    <Link
      to={`/hotels/${hotel._id}`}
      style={{
        width:284, flexShrink:0, borderRadius:22, overflow:'hidden',
        background: T.bgCard, border:`1.5px solid ${hov ? T.goldBorder : T.border}`,
        boxShadow: hov ? T.shadowHov : T.shadow,
        transform: hov ? 'translateY(-10px)' : 'translateY(0)',
        transition:'transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.25s',
        display:'flex', flexDirection:'column', textDecoration:'none',
        ...extStyle,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Image */}
      <div style={{ height:195, position:'relative', overflow:'hidden', flexShrink:0 }}>
        <img
          src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
          alt={hotel.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', transform: hov ? 'scale(1.09)' : 'scale(1)', transition:'transform 0.55s cubic-bezier(.22,1,.36,1)', display:'block' }}
          onError={e => { e.currentTarget.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
        />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)` }} />
        {/* Type badge */}
        <span style={{
          position:'absolute', top:12, left:12, fontSize:10, fontWeight:800,
          padding:'4px 10px', borderRadius:99,
          background: T.gold, color:'#fff',
          boxShadow:'0 2px 10px rgba(245,158,11,0.45)',
          animation: hov ? 'none' : 'none',
        }}>{typeLabel}</span>
        {/* Discount badge */}
        {hotel.discount > 0 && (
          <span style={{ position:'absolute', top:12, right:12, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:99, background: T.red, color:'#fff', boxShadow:'0 2px 10px rgba(239,68,68,0.4)' }}>
            -{hotel.discount}% OFF
          </span>
        )}
        {/* Bottom star row */}
        <div style={{ position:'absolute', bottom:10, left:12, display:'flex', alignItems:'center', justifyContent:'space-between', right:12 }}>
          <Stars count={hotel.starRating} />
          {/* Wishlist heart */}
          <button
            onClick={handleWishlist}
            style={{
              background: wishlisted ? '#fee2e2' : 'rgba(0,0,0,0.45)',
              border:'none', cursor:'pointer', borderRadius:'50%',
              width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, backdropFilter:'blur(4px)',
              transition:'all 0.25s', flexShrink:0,
              animation: wishlisted ? 'heartBeat 0.4s ease' : 'none',
            }}
          >
            <span style={{ color: wishlisted ? T.red : 'rgba(255,255,255,0.85)', lineHeight:1 }}>
              {wishlisted ? '♥' : '♡'}
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'16px', flex:1, display:'flex', flexDirection:'column' }}>
        {/* Rating row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:11, color: T.textLight }}>
            {hotel.reviewCount > 0
              ? <><strong style={{ color: T.goldDk }}>★ {hotel.averageRating}</strong> ({hotel.reviewCount})</>
              : <span style={{ fontStyle:'italic' }}>No reviews yet</span>}
          </span>
          <Tooltip text="Quick View">
            <span
              onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView?.(hotel); }}
              style={{
                fontSize:10, fontWeight:700, color: T.goldDk,
                background: T.goldBg, border:`1px solid ${T.goldBorder}`,
                padding:'3px 9px', borderRadius:99, cursor:'pointer',
                transition:'all 0.2s',
                opacity: hov ? 1 : 0,
                transform: hov ? 'translateY(0)' : 'translateY(4px)',
              }}
            >Quick View</span>
          </Tooltip>
        </div>

        {/* Name: exactly 2 lines with ellipsis */}
        <h3 style={{
          fontWeight:800, fontSize:15, color: hov ? T.goldDk : T.text,
          margin:'0 0 6px', lineHeight:1.4,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden', minHeight:'2.8em',
          transition:'color 0.2s',
        }}>{hotel.name}</h3>

        {/* Location */}
        <p style={{ fontSize:12, color: T.textLight, margin:'0 0 10px', display:'flex', alignItems:'center', gap:5, overflow:'hidden' }}>
          <svg width="11" height="11" fill="currentColor" style={{ color:T.gold, flexShrink:0 }} viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{hotel.location}</span>
        </p>

        {/* Amenities */}
        {hotel.amenities?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10, minHeight:22 }}>
            {hotel.amenities.slice(0, 2).map(a => (
              <span key={a} style={{ fontSize:10, padding:'3px 8px', borderRadius:7, background:'#f3f4f6', color: T.textMid, whiteSpace:'nowrap' }}>{a}</span>
            ))}
            {hotel.amenities.length > 2 && <span style={{ fontSize:10, color: T.textLight, alignSelf:'center' }}>+{hotel.amenities.length - 2}</span>}
          </div>
        )}

        {/* Pricing */}
        <div style={{ marginTop:'auto', paddingTop:12, borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            {hotel.discount > 0 && (
              <span style={{ fontSize:11, textDecoration:'line-through', color: T.textLight, display:'block' }}>LKR {hotel.pricePerNight?.toLocaleString()}</span>
            )}
            <span style={{ fontSize:20, fontWeight:900, color: T.goldDk }}>LKR {Math.round(disc).toLocaleString()}</span>
            <span style={{ fontSize:11, color: T.textLight, marginLeft:3 }}>/night</span>
          </div>
          {hotel.discount > 0 && (
            <span style={{ fontSize:11, fontWeight:700, padding:'4px 9px', borderRadius:10, background: T.emeraldBg, color: T.emerald, border:'1px solid #a7f3d0' }}>
              Save {hotel.discount}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────
   POPULAR CARD
───────────────────────────────────────────────────── */
function PopularCard({ item, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{
        width:214, height:265, flexShrink:0, borderRadius:22, overflow:'hidden',
        position:'relative', border:`1.5px solid ${hov ? T.goldBorder : T.border}`,
        boxShadow: hov ? T.shadowHov : T.shadow,
        transform: hov ? 'translateY(-9px) scale(1.02)' : 'translateY(0) scale(1)',
        transition:'transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.25s',
        cursor:'pointer', textAlign:'left', padding:0, background:'#111',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <img src={item.img} alt={item.name}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform: hov ? 'scale(1.12)' : 'scale(1)', transition:'transform 0.6s cubic-bezier(.22,1,.36,1)' }}
      />
      {/* Gradient */}
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)`, opacity: hov ? 1 : 0.85, transition:'opacity 0.3s' }} />
      {/* Gold shimmer on hover */}
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg, rgba(245,158,11,0.18), transparent 60%)`, opacity: hov ? 1 : 0, transition:'opacity 0.3s' }} />
      {/* Tag */}
      <span style={{ position:'absolute', top:13, left:13, fontSize:10, fontWeight:800, padding:'4px 10px', borderRadius:99, background: T.gold, color:'#fff', boxShadow:'0 2px 10px rgba(245,158,11,0.5)', zIndex:2 }}>
        {item.tag}
      </span>
      {/* Count */}
      <span style={{ position:'absolute', top:13, right:13, fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:99, background:'rgba(0,0,0,0.55)', color:'rgba(255,255,255,0.9)', backdropFilter:'blur(6px)', zIndex:2 }}>
        {item.hotels} hotels
      </span>
      {/* Footer */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 16px 14px', zIndex:2,
        transform: hov ? 'translateY(0)' : 'translateY(4px)', transition:'transform 0.3s', }}>
        <h4 style={{ color:'#fff', fontWeight:800, fontSize:15, margin:'0 0 6px', lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {item.name}
        </h4>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.75)', margin:0, display:'flex', alignItems:'center', gap:5,
          opacity: hov ? 1 : 0.7, transition:'opacity 0.3s', }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Explore hotels
        </p>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   TOP RATED GRID CARD
───────────────────────────────────────────────────── */
function TopCard({ h, onQuickView, onWishlist }) {
  const [hov, setHov] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const disc = Math.round(h.pricePerNight * (1 - (h.discount || 0) / 100));

  const handleWishlist = e => {
    e.preventDefault();
    e.stopPropagation();
    const next = !wishlisted;
    setWishlisted(next);
    onWishlist?.(h, next);
  };

  return (
    <Link
      to={`/hotels/${h._id}`}
      style={{
        borderRadius:22, overflow:'hidden', background:'#fff',
        border:`1.5px solid ${hov ? T.goldBorder : T.border}`,
        boxShadow: hov ? T.shadowHov : T.shadow,
        transform: hov ? 'translateY(-8px)' : 'translateY(0)',
        transition:'transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s, border-color 0.25s',
        display:'flex', flexDirection:'column', textDecoration:'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ height:185, position:'relative', overflow:'hidden', flexShrink:0 }}>
        <img
          src={h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
          alt={h.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', transform: hov ? 'scale(1.1)' : 'scale(1)', transition:'transform 0.55s cubic-bezier(.22,1,.36,1)', display:'block' }}
          onError={e => { e.currentTarget.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'; }}
        />
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to top, rgba(0,0,0,0.4), transparent 55%)` }} />
        {h.starRating && (
          <span style={{ position:'absolute', top:10, right:10, fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:99, background:'rgba(0,0,0,0.55)', color: T.goldLt, backdropFilter:'blur(6px)' }}>
            {'★'.repeat(h.starRating)}
          </span>
        )}
        {h.discount > 0 && (
          <span style={{ position:'absolute', top:10, left:10, fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:99, background: T.red, color:'#fff' }}>
            -{h.discount}%
          </span>
        )}
        {/* Hover overlay actions */}
        <div style={{
          position:'absolute', bottom:10, left:10, right:10,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(6px)',
          transition:'opacity 0.25s, transform 0.25s',
        }}>
          <span
            onClick={e => { e.preventDefault(); e.stopPropagation(); onQuickView?.(h); }}
            style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:99, background:'rgba(255,255,255,0.9)', color: T.goldDk, cursor:'pointer' }}
          >Quick View</span>
          <button onClick={handleWishlist} style={{
            width:28, height:28, borderRadius:'50%', border:'none', cursor:'pointer',
            background: wishlisted ? '#fee2e2' : 'rgba(255,255,255,0.85)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, transition:'all 0.2s',
            animation: wishlisted ? 'heartBeat 0.4s ease' : 'none',
          }}>
            <span style={{ color: wishlisted ? T.red : T.textMid, lineHeight:1 }}>{wishlisted ? '♥' : '♡'}</span>
          </button>
        </div>
      </div>

      <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column' }}>
        {/* Name: 2-line clamp */}
        <h3 style={{
          fontWeight:800, fontSize:14, lineHeight:1.4,
          color: hov ? T.goldDk : T.text,
          margin:'0 0 6px',
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          overflow:'hidden', minHeight:'2.8em',
          transition:'color 0.2s',
        }}>{h.name}</h3>

        <p style={{ fontSize:11, color: T.textLight, margin:'0 0 0', display:'flex', alignItems:'center', gap:4, overflow:'hidden' }}>
          <svg width="11" height="11" fill="currentColor" style={{ color:T.gold, flexShrink:0 }} viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.location}</span>
        </p>

        <div style={{ marginTop:'auto', paddingTop:10, borderTop:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <span style={{ fontWeight:900, fontSize:15, color: T.goldDk }}>LKR {disc.toLocaleString()}</span>
            <span style={{ fontSize:10, color: T.textLight, marginLeft:3 }}>/night</span>
          </div>
          {h.averageRating > 0 && (
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:9, background: T.goldBg, color: T.goldDk }}>
              ★ {h.averageRating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────
   HORIZONTAL CAROUSEL
───────────────────────────────────────────────────── */
function HorizontalCarousel({ children, gap = 18 }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', check, { passive:true });
    window.addEventListener('resize', check);
    check();
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [check]);

  const scroll = dir => ref.current?.scrollBy({ left: dir * 320, behavior:'smooth' });

  const ArrowBtn = ({ dir, visible }) => (
    visible ? (
      <button
        onClick={() => scroll(dir)}
        style={{
          position:'absolute', top:'50%',
          [dir === -1 ? 'left' : 'right']: -18,
          transform:'translateY(-50%)',
          zIndex:10, width:42, height:42, borderRadius:'50%',
          background: T.bgCard, border:`2px solid ${T.goldBorder}`,
          color: T.goldDk, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: T.shadowCard,
          transition:'all 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color='#fff'; e.currentTarget.style.transform='translateY(-50%) scale(1.12)'; e.currentTarget.style.boxShadow=`0 6px 18px rgba(245,158,11,0.35)`; }}
        onMouseOut={e => { e.currentTarget.style.background = T.bgCard; e.currentTarget.style.color=T.goldDk; e.currentTarget.style.transform='translateY(-50%) scale(1)'; e.currentTarget.style.boxShadow=T.shadowCard; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={dir === -1 ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>
    ) : null
  );

  return (
    <div style={{ position:'relative', margin:'0 8px' }}>
      <ArrowBtn dir={-1} visible={canLeft} />
      <div
        ref={ref}
        className="hide-scrollbar"
        style={{ display:'flex', overflowX:'auto', gap:`${gap}px`, paddingBottom:10, paddingTop:4, paddingLeft:2, paddingRight:2 }}
      >
        {children}
      </div>
      <ArrowBtn dir={1} visible={canRight} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────── */
const SectionHeader = ({ eyebrow, title, subtitle, onViewAll }) => (
  <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:30 }}>
    <div>
      {eyebrow && (
        <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.18em', color: T.gold, display:'block', marginBottom:6 }}>
          {eyebrow}
        </span>
      )}
      <h2 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color: T.text, margin:0, fontFamily:"'Playfair Display', serif", lineHeight:1.15 }}>{title}</h2>
      {subtitle && <p style={{ fontSize:13, color: T.textLight, margin:'5px 0 0', lineHeight:1.5 }}>{subtitle}</p>}
    </div>
    {onViewAll && (
      <button
        onClick={onViewAll}
        style={{
          display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700,
          padding:'9px 18px', borderRadius:99,
          color: T.goldDk, background: T.goldBg, border:`1.5px solid ${T.goldBorder}`,
          cursor:'pointer', transition:'all 0.25s', whiteSpace:'nowrap', flexShrink:0, marginLeft:16,
        }}
        onMouseOver={e => { e.currentTarget.style.background=T.gold; e.currentTarget.style.color='#fff'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 18px rgba(245,158,11,0.35)`; }}
        onMouseOut={e => { e.currentTarget.style.background=T.goldBg; e.currentTarget.style.color=T.goldDk; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
      >
        View All
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────
   GOLD DIVIDER
───────────────────────────────────────────────────── */
const GoldDivider = () => (
  <div style={{ height:2, background:`linear-gradient(90deg, transparent, ${T.gold}, transparent)`, borderRadius:99, margin:'0 auto 64px', maxWidth:280, opacity:0.3 }} />
);

/* ─────────────────────────────────────────────────────
   SECTION WRAPPER — intersection-observer fade-up
───────────────────────────────────────────────────── */
function AnimSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold:0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(30px)', transition:`opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function HotelLandingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ location:'', checkIn:'', checkOut:'', adults:1, children:0 });
  const [occupancyOpen, setOccupancyOpen] = useState(false);
  const [deals, setDeals] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [mapHotels, setMapHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroFocus, setHeroFocus] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [quickViewHotel, setQuickViewHotel] = useState(null);
  const { toasts, add: addToast } = useToast();

  // Hero entrance
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 100); return () => clearTimeout(t); }, []);

  useEffect(() => {
    (async () => {
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
        setMapHotels(all.data.filter(h => h.coordinates?.lat));
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    const params = new URLSearchParams({
      ...(search.location && { location: search.location }),
      ...(search.checkIn  && { checkIn:  search.checkIn  }),
      ...(search.checkOut && { checkOut: search.checkOut }),
      adults:      search.adults,
      children:    search.children,
      search_type: 'location',
    });
    navigate(`/hotels/search?${params}`);
  };

  const handleWishlist = (hotel, saved) => {
    if (saved) {
      addToast('Saved to Wishlist', hotel.name, 'wishlist');
    } else {
      addToast('Removed from Wishlist', hotel.name, 'info');
    }
  };

  const occupancyLabel = `${search.adults} Adult${search.adults !== 1 ? 's' : ''}${search.children > 0 ? `, ${search.children} Child${search.children !== 1 ? 'ren' : ''}` : ''}`;

  const glassInput = {
    background:'rgba(255,255,255,0.13)',
    backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)',
    border:'1.5px solid rgba(255,255,255,0.25)',
    borderRadius:12, padding:'11px 14px',
    color:'#fff', fontSize:14, outline:'none', width:'100%',
    transition:'border-color 0.25s, box-shadow 0.25s',
    fontFamily:"'DM Sans', sans-serif",
  };

  return (
    <Layout>
      {/* Inject global styles */}
      <style>{GLOBAL_STYLES}</style>

      {/* Toast container */}
      <Toast toasts={toasts} />

      {/* Quick View Modal */}
      {quickViewHotel && (
        <QuickViewModal hotel={quickViewHotel} onClose={() => setQuickViewHotel(null)} navigate={navigate} />
      )}

      <div style={{ backgroundColor: T.bg, color: T.text, minHeight:'100vh', fontFamily:"'DM Sans', sans-serif" }}>

        {/* ════════════════════════════════════════
            HERO
        ════════════════════════════════════════ */}
        <section style={{
          position:'relative', height:'82vh', minHeight:580,
          backgroundImage:"url('https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1920&q=80')",
          backgroundSize:'cover', backgroundPosition:'center',
          display:'flex', alignItems:'center',
        }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(145deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.32) 60%,rgba(0,0,0,0.60) 100%)' }} />
          {/* Gold bottom line */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,transparent,${T.gold},transparent)` }} />
          {/* Subtle particle dots */}
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{
              position:'absolute', borderRadius:'50%',
              width: 4 + i * 2, height: 4 + i * 2,
              background: T.goldLt, opacity:0.25,
              top:`${18 + i * 14}%`, left:`${8 + i * 18}%`,
              animation:`heroFloat ${3 + i}s ease-in-out infinite`,
              animationDelay:`${i * 0.7}s`,
            }} />
          ))}

          <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:1280, margin:'0 auto', padding:'0 32px' }}>
            {/* Headline with staggered entrance */}
            <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(36px)', transition:'opacity 0.8s ease, transform 0.8s cubic-bezier(.22,1,.36,1)' }}>
              <p style={{ fontSize:11, fontWeight:800, color: T.gold, textTransform:'uppercase', letterSpacing:'0.2em', marginBottom:12, opacity:0.9 }}>
                🌴 Sri Lanka's Premier Hotel Discovery
              </p>
              <h1 style={{ fontSize:'clamp(2.6rem,5.5vw,4.2rem)', fontWeight:900, color:'#fff', marginBottom:14, lineHeight:1.06, letterSpacing:'-0.025em', fontFamily:"'Playfair Display', serif" }}>
                Find Your Perfect <span style={{ color: T.gold, display:'inline-block' }}>Stay</span>
              </h1>
              <p style={{ color:'rgba(255,255,255,0.78)', fontSize:16, marginBottom:36, maxWidth:500, lineHeight:1.7 }}>
                Discover the finest hotels across Sri Lanka's most stunning destinations — from golden beaches to misty hill country.
              </p>
            </div>

            {/* Search form */}
            <div style={{
              opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(28px)',
              transition:'opacity 0.8s ease 0.2s, transform 0.8s cubic-bezier(.22,1,.36,1) 0.2s',
            }}>
              <form
                onSubmit={handleSearch}
                style={{
                  background: heroFocus ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)',
                  backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
                  border:`1.5px solid ${heroFocus ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.22)'}`,
                  borderRadius:22, padding:'22px 24px',
                  maxWidth:940,
                  boxShadow: heroFocus ? `0 28px 64px rgba(0,0,0,0.38), 0 0 0 3px rgba(245,158,11,0.15)` : '0 18px 52px rgba(0,0,0,0.28)',
                  transition:'all 0.3s',
                }}
                onFocus={() => setHeroFocus(true)}
                onBlur={() => setHeroFocus(false)}
              >
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-end', gap:14 }}>
                  {/* Location */}
                  <div style={{ flex:'1 1 200px' }}>
                    <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:6, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em' }}>
                      📍 Destination
                    </label>
                    <input
                      type="text" placeholder="Colombo, Kandy, Ella…"
                      value={search.location}
                      onChange={e => setSearch({...search, location:e.target.value})}
                      style={glassInput}
                      onFocus={e => { e.target.style.borderColor=T.gold; e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.25)`; }}
                      onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.25)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                  {/* Check-in */}
                  <div style={{ flex:'0 1 150px' }}>
                    <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:6, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em' }}>📅 Check-in</label>
                    <input type="date" value={search.checkIn}
                      onChange={e => setSearch({...search, checkIn:e.target.value})}
                      style={{ ...glassInput, colorScheme:'dark' }}
                      onFocus={e => { e.target.style.borderColor=T.gold; e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.25)`; }}
                      onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.25)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                  {/* Check-out */}
                  <div style={{ flex:'0 1 150px' }}>
                    <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:6, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em' }}>📅 Check-out</label>
                    <input type="date" value={search.checkOut}
                      onChange={e => setSearch({...search, checkOut:e.target.value})}
                      style={{ ...glassInput, colorScheme:'dark' }}
                      onFocus={e => { e.target.style.borderColor=T.gold; e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.25)`; }}
                      onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.25)'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                  {/* Guests */}
                  <div style={{ flex:'0 1 190px', position:'relative' }}>
                    <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.6)', marginBottom:6, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em' }}>👥 Guests</label>
                    <button type="button" onClick={() => setOccupancyOpen(v => !v)}
                      style={{ ...glassInput, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
                      <span>{occupancyLabel}</span>
                      <svg style={{ width:12, height:12, opacity:0.7, transform: occupancyOpen ? 'rotate(180deg)' : '', transition:'transform 0.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    {occupancyOpen && (
                      <div style={{
                        position:'absolute', top:'calc(100% + 12px)', left:0, zIndex:50,
                        background:'#fff', border:`1px solid ${T.border}`, borderRadius:18,
                        padding:20, minWidth:235,
                        boxShadow:'0 20px 50px rgba(0,0,0,0.18)',
                        animation:'slideDown 0.22s cubic-bezier(.22,1,.36,1)',
                      }}>
                        {[['Adults','Age 13+','adults',1,10],['Children','Age 0–12','children',0,10]].map(([label,sub,key,mn,mx]) => (
                          <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                            <div>
                              <p style={{ fontSize:13, fontWeight:700, color: T.text, margin:0 }}>{label}</p>
                              <p style={{ fontSize:11, color: T.textLight, margin:0 }}>{sub}</p>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                              <button type="button" onClick={() => setSearch(s => ({...s, [key]:Math.max(mn, s[key]-1)}))}
                                style={{ width:32, height:32, borderRadius:'50%', background:'#f3f4f6', color: T.textMid, border:`1px solid ${T.border}`, cursor:'pointer', fontWeight:700, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background=T.goldBg; e.currentTarget.style.borderColor=T.goldBorder; }}
                                onMouseOut={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.borderColor=T.border; }}>
                                −
                              </button>
                              <span style={{ fontWeight:800, fontSize:14, color: T.text, minWidth:18, textAlign:'center' }}>{search[key]}</span>
                              <button type="button" onClick={() => setSearch(s => ({...s, [key]:Math.min(mx, s[key]+1)}))}
                                style={{ width:32, height:32, borderRadius:'50%', background: T.gold, color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background=T.goldDk; }}
                                onMouseOut={e => { e.currentTarget.style.background=T.gold; }}>
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setOccupancyOpen(false)}
                          style={{ width:'100%', padding:'10px', borderRadius:12, background: T.gold, color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, transition:'background 0.2s', marginTop:4 }}
                          onMouseOver={e => { e.currentTarget.style.background=T.goldDk; }}
                          onMouseOut={e => { e.currentTarget.style.background=T.gold; }}>
                          Done ✓
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Search btn */}
                  <div>
                    <button type="submit" style={{
                      background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,
                      color:'#fff', fontWeight:800, padding:'12px 30px',
                      borderRadius:14, border:'none', cursor:'pointer', fontSize:14,
                      boxShadow:`0 6px 22px rgba(245,158,11,0.42)`,
                      transition:'transform 0.2s, box-shadow 0.2s',
                      display:'flex', alignItems:'center', gap:8,
                      letterSpacing:'0.02em', whiteSpace:'nowrap',
                      fontFamily:"'DM Sans', sans-serif",
                    }}
                      onMouseOver={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 30px rgba(245,158,11,0.52)`; }}
                      onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 22px rgba(245,158,11,0.42)`; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      Search
                    </button>
                  </div>
                </div>

                {/* Quick-pick chips */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.12)', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.50)' }}>Quick picks:</span>
                  {['Colombo','Kandy','Ella','Mirissa','Sigiriya','Galle'].map(loc => (
                    <button key={loc} type="button"
                      onClick={() => setSearch(s => ({...s, location:loc}))}
                      style={{
                        fontSize:11, padding:'5px 13px', borderRadius:99,
                        background:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.78)',
                        border:'1px solid rgba(255,255,255,0.18)', cursor:'pointer',
                        transition:'all 0.2s',
                        fontFamily:"'DM Sans', sans-serif",
                      }}
                      onMouseOver={e => { e.currentTarget.style.background=`rgba(245,158,11,0.25)`; e.currentTarget.style.color=T.goldLt; e.currentTarget.style.borderColor='rgba(245,158,11,0.5)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                      onMouseOut={e => { e.currentTarget.style.background='rgba(255,255,255,0.10)'; e.currentTarget.style.color='rgba(255,255,255,0.78)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; e.currentTarget.style.transform='translateY(0)'; }}
                    >{loc}</button>
                  ))}
                </div>
              </form>
            </div>

            {/* Stats strip */}
            <div style={{
              display:'flex', flexWrap:'wrap', gap:36, marginTop:36,
              opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(18px)',
              transition:'opacity 0.8s ease 0.45s, transform 0.8s cubic-bezier(.22,1,.36,1) 0.45s',
            }}>
              {[['500+','Hotels'],['50K+','Happy Guests'],['25+','Destinations'],['4.9★','Avg Rating']].map(([v, l]) => (
                <div key={l}>
                  <p style={{ fontSize:21, fontWeight:900, color: T.goldLt, margin:'0 0 2px', letterSpacing:'-0.01em' }}>{v}</p>
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.60)', margin:0, textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════
            CONTENT AREA — centred
        ════════════════════════════════════════ */}
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px 100px' }}>

          {/* ── Recently Viewed ── */}
          <AnimSection>
            <section style={{ marginBottom:72 }}>
              <SectionHeader eyebrow="Your History" title="Recently Viewed" subtitle="Hotels you explored recently" />
              <HorizontalCarousel>
                {RECENTLY_VIEWED.map((h, i) => (
                  <RecentCard
                    key={h._id} hotel={h}
                    onQuickView={setQuickViewHotel}
                    style={{ animationDelay:`${i * 60}ms` }}
                  />
                ))}
              </HorizontalCarousel>
            </section>
          </AnimSection>

          <GoldDivider />

          {/* ── Hot Deals ── */}
          <AnimSection delay={60}>
            <section style={{ marginBottom:72 }}>
              <SectionHeader
                eyebrow="Limited Time Offers" title="🔥 Hotel Deals"
                subtitle="Exclusive prices — book before they're gone"
                onViewAll={() => navigate('/hotels/search?filter=hot-deals&source=hot-deals')}
              />
              {loading ? (
                <div style={{ display:'flex', gap:18 }}>
                  {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : deals.length > 0 ? (
                <HorizontalCarousel>
                  {deals.map(h => <DealCard key={h._id} hotel={h} onQuickView={setQuickViewHotel} onWishlist={handleWishlist} />)}
                </HorizontalCarousel>
              ) : (
                <div style={{ padding:48, textAlign:'center', borderRadius:18, background:'#fff', border:`2px dashed ${T.border}` }}>
                  <p style={{ color: T.textLight, fontSize:14 }}>No deals right now — check back soon!</p>
                </div>
              )}
            </section>
          </AnimSection>

          <GoldDivider />

          {/* ── Popular Destinations ── */}
          <AnimSection delay={80}>
            <section style={{ marginBottom:72 }}>
              <SectionHeader
                eyebrow="Trending Now" title="Popular Destinations"
                subtitle="Most searched by travellers this season"
                onViewAll={() => navigate('/hotels/search?filter=popular')}
              />
              <HorizontalCarousel>
                {POPULAR_SEARCHES.map(item => (
                  <PopularCard
                    key={item.id} item={item}
                    onClick={() => navigate(`/hotels/search?location=${encodeURIComponent(item.query)}&search_type=location`)}
                  />
                ))}
              </HorizontalCarousel>
            </section>
          </AnimSection>

          <GoldDivider />

          {/* ── Top Rated Grid ── */}
          <AnimSection delay={100}>
            <section style={{ marginBottom:72 }}>
              <SectionHeader
                eyebrow="Guest Favourites" title="Top Rated Hotels"
                subtitle="Highest rated across Sri Lanka — loved by guests"
                onViewAll={() => navigate('/hotels/search?sort=rating_desc')}
              />
              {loading ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20 }}>
                  {[...Array(4)].map((_, i) => <SkeletonCard key={i} flexShrink0={false} />)}
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:20 }}>
                  {(topRated.length > 0 ? topRated : deals).slice(0, 4).map((h, i) => (
                    <div key={h._id} style={{ animation:`fadeUp 0.55s cubic-bezier(.22,1,.36,1) ${i * 80}ms both` }}>
                      <TopCard h={h} onQuickView={setQuickViewHotel} onWishlist={handleWishlist} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </AnimSection>

          <GoldDivider />

          {/* ── Popular from API ── */}
          {!loading && popular.length > 0 && (
            <AnimSection delay={120}>
              <section style={{ marginBottom:72 }}>
                <SectionHeader
                  eyebrow="Most Booked" title="Popular Hotels"
                  subtitle="Most booked by our travellers"
                  onViewAll={() => navigate('/hotels/search?filter=popular&search_type=popular')}
                />
                <HorizontalCarousel>
                  {popular.map(h => <DealCard key={h._id} hotel={h} onQuickView={setQuickViewHotel} onWishlist={handleWishlist} />)}
                </HorizontalCarousel>
              </section>
            </AnimSection>
          )}

          {!loading && popular.length > 0 && <GoldDivider />}

          {/* ── MAP ── */}
          <AnimSection delay={140}>
            <section>
              <SectionHeader
                eyebrow="Explore" title="Hotels on the Map"
                subtitle="Discover hotel locations across Sri Lanka"
              />
              <div style={{
                borderRadius:24, overflow:'hidden',
                border:`1px solid ${T.border}`,
                boxShadow:'0 10px 40px rgba(0,0,0,0.10)',
                height:470, position:'relative',
              }}>
                <div style={{
                  position:'absolute', top:14, left:14, zIndex:999,
                  background:'#fff', border:`1px solid ${T.border}`,
                  borderRadius:12, padding:'7px 16px', boxShadow: T.shadow,
                }}>
                  <p style={{ fontSize:12, fontWeight:700, color: T.goldDk, margin:0 }}>📍 {mapHotels.length} Hotels Found</p>
                </div>
                <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height:'100%', width:'100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                  />
                  {mapHotels.map(h => (
                    <Marker key={h._id} position={[h.coordinates.lat, h.coordinates.lng]}>
                      <Popup>
                        <div style={{ fontSize:13, minWidth:175, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>
                          <p style={{ fontWeight:800, color: T.text, margin:'0 0 3px' }}>{h.name}</p>
                          <p style={{ color: T.textLight, fontSize:12, margin:'0 0 8px' }}>{h.location}</p>
                          <p style={{ color: T.goldDk, fontWeight:900, fontSize:14, margin:'0 0 10px' }}>
                            LKR {h.pricePerNight?.toLocaleString()}<span style={{ color: T.textLight, fontWeight:400, fontSize:11 }}>/night</span>
                          </p>
                          <a href={`/hotels/${h._id}`} style={{
                            display:'inline-block', padding:'6px 14px',
                            background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,
                            borderRadius:9, color:'#fff', fontSize:11, fontWeight:700,
                            textDecoration:'none', boxShadow:`0 3px 10px rgba(245,158,11,0.3)`,
                          }}>View Hotel →</a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </section>
          </AnimSection>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{
          background:`linear-gradient(135deg,${T.navyMid},${T.navy})`,
          padding:'72px 32px', textAlign:'center',
          borderTop:`3px solid ${T.goldBorder}`,
          position:'relative', overflow:'hidden',
        }}>
          {/* Decorative glow blob */}
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:300, borderRadius:'50%', background:`radial-gradient(ellipse, rgba(245,158,11,0.10), transparent 70%)`, pointerEvents:'none' }} />
          <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.18em', color: T.gold, display:'block', marginBottom:14 }}>Exclusive Offer</span>
          <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, color:'#fff', margin:'0 0 14px', fontFamily:"'Playfair Display', serif", position:'relative' }}>
            Ready for Your Dream Getaway?
          </h2>
          <p style={{ color:'rgba(255,255,255,0.58)', maxWidth:430, margin:'0 auto 36px', fontSize:15, lineHeight:1.7, position:'relative' }}>
            Unlock member-only rates, early-bird deals &amp; personalised recommendations.
          </p>
          <button
            onClick={() => navigate('/hotels/search')}
            style={{
              background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,
              color:'#fff', fontWeight:800, padding:'15px 42px',
              borderRadius:16, border:'none', cursor:'pointer', fontSize:15,
              boxShadow:`0 8px 28px rgba(245,158,11,0.40)`,
              transition:'transform 0.25s, box-shadow 0.25s',
              position:'relative', letterSpacing:'0.01em',
              fontFamily:"'DM Sans', sans-serif",
            }}
            onMouseOver={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 16px 40px rgba(245,158,11,0.52)`; }}
            onMouseOut={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 8px 28px rgba(245,158,11,0.40)`; }}
          >
            Explore All Hotels →
          </button>
        </div>
      </div>
    </Layout>
  );
}