import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import 'leaflet/dist/leaflet.css';

/* ─────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&family=Playfair+Display:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: 'DM Sans', sans-serif; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes shimmer  { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
  @keyframes toastIn  { from{opacity:0;transform:translateX(110%)} to{opacity:1;transform:translateX(0)} }
  @keyframes toastOut { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(110%)} }
  @keyframes progressBar { from{width:100%} to{width:0%} }
  @keyframes heartBeat { 0%,100%{transform:scale(1)} 30%{transform:scale(1.4)} 60%{transform:scale(0.9)} }
  @keyframes dropIn   { from{opacity:0;transform:translateY(-8px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes chipIn   { from{opacity:0;transform:scale(.75)} to{opacity:1;transform:scale(1)} }

  .hide-scrollbar::-webkit-scrollbar{display:none}
  .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
  .skeleton-shine{background:linear-gradient(90deg,#efefef 25%,#e0e0e0 50%,#efefef 75%);background-size:700px 100%;animation:shimmer 1.6s infinite}
  .card-row{animation:fadeUp 0.5s cubic-bezier(.22,1,.36,1) both}

  input[type="range"]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:99px;outline:none;cursor:pointer;background:linear-gradient(to right,#f59e0b var(--pct,50%),#e5e7eb var(--pct,50%))}
  input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 2px 8px rgba(245,158,11,.4);cursor:pointer;transition:transform .15s}
  input[type="range"]::-webkit-slider-thumb:hover{transform:scale(1.2)}
`;

const T = {
  bg:'#f4f5f7', bgCard:'#fff',
  navy:'#1a1a2e', navyMid:'#16213e',
  gold:'#f59e0b', goldDk:'#d97706', goldLt:'#fbbf24',
  goldBg:'#fffbeb', goldBorder:'#fcd34d',
  emerald:'#059669', emeraldBg:'#ecfdf5',
  red:'#ef4444',
  text:'#111827', textMid:'#374151', textLight:'#6b7280',
  border:'#e5e7eb', borderMid:'#d1d5db',
  shadow:'0 2px 12px rgba(0,0,0,0.06)',
  shadowHov:'0 20px 48px rgba(0,0,0,0.13)',
};

/* ─── MAP ICONS ─── */
const defaultIcon = new L.Icon({
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],
});
const highlightIcon = new L.Icon({
  iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[30,48],iconAnchor:[15,48],popupAnchor:[1,-40],
});

/* ─────────────────────────────────────────────────────
   MAP UPDATER — panTo only, NEVER touches zoom
   This is the fix for the zoom in/out bug.
   The previous version passed `zoom={hoveredId ? 10 : 7}` which
   caused the map to zoom in on hover and zoom out on mouseout.
   Now we only call map.panTo() which keeps whatever zoom the user has set.
───────────────────────────────────────────────────── */
function MapUpdater({ center }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!center) return;
    const [lat, lng] = center;
    const p = prev.current;
    if (p && Math.abs(p[0]-lat) < 0.0001 && Math.abs(p[1]-lng) < 0.0001) return;
    prev.current = [lat, lng];
    map.panTo([lat, lng], { animate:true, duration:0.55 });
  }, [center, map]);
  return null;
}

/* ─── TOAST ─── */
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, msg='', type='success', dur=3000) => {
    const id = Date.now();
    setToasts(p => [...p, {id,title,msg,type,dur,exiting:false}]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id===id ? {...t,exiting:true} : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id!==id)), 380);
    }, dur);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  const icons  = {success:'✅',wishlist:'❤️',info:'ℹ️',remove:'🗑️'};
  const colors = {success:T.emerald,wishlist:T.gold,info:T.navy,remove:T.red};
  return (
    <div style={{position:'fixed',top:24,right:24,zIndex:9999,display:'flex',flexDirection:'column',gap:10,pointerEvents:'none'}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex',alignItems:'center',gap:12,background:'#fff',
          border:`1.5px solid ${(colors[t.type]||T.emerald)}33`,
          borderLeft:`4px solid ${colors[t.type]||T.emerald}`,
          borderRadius:14,padding:'13px 18px',minWidth:260,maxWidth:320,
          boxShadow:'0 10px 36px rgba(0,0,0,0.13)',position:'relative',overflow:'hidden',pointerEvents:'auto',
          animation: t.exiting ? 'toastOut 0.35s ease forwards' : 'toastIn 0.4s cubic-bezier(.22,1,.36,1) forwards',
        }}>
          <span style={{fontSize:18,flexShrink:0}}>{icons[t.type]||'✅'}</span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:800,color:T.text,margin:0}}>{t.title}</p>
            {t.msg && <p style={{fontSize:11,color:T.textLight,margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.msg}</p>}
          </div>
          <div style={{position:'absolute',bottom:0,left:0,height:3,background:colors[t.type]||T.emerald,borderRadius:99,animation:`progressBar ${t.dur}ms linear forwards`}} />
        </div>
      ))}
    </div>
  );
}

/* ─── SKELETON ─── */
function SkeletonRow() {
  return (
    <div style={{display:'flex',background:'#fff',borderRadius:22,overflow:'hidden',border:`1px solid ${T.border}`}}>
      <div className="skeleton-shine" style={{width:240,flexShrink:0,minHeight:200}} />
      <div style={{flex:1,padding:'20px 22px',display:'flex',flexDirection:'column',gap:12}}>
        <div className="skeleton-shine" style={{height:22,borderRadius:8,width:'65%'}} />
        <div className="skeleton-shine" style={{height:14,borderRadius:8,width:'40%'}} />
        <div style={{display:'flex',gap:8}}>
          {[80,65,55].map(w => <div key={w} className="skeleton-shine" style={{height:26,borderRadius:8,width:w}} />)}
        </div>
        <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div className="skeleton-shine" style={{height:28,borderRadius:8,width:160}} />
          <div className="skeleton-shine" style={{height:40,borderRadius:12,width:120}} />
        </div>
      </div>
    </div>
  );
}

/* ─── RESULT CARD ─── */
function ResultCard({ hotel, onHover, hoveredId, onWishlist, wishlisted, delay=0 }) {
  const [hov, setHov] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const isActive = hov || hoveredId === hotel._id;
  const disc = Math.round(hotel.pricePerNight * (1-(hotel.discount||0)/100));
  const imgs = hotel.images || [];

  return (
    <div className="card-row" style={{animationDelay:`${delay}ms`}}
      onMouseEnter={() => { setHov(true); onHover(hotel._id); }}
      onMouseLeave={() => { setHov(false); onHover(null); }}
    >
      <div style={{
        display:'flex', background:T.bgCard, borderRadius:22, overflow:'hidden',
        border:`1.5px solid ${isActive ? T.gold : T.border}`,
        boxShadow: isActive ? T.shadowHov : T.shadow,
        transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
        transition:'all 0.35s cubic-bezier(.22,1,.36,1)',
      }}>
        {/* Image */}
        <div style={{width:240,flexShrink:0,position:'relative',overflow:'hidden',minHeight:200}}>
          <img
            src={imgs[imgIdx]||'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500'}
            alt={hotel.name}
            style={{width:'100%',height:'100%',minHeight:200,objectFit:'cover',display:'block',
              transform:isActive?'scale(1.08)':'scale(1)',transition:'transform 0.55s cubic-bezier(.22,1,.36,1)'}}
            onError={e=>{e.currentTarget.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500';}}
          />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.42) 0%,transparent 55%)'}} />
          {hotel.discount > 0 && (
            <span style={{position:'absolute',top:12,left:12,background:T.red,color:'#fff',fontSize:10,fontWeight:800,padding:'4px 10px',borderRadius:99}}>
              -{hotel.discount}% OFF
            </span>
          )}
          <button onClick={e=>{e.preventDefault();e.stopPropagation();onWishlist?.(hotel);}} style={{
            position:'absolute',top:12,right:12,width:32,height:32,borderRadius:'50%',border:'none',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            background:wishlisted?'#fee2e2':'rgba(0,0,0,0.45)',
            fontSize:15,backdropFilter:'blur(4px)',transition:'all 0.25s',
            animation:wishlisted?'heartBeat 0.4s ease':'none',
          }}>
            <span style={{color:wishlisted?T.red:'rgba(255,255,255,0.9)',lineHeight:1}}>{wishlisted?'♥':'♡'}</span>
          </button>
          {imgs.length > 1 && (
            <div style={{position:'absolute',bottom:10,left:0,right:0,display:'flex',justifyContent:'center',gap:5,opacity:isActive?1:0,transition:'opacity 0.25s'}}>
              {imgs.map((_,i) => (
                <button key={i} onClick={e=>{e.preventDefault();e.stopPropagation();setImgIdx(i);}} style={{
                  width:i===imgIdx?20:7,height:7,borderRadius:99,border:'none',cursor:'pointer',
                  background:i===imgIdx?T.gold:'rgba(255,255,255,0.6)',transition:'all 0.25s',padding:0,
                }} />
              ))}
            </div>
          )}
          <span style={{position:'absolute',bottom:imgs.length>1?28:10,left:12,fontSize:11,color:T.goldLt}}>
            {'★'.repeat(hotel.starRating||0)}
          </span>
        </div>

        {/* Content */}
        <div style={{flex:1,padding:'20px 22px',display:'flex',flexDirection:'column',minWidth:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:8}}>
            <div style={{minWidth:0,flex:1}}>
              {hotel.hotelType && (
                <span style={{fontSize:10,fontWeight:800,color:T.goldDk,background:T.goldBg,border:`1px solid ${T.goldBorder}`,padding:'3px 10px',borderRadius:99,display:'inline-block',marginBottom:6,textTransform:'capitalize'}}>
                  {hotel.hotelType}
                </span>
              )}
              <h3 style={{fontSize:18,fontWeight:900,color:isActive?T.goldDk:T.text,margin:0,lineHeight:1.25,fontFamily:"'Playfair Display',serif",transition:'color 0.2s',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                {hotel.name}
              </h3>
              <p style={{fontSize:13,color:T.textLight,margin:'5px 0 0',display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
                <svg width="12" height="12" fill="currentColor" style={{color:T.gold,flexShrink:0}} viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{hotel.location}</span>
              </p>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{
                background:(hotel.averageRating||0)>=4.5?T.emeraldBg:T.goldBg,
                border:`1px solid ${(hotel.averageRating||0)>=4.5?'#a7f3d0':T.goldBorder}`,
                color:(hotel.averageRating||0)>=4.5?T.emerald:T.goldDk,
                fontWeight:900,fontSize:15,padding:'5px 12px',borderRadius:12,
                display:'flex',alignItems:'center',gap:4,
              }}>
                <span style={{fontSize:12}}>★</span>{hotel.averageRating?.toFixed(1)||'—'}
              </div>
              <p style={{fontSize:11,color:T.textLight,margin:'5px 0 0',whiteSpace:'nowrap'}}>
                {hotel.reviewCount>0?`${hotel.reviewCount} reviews`:'No reviews'}
              </p>
            </div>
          </div>

          {hotel.description && (
            <p style={{fontSize:12,color:T.textLight,lineHeight:1.6,margin:'0 0 12px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
              {hotel.description}
            </p>
          )}

          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {hotel.amenities?.slice(0,4).map(a => (
              <span key={a} style={{fontSize:11,background:'#f3f4f6',padding:'4px 10px',borderRadius:8,color:T.textMid,whiteSpace:'nowrap'}}>{a}</span>
            ))}
            {hotel.amenities?.length>4 && <span style={{fontSize:11,color:T.textLight,alignSelf:'center'}}>+{hotel.amenities.length-4}</span>}
          </div>

          <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'flex-end',paddingTop:14,borderTop:`1px solid ${T.border}`}}>
            <div>
              {hotel.discount>0 && <p style={{fontSize:12,color:T.textLight,margin:'0 0 2px',textDecoration:'line-through'}}>LKR {hotel.pricePerNight?.toLocaleString()}</p>}
              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                <span style={{fontSize:24,fontWeight:900,color:T.goldDk,lineHeight:1}}>LKR {disc.toLocaleString()}</span>
                <span style={{fontSize:12,color:T.textLight}}>/night</span>
              </div>
              {hotel.discount>0 && <span style={{fontSize:11,fontWeight:700,color:T.emerald}}>Save LKR {(hotel.pricePerNight-disc).toLocaleString()}</span>}
            </div>
            <Link to={`/hotels/${hotel._id}`} onClick={e=>e.stopPropagation()} style={{
              background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,color:'#fff',
              padding:'11px 24px',borderRadius:13,fontWeight:800,fontSize:13,textDecoration:'none',
              boxShadow:isActive?`0 10px 24px rgba(245,158,11,0.42)`:`0 4px 14px rgba(245,158,11,0.22)`,
              transform:isActive?'translateY(-2px)':'translateY(0)',transition:'all 0.25s',
              whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:7,
            }}>
              See Details
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   FILTER DROPDOWN — generic popup wrapper
───────────────────────────────────────────────────── */
function FilterDropdown({ label, active, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={() => setOpen(v=>!v)} style={{
        display:'flex',alignItems:'center',gap:7,padding:'9px 15px',borderRadius:12,cursor:'pointer',
        background:active?T.goldBg:'#fff',
        border:`1.5px solid ${active?T.gold:open?T.borderMid:T.border}`,
        color:active?T.goldDk:T.text,fontWeight:active?800:600,fontSize:13,
        boxShadow:open?`0 0 0 3px rgba(245,158,11,0.12)`:'none',
        transition:'all 0.2s',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif",
      }}>
        {label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
          style={{transform:open?'rotate(180deg)':'',transition:'transform 0.2s',opacity:.5,marginLeft:2}}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position:'absolute',top:'calc(100% + 8px)',left:0,zIndex:200,
          background:'#fff',border:`1px solid ${T.border}`,borderRadius:16,
          boxShadow:'0 20px 50px rgba(0,0,0,0.14)',minWidth:220,padding:18,
          animation:'dropIn 0.22s cubic-bezier(.22,1,.36,1)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   HORIZONTAL FILTER BAR — sits below the search header
───────────────────────────────────────────────────── */
function FilterBar({ filters, onChange, hotels, sort, onSort }) {
  const maxPrice = Math.max(...hotels.map(h=>h.pricePerNight||0), 100000);
  const pct = Math.round(((filters.maxPrice??maxPrice)/maxPrice)*100);

  const toggleArr = (key, val) =>
    onChange(f => ({...f,[key]:f[key]?.includes(val)?f[key].filter(x=>x!==val):[...(f[key]||[]),val]}));

  const STARS     = [5,4,3,2,1];
  const TYPES     = ['resort','boutique','villa','heritage','business','budget'];
  const AMENITIES = ['Pool','WiFi','Gym','Spa','Restaurant','Parking','Beach Access','Bar'];
  const SORT_OPTS = [
    {value:'default',    label:'Recommended'},
    {value:'price_asc',  label:'Price: Low → High'},
    {value:'price_desc', label:'Price: High → Low'},
    {value:'rating_desc',label:'Highest Rated'},
    {value:'name_asc',   label:'Name A → Z'},
  ];

  const hasPrice     = (filters.maxPrice??maxPrice) < maxPrice;
  const hasStars     = filters.stars?.length>0;
  const hasTypes     = filters.types?.length>0;
  const hasAmenities = filters.amenities?.length>0;
  const anyActive    = hasPrice||hasStars||hasTypes||hasAmenities;

  const Chk = ({checked,onToggle}) => (
    <span onClick={onToggle} style={{
      width:17,height:17,borderRadius:5,flexShrink:0,cursor:'pointer',
      border:`2px solid ${checked?T.gold:T.borderMid}`,background:checked?T.gold:'transparent',
      display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s',
    }}>
      {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
    </span>
  );

  return (
    <div style={{
      background:'#fff',borderBottom:`1px solid ${T.border}`,
      padding:'10px 24px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',
      boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <span style={{fontSize:12,fontWeight:700,color:T.textLight,marginRight:2}}>Filter:</span>

      {/* Price */}
      <FilterDropdown label={hasPrice?`💰 ≤ LKR ${(filters.maxPrice||0).toLocaleString()}`:'💰 Price'} active={hasPrice}>
        <p style={{fontSize:11,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>Max price / night</p>
        <input type="range" min={0} max={maxPrice} step={1000} value={filters.maxPrice??maxPrice}
          style={{'--pct':`${pct}%`}} onChange={e=>onChange(f=>({...f,maxPrice:+e.target.value}))} />
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
          <span style={{fontSize:11,color:T.textLight}}>LKR 0</span>
          <span style={{fontSize:12,fontWeight:800,color:T.goldDk}}>LKR {(filters.maxPrice??maxPrice).toLocaleString()}</span>
        </div>
      </FilterDropdown>

      {/* Stars */}
      <FilterDropdown label={hasStars?`⭐ ${filters.stars.join(', ')}★`:'⭐ Stars'} active={hasStars}>
        <p style={{fontSize:11,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>Star Rating</p>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {STARS.map(s => (
            <label key={s} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
              <Chk checked={filters.stars?.includes(s)} onToggle={()=>toggleArr('stars',s)} />
              <span style={{display:'flex',gap:2}}>
                {[...Array(s)].map((_,i)=><span key={i} style={{color:T.gold,fontSize:14}}>★</span>)}
                {[...Array(5-s)].map((_,i)=><span key={i} style={{color:T.border,fontSize:14}}>★</span>)}
              </span>
            </label>
          ))}
        </div>
      </FilterDropdown>

      {/* Type */}
      <FilterDropdown label={hasTypes?`🏨 ${filters.types.map(t=>t[0].toUpperCase()+t.slice(1)).join(', ')}`:'🏨 Type'} active={hasTypes}>
        <p style={{fontSize:11,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>Hotel Type</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {TYPES.map(t=>{
            const on=filters.types?.includes(t);
            return (
              <button key={t} onClick={()=>toggleArr('types',t)} style={{
                fontSize:11,fontWeight:700,padding:'5px 12px',borderRadius:99,cursor:'pointer',
                background:on?T.gold:'#f3f4f6',color:on?'#fff':T.textMid,
                border:`1.5px solid ${on?T.gold:T.border}`,transition:'all 0.18s',textTransform:'capitalize',
                fontFamily:"'DM Sans',sans-serif",
              }}>{t}</button>
            );
          })}
        </div>
      </FilterDropdown>

      {/* Amenities */}
      <FilterDropdown label={hasAmenities?`✨ ${filters.amenities.length} amenit${filters.amenities.length>1?'ies':'y'}`:'✨ Amenities'} active={hasAmenities}>
        <p style={{fontSize:11,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>Amenities</p>
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {AMENITIES.map(a=>(
            <label key={a} style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
              <Chk checked={filters.amenities?.includes(a)} onToggle={()=>toggleArr('amenities',a)} />
              <span style={{fontSize:13,color:filters.amenities?.includes(a)?T.text:T.textMid,fontWeight:filters.amenities?.includes(a)?700:400,transition:'all 0.18s'}}>{a}</span>
            </label>
          ))}
        </div>
      </FilterDropdown>

      {/* Divider */}
      <div style={{width:1,height:26,background:T.border,margin:'0 4px'}} />

      {/* Sort */}
      <FilterDropdown label={`↕ ${SORT_OPTS.find(o=>o.value===sort)?.label||'Sort'}`} active={sort!=='default'}>
        <p style={{fontSize:11,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>Sort by</p>
        {SORT_OPTS.map(o=>(
          <button key={o.value} onClick={()=>onSort(o.value)} style={{
            display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 12px',
            textAlign:'left',background:sort===o.value?T.goldBg:'transparent',
            color:sort===o.value?T.goldDk:T.text,fontWeight:sort===o.value?800:500,
            fontSize:13,border:'none',cursor:'pointer',borderRadius:10,transition:'background 0.15s',
            borderLeft:sort===o.value?`3px solid ${T.gold}`:'3px solid transparent',
            fontFamily:"'DM Sans',sans-serif",
          }}>
            {sort===o.value && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            {o.label}
          </button>
        ))}
      </FilterDropdown>

      {/* Clear */}
      {anyActive && (
        <button onClick={()=>onChange({maxPrice,stars:[],types:[],amenities:[]})} style={{
          display:'flex',alignItems:'center',gap:6,padding:'9px 14px',marginLeft:'auto',
          background:'#fef2f2',color:T.red,border:`1.5px solid #fecaca`,
          borderRadius:12,cursor:'pointer',fontSize:12,fontWeight:800,
          transition:'all 0.2s',animation:'chipIn 0.2s ease',fontFamily:"'DM Sans',sans-serif",
        }}
          onMouseOver={e=>{e.currentTarget.style.background='#fee2e2';}}
          onMouseOut={e=>{e.currentTarget.style.background='#fef2f2';}}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ─── ACTIVE CHIP STRIP ─── */
function ActiveChips({ filters, onChange, maxPrice }) {
  const chips = [];
  if ((filters.maxPrice??maxPrice)<maxPrice)
    chips.push({label:`≤ LKR ${(filters.maxPrice||0).toLocaleString()}`,clr:()=>onChange(f=>({...f,maxPrice}))});
  filters.stars?.forEach(s=>chips.push({label:`${s}★`,clr:()=>onChange(f=>({...f,stars:f.stars.filter(x=>x!==s)}))}));
  filters.types?.forEach(t=>chips.push({label:t,clr:()=>onChange(f=>({...f,types:f.types.filter(x=>x!==t)}))}));
  filters.amenities?.forEach(a=>chips.push({label:a,clr:()=>onChange(f=>({...f,amenities:f.amenities.filter(x=>x!==a)}))}));
  if (!chips.length) return null;
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:14}}>
      {chips.map((c,i)=>(
        <span key={i} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,
          padding:'4px 11px',background:T.goldBg,color:T.goldDk,border:`1.5px solid ${T.goldBorder}`,borderRadius:99,animation:'chipIn 0.22s ease both'}}>
          {c.label}
          <button onClick={c.clr} style={{background:'none',border:'none',cursor:'pointer',color:T.goldDk,padding:0,fontSize:13,fontWeight:900,lineHeight:1}}>×</button>
        </span>
      ))}
    </div>
  );
}

/* ─── PAGINATION ─── */
function Pagination({ page, total, perPage, onChange }) {
  const pages = Math.ceil(total/perPage);
  if (pages<=1) return null;
  const range=[];
  for (let i=1;i<=pages;i++){
    if(i===1||i===pages||Math.abs(i-page)<=1) range.push(i);
    else if(range[range.length-1]!=='…') range.push('…');
  }
  const Btn=({label,onClick,disabled,active})=>(
    <button onClick={onClick} disabled={disabled} style={{
      minWidth:40,height:40,padding:'0 10px',borderRadius:12,cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?.4:1,fontWeight:active?800:600,fontSize:13,
      background:active?T.gold:'#fff',color:active?'#fff':T.text,
      border:active?'none':`1.5px solid ${T.border}`,
      boxShadow:active?`0 4px 14px rgba(245,158,11,0.35)`:'none',
      transition:'all 0.2s',fontFamily:"'DM Sans',sans-serif",
    }}>{label}</button>
  );
  return (
    <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:36,alignItems:'center'}}>
      <Btn label="← Prev" onClick={()=>onChange(page-1)} disabled={page===1} />
      {range.map((p,i)=>p==='…'
        ?<span key={i} style={{color:T.textLight,fontSize:13,padding:'0 4px'}}>…</span>
        :<Btn key={p} label={p} onClick={()=>onChange(p)} active={page===p} />
      )}
      <Btn label="Next →" onClick={()=>onChange(page+1)} disabled={page===pages} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
const PER_PAGE = 6;

export default function HotelSearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [search,setSearch]=useState({
    location:params.get('location')||'',checkIn:params.get('checkIn')||'',
    checkOut:params.get('checkOut')||'',adults:parseInt(params.get('adults')||'1'),children:parseInt(params.get('children')||'0'),
  });
  const [hotels,setHotels]=useState([]);
  const [loading,setLoading]=useState(true);
  const [hoveredId,setHoveredId]=useState(null);
  const [page,setPage]=useState(1);
  const [sort,setSort]=useState('default');
  const [wishlist,setWishlist]=useState(new Set());
  const [occupOpen,setOccupOpen]=useState(false);
  const [filters,setFilters]=useState({maxPrice:500000,stars:[],types:[],amenities:[]});
  const {toasts,add:addToast}=useToast();

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try {
        const {data}=await api.get(`/hotels?${params.toString()}`);
        setHotels(data);
        const max=Math.max(...data.map(h=>h.pricePerNight||0),100000);
        setFilters(f=>({...f,maxPrice:max}));
      } catch{} finally{setLoading(false);}
    })();
  },[params]);

  const handleSearch=e=>{
    e.preventDefault();
    const np=new URLSearchParams();
    if(search.location) np.set('location',search.location);
    if(search.checkIn)  np.set('checkIn',search.checkIn);
    if(search.checkOut) np.set('checkOut',search.checkOut);
    np.set('adults',search.adults); np.set('children',search.children);
    setParams(np); setPage(1);
  };

  const handleWishlist=hotel=>{
    setWishlist(prev=>{
      const next=new Set(prev);
      if(next.has(hotel._id)){next.delete(hotel._id);addToast('Removed',hotel.name,'remove');}
      else{next.add(hotel._id);addToast('Saved to Wishlist',hotel.name,'wishlist');}
      return next;
    });
  };

  const maxPrice=Math.max(...hotels.map(h=>h.pricePerNight||0),100000);

  const filtered=hotels.filter(h=>{
    if((filters.maxPrice??maxPrice)<h.pricePerNight) return false;
    if(filters.stars?.length && !filters.stars.includes(h.starRating)) return false;
    if(filters.types?.length && !filters.types.includes(h.hotelType)) return false;
    if(filters.amenities?.length && !filters.amenities.every(a=>h.amenities?.some(x=>x.toLowerCase().includes(a.toLowerCase())))) return false;
    return true;
  });

  const sorted=[...filtered].sort((a,b)=>{
    if(sort==='price_asc')   return a.pricePerNight-b.pricePerNight;
    if(sort==='price_desc')  return b.pricePerNight-a.pricePerNight;
    if(sort==='rating_desc') return (b.averageRating||0)-(a.averageRating||0);
    if(sort==='name_asc')    return a.name.localeCompare(b.name);
    return 0;
  });

  const paginated=sorted.slice((page-1)*PER_PAGE,page*PER_PAGE);
  const mapHotels=filtered.filter(h=>h.coordinates?.lat);

  // Pan to hovered hotel — zoom NEVER changes
  const hoveredHotel=mapHotels.find(h=>h._id===hoveredId);
  const panCenter=hoveredHotel?[hoveredHotel.coordinates.lat,hoveredHotel.coordinates.lng]:null;
  const defaultCenter=mapHotels.length?[mapHotels[0].coordinates.lat,mapHotels[0].coordinates.lng]:[7.8731,80.7718];

  const occupancyLabel=`${search.adults} Adult${search.adults!==1?'s':''}${search.children>0?`, ${search.children} Child${search.children!==1?'ren':''}`:''}`;
  const inpBase={padding:'10px 14px',borderRadius:11,border:`1.5px solid ${T.border}`,fontSize:13,outline:'none',background:'#fff',color:T.text,fontFamily:"'DM Sans',sans-serif",transition:'border-color 0.2s,box-shadow 0.2s'};
  const focusE={
    onFocus:e=>{e.target.style.borderColor=T.gold;e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.18)`;},
    onBlur:e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow='none';},
  };

  return (
    <Layout>
      <style>{GLOBAL_STYLES}</style>
      <ToastContainer toasts={toasts} />

      <div style={{background:T.bg,minHeight:'100vh',fontFamily:"'DM Sans',sans-serif"}}>

        {/* ══ STICKY: Search + Filter bar ══ */}
        <div style={{position:'sticky',top:0,zIndex:100}}>

          {/* Search */}
          <div style={{background:T.navyMid,borderBottom:`3px solid ${T.goldBorder}`,padding:'16px 24px',boxShadow:'0 4px 24px rgba(0,0,0,0.22)'}}>
            <form onSubmit={handleSearch} style={{maxWidth:1300,margin:'0 auto',display:'flex',gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div style={{flex:'1 1 180px'}}>
                <label style={{display:'block',fontSize:9,color:'rgba(255,255,255,0.5)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:5}}>📍 Destination</label>
                <input type="text" placeholder="Colombo, Kandy, Ella…" value={search.location}
                  onChange={e=>setSearch({...search,location:e.target.value})} style={inpBase} {...focusE} />
              </div>
              <div style={{flex:'0 1 145px'}}>
                <label style={{display:'block',fontSize:9,color:'rgba(255,255,255,0.5)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:5}}>📅 Check-in</label>
                <input type="date" value={search.checkIn} onChange={e=>setSearch({...search,checkIn:e.target.value})} style={inpBase} {...focusE} />
              </div>
              <div style={{flex:'0 1 145px'}}>
                <label style={{display:'block',fontSize:9,color:'rgba(255,255,255,0.5)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:5}}>📅 Check-out</label>
                <input type="date" value={search.checkOut} onChange={e=>setSearch({...search,checkOut:e.target.value})} style={inpBase} {...focusE} />
              </div>
              <div style={{flex:'0 1 185px',position:'relative'}}>
                <label style={{display:'block',fontSize:9,color:'rgba(255,255,255,0.5)',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:5}}>👥 Guests</label>
                <button type="button" onClick={()=>setOccupOpen(v=>!v)} style={{...inpBase,width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderColor:occupOpen?T.gold:T.border,boxShadow:occupOpen?`0 0 0 3px rgba(245,158,11,0.18)`:'none'}}>
                  <span>{occupancyLabel}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{transform:occupOpen?'rotate(180deg)':'',transition:'transform 0.2s',opacity:.5}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {occupOpen && (
                  <div style={{position:'absolute',top:'calc(100% + 10px)',left:0,zIndex:300,background:'#fff',border:`1px solid ${T.border}`,borderRadius:16,padding:18,minWidth:225,boxShadow:'0 20px 50px rgba(0,0,0,0.16)',animation:'dropIn 0.22s cubic-bezier(.22,1,.36,1)'}}>
                    {[['Adults','Age 13+','adults',1,10],['Children','Age 0–12','children',0,10]].map(([lbl,sub,key,mn,mx])=>(
                      <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                        <div>
                          <p style={{fontSize:13,fontWeight:700,color:T.text,margin:0}}>{lbl}</p>
                          <p style={{fontSize:11,color:T.textLight,margin:0}}>{sub}</p>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <button type="button" onClick={()=>setSearch(s=>({...s,[key]:Math.max(mn,s[key]-1)}))}
                            style={{width:30,height:30,borderRadius:'50%',border:`1px solid ${T.border}`,background:'#f3f4f6',cursor:'pointer',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.18s'}}
                            onMouseOver={e=>{e.currentTarget.style.background=T.goldBg;e.currentTarget.style.borderColor=T.goldBorder;}}
                            onMouseOut={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.borderColor=T.border;}}>−</button>
                          <span style={{fontWeight:800,fontSize:14,color:T.text,minWidth:16,textAlign:'center'}}>{search[key]}</span>
                          <button type="button" onClick={()=>setSearch(s=>({...s,[key]:Math.min(mx,s[key]+1)}))}
                            style={{width:30,height:30,borderRadius:'50%',border:'none',background:T.gold,color:'#fff',cursor:'pointer',fontWeight:700,fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.18s'}}
                            onMouseOver={e=>{e.currentTarget.style.background=T.goldDk;}}
                            onMouseOut={e=>{e.currentTarget.style.background=T.gold;}}>+</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={()=>setOccupOpen(false)}
                      style={{width:'100%',padding:'9px',borderRadius:10,background:T.gold,color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,transition:'background 0.18s'}}
                      onMouseOver={e=>{e.currentTarget.style.background=T.goldDk;}}
                      onMouseOut={e=>{e.currentTarget.style.background=T.gold;}}>Done ✓</button>
                  </div>
                )}
              </div>
              <button type="submit" style={{
                background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,color:'#fff',fontWeight:800,
                padding:'11px 28px',borderRadius:12,border:'none',cursor:'pointer',fontSize:14,
                boxShadow:`0 6px 20px rgba(245,158,11,0.38)`,display:'flex',alignItems:'center',gap:8,
                transition:'transform 0.2s,box-shadow 0.2s',whiteSpace:'nowrap',fontFamily:"'DM Sans',sans-serif",
              }}
                onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 28px rgba(245,158,11,0.48)`;}}
                onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 6px 20px rgba(245,158,11,0.38)`;}}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Search
              </button>
            </form>
          </div>

          {/* ── FILTER BAR below search, still sticky ── */}
          <FilterBar filters={filters} onChange={setFilters} hotels={hotels} sort={sort} onSort={v=>{setSort(v);setPage(1);}} />
        </div>

        {/* ══ CONTENT: Results + Map ══ */}
        <div style={{maxWidth:1440,margin:'0 auto',padding:'28px 24px 60px',display:'flex',gap:24,alignItems:'flex-start'}}>

          {/* Results */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{marginBottom:16}}>
              <h1 style={{fontSize:'clamp(1.2rem,2.5vw,1.65rem)',fontWeight:900,color:T.text,margin:'0 0 4px',fontFamily:"'Playfair Display',serif"}}>
                {search.location?`Hotels in ${search.location}`:'Explore All Hotels'}
              </h1>
              <p style={{fontSize:13,color:T.textLight,margin:'0 0 12px'}}>
                {loading?'Searching…':`${filtered.length} propert${filtered.length!==1?'ies':'y'} found`}
                {!loading && hotels.length!==filtered.length && <span style={{color:T.goldDk,marginLeft:6}}>({hotels.length-filtered.length} filtered out)</span>}
              </p>
              <ActiveChips filters={filters} onChange={setFilters} maxPrice={maxPrice} />
            </div>

            {loading ? (
              <div style={{display:'flex',flexDirection:'column',gap:18}}>
                {[...Array(4)].map((_,i)=><SkeletonRow key={i} />)}
              </div>
            ) : paginated.length===0 ? (
              <div style={{padding:'64px 40px',textAlign:'center',background:'#fff',borderRadius:22,border:`2px dashed ${T.border}`,animation:'fadeUp 0.5s ease'}}>
                <span style={{fontSize:48,display:'block',marginBottom:16}}>🏨</span>
                <h3 style={{fontSize:20,fontWeight:900,margin:'0 0 8px',color:T.text,fontFamily:"'Playfair Display',serif"}}>No hotels match your filters</h3>
                <p style={{color:T.textLight,fontSize:14,margin:'0 0 24px'}}>Try adjusting your filters or search for a different destination.</p>
                <button onClick={()=>setFilters({maxPrice,stars:[],types:[],amenities:[]})} style={{
                  background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,color:'#fff',padding:'11px 28px',
                  borderRadius:12,border:'none',cursor:'pointer',fontWeight:800,fontSize:14,
                  boxShadow:`0 6px 18px rgba(245,158,11,0.3)`,
                }}>Clear All Filters</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:18}}>
                {paginated.map((h,i)=>(
                  <ResultCard key={h._id} hotel={h} onHover={setHoveredId} hoveredId={hoveredId}
                    onWishlist={handleWishlist} wishlisted={wishlist.has(h._id)} delay={i*65} />
                ))}
              </div>
            )}

            <Pagination page={page} total={filtered.length} perPage={PER_PAGE}
              onChange={p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'});}} />
          </div>

          {/* Map */}
          <div style={{width:460,flexShrink:0}}>
            <div style={{position:'sticky',top:132,height:'calc(100vh - 160px)',borderRadius:24,overflow:'hidden',border:`1px solid ${T.border}`,boxShadow:'0 12px 48px rgba(0,0,0,0.11)',display:'flex',flexDirection:'column'}}>
              <div style={{padding:'12px 16px',background:'#fff',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,zIndex:10}}>
                <p style={{fontSize:13,fontWeight:800,color:T.goldDk,margin:0}}>📍 {mapHotels.length} hotel{mapHotels.length!==1?'s':''} on map</p>
                {hoveredId && (
                  <span style={{fontSize:11,color:T.textLight,animation:'fadeIn 0.2s ease',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>
                    <strong style={{color:T.text}}>{hotels.find(h=>h._id===hoveredId)?.name}</strong>
                  </span>
                )}
              </div>
              <div style={{flex:1,position:'relative'}}>
                <MapContainer center={defaultCenter} zoom={7} style={{height:'100%',width:'100%'}} scrollWheelZoom={true}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>' />
                  {/* panCenter is null when nothing is hovered → MapUpdater skips any pan */}
                  {panCenter && <MapUpdater center={panCenter} />}
                  {mapHotels.map(h=>{
                    const isHov=hoveredId===h._id;
                    return (
                      <Marker key={h._id} position={[h.coordinates.lat,h.coordinates.lng]}
                        icon={isHov?highlightIcon:defaultIcon}
                        eventHandlers={{
                          mouseover:e=>{setHoveredId(h._id);e.target.openPopup();},
                          mouseout:()=>setHoveredId(null),
                          click:()=>navigate(`/hotels/${h._id}`),
                        }}>
                        <Popup closeButton={false} offset={[0,-20]}>
                          <div style={{width:210,fontFamily:"'DM Sans',sans-serif",lineHeight:1.45}}>
                            <div style={{borderRadius:12,overflow:'hidden',marginBottom:10}}>
                              <img src={h.images?.[0]||''} alt={h.name} style={{width:'100%',height:115,objectFit:'cover',display:'block'}} />
                            </div>
                            {h.hotelType && <span style={{fontSize:9,fontWeight:800,color:T.goldDk,background:T.goldBg,padding:'2px 8px',borderRadius:99,textTransform:'capitalize'}}>{h.hotelType}</span>}
                            <p style={{fontWeight:900,fontSize:14,margin:'6px 0 3px',color:T.text,lineHeight:1.3}}>{h.name}</p>
                            <p style={{fontSize:11,color:T.textLight,margin:'0 0 6px'}}>★ {h.averageRating?.toFixed(1)||0} · {h.reviewCount||0} reviews</p>
                            <p style={{fontSize:15,fontWeight:900,color:T.goldDk,margin:'0 0 10px'}}>
                              LKR {h.pricePerNight?.toLocaleString()}<span style={{fontSize:10,color:T.textLight,fontWeight:400}}>/night</span>
                            </p>
                            <Link to={`/hotels/${h._id}`} style={{display:'block',textAlign:'center',background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,color:'#fff',padding:'9px',borderRadius:10,fontWeight:800,textDecoration:'none',fontSize:12,boxShadow:`0 4px 12px rgba(245,158,11,0.3)`}}>View Hotel →</Link>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist float bar */}
        {wishlist.size>0 && (
          <div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:T.navy,color:'#fff',padding:'13px 26px',borderRadius:99,boxShadow:'0 16px 48px rgba(0,0,0,0.28)',display:'flex',alignItems:'center',gap:14,zIndex:999,animation:'fadeUp 0.4s ease',whiteSpace:'nowrap',border:`2px solid ${T.goldBorder}`}}>
            <span>❤️</span>
            <span style={{fontSize:14,fontWeight:700}}>{wishlist.size} hotel{wishlist.size>1?'s':''} saved</span>
            <button onClick={()=>navigate('/wishlist')} style={{background:T.gold,color:'#fff',border:'none',padding:'7px 16px',borderRadius:99,fontWeight:800,fontSize:13,cursor:'pointer',transition:'background 0.2s'}}
              onMouseOver={e=>{e.currentTarget.style.background=T.goldDk;}}
              onMouseOut={e=>{e.currentTarget.style.background=T.gold;}}>View →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}