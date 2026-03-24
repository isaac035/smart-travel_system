import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { CheckCircle, Plus, Search, Upload, X, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/* ─────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes shimmer  { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes slideTab { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
  @keyframes gradShift {
    0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
  }
  @keyframes countUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .ho-dash {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    background:#0f1623;
    color:#f9fafb;
    position:relative;
  }
  .ho-dash-bg {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background:linear-gradient(135deg,#0f1623 0%,#1a1a2e 45%,#16213e 75%,#0f3460 100%);
    background-size:400% 400%;
    animation:gradShift 18s ease infinite;
  }
  .ho-dash-bg::after {
    content:''; position:absolute;
    top:-120px; right:-120px;
    width:540px; height:540px; border-radius:50%;
    background:radial-gradient(circle,rgba(245,158,11,0.07),transparent 65%);
    pointer-events:none;
  }

  /* Card */
  .d-card {
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:20px;
    backdrop-filter:blur(12px);
  }
  .d-card-solid {
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:16px;
  }

  /* Input */
  .d-inp {
    width:100%; border-radius:13px;
    background:rgba(255,255,255,0.06);
    border:1.5px solid rgba(255,255,255,0.10);
    color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:500;
    padding:10px 14px;
    transition:border-color .2s, box-shadow .2s, background .2s;
  }
  .d-inp::placeholder { color:rgba(255,255,255,0.25); }
  .d-inp:focus {
    border-color:#f59e0b;
    background:rgba(255,255,255,0.08);
    box-shadow:0 0 0 3px rgba(245,158,11,0.15);
  }
  select.d-inp option { background:#1a1a2e; color:#fff; }

  /* Skeleton */
  .d-skeleton {
    background:linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.05) 75%);
    background-size:700px 100%;
    animation:shimmer 1.6s infinite;
    border-radius:10px;
  }

  /* Tab button */
  .d-tab { transition:all .25s; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .d-tab-on  { background:rgba(245,158,11,0.15)!important; border-color:rgba(245,158,11,0.4)!important; color:#f59e0b!important; }
  .d-tab-off { color:rgba(255,255,255,0.45); }
  .d-tab-off:hover { background:rgba(255,255,255,0.06)!important; color:rgba(255,255,255,0.75)!important; }

  /* Section reveal */
  .tab-reveal { animation:slideTab .35s cubic-bezier(.22,1,.36,1) both; }

  /* Gold CTA button */
  .d-btn-gold {
    background:linear-gradient(135deg,#f59e0b,#d97706);
    color:#1a1a2e; border:none; border-radius:13px;
    font-weight:800; font-size:13px; cursor:pointer;
    padding:11px 22px; display:inline-flex; align-items:center; gap:8px;
    font-family:'DM Sans',sans-serif;
    box-shadow:0 6px 20px rgba(245,158,11,0.32);
    transition:transform .2s, box-shadow .2s, filter .2s;
  }
  .d-btn-gold:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:0 10px 28px rgba(245,158,11,0.44);
    filter:brightness(1.07);
  }
  .d-btn-gold:disabled { opacity:.5; cursor:not-allowed; }

  /* Ghost button */
  .d-btn-ghost {
    background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.12);
    color:rgba(255,255,255,0.65); border-radius:13px;
    font-weight:700; font-size:13px; cursor:pointer;
    padding:10px 20px; display:inline-flex; align-items:center; gap:8px;
    font-family:'DM Sans',sans-serif; transition:all .2s;
  }
  .d-btn-ghost:hover { background:rgba(255,255,255,0.09); color:#fff; }

  /* Stat card counter */
  .stat-num { animation:countUp .6s cubic-bezier(.22,1,.36,1) both; }

  /* Table row hover */
  .d-tr:hover { background:rgba(255,255,255,0.04); }

  /* Step indicator */
  .step-dot-on  { background:#f59e0b; box-shadow:0 0 0 4px rgba(245,158,11,0.2); }
  .step-dot-off { background:rgba(255,255,255,0.15); }

  /* Amenity chip */
  .amenity-on  { background:rgba(245,158,11,0.14)!important; border-color:rgba(245,158,11,0.5)!important; color:#fbbf24!important; }
  .amenity-off { color:rgba(255,255,255,0.55); }
  .amenity-off:hover { background:rgba(255,255,255,0.07)!important; color:rgba(255,255,255,0.85)!important; }

  /* Scrollbar */
  .d-scroll::-webkit-scrollbar { width:5px; }
  .d-scroll::-webkit-scrollbar-track { background:transparent; }
  .d-scroll::-webkit-scrollbar-thumb { background:rgba(245,158,11,0.3); border-radius:99px; }

  /* Publish spinner */
  .spin-anim { animation:spin .7s linear infinite; }
`;

/* ─── THEME ─── */
const T = {
  gold:'#f59e0b', goldDk:'#d97706', goldLt:'#fbbf24',
  goldBg:'rgba(245,158,11,0.12)', goldBorder:'rgba(245,158,11,0.35)',
  emerald:'#10b981', red:'#ef4444',
  text:'#f9fafb', textMid:'rgba(255,255,255,0.65)', textLight:'rgba(255,255,255,0.38)',
  border:'rgba(255,255,255,0.09)',
};

/* ─── HELPERS ─── */
function LKR(v) { return `LKR ${Number(v||0).toLocaleString()}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'; }

const pinIcon = new L.Icon({
  iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[30,48], iconAnchor:[15,48], popupAnchor:[1,-40],
});

function MapClickToPin({ onPick }) {
  useMapEvents({ click:(e)=>onPick({lat:e.latlng.lat,lng:e.latlng.lng}) });
  return null;
}

function getCapacityFromBed(bedType, bedCount) {
  const bc=Math.max(1,Number(bedCount||1));
  const t=(bedType||'').toLowerCase();
  const p=t==='single'?1:t==='triple'?3:2;
  return Math.max(1,Math.min(10,p*bc));
}

function dealPreview(room) {
  const base=Number(room?.basePricePerNight||0);
  if(!room?.hasHotDeal) return {original:base,final:base};
  if(room.dealType==='percentage') {
    const pct=Number(room.discountPercentage||0);
    return {original:base,final:Math.max(0,base*(1-pct/100))};
  }
  return {original:base,final:Math.max(0,base-Number(room.discountValue||0))};
}

/* ─── STATUS PILL ─── */
function StatusPill({ status }) {
  const s=(status||'').toLowerCase();
  const map={
    pending:  {bg:'rgba(251,191,36,0.15)',  text:'#fbbf24', border:'rgba(251,191,36,0.35)',  dot:'#fbbf24'},
    confirmed:{bg:'rgba(16,185,129,0.12)',  text:'#34d399', border:'rgba(16,185,129,0.3)',   dot:'#34d399'},
    rejected: {bg:'rgba(239,68,68,0.12)',   text:'#f87171', border:'rgba(239,68,68,0.3)',    dot:'#f87171'},
    cancelled:{bg:'rgba(255,255,255,0.06)', text:'rgba(255,255,255,0.45)', border:'rgba(255,255,255,0.12)', dot:'rgba(255,255,255,0.3)'},
  };
  const v=map[s]||map.cancelled;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:99,fontSize:11,fontWeight:800,background:v.bg,color:v.text,border:`1px solid ${v.border}`}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:v.dot,flexShrink:0}} />
      {(status||'—').charAt(0).toUpperCase()+(status||'').slice(1)}
    </span>
  );
}

/* ─── LABEL ─── */
function Lbl({ children }) {
  return <label style={{display:'block',fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.13em',marginBottom:7}}>{children}</label>;
}

/* ─── SKELETON ─── */
function Sk({ h=16, w='100%', r=8 }) {
  return <div className="d-skeleton" style={{height:h,width:w,borderRadius:r}} />;
}

/* ─── AMENITY TOGGLE GRID ─── */
function AmenityGrid({ options, selected, onToggle }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8}}>
      {options.map(opt=>{
        const on=selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={()=>onToggle(opt)}
            className={`d-card-solid d-tab amenity-${on?'on':'off'}`}
            style={{padding:'9px 14px',textAlign:'left',display:'flex',alignItems:'center',gap:9,border:'1px solid rgba(255,255,255,0.09)',cursor:'pointer'}}>
            <span style={{width:16,height:16,borderRadius:5,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
              background:on?T.gold:'rgba(255,255,255,0.08)',border:`1.5px solid ${on?T.gold:'rgba(255,255,255,0.14)'}`,transition:'all .18s'}}>
              {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
            </span>
            <span style={{fontSize:12,fontWeight:700}}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── STEP INDICATOR ─── */
function StepBar({ step, steps }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:28}}>
      {steps.map((lbl,i)=>(
        <div key={lbl} style={{display:'flex',alignItems:'center',flex: i<steps.length-1 ? 1 : 'none'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:13,
              background: i<step ? T.gold : i===step ? T.gold : 'rgba(255,255,255,0.1)',
              color: i<=step ? '#1a1a2e' : T.textLight,
              boxShadow: i===step ? `0 0 0 4px rgba(245,158,11,0.2)` : 'none',
              transition:'all .3s'}}>
              {i<step ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> : i+1}
            </div>
            <span style={{fontSize:10,fontWeight:700,color:i===step?T.goldLt:T.textLight,textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>{lbl}</span>
          </div>
          {i<steps.length-1 && (
            <div style={{flex:1,height:2,margin:'0 8px',marginBottom:18,borderRadius:99,background: i<step?T.gold:'rgba(255,255,255,0.1)',transition:'background .4s'}} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AddHotelsFromOwners() {
  const [activeTab, setActiveTab] = useState('overview');
  const [hotels, setHotels]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [ownerSearch, setOwnerSearch]       = useState('');
  const [ownerHotelFilter, setOwnerHotelFilter] = useState('all');
  const [detailsModal, setDetailsModal]     = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const amenitiesOptions = useMemo(()=>['Free WiFi','Swimming Pool','Spa','Gym','Restaurant','Parking','Room Service','Air Conditioning','Concierge','Family Friendly','Business Center','24/7 Reception'],[]);
  const roomFacilityOptions = useMemo(()=>['A/C','Balcony','Mini-bar','Bathtub','Workspace','Soundproofed','Rain shower','City view','Microwave'],[]);

  useEffect(()=>{
    let c=false;
    (async()=>{
      setLoadingDashboard(true);
      try {
        const [hr,sr]=await Promise.all([api.get('/hotel-owner-dashboard/hotels'),api.get('/hotel-owner-dashboard/stats')]);
        if(!c){setHotels(hr.data||[]);setStats(sr.data||null);}
      } catch(err){toast.error(err.response?.data?.message||'Failed to load dashboard');}
      finally{if(!c)setLoadingDashboard(false);}
    })();
    return()=>{c=true;};
  },[]);

  const refreshReservations = async()=>{
    setReservationsLoading(true);
    try {
      const p=new URLSearchParams();
      if(ownerHotelFilter!=='all') p.set('hotelId',ownerHotelFilter);
      if(ownerSearch.trim()) p.set('search',ownerSearch.trim());
      const {data}=await api.get(`/hotel-owner-dashboard/bookings?${p}`);
      setReservations(data||[]);
    } catch(err){toast.error(err.response?.data?.message||'Failed to load reservations');}
    finally{setReservationsLoading(false);}
  };

  useEffect(()=>{ if(activeTab==='reservations') refreshReservations(); },[activeTab]);
  useEffect(()=>{ if(activeTab==='reservations') refreshReservations(); },[ownerHotelFilter,ownerSearch]);

  const handleAcceptReject=async(id,type)=>{
    setActionLoadingId(id);
    try {
      if(type==='accept') await api.put(`/hotel-owner-dashboard/bookings/${id}/accept`);
      if(type==='reject') await api.put(`/hotel-owner-dashboard/bookings/${id}/reject`);
      toast.success(type==='accept'?'Booking accepted ✓':'Booking rejected');
      setDetailsModal(null); refreshReservations();
    } catch(err){toast.error(err.response?.data?.message||'Action failed');}
    finally{setActionLoadingId(null);}
  };

  const overviewHotels=useMemo(()=>{
    const q=ownerSearch.trim().toLowerCase();
    return hotels.filter(h=>{
      const mf=ownerHotelFilter==='all'||String(h._id)===String(ownerHotelFilter);
      const mq=!q||`${h.name||''} ${h.location||''} ${h.address||''}`.toLowerCase().includes(q);
      return mf&&mq;
    });
  },[hotels,ownerSearch,ownerHotelFilter]);

  const NAV = [
    { id:'overview',     label:'Overview',     badge: stats?.pendingBookings||0, icon:'🏠' },
    { id:'reservations', label:'Reservations', badge: reservations.length,       icon:'📅' },
    { id:'add',          label:'Add Hotel',    badge: null,                      icon:'➕' },
  ];

  const STAT_CARDS = stats ? [
    { label:'Total Hotels',    value: stats.totalHotelsUploaded, icon:'🏨', color:T.gold    },
    { label:'Monthly Revenue', value: LKR(stats.monthlyRevenue), icon:'💰', color:'#34d399' },
    { label:'Yearly Revenue',  value: LKR(stats.yearlyRevenue),  icon:'📈', color:'#60a5fa' },
    { label:'Pending Bookings',value: stats.pendingBookings,     icon:'⏳', color:'#f87171' },
  ] : [];

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="ho-dash">
        <div className="ho-dash-bg" />

        <div style={{position:'relative',zIndex:1,maxWidth:1340,margin:'0 auto',padding:'28px 24px 60px',display:'grid',gridTemplateColumns:'260px 1fr',gap:24,alignItems:'start'}}>

          {/* ═══════════════════════
              SIDEBAR
          ═══════════════════════ */}
          <aside style={{position:'sticky',top:88}}>
            <div className="d-card d-scroll" style={{padding:20,overflow:'auto',maxHeight:'calc(100vh - 110px)'}}>
              {/* Owner identity */}
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
                <div style={{width:46,height:46,borderRadius:14,background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:`0 6px 18px rgba(245,158,11,0.35)`}}>
                  <Star size={20} color="#1a1a2e" fill="#1a1a2e" />
                </div>
                <div>
                  <p style={{fontWeight:900,fontSize:14,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>Hotel Owner</p>
                  <p style={{fontSize:11,color:T.textLight,margin:0,fontWeight:600}}>{stats?`${stats.totalHotelsUploaded||0} properties`:'Dashboard'}</p>
                </div>
              </div>

              {/* Nav items */}
              <nav style={{display:'flex',flexDirection:'column',gap:6}}>
                {NAV.map(n=>(
                  <button key={n.id} type="button" onClick={()=>setActiveTab(n.id)}
                    className={`d-tab d-card-solid d-tab-${activeTab===n.id?'on':'off'}`}
                    style={{padding:'11px 14px',textAlign:'left',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1px solid rgba(255,255,255,0.09)',borderRadius:13}}>
                    <span style={{display:'flex',alignItems:'center',gap:9,fontWeight:800,fontSize:13}}>
                      <span style={{fontSize:16}}>{n.icon}</span>
                      {n.label}
                    </span>
                    {n.badge!==null && n.badge>0 && (
                      <span style={{background:activeTab===n.id?T.gold:'rgba(245,158,11,0.25)',color:activeTab===n.id?'#1a1a2e':T.goldLt,fontSize:10,fontWeight:900,padding:'2px 8px',borderRadius:99,minWidth:20,textAlign:'center'}}>
                        {n.badge}
                      </span>
                    )}
                    {n.id==='add' && (
                      <span style={{fontSize:10,fontWeight:700,color:activeTab==='add'?T.goldDk:T.textLight}}>New</span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Quick stats in sidebar */}
              {stats && (
                <div style={{marginTop:20,paddingTop:18,borderTop:`1px solid ${T.border}`,display:'flex',flexDirection:'column',gap:10}}>
                  {[
                    ['Monthly',LKR(stats.monthlyRevenue),'💰'],
                    ['Pending',`${stats.pendingBookings} bookings`,'⏳'],
                  ].map(([k,v,ic])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:`1px solid ${T.border}`}}>
                      <span style={{fontSize:11,color:T.textLight,fontWeight:700,display:'flex',alignItems:'center',gap:6}}><span>{ic}</span>{k}</span>
                      <span style={{fontSize:12,fontWeight:900,color:T.goldLt}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{marginTop:18,fontSize:11,color:T.textLight,lineHeight:1.6,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
                Upload hotels, manage rooms, and review traveller bookings in real time.
              </p>
            </div>
          </aside>

          {/* ═══════════════════════
              MAIN CONTENT
          ═══════════════════════ */}
          <main>

            {/* Loading skeleton */}
            {loadingDashboard && activeTab!=='add' && (
              <div className="d-card" style={{padding:28}}>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <Sk h={28} w="45%" />
                  <Sk h={14} w="30%" />
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:8}}>
                    {[1,2,3,4].map(i=><Sk key={i} h={90} r={14} />)}
                  </div>
                  <Sk h={200} r={16} />
                </div>
              </div>
            )}

            {/* ── OVERVIEW ── */}
            {!loadingDashboard && activeTab==='overview' && (
              <div className="tab-reveal" style={{display:'flex',flexDirection:'column',gap:20}}>

                {/* Page header */}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:'clamp(1.4rem,2.5vw,1.9rem)',fontWeight:900,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>
                      Dashboard Overview
                    </h1>
                    <p style={{fontSize:13,color:T.textLight,margin:'5px 0 0'}}>Manage your properties and track performance</p>
                  </div>
                  <button className="d-btn-gold" onClick={()=>setActiveTab('add')}>
                    <Plus size={15} /> Add New Hotel
                  </button>
                </div>

                {/* Stat cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
                  {STAT_CARDS.map((s,i)=>(
                    <div key={s.label} className="d-card" style={{padding:'20px 22px',animationDelay:`${i*60}ms`}}
                      onMouseOver={e=>{e.currentTarget.style.borderColor=`${s.color}44`;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,0.25)`;}}
                      onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
                      style={{padding:'20px 22px',transition:'all .3s',cursor:'default'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                        <span style={{fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.12em'}}>{s.label}</span>
                        <span style={{fontSize:22,width:38,height:38,borderRadius:10,background:`${s.color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>{s.icon}</span>
                      </div>
                      <div className="stat-num" style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Search + filter bar */}
                <div className="d-card" style={{padding:18,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
                  <div style={{flex:'1 1 200px'}}>
                    <Lbl>🔍 Search Hotels</Lbl>
                    <div style={{position:'relative'}}>
                      <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.textLight,pointerEvents:'none'}} />
                      <input className="d-inp" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)}
                        placeholder="Hotel name or location" style={{paddingLeft:36}} />
                    </div>
                  </div>
                  <div style={{flex:'0 1 220px'}}>
                    <Lbl>🏨 Filter by Hotel</Lbl>
                    <select className="d-inp" value={ownerHotelFilter} onChange={e=>setOwnerHotelFilter(e.target.value)}>
                      <option value="all">All Hotels</option>
                      {hotels.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Hotel cards grid */}
                <div>
                  <p style={{fontSize:12,fontWeight:700,color:T.textLight,marginBottom:14}}>
                    {overviewHotels.length} hotel{overviewHotels.length!==1?'s':''} found
                  </p>
                  {overviewHotels.length===0 ? (
                    <div className="d-card" style={{padding:'48px',textAlign:'center'}}>
                      <span style={{fontSize:40,display:'block',marginBottom:12}}>🏨</span>
                      <p style={{color:T.textLight,fontWeight:700,fontSize:14,margin:'0 0 16px'}}>No hotels match your search</p>
                      <button className="d-btn-gold" onClick={()=>setActiveTab('add')}><Plus size={14}/>Add Your First Hotel</button>
                    </div>
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
                      {overviewHotels.map((h,i)=>(
                        <div key={h._id} className="d-card" style={{padding:0,overflow:'hidden',transition:'all .3s',animationDelay:`${i*50}ms`,animation:'fadeUp .5s cubic-bezier(.22,1,.36,1) both'}}
                          onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(245,158,11,0.3)';e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.3)';}}
                          onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
                          {h.images?.[0] && (
                            <div style={{height:130,overflow:'hidden',position:'relative'}}>
                              <img src={h.images[0]} alt={h.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.5),transparent 55%)'}} />
                              <span style={{position:'absolute',bottom:10,left:12,color:T.goldLt,fontSize:12}}>
                                {'★'.repeat(h.starRating||h.stars||5)}
                              </span>
                            </div>
                          )}
                          <div style={{padding:'14px 16px'}}>
                            <p style={{fontWeight:900,fontSize:14,color:T.text,margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.name}</p>
                            <p style={{fontSize:11,color:T.textLight,margin:'0 0 12px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
                              <svg width="10" height="10" fill="currentColor" style={{color:T.gold,flexShrink:0}} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                              {h.location||h.address}
                            </p>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                              <span style={{fontSize:12,fontWeight:900,color:T.goldLt}}>
                                {h.pricePerNight?`LKR ${Number(h.pricePerNight).toLocaleString()}/night`:''}
                              </span>
                              <span style={{fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:99,background:'rgba(245,158,11,0.12)',color:T.goldLt,border:'1px solid rgba(245,158,11,0.25)'}}>
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RESERVATIONS ── */}
            {activeTab==='reservations' && (
              <div className="tab-reveal" style={{display:'flex',flexDirection:'column',gap:20}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:'clamp(1.4rem,2.5vw,1.9rem)',fontWeight:900,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>Reservations</h1>
                    <p style={{fontSize:13,color:T.textLight,margin:'5px 0 0'}}>{reservations.length} booking{reservations.length!==1?'s':''} found</p>
                  </div>
                  <button className="d-btn-ghost" onClick={refreshReservations}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M1 4v6h6M23 20v-6h-6"/><path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 1 0 21.99 12"/></svg>
                    Refresh
                  </button>
                </div>

                {/* Filters */}
                <div className="d-card" style={{padding:18,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
                  <div style={{flex:'1 1 200px'}}>
                    <Lbl>🔍 Search</Lbl>
                    <div style={{position:'relative'}}>
                      <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:T.textLight,pointerEvents:'none'}} />
                      <input className="d-inp" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)} placeholder="Guest name or hotel" style={{paddingLeft:36}} />
                    </div>
                  </div>
                  <div style={{flex:'0 1 220px'}}>
                    <Lbl>🏨 Hotel</Lbl>
                    <select className="d-inp" value={ownerHotelFilter} onChange={e=>setOwnerHotelFilter(e.target.value)}>
                      <option value="all">All Hotels</option>
                      {hotels.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="d-card" style={{overflow:'hidden'}}>
                  {reservationsLoading ? (
                    <div style={{padding:28,display:'flex',flexDirection:'column',gap:12}}>
                      {[1,2,3,4].map(i=><Sk key={i} h={44} r={10} />)}
                    </div>
                  ) : reservations.length===0 ? (
                    <div style={{padding:'56px',textAlign:'center'}}>
                      <span style={{fontSize:40,display:'block',marginBottom:12}}>📋</span>
                      <p style={{color:T.textLight,fontWeight:700,fontSize:14}}>No reservations found</p>
                    </div>
                  ) : (
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead>
                          <tr style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                            {['Guest','Room','Check-in','Check-out','Status','Action'].map(h=>(
                              <th key={h} style={{padding:'14px 18px',textAlign:'left',fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.12em',whiteSpace:'nowrap'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.map(b=>{
                            const name=`${b.firstName||''} ${b.lastName||''}`.trim()||'N/A';
                            return (
                              <tr key={b._id} className="d-tr" style={{borderBottom:'1px solid rgba(255,255,255,0.05)',transition:'background .2s'}}>
                                <td style={{padding:'14px 18px',fontWeight:800,color:T.text}}>{name}</td>
                                <td style={{padding:'14px 18px',color:T.textMid}}>{b.roomType||'—'}</td>
                                <td style={{padding:'14px 18px',color:T.textMid,whiteSpace:'nowrap'}}>{fmtDate(b.checkIn)}</td>
                                <td style={{padding:'14px 18px',color:T.textMid,whiteSpace:'nowrap'}}>{fmtDate(b.checkOut)}</td>
                                <td style={{padding:'14px 18px'}}><StatusPill status={b.status} /></td>
                                <td style={{padding:'14px 18px'}}>
                                  <button onClick={()=>setDetailsModal(b)} style={{
                                    padding:'7px 16px',borderRadius:10,border:'1px solid rgba(245,158,11,0.3)',
                                    background:'rgba(245,158,11,0.08)',color:T.goldLt,fontWeight:800,fontSize:12,
                                    cursor:'pointer',transition:'all .2s',fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap',
                                  }}
                                    onMouseOver={e=>{e.currentTarget.style.background=T.goldBg;e.currentTarget.style.borderColor=T.goldBorder;}}
                                    onMouseOut={e=>{e.currentTarget.style.background='rgba(245,158,11,0.08)';e.currentTarget.style.borderColor='rgba(245,158,11,0.3)';}}>
                                    View →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Details modal */}
                {detailsModal && (
                  <div onClick={e=>{if(e.target===e.currentTarget)setDetailsModal(null);}}
                    style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'fadeIn .25s ease'}}>
                    <div style={{width:'100%',maxWidth:660,background:'#111827',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,overflow:'hidden',boxShadow:'0 32px 80px rgba(0,0,0,0.5)',animation:'fadeUp .35s cubic-bezier(.22,1,.36,1)'}}>
                      {/* Modal header */}
                      <div style={{padding:'20px 24px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <h3 style={{fontSize:18,fontWeight:900,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>Reservation Details</h3>
                          <p style={{fontSize:12,color:T.textLight,margin:'4px 0 0'}}>{detailsModal.hotelId?.name||'Hotel'} · {detailsModal.roomType||'—'}</p>
                        </div>
                        <button onClick={()=>setDetailsModal(null)} style={{width:34,height:34,borderRadius:10,background:'rgba(255,255,255,0.06)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:T.textMid,transition:'all .2s'}}
                          onMouseOver={e=>{e.currentTarget.style.background='rgba(239,68,68,0.15)';e.currentTarget.style.color='#f87171';}}
                          onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color=T.textMid;}}>
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:16}}>
                        {/* Guest + Dates */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                          {[
                            {title:'Guest Info', rows:[
                              [`${detailsModal.firstName||''} ${detailsModal.lastName||''}`.trim()||'N/A'],
                              [detailsModal.email],[detailsModal.phone],
                            ]},
                            {title:'Booking Info', rows:[
                              [`${fmtDate(detailsModal.checkIn)} → ${fmtDate(detailsModal.checkOut)}`],
                              [`${detailsModal.guests?.adults||0} adults, ${detailsModal.guests?.children||0} children`],
                              [LKR(detailsModal.totalPrice)+' total'],
                            ]},
                          ].map(sec=>(
                            <div key={sec.title} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'14px 16px'}}>
                              <p style={{fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 12px'}}>{sec.title}</p>
                              {sec.rows.map((r,i)=>(
                                <p key={i} style={{fontSize:13,fontWeight:i===0?800:600,color:i===0?T.text:T.textMid,margin:'0 0 3px'}}>{r}</p>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* Payment slip */}
                        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'14px 16px'}}>
                          <p style={{fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 12px'}}>Payment Slip</p>
                          {detailsModal.paymentSlip ? (
                            <img src={detailsModal.paymentSlip} alt="Payment slip" style={{width:'100%',maxHeight:280,objectFit:'contain',borderRadius:10,background:'rgba(0,0,0,0.2)'}} />
                          ) : (
                            <p style={{fontSize:13,color:T.textMid}}>No payment slip uploaded.</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,paddingTop:4}}>
                          <StatusPill status={detailsModal.status} />
                          <div style={{display:'flex',gap:10}}>
                            <button disabled={actionLoadingId===detailsModal._id} onClick={()=>handleAcceptReject(detailsModal._id,'accept')}
                              style={{padding:'10px 22px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:13,display:'flex',alignItems:'center',gap:7,transition:'all .2s',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 6px 18px rgba(16,185,129,0.3)',opacity:actionLoadingId?0.6:1}}
                              onMouseOver={e=>{if(!actionLoadingId){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 24px rgba(16,185,129,0.4)';}}}
                              onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 6px 18px rgba(16,185,129,0.3)';}}>
                              <CheckCircle size={15} /> Accept
                            </button>
                            <button disabled={actionLoadingId===detailsModal._id} onClick={()=>handleAcceptReject(detailsModal._id,'reject')}
                              style={{padding:'10px 22px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',fontWeight:800,fontSize:13,display:'flex',alignItems:'center',gap:7,transition:'all .2s',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 6px 18px rgba(239,68,68,0.25)',opacity:actionLoadingId?0.6:1}}
                              onMouseOver={e=>{if(!actionLoadingId){e.currentTarget.style.transform='translateY(-2px)';}}}
                              onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';}}>
                              <X size={15} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ADD HOTEL ── */}
            {activeTab==='add' && (
              <div className="tab-reveal">
                <div style={{marginBottom:20}}>
                  <h1 style={{fontSize:'clamp(1.4rem,2.5vw,1.9rem)',fontWeight:900,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>Add New Hotel</h1>
                  <p style={{fontSize:13,color:T.textLight,margin:'5px 0 0'}}>Fill in your hotel details, rooms, and publish</p>
                </div>
                <AddHotelForm
                  amenitiesOptions={amenitiesOptions}
                  roomFacilityOptions={roomFacilityOptions}
                  onHotelPublished={async()=>{
                    try {
                      const [hr,sr]=await Promise.all([api.get('/hotel-owner-dashboard/hotels'),api.get('/hotel-owner-dashboard/stats')]);
                      setHotels(hr.data||[]); setStats(sr.data||null);
                      toast.success('Hotel published successfully! 🎉');
                      setActiveTab('overview');
                    } catch{}
                  }}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}

/* ══════════════════════════════════════════
   ADD HOTEL FORM
══════════════════════════════════════════ */
function AddHotelForm({ amenitiesOptions, roomFacilityOptions, onHotelPublished }) {
  const [step, setStep] = useState(0);
  const [publishLoading, setPublishLoading] = useState(false);
  const STEPS = ['Hotel Details', 'Rooms', 'Review & Publish'];

  const defaultRoom = { roomName:'', roomSize:'', bedType:'double', bedCount:1, roomFacilities:[], basePricePerNight:'', hasHotDeal:false, dealType:'percentage', discountPercentage:'', discountValue:'' };

  const { register, control, handleSubmit, watch, setValue, formState:{errors} } = useForm({
    defaultValues: { hotelName:'', description:'', location:'', address:'', coordinates:{lat:6.9271,lng:79.8612}, starRating:5, contactEmail:'', phone1:'', phone2:'', hotelAmenities:[], mainImageFile:null, secondaryImageFiles:[], rooms:[defaultRoom] }
  });

  const { fields, append, remove } = useFieldArray({ control, name:'rooms' });
  const roomsWatch = watch('rooms');
  const latWatch = watch('coordinates.lat');
  const lngWatch = watch('coordinates.lng');
  const hotelAmenitiesSelected = watch('hotelAmenities');

  const [mainImageFile, setMainImageFile] = useState(null);
  const [secondaryImageFiles, setSecondaryImageFiles] = useState([]);
  const [roomImageFiles, setRoomImageFiles] = useState([]);

  useEffect(() => {
    // Keep room image files aligned with the dynamic room list.
    setRoomImageFiles((prev) => {
      const needed = fields.length;
      if (needed <= 0) return [];
      const next = Array.from({ length: needed }, (_, i) => prev[i] || null);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  const toggleHotelAmenity = amenity=>{
    const cur=new Set(watch('hotelAmenities')||[]);
    cur.has(amenity)?cur.delete(amenity):cur.add(amenity);
    setValue('hotelAmenities',Array.from(cur));
  };
  const toggleRoomFacility=(idx,fac)=>{
    const cur=new Set(watch(`rooms.${idx}.roomFacilities`)||[]);
    cur.has(fac)?cur.delete(fac):cur.add(fac);
    setValue(`rooms.${idx}.roomFacilities`,Array.from(cur));
  };
  const pickPin=c=>{ setValue('coordinates.lat',c.lat); setValue('coordinates.lng',c.lng); };

  const publishHotel=async values=>{
    const computedRooms=(values.rooms||[]).map(r=>{
      const p=dealPreview(r);
      return {
        type:r.roomName, pricePerNight:p.final, originalPricePerNight:p.original,
        hasHotDeal:!!r.hasHotDeal,
        discountPercentage:r.dealType==='percentage'?Number(r.discountPercentage||0):undefined,
        discountValue:r.dealType==='value'?Number(r.discountValue||0):undefined,
        capacity:getCapacityFromBed(r.bedType,r.bedCount), count:1,
        roomSize:r.roomSize?Number(r.roomSize):undefined,
        bedType:r.bedType, bedCount:Number(r.bedCount||1),
        amenities:(r.roomFacilities||[]).filter(Boolean),
        // Room images are uploaded as files and mapped server-side.
        images:[],
      };
    });

    // Require exactly 1 image per room (as requested).
    for (let i = 0; i < computedRooms.length; i++) {
      if (!roomImageFiles?.[i]) {
        toast.error(`Please upload an image for Room ${i + 1}.`);
        return;
      }
    }
    const minP=computedRooms.map(r=>Number(r.pricePerNight||0)).filter(n=>n>0);
    const payload={
      name:values.hotelName, description:values.description,
      location:values.location, address:values.address||values.location,
      starRating:Number(values.starRating||5), phone:values.phone1||'', email:values.contactEmail||'',
      coordinates:{lat:Number(values.coordinates?.lat||latWatch),lng:Number(values.coordinates?.lng||lngWatch)},
      amenities:values.hotelAmenities||[], rooms:computedRooms,
      pricePerNight:minP.length?Math.min(...minP):0, discount:0, isActive:true,
    };
    const fd=new FormData();
    fd.append('data',JSON.stringify(payload));
    if(!mainImageFile){toast.error('Please upload a main hotel image');return;}
    [mainImageFile,...(secondaryImageFiles||[])].filter(Boolean).forEach(f=>fd.append('images',f));
    // Append room images for server-side mapping.
    roomImageFiles.slice(0, computedRooms.length).forEach((f) => {
      if (f) fd.append('roomImages', f);
    });
    setPublishLoading(true);
    try {
      await api.post('/hotels',fd,{headers:{'Content-Type':'multipart/form-data'}});
      await onHotelPublished?.();
    } catch(err){toast.error(err.response?.data?.message||'Failed to publish hotel');}
    finally{setPublishLoading(false);}
  };

  const BED_TYPES=[{value:'single',label:'Single'},{value:'double',label:'Double'},{value:'triple',label:'Triple'},{value:'king',label:'King'},{value:'queen',label:'Queen'}];

  const SectionTitle = ({children,sub})=>(
    <div style={{marginBottom:22}}>
      <h2 style={{fontSize:18,fontWeight:900,color:'#f9fafb',margin:0,fontFamily:"'Playfair Display',serif"}}>{children}</h2>
      {sub&&<p style={{fontSize:13,color:'rgba(255,255,255,0.4)',margin:'4px 0 0'}}>{sub}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(publishHotel)} style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Step bar */}
      <div className="d-card" style={{padding:'20px 24px'}}>
        <StepBar step={step} steps={STEPS} />
        <div style={{display:'flex',gap:8}}>
          {STEPS.map((lbl,i)=>(
            <button key={lbl} type="button" onClick={()=>setStep(i)}
              className={`d-tab d-card-solid d-tab-${step===i?'on':'off'}`}
              style={{padding:'9px 18px',borderRadius:12,border:'1px solid rgba(255,255,255,0.09)',fontSize:13,fontWeight:800}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 0: Hotel Details ── */}
      {step===0 && (
        <div className="d-card tab-reveal" style={{padding:'28px'}}>
          <SectionTitle sub="Add the hotel profile, contact info, location and images">Hotel Details</SectionTitle>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <Lbl>Hotel Name *</Lbl>
              <input className="d-inp" {...register('hotelName',{required:true})} placeholder="e.g. Cinnamon Grand Colombo" />
              {errors.hotelName && <p style={{color:'#f87171',fontSize:11,marginTop:4,fontWeight:700}}>Hotel name is required</p>}
            </div>
            <div>
              <Lbl>Star Rating *</Lbl>
              <select className="d-inp" {...register('starRating',{required:true})}>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
              </select>
            </div>
          </div>

          <div style={{marginBottom:16}}>
            <Lbl>About / Description *</Lbl>
            <textarea className="d-inp" {...register('description',{required:true})} rows={4} placeholder="Describe your hotel…" style={{resize:'vertical'}} />
            {errors.description && <p style={{color:'#f87171',fontSize:11,marginTop:4,fontWeight:700}}>Description is required</p>}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20}}>
            <div>
              <Lbl>Contact Email *</Lbl>
              <input className="d-inp" {...register('contactEmail',{required:true})} type="email" placeholder="hotel@email.com" />
            </div>
            <div>
              <Lbl>Phone 1 *</Lbl>
              <input className="d-inp" {...register('phone1',{required:true})} placeholder="+94 77 123 4567" />
            </div>
            <div>
              <Lbl>Phone 2 (optional)</Lbl>
              <input className="d-inp" {...register('phone2')} placeholder="+94 11 234 5678" />
            </div>
          </div>

          {/* Location + Map */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:20,marginBottom:20}}>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <Lbl>City / Location *</Lbl>
                <input className="d-inp" {...register('location',{required:true})} placeholder="e.g. Colombo 03" />
              </div>
              <div>
                <Lbl>Full Address (optional)</Lbl>
                <input className="d-inp" {...register('address')} placeholder="77 Galle Road, Colombo 03" />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <Lbl>Latitude</Lbl>
                  <input className="d-inp" {...register('coordinates.lat')} type="number" step="any" />
                </div>
                <div>
                  <Lbl>Longitude</Lbl>
                  <input className="d-inp" {...register('coordinates.lng')} type="number" step="any" />
                </div>
              </div>
              <div style={{background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:12,padding:'12px 14px'}}>
                <p style={{fontSize:11,fontWeight:800,color:'rgba(245,158,11,0.8)',margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'0.1em'}}>💡 Map Tip</p>
                <p style={{fontSize:12,color:'rgba(255,255,255,0.5)',margin:0,lineHeight:1.6}}>Click anywhere on the map to automatically set the coordinates.</p>
              </div>
            </div>
            <div style={{borderRadius:16,overflow:'hidden',border:'1px solid rgba(255,255,255,0.09)',height:300}}>
              <MapContainer center={[latWatch||6.9271,lngWatch||79.8612]} zoom={12} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickToPin onPick={pickPin} />
                <Marker position={[latWatch||6.9271,lngWatch||79.8612]} icon={pinIcon} />
              </MapContainer>
            </div>
          </div>

          {/* Amenities */}
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <Lbl>Hotel Amenities *</Lbl>
              <span style={{fontSize:11,fontWeight:800,color:'rgba(245,158,11,0.7)',background:'rgba(245,158,11,0.1)',padding:'3px 10px',borderRadius:99}}>
                {(hotelAmenitiesSelected||[]).length} selected
              </span>
            </div>
            <AmenityGrid options={amenitiesOptions} selected={hotelAmenitiesSelected||[]} onToggle={toggleHotelAmenity} />
          </div>

          {/* Images */}
          <div style={{marginBottom:24}}>
            <Lbl>Hotel Images</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {[
                {label:'Main Image *', multi:false, file:mainImageFile, setter:setMainImageFile},
                {label:'Gallery Images', multi:true, file:secondaryImageFiles, setter:setSecondaryImageFiles},
              ].map(({label,multi,file,setter})=>(
                <div key={label} style={{background:'rgba(255,255,255,0.03)',border:'1.5px dashed rgba(255,255,255,0.12)',borderRadius:14,padding:'20px',textAlign:'center',transition:'border-color .2s'}}
                  onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(245,158,11,0.4)';}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)';}}>
                  <Upload size={22} style={{color:'rgba(245,158,11,0.6)',marginBottom:10}} />
                  <p style={{fontSize:12,fontWeight:800,color:'rgba(255,255,255,0.65)',margin:'0 0 10px'}}>{label}</p>
                  <input type="file" accept="image/*" multiple={multi}
                    onChange={e=>setter(multi?Array.from(e.target.files||[]):(e.target.files?.[0]||null))}
                    style={{fontSize:12,color:'rgba(255,255,255,0.45)',maxWidth:'100%'}} />
                  {!multi && file && <p style={{fontSize:11,color:'rgba(245,158,11,0.7)',marginTop:8,fontWeight:700}}>✓ {file.name}</p>}
                  {multi && file?.length>0 && <p style={{fontSize:11,color:'rgba(245,158,11,0.7)',marginTop:8,fontWeight:700}}>✓ {file.length} file{file.length>1?'s':''} selected</p>}
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="button" className="d-btn-gold" onClick={()=>setStep(1)}>
              Continue to Rooms
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Rooms ── */}
      {step===1 && (
        <div className="d-card tab-reveal" style={{padding:'28px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:22}}>
            <SectionTitle sub="Add room types with pricing, facilities and images">Room Types</SectionTitle>
            <button
              type="button"
              className="d-btn-gold"
              onClick={() => {
                append(defaultRoom);
                setRoomImageFiles((prev) => [...prev, null]);
              }}
            >
              <Plus size={14}/> Add Room
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {fields.map((field,idx)=>{
              const room=roomsWatch?.[idx]||field;
              const p=dealPreview(room);
              return (
                <div key={field.id} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:18,padding:'22px',transition:'border-color .2s'}}
                  onMouseOver={e=>{e.currentTarget.style.borderColor='rgba(245,158,11,0.2)';}}
                  onMouseOut={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.09)';}}>

                  {/* Room header */}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{width:30,height:30,borderRadius:10,background:'rgba(245,158,11,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:'#f59e0b'}}>
                        {idx+1}
                      </span>
                      <span style={{fontWeight:900,fontSize:15,color:'#f9fafb'}}>{room?.roomName||`Room ${idx+1}`}</span>
                    </div>
                    {fields.length>1 && (
                      <button
                        type="button"
                        onClick={() => {
                          remove(idx);
                          setRoomImageFiles((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        style={{padding:'6px 14px',borderRadius:10,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#f87171',fontSize:12,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:6,transition:'all .2s'}}
                        onMouseOver={e=>{e.currentTarget.style.background='rgba(239,68,68,0.18)';}}
                        onMouseOut={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';}}>
                        <X size={13}/> Remove
                      </button>
                    )}
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,marginBottom:16}}>
                    <div>
                      <Lbl>Room Name *</Lbl>
                      <input className="d-inp" {...register(`rooms.${idx}.roomName`,{required:true})} placeholder="Deluxe Ocean View" />
                    </div>
                    <div>
                      <Lbl>Size (sq ft)</Lbl>
                      <input className="d-inp" {...register(`rooms.${idx}.roomSize`)} type="number" placeholder="250" />
                    </div>
                    <div>
                      <Lbl>Bed Type</Lbl>
                      <select className="d-inp" {...register(`rooms.${idx}.bedType`)}>
                        {BED_TYPES.map(b=><option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <Lbl>Bed Count</Lbl>
                      <input className="d-inp" {...register(`rooms.${idx}.bedCount`,{valueAsNumber:true})} type="number" min={1} />
                    </div>
                  </div>

                  {/* Facilities */}
                  <div style={{marginBottom:16}}>
                    <Lbl>Room Facilities</Lbl>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {roomFacilityOptions.map(fac=>{
                        const on=(room?.roomFacilities||[]).includes(fac);
                        return (
                          <button key={fac} type="button" onClick={()=>toggleRoomFacility(idx,fac)}
                            className={`d-tab amenity-${on?'on':'off'}`}
                            style={{padding:'6px 14px',borderRadius:99,border:`1px solid ${on?'rgba(245,158,11,0.45)':'rgba(255,255,255,0.1)'}`,background:on?'rgba(245,158,11,0.13)':'rgba(255,255,255,0.04)',fontSize:12,fontWeight:700}}>
                            {fac}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Image Upload */}
                  <div style={{marginBottom:16}}>
                    <Lbl>Room Image *</Lbl>
                    <div style={{display:'grid',gridTemplateColumns:'1fr',gap:10}}>
                      <input
                        type="file"
                        accept="image/*"
                        className="d-inp"
                        style={{padding:'10px 14px'}}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setRoomImageFiles((prev) => prev.map((x, i) => (i === idx ? file : x)));
                        }}
                      />
                    </div>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:6}}>
                      {roomImageFiles?.[idx]?.name ? `Selected: ${roomImageFiles[idx].name}` : 'Select one image from your device for this room.'}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div style={{background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:14,padding:'18px 20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                      <p style={{fontWeight:900,fontSize:14,color:'#f9fafb',margin:0}}>💰 Pricing</p>
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                        <input type="checkbox" {...register(`rooms.${idx}.hasHotDeal`)} style={{accentColor:T.gold,width:15,height:15}} />
                        <span style={{fontSize:12,fontWeight:800,color:'rgba(255,255,255,0.65)'}}>Hot Deal</span>
                        {room?.hasHotDeal && <span style={{fontSize:10,background:'rgba(239,68,68,0.2)',color:'#f87171',padding:'2px 8px',borderRadius:99,fontWeight:800}}>🔥 ON</span>}
                      </label>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div>
                        <Lbl>Base Price / Night *</Lbl>
                        <input className="d-inp" {...register(`rooms.${idx}.basePricePerNight`,{required:true})} type="number" placeholder="32000" />
                      </div>
                      <div>
                        <Lbl>Price Preview</Lbl>
                        <div style={{padding:'10px 14px',borderRadius:13,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.09)',display:'flex',alignItems:'center',gap:10}}>
                          {room?.hasHotDeal && p.original>0 && (
                            <span style={{fontSize:12,textDecoration:'line-through',color:'rgba(255,255,255,0.3)',fontWeight:700}}>{LKR(p.original)}</span>
                          )}
                          <span style={{fontSize:14,fontWeight:900,color:room?.hasHotDeal?'#fbbf24':'#f9fafb'}}>{LKR(p.final)}</span>
                        </div>
                      </div>
                    </div>
                    {room?.hasHotDeal && (
                      <div style={{marginTop:14}}>
                        <div style={{display:'flex',gap:8,marginBottom:12}}>
                          {[{v:'percentage',l:'% Discount'},{v:'value',l:'Fixed Amount'}].map(opt=>(
                            <button key={opt.v} type="button" onClick={()=>setValue(`rooms.${idx}.dealType`,opt.v)}
                              className={`d-tab d-tab-${room?.dealType===opt.v?'on':'off'}`}
                              style={{padding:'7px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,0.09)',fontSize:12,fontWeight:800}}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        {room?.dealType==='percentage' ? (
                          <div style={{maxWidth:200}}>
                            <Lbl>Discount %</Lbl>
                            <input className="d-inp" {...register(`rooms.${idx}.discountPercentage`)} type="number" min={0} max={100} placeholder="20" />
                          </div>
                        ) : (
                          <div style={{maxWidth:200}}>
                            <Lbl>Discount Value (LKR)</Lbl>
                            <input className="d-inp" {...register(`rooms.${idx}.discountValue`)} type="number" min={0} placeholder="5000" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:12,fontWeight:600}}>
                    Estimated capacity: <strong style={{color:'rgba(255,255,255,0.6)'}}>{getCapacityFromBed(room?.bedType,room?.bedCount)} guests</strong>
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,flexWrap:'wrap',gap:12}}>
            <button type="button" className="d-btn-ghost" onClick={()=>setStep(0)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back
            </button>
            <button type="button" className="d-btn-gold" onClick={()=>setStep(2)}>
              Review & Publish
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review & Publish ── */}
      {step===2 && (
        <div className="d-card tab-reveal" style={{padding:'28px'}}>
          <SectionTitle sub="Confirm your hotel and room details before publishing">Review & Publish</SectionTitle>

          {/* Hotel summary */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:16,padding:'20px 22px',marginBottom:16}}>
            <p style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.12em',margin:'0 0 14px'}}>Hotel Summary</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              {[
                ['Hotel Name', watch('hotelName')||'—'],
                ['Location', watch('location')||'—'],
                ['Star Rating', `${'★'.repeat(Number(watch('starRating')||5))} (${watch('starRating')||5})`],
                ['Contact Email', watch('contactEmail')||'—'],
                ['Phone', watch('phone1')||'—'],
                ['Amenities', `${(watch('hotelAmenities')||[]).length} selected`],
              ].map(([k,v])=>(
                <div key={k}>
                  <p style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 4px'}}>{k}</p>
                  <p style={{fontSize:13,fontWeight:800,color:'#f9fafb',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms summary */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:16,overflow:'hidden',marginBottom:20}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between'}}>
              <p style={{fontSize:10,fontWeight:800,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.12em',margin:0}}>Rooms ({fields.length})</p>
            </div>
            {fields.map((f,idx)=>{
              const room=roomsWatch?.[idx]||f;
              const p=dealPreview(room);
              return (
                <div key={f.id} style={{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontWeight:900,fontSize:14,color:'#f9fafb',margin:'0 0 3px'}}>{room?.roomName||`Room ${idx+1}`}</p>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.4)',margin:0}}>{room?.bedType} bed · {room?.bedCount} bed(s) · {getCapacityFromBed(room?.bedType,room?.bedCount)} guests</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {room?.hasHotDeal && <p style={{fontSize:11,textDecoration:'line-through',color:'rgba(255,255,255,0.3)',margin:'0 0 2px',fontWeight:700}}>{LKR(p.original)}</p>}
                    <p style={{fontSize:15,fontWeight:900,color:'#fbbf24',margin:0}}>{LKR(p.final)}<span style={{fontSize:11,color:'rgba(255,255,255,0.4)',fontWeight:600}}>/night</span></p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checklist */}
          <div style={{background:'rgba(16,185,129,0.05)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:14,padding:'16px 18px',marginBottom:20}}>
            <p style={{fontSize:11,fontWeight:800,color:'rgba(16,185,129,0.8)',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 12px'}}>✅ Pre-publish Checklist</p>
            {[
              [!!watch('hotelName'),'Hotel name provided'],
              [!!mainImageFile,'Main image uploaded'],
              [(watch('hotelAmenities')||[]).length>0,'At least one amenity selected'],
              [fields.length>0,'At least one room added'],
              [fields.every((_,i)=>watch(`rooms.${i}.basePricePerNight`)>0),'All rooms have pricing'],
            ].map(([ok,lbl])=>(
              <div key={lbl} style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                <span style={{width:18,height:18,borderRadius:'50%',background:ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.15)',border:`1px solid ${ok?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {ok
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  }
                </span>
                <span style={{fontSize:13,fontWeight:700,color:ok?'rgba(255,255,255,0.7)':'rgba(239,68,68,0.8)'}}>{lbl}</span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <button type="button" className="d-btn-ghost" onClick={()=>setStep(1)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back to Rooms
            </button>
            <button type="submit" disabled={publishLoading} className="d-btn-gold" style={{padding:'13px 32px',fontSize:14}}>
              {publishLoading
                ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="spin-anim"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>Publishing…</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7"/></svg>Publish Hotel</>
              }
            </button>
          </div>
        </div>
      )}
    </form>
  );
}