import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { CheckCircle, Plus, Search, Upload, X, Star, Home, Calendar, Edit3, Trash2, RefreshCw, ChevronRight, ChevronLeft, ArrowUpRight, Hotel, TrendingUp, Clock, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/* ─────────────────────────────────────────────────
   GLOBAL STYLES — Refined Light Theme
───────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:translateX(0)} }
  @keyframes shimmer  { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

  :root {
    --ink: #0f172a;
    --ink-mid: #475569;
    --ink-soft: #94a3b8;
    --ink-faint: #cbd5e1;
    --paper: #ffffff;
    --paper-2: #f8fafc;
    --paper-3: #f1f5f9;
    --paper-4: #e2e8f0;
    --amber: #d97706;
    --amber-lt: #f59e0b;
    --amber-bg: #fef3c7;
    --amber-border: #fde68a;
    --green: #059669;
    --green-bg: #d1fae5;
    --red: #dc2626;
    --red-bg: #fee2e2;
    --blue: #2563eb;
    --blue-bg: #dbeafe;
    --shadow-xs: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
    --shadow-sm: 0 4px 6px -1px rgba(15,23,42,0.08), 0 2px 4px -2px rgba(15,23,42,0.05);
    --shadow-md: 0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.05);
    --shadow-lg: 0 20px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.04);
    --shadow-xl: 0 25px 50px -12px rgba(15,23,42,0.18);
    --radius: 14px;
    --radius-sm: 10px;
    --radius-xs: 7px;
  }

  .ho-wrap {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: var(--paper-2);
    color: var(--ink);
  }

  /* Cards */
  .card {
    background: var(--paper);
    border: 1px solid var(--paper-4);
    border-radius: var(--radius);
    box-shadow: var(--shadow-xs);
  }
  .card-hover {
    transition: all .22s cubic-bezier(.22,1,.36,1);
  }
  .card-hover:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--ink-faint);
  }

  /* Inputs */
  .inp {
    width: 100%;
    border-radius: var(--radius-xs);
    background: var(--paper-2);
    border: 1.5px solid var(--paper-4);
    color: var(--ink);
    outline: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    padding: 10px 14px;
    transition: border-color .18s, box-shadow .18s, background .18s;
  }
  .inp::placeholder { color: var(--ink-faint); }
  .inp:focus {
    border-color: var(--amber-lt);
    background: var(--paper);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.12);
  }
  select.inp option { background: var(--paper); }
  textarea.inp { resize: vertical; }

  /* Skeleton */
  .skeleton {
    background: linear-gradient(90deg, var(--paper-3) 25%, var(--paper-4) 50%, var(--paper-3) 75%);
    background-size: 700px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }

  /* Nav item */
  .nav-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-radius: var(--radius-sm);
    cursor: pointer; transition: all .18s;
    border: 1px solid transparent;
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    color: var(--ink-mid); background: transparent; width: 100%;
    text-align: left;
  }
  .nav-item:hover { background: var(--paper-3); color: var(--ink); border-color: var(--paper-4); }
  .nav-item.active {
    background: linear-gradient(135deg, #fffbeb, #fef3c7);
    color: var(--amber);
    border-color: var(--amber-border);
    font-weight: 700;
  }

  /* Buttons */
  .btn-amber {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
    border: none; border-radius: var(--radius-sm);
    font-weight: 700; font-size: 13.5px; cursor: pointer;
    padding: 10px 20px; display: inline-flex; align-items: center; gap: 7px;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 4px 14px rgba(245,158,11,0.35);
    transition: all .2s;
  }
  .btn-amber:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(245,158,11,0.45); transform: translateY(-1px); filter: brightness(1.05); }
  .btn-amber:disabled { opacity: .5; cursor: not-allowed; }

  .btn-ghost {
    background: var(--paper);
    border: 1.5px solid var(--paper-4);
    color: var(--ink-mid); border-radius: var(--radius-sm);
    font-weight: 600; font-size: 13px; cursor: pointer;
    padding: 9px 18px; display: inline-flex; align-items: center; gap: 7px;
    font-family: 'DM Sans', sans-serif; transition: all .18s;
  }
  .btn-ghost:hover { background: var(--paper-3); color: var(--ink); border-color: var(--ink-faint); }

  .btn-danger {
    background: var(--paper);
    border: 1.5px solid #fca5a5;
    color: var(--red); border-radius: var(--radius-sm);
    font-weight: 700; font-size: 13px; cursor: pointer;
    padding: 9px 18px; display: inline-flex; align-items: center; gap: 7px;
    font-family: 'DM Sans', sans-serif; transition: all .18s;
  }
  .btn-danger:hover:not(:disabled) { background: var(--red-bg); border-color: var(--red); }
  .btn-danger:disabled { opacity: .5; cursor: not-allowed; }

  .btn-success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff; border: none; border-radius: var(--radius-sm);
    font-weight: 700; font-size: 13px; cursor: pointer;
    padding: 9px 18px; display: inline-flex; align-items: center; gap: 7px;
    font-family: 'DM Sans', sans-serif; transition: all .2s;
    box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  }
  .btn-success:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
  .btn-success:disabled { opacity: .5; cursor: not-allowed; }

  /* Table */
  .tbl-row { transition: background .15s; }
  .tbl-row:hover { background: var(--paper-2); }

  /* Amenity chip */
  .chip {
    padding: 6px 13px; border-radius: 99px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .15s; border: 1.5px solid var(--paper-4);
    background: var(--paper-2); color: var(--ink-mid);
    font-family: 'DM Sans', sans-serif;
  }
  .chip:hover { border-color: var(--ink-faint); color: var(--ink); }
  .chip.on { background: var(--amber-bg); border-color: var(--amber-border); color: var(--amber); font-weight: 700; }

  /* Step line */
  .step-line { height: 2px; flex: 1; border-radius: 99px; margin: 0 8px; transition: background .4s; }

  /* Reveal animation */
  .reveal { animation: fadeUp .32s cubic-bezier(.22,1,.36,1) both; }
  .reveal-sm { animation: slideIn .28s cubic-bezier(.22,1,.36,1) both; }

  /* Scrollbar */
  .scroll-y { overflow-y: auto; }
  .scroll-y::-webkit-scrollbar { width: 4px; }
  .scroll-y::-webkit-scrollbar-thumb { background: var(--ink-faint); border-radius: 99px; }

  /* Stat badge */
  .stat-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
  }

  /* Room card */
  .room-card {
    background: var(--paper-2); border: 1.5px solid var(--paper-4);
    border-radius: var(--radius); padding: 22px;
    transition: border-color .2s;
  }
  .room-card:hover { border-color: var(--amber-border); }

  /* Image upload area */
  .upload-zone {
    border: 2px dashed var(--paper-4); border-radius: var(--radius-sm);
    padding: 20px; text-align: center; transition: all .2s; cursor: pointer;
    background: var(--paper-2);
  }
  .upload-zone:hover { border-color: var(--amber-lt); background: var(--amber-bg); }
  .upload-zone.has-file { border-color: var(--amber-lt); background: #fffbeb; }

  /* Modal overlay */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(15,23,42,0.45); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn .2s ease;
  }
  .modal-box {
    width: 100%; background: var(--paper);
    border-radius: 20px; box-shadow: var(--shadow-xl);
    animation: fadeUp .3s cubic-bezier(.22,1,.36,1);
    overflow: hidden;
  }

  /* Confirmation card */
  .confirm-card {
    background: #fff5f5; border: 1.5px solid #fca5a5;
    border-radius: var(--radius-sm); padding: 16px; margin-top: 12px;
    animation: fadeUp .2s ease;
  }

  /* Spin */
  .spin { animation: spin .75s linear infinite; }
`;

/* ─── CONSTANTS ─── */
const T = {
  amber: '#d97706', amberLt: '#f59e0b', amberBg: '#fef3c7',
  green: '#059669', red: '#dc2626', blue: '#2563eb',
  ink: '#0f172a', inkMid: '#475569', inkSoft: '#94a3b8',
  paper: '#ffffff', paper2: '#f8fafc', paper3: '#f1f5f9', paper4: '#e2e8f0',
};

const AMENITIES = ['Free WiFi','Swimming Pool','Spa','Gym','Restaurant','Parking','Room Service','Air Conditioning','Concierge','Family Friendly','Business Center','24/7 Reception'];
const ROOM_FACILITIES = ['A/C','Balcony','Mini-bar','Bathtub','Workspace','Soundproofed','Rain shower','City view','Microwave'];
const BED_TYPES = [{value:'single',label:'Single'},{value:'double',label:'Double'},{value:'triple',label:'Triple'},{value:'king',label:'King'},{value:'queen',label:'Queen'}];
const STEPS_ADD = ['Hotel Info','Rooms','Review'];
const STEPS_EDIT = ['Hotel Info','Rooms','Review'];

function LKR(v) { return `LKR ${Number(v||0).toLocaleString()}`; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'; }

const pinIcon = new L.Icon({
  iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[28,44],iconAnchor:[14,44],popupAnchor:[1,-38],
});

function MapClickToPin({ onPick }) {
  useMapEvents({ click: e => onPick({lat:e.latlng.lat,lng:e.latlng.lng}) });
  return null;
}

function getCapacityFromBed(bedType, bedCount) {
  const bc = Math.max(1, Number(bedCount||1));
  const t = (bedType||'').toLowerCase();
  const p = t==='single'?1 : t==='triple'?3 : 2;
  return Math.max(1, Math.min(10, p*bc));
}

function dealPreview(room) {
  const base = Number(room?.basePricePerNight||0);
  if (!room?.hasHotDeal) return {original:base,final:base};
  if (room.dealType==='percentage') {
    const pct = Number(room.discountPercentage||0);
    return {original:base, final:Math.max(0,base*(1-pct/100))};
  }
  return {original:base, final:Math.max(0,base-Number(room.discountValue||0))};
}

/* ─── SUB-COMPONENTS ─── */
function Lbl({ children, required }) {
  return (
    <label style={{display:'block',fontSize:11,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>
      {children}{required && <span style={{color:T.red,marginLeft:2}}>*</span>}
    </label>
  );
}

function Sk({ h=16, w='100%', r=8 }) {
  return <div className="skeleton" style={{height:h,width:w,borderRadius:r}} />;
}

function StatusPill({ status }) {
  const s = (status||'').toLowerCase();
  const map = {
    pending:  {bg:'#fffbeb',text:'#92400e',border:'#fde68a',dot:'#f59e0b'},
    confirmed:{bg:'#d1fae5',text:'#065f46',border:'#a7f3d0',dot:'#10b981'},
    rejected: {bg:'#fee2e2',text:'#991b1b',border:'#fca5a5',dot:'#ef4444'},
    cancelled:{bg:T.paper3,text:T.inkMid,border:T.paper4,dot:T.inkSoft},
  };
  const v = map[s]||map.cancelled;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 11px',borderRadius:99,fontSize:11,fontWeight:700,background:v.bg,color:v.text,border:`1.5px solid ${v.border}`}}>
      <span style={{width:5,height:5,borderRadius:'50%',background:v.dot,flexShrink:0}} />
      {(status||'—').charAt(0).toUpperCase()+(status||'').slice(1)}
    </span>
  );
}

function AmenityGrid({ options, selected, onToggle }) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)}
            className={`chip${on?' on':''}`}>
            {on && '✓ '}{opt}
          </button>
        );
      })}
    </div>
  );
}

function StepBar({ step, steps }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:28}}>
      {steps.map((lbl,i) => (
        <div key={lbl} style={{display:'flex',alignItems:'center',flex: i<steps.length-1 ? 1 : 'none'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{
              width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:800,fontSize:13,
              background: i<step ? T.amberLt : i===step ? '#fff' : T.paper3,
              color: i<step ? '#fff' : i===step ? T.amberLt : T.inkSoft,
              border: i===step ? `2px solid ${T.amberLt}` : i<step ? `2px solid ${T.amberLt}` : `2px solid ${T.paper4}`,
              boxShadow: i===step ? `0 0 0 4px rgba(245,158,11,0.14)` : 'none',
              transition:'all .3s',
            }}>
              {i<step
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : i+1
              }
            </div>
            <span style={{fontSize:10,fontWeight:700,color:i===step?T.amber:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap'}}>{lbl}</span>
          </div>
          {i<steps.length-1 && (
            <div className="step-line" style={{marginBottom:18,background:i<step?T.amberLt:T.paper4}} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function HotelOwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [hotels, setHotels] = useState([]);
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingRes, setLoadingRes] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState('all');
  const [detailsModal, setDetailsModal] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editHotel, setEditHotel] = useState(null);   // hotel being edited
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState(null);

  /* ── Load dashboard ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDash(true);
      try {
        const [hr,sr] = await Promise.all([api.get('/hotel-owner-dashboard/hotels'),api.get('/hotel-owner-dashboard/stats')]);
        if (!cancelled) { setHotels(hr.data||[]); setStats(sr.data||null); }
      } catch(err) { toast.error(err.response?.data?.message||'Failed to load dashboard'); }
      finally { if (!cancelled) setLoadingDash(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshHotels = async () => {
    try {
      const [hr,sr] = await Promise.all([api.get('/hotel-owner-dashboard/hotels'),api.get('/hotel-owner-dashboard/stats')]);
      setHotels(hr.data||[]); setStats(sr.data||null);
    } catch {}
  };

  /* ── Load reservations ── */
  const loadReservations = async () => {
    setLoadingRes(true);
    try {
      const p = new URLSearchParams();
      if (hotelFilter !== 'all') p.set('hotelId', hotelFilter);
      if (ownerSearch.trim()) p.set('search', ownerSearch.trim());
      const {data} = await api.get(`/hotel-owner-dashboard/bookings?${p}`);
      setReservations(data||[]);
    } catch(err) { toast.error(err.response?.data?.message||'Failed to load reservations'); }
    finally { setLoadingRes(false); }
  };

  useEffect(() => { if (activeTab==='reservations') loadReservations(); }, [activeTab]);
  useEffect(() => { if (activeTab==='reservations') loadReservations(); }, [hotelFilter, ownerSearch]);

  /* ── Accept / Reject ── */
  const handleAcceptReject = async (id, type) => {
    setActionLoadingId(id);
    try {
      if (type==='accept') await api.put(`/hotel-owner-dashboard/bookings/${id}/accept`);
      if (type==='reject') await api.put(`/hotel-owner-dashboard/bookings/${id}/reject`);
      toast.success(type==='accept' ? 'Booking accepted ✓' : 'Booking rejected');
      setDetailsModal(null); loadReservations();
    } catch(err) { toast.error(err.response?.data?.message||'Action failed'); }
    finally { setActionLoadingId(null); }
  };

  /* ── Publish hotel ── */
  const handlePublishHotel = async (hotelId) => {
    setPublishingId(hotelId);
    try {
      await api.post(`/hotel-owner-dashboard/hotels/${hotelId}/publish`);
      toast.success('Hotel submitted for approval! ✓');
      await refreshHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit hotel');
    } finally {
      setPublishingId(null);
    }
  };

  /* ── Delete hotel ── */
  const handleDeleteHotel = async (hotelId) => {
    setIsDeleting(true);
    try {
      await api.delete(`/hotel-owner-dashboard/hotels/${hotelId}`);
      toast.success('Hotel deleted successfully');
      setDeleteConfirmId(null);
      await refreshHotels();
    } catch(err) {
      toast.error(err.response?.data?.message||'Failed to delete hotel');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── Filtered hotels ── */
  const filteredHotels = useMemo(() => {
    const q = ownerSearch.trim().toLowerCase();
    return hotels.filter(h => {
      const mf = hotelFilter==='all' || String(h._id)===String(hotelFilter);
      const mq = !q || `${h.name||''} ${h.location||''} ${h.address||''}`.toLowerCase().includes(q);
      return mf && mq;
    });
  }, [hotels, ownerSearch, hotelFilter]);

  /* ── NAV ── */
  const NAV = [
    { id:'overview',     label:'Overview',        icon:<Home size={15}/>,      badge: null },
    { id:'reservations', label:'Reservations',     icon:<Calendar size={15}/>,  badge: stats?.pendingBookings||0 },
    { id:'update',       label:'Update Hotel',     icon:<Edit3 size={15}/>,     badge: null },
    { id:'delete',       label:'Delete Hotel',     icon:<Trash2 size={15}/>,    badge: null },
    { id:'add',          label:'Add Hotel',        icon:<Plus size={15}/>,      badge: null },
  ];

  const STAT_CARDS = stats ? [
    { label:'Total Hotels',    value: stats.totalHotelsUploaded, icon:<Building2 size={20}/>, color:T.amber,    bg:'#fffbeb' },
    { label:'Monthly Revenue', value: LKR(stats.monthlyRevenue), icon:<TrendingUp size={20}/>,color:T.green,    bg:'#d1fae5' },
    { label:'Yearly Revenue',  value: LKR(stats.yearlyRevenue),  icon:<ArrowUpRight size={20}/>,color:T.blue,   bg:'#dbeafe' },
    { label:'Pending',         value: stats.pendingBookings,     icon:<Clock size={20}/>,     color:T.red,      bg:'#fee2e2' },
  ] : [];

  /* ── Reusable search bar ── */
  const SearchBar = () => (
    <div className="card" style={{padding:16,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end',marginBottom:20}}>
      <div style={{flex:'1 1 200px'}}>
        <Lbl>Search Hotels</Lbl>
        <div style={{position:'relative'}}>
          <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:T.inkSoft}} />
          <input className="inp" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)} placeholder="Hotel name or location…" style={{paddingLeft:34}} />
        </div>
      </div>
      <div style={{flex:'0 1 210px'}}>
        <Lbl>Filter by Hotel</Lbl>
        <select className="inp" value={hotelFilter} onChange={e=>setHotelFilter(e.target.value)}>
          <option value="all">All Hotels</option>
          {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="ho-wrap">

        {/* Top accent bar */}
        <div style={{height:3,background:'linear-gradient(90deg,#f59e0b,#d97706,#b45309)',borderRadius:'0 0 99px 99px',marginBottom:0}} />

        <div style={{maxWidth:1360,margin:'0 auto',padding:'24px 20px 60px',display:'grid',gridTemplateColumns:'240px 1fr',gap:20,alignItems:'start'}}>

          {/* ═══════ SIDEBAR ═══════ */}
          <aside style={{position:'sticky',top:80}}>
            <div className="card scroll-y" style={{padding:16,maxHeight:'calc(100vh - 100px)',overflow:'auto'}}>
              {/* Identity */}
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${T.paper4}`}}>
                <div style={{width:44,height:44,borderRadius:13,background:'linear-gradient(135deg,#fef3c7,#fde68a)',border:`1px solid ${T.amberBg}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 12px rgba(245,158,11,0.2)'}}>
                  <Star size={20} color={T.amber} fill={T.amber} />
                </div>
                <div>
                  <p style={{fontWeight:800,fontSize:14,color:T.ink,margin:0,fontFamily:"'Instrument Serif',serif",fontStyle:'italic'}}>Hotel Owner</p>
                  <p style={{fontSize:11,color:T.inkSoft,margin:0,fontWeight:600}}>{stats ? `${stats.totalHotelsUploaded||0} properties` : '—'}</p>
                </div>
              </div>

              {/* Nav */}
              <nav style={{display:'flex',flexDirection:'column',gap:4}}>
                {NAV.map(n => (
                  <button key={n.id} type="button" onClick={() => setActiveTab(n.id)}
                    className={`nav-item${activeTab===n.id?' active':''}`}>
                    <span style={{display:'flex',alignItems:'center',gap:9}}>{n.icon}{n.label}</span>
                    {n.badge > 0 && (
                      <span style={{fontSize:10,fontWeight:800,background:activeTab===n.id?T.amber:T.paper3,color:activeTab===n.id?'#fff':T.inkMid,padding:'2px 7px',borderRadius:99}}>
                        {n.badge}
                      </span>
                    )}
                    {n.id==='add' && (
                      <span style={{fontSize:9,fontWeight:800,background:'#dbeafe',color:T.blue,padding:'2px 7px',borderRadius:99}}>NEW</span>
                    )}
                  </button>
                ))}
              </nav>

              {/* Mini stats */}
              {stats && (
                <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.paper4}`,display:'flex',flexDirection:'column',gap:8}}>
                  {[
                    ['Monthly',LKR(stats.monthlyRevenue),T.green,'#d1fae5'],
                    ['Pending',`${stats.pendingBookings} bookings`,T.red,'#fee2e2'],
                  ].map(([k,v,clr,bg]) => (
                    <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 11px',borderRadius:9,background:bg,border:`1px solid ${clr}22`}}>
                      <span style={{fontSize:11,color:T.inkMid,fontWeight:600}}>{k}</span>
                      <span style={{fontSize:11,fontWeight:800,color:clr}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{marginTop:16,fontSize:11,color:T.inkSoft,lineHeight:1.65,paddingTop:14,borderTop:`1px solid ${T.paper4}`}}>
                Manage hotels, review bookings, and track revenue in real time.
              </p>
            </div>
          </aside>

          {/* ═══════ MAIN ═══════ */}
          <main>

            {/* Loading */}
            {loadingDash && activeTab!=='add' && (
              <div className="card" style={{padding:28,display:'flex',flexDirection:'column',gap:14}}>
                <Sk h={30} w="42%" /> <Sk h={14} w="28%" />
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:8}}>
                  {[1,2,3,4].map(i=><Sk key={i} h={88} r={12} />)}
                </div>
                <Sk h={180} r={14} />
              </div>
            )}

            {/* ──────── OVERVIEW ──────── */}
            {!loadingDash && activeTab==='overview' && (
              <div className="reveal" style={{display:'flex',flexDirection:'column',gap:18}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:'clamp(1.5rem,2.5vw,2rem)',fontWeight:400,color:T.ink,margin:0,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',lineHeight:1.2}}>
                      Dashboard Overview
                    </h1>
                    <p style={{fontSize:13,color:T.inkSoft,margin:'5px 0 0',fontWeight:500}}>Manage your properties and track performance</p>
                  </div>
                  <button className="btn-amber" onClick={() => setActiveTab('add')}><Plus size={14}/>Add New Hotel</button>
                </div>

                {/* Stat cards */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12}}>
                  {STAT_CARDS.map((s,i) => (
                    <div key={s.label} className="card card-hover" style={{padding:'18px 20px',animationDelay:`${i*50}ms`,animation:'fadeUp .5s both'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                        <span style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em'}}>{s.label}</span>
                        <span style={{width:36,height:36,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',color:s.color}}>{s.icon}</span>
                      </div>
                      <div style={{fontSize:22,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <SearchBar />

                {/* Hotel grid */}
                <div>
                  <p style={{fontSize:12,fontWeight:600,color:T.inkSoft,marginBottom:12}}>
                    {filteredHotels.length} hotel{filteredHotels.length!==1?'s':''} found
                  </p>
                  {filteredHotels.length===0 ? (
                    <div className="card" style={{padding:'48px',textAlign:'center'}}>
                      <Hotel size={40} style={{color:T.inkSoft,margin:'0 auto 12px'}} />
                      <p style={{color:T.inkSoft,fontWeight:600,fontSize:14,marginBottom:16}}>No hotels match your search</p>
                      <button className="btn-amber" onClick={() => setActiveTab('add')}><Plus size={14}/>Add Your First Hotel</button>
                    </div>
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
                      {filteredHotels.map((h,i) => (
                        <HotelCard key={h._id} h={h} i={i} onClick={null}
                          onPublish={handlePublishHotel}
                          publishingId={publishingId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ──────── RESERVATIONS ──────── */}
            {activeTab==='reservations' && (
              <div className="reveal" style={{display:'flex',flexDirection:'column',gap:18}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:'clamp(1.5rem,2.5vw,2rem)',fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Reservations</h1>
                    <p style={{fontSize:13,color:T.inkSoft,margin:'5px 0 0',fontWeight:500}}>{reservations.length} booking{reservations.length!==1?'s':''} found</p>
                  </div>
                  <button className="btn-ghost" onClick={loadReservations}><RefreshCw size={13}/>Refresh</button>
                </div>

                <div className="card" style={{padding:16,display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
                  <div style={{flex:'1 1 200px'}}>
                    <Lbl>Search</Lbl>
                    <div style={{position:'relative'}}>
                      <Search size={13} style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',color:T.inkSoft}} />
                      <input className="inp" value={ownerSearch} onChange={e=>setOwnerSearch(e.target.value)} placeholder="Guest name or hotel…" style={{paddingLeft:34}} />
                    </div>
                  </div>
                  <div style={{flex:'0 1 210px'}}>
                    <Lbl>Hotel</Lbl>
                    <select className="inp" value={hotelFilter} onChange={e=>setHotelFilter(e.target.value)}>
                      <option value="all">All Hotels</option>
                      {hotels.map(h=><option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="card" style={{overflow:'hidden'}}>
                  {loadingRes ? (
                    <div style={{padding:24,display:'flex',flexDirection:'column',gap:10}}>
                      {[1,2,3,4].map(i=><Sk key={i} h={44} r={8} />)}
                    </div>
                  ) : reservations.length===0 ? (
                    <div style={{padding:'56px',textAlign:'center'}}>
                      <Calendar size={36} style={{color:T.inkSoft,margin:'0 auto 12px'}} />
                      <p style={{color:T.inkSoft,fontWeight:600,fontSize:14}}>No reservations found</p>
                    </div>
                  ) : (
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                        <thead>
                          <tr style={{borderBottom:`1.5px solid ${T.paper4}`,background:T.paper2}}>
                            {['Guest','Room','Check-in','Check-out','Status','Action'].map(h=>(
                              <th key={h} style={{padding:'12px 18px',textAlign:'left',fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',whiteSpace:'nowrap'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.map(b => {
                            const name = `${b.firstName||''} ${b.lastName||''}`.trim()||'N/A';
                            return (
                              <tr key={b._id} className="tbl-row" style={{borderBottom:`1px solid ${T.paper3}`}}>
                                <td style={{padding:'13px 18px',fontWeight:700,color:T.ink}}>{name}</td>
                                <td style={{padding:'13px 18px',color:T.inkMid}}>{b.roomType||'—'}</td>
                                <td style={{padding:'13px 18px',color:T.inkMid,whiteSpace:'nowrap'}}>{fmtDate(b.checkIn)}</td>
                                <td style={{padding:'13px 18px',color:T.inkMid,whiteSpace:'nowrap'}}>{fmtDate(b.checkOut)}</td>
                                <td style={{padding:'13px 18px'}}><StatusPill status={b.status} /></td>
                                <td style={{padding:'13px 18px'}}>
                                  <button onClick={() => setDetailsModal(b)} className="btn-ghost" style={{padding:'6px 14px',fontSize:12}}>View →</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Booking detail modal */}
                {detailsModal && (
                  <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setDetailsModal(null);}}>
                    <div className="modal-box" style={{maxWidth:660}}>
                      <div style={{padding:'20px 24px',borderBottom:`1px solid ${T.paper4}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                        <div>
                          <h3 style={{fontSize:18,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Reservation Details</h3>
                          <p style={{fontSize:12,color:T.inkSoft,margin:'4px 0 0'}}>{detailsModal.hotelId?.name||'Hotel'} · {detailsModal.roomType||'—'}</p>
                        </div>
                        <button onClick={() => setDetailsModal(null)} style={{width:32,height:32,borderRadius:8,background:T.paper2,border:`1px solid ${T.paper4}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:T.inkMid,transition:'all .15s'}}
                          onMouseOver={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color=T.red;}}
                          onMouseOut={e=>{e.currentTarget.style.background=T.paper2;e.currentTarget.style.color=T.inkMid;}}>
                          <X size={14}/>
                        </button>
                      </div>

                      <div style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                          {[
                            {title:'Guest Info',rows:[[`${detailsModal.firstName||''} ${detailsModal.lastName||''}`.trim()||'N/A'],[detailsModal.email],[detailsModal.phone]]},
                            {title:'Booking Info',rows:[[`${fmtDate(detailsModal.checkIn)} → ${fmtDate(detailsModal.checkOut)}`],[`${detailsModal.guests?.adults||0} adults, ${detailsModal.guests?.children||0} children`],[LKR(detailsModal.totalPrice)+' total']]},
                          ].map(sec => (
                            <div key={sec.title} style={{background:T.paper2,border:`1px solid ${T.paper4}`,borderRadius:12,padding:'14px 16px'}}>
                              <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>{sec.title}</p>
                              {sec.rows.map((r,i) => <p key={i} style={{fontSize:13,fontWeight:i===0?700:500,color:i===0?T.ink:T.inkMid,margin:'0 0 3px'}}>{r}</p>)}
                            </div>
                          ))}
                        </div>

                        <div style={{background:T.paper2,border:`1px solid ${T.paper4}`,borderRadius:12,padding:'14px 16px'}}>
                          <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>Payment Slip</p>
                          {detailsModal.paymentSlip
                            ? <img src={detailsModal.paymentSlip} alt="Payment slip" style={{width:'100%',maxHeight:240,objectFit:'contain',borderRadius:8,background:T.paper3}} />
                            : <p style={{fontSize:13,color:T.inkSoft}}>No payment slip uploaded.</p>}
                        </div>

                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,paddingTop:4}}>
                          <StatusPill status={detailsModal.status} />
                          <div style={{display:'flex',gap:10}}>
                            <button disabled={!!actionLoadingId} onClick={() => handleAcceptReject(detailsModal._id,'accept')} className="btn-success">
                              {actionLoadingId===detailsModal._id ? <span className="spin" style={{width:13,height:13,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',display:'block'}}/> : <CheckCircle size={14}/>}
                              Accept
                            </button>
                            <button disabled={!!actionLoadingId} onClick={() => handleAcceptReject(detailsModal._id,'reject')} className="btn-danger">
                              <X size={14}/>Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ──────── UPDATE HOTEL ──────── */}
            {activeTab==='update' && !editHotel && (
              <div className="reveal" style={{display:'flex',flexDirection:'column',gap:18}}>
                <div>
                  <h1 style={{fontSize:'clamp(1.5rem,2.5vw,2rem)',fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Update Hotel</h1>
                  <p style={{fontSize:13,color:T.inkSoft,margin:'5px 0 0',fontWeight:500}}>Select a hotel to edit its full details, rooms, and amenities</p>
                </div>
                <SearchBar />

                {filteredHotels.length===0 ? (
                  <div className="card" style={{padding:'48px',textAlign:'center'}}>
                    <Hotel size={40} style={{color:T.inkSoft,margin:'0 auto 12px'}} />
                    <p style={{color:T.inkSoft,fontWeight:600,fontSize:14,marginBottom:16}}>No hotels found</p>
                    <button className="btn-amber" onClick={() => setActiveTab('add')}><Plus size={14}/>Add Your First Hotel</button>
                  </div>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
                    {filteredHotels.map((h,i) => (
                      <HotelCard key={h._id} h={h} i={i} onClick={() => setEditHotel(h)} actionLabel="Edit Hotel →" actionColor={T.amber} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ──────── EDIT FORM ──────── */}
            {activeTab==='update' && editHotel && (
              <div className="reveal">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                  <button className="btn-ghost" onClick={() => setEditHotel(null)}><ChevronLeft size={14}/>Back</button>
                  <div>
                    <h1 style={{fontSize:'clamp(1.3rem,2vw,1.7rem)',fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>
                      Editing: {editHotel.name}
                    </h1>
                    <p style={{fontSize:12,color:T.inkSoft,margin:'3px 0 0',fontWeight:500}}>Make any changes below and save</p>
                  </div>
                </div>
                <EditHotelForm
                  hotel={editHotel}
                  amenitiesOptions={AMENITIES}
                  roomFacilityOptions={ROOM_FACILITIES}
                  onSuccess={async () => {
                    await refreshHotels();
                    setEditHotel(null);
                    setActiveTab('overview');
                    toast.success('Hotel updated successfully! ✓');
                  }}
                  onCancel={() => setEditHotel(null)}
                />
              </div>
            )}

            {/* ──────── DELETE HOTEL ──────── */}
            {activeTab==='delete' && (
              <div className="reveal" style={{display:'flex',flexDirection:'column',gap:18}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                  <div>
                    <h1 style={{fontSize:'clamp(1.5rem,2.5vw,2rem)',fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Delete Hotel</h1>
                    <p style={{fontSize:13,color:T.inkSoft,margin:'5px 0 0',fontWeight:500}}>Permanently remove a hotel listing. This cannot be undone.</p>
                  </div>
                </div>

                {/* Warning banner */}
                <div style={{padding:'14px 18px',background:'#fff5f5',border:`1.5px solid #fca5a5`,borderRadius:12,display:'flex',gap:12,alignItems:'center'}}>
                  <span style={{fontSize:20}}>⚠️</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:T.red,margin:0}}>Destructive Action</p>
                    <p style={{fontSize:12,color:'#7f1d1d',margin:'2px 0 0'}}>Deleting a hotel will permanently remove it and all associated data. Make sure you're certain before proceeding.</p>
                  </div>
                </div>

                <SearchBar />

                {filteredHotels.length===0 ? (
                  <div className="card" style={{padding:'48px',textAlign:'center'}}>
                    <Trash2 size={40} style={{color:T.inkSoft,margin:'0 auto 12px'}} />
                    <p style={{color:T.inkSoft,fontWeight:600,fontSize:14}}>No hotels to delete</p>
                  </div>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
                    {filteredHotels.map((h,i) => (
                      <div key={h._id} className="card card-hover reveal" style={{overflow:'hidden',animationDelay:`${i*45}ms`}}>
                        {h.images?.[0] && (
                          <div style={{height:150,overflow:'hidden',position:'relative'}}>
                            <img src={h.images[0]} alt={h.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.35),transparent 55%)'}} />
                          </div>
                        )}
                        <div style={{padding:'16px 18px'}}>
                          <p style={{fontWeight:800,fontSize:15,color:T.ink,margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.name}</p>
                          <p style={{fontSize:12,color:T.inkSoft,margin:'0 0 14px',display:'flex',alignItems:'center',gap:4}}>
                            📍 {h.location||h.address}
                          </p>
                          <div style={{display:'flex',gap:8}}>
                            <button
                              disabled={isDeleting}
                              onClick={() => setDeleteConfirmId(deleteConfirmId===h._id ? null : h._id)}
                              className="btn-danger"
                              style={{flex:1,justifyContent:'center',padding:'9px'}}>
                              <Trash2 size={13}/>
                              {deleteConfirmId===h._id ? 'Cancel' : 'Delete Hotel'}
                            </button>
                          </div>

                          {deleteConfirmId===h._id && (
                            <div className="confirm-card">
                              <p style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:6}}>Are you absolutely sure?</p>
                              <p style={{fontSize:12,color:T.inkMid,marginBottom:14,lineHeight:1.5}}>
                                This will permanently delete <strong>"{h.name}"</strong> and all associated bookings from the database.
                              </p>
                              <div style={{display:'flex',gap:8}}>
                                <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="btn-ghost" style={{flex:1,justifyContent:'center',fontSize:12,padding:'8px'}}>
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteHotel(h._id)}
                                  disabled={isDeleting}
                                  style={{flex:1,padding:'8px',background:T.red,border:'none',color:'#fff',borderRadius:8,cursor:isDeleting?'not-allowed':'pointer',fontWeight:800,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:"'DM Sans',sans-serif",transition:'all .2s',opacity:isDeleting?.7:1}}>
                                  {isDeleting
                                    ? <><span className="spin" style={{width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',display:'block'}}/>Deleting…</>
                                    : <><Trash2 size={12}/>Yes, Delete</>
                                  }
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ──────── ADD HOTEL ──────── */}
            {activeTab==='add' && (
              <div className="reveal">
                <div style={{marginBottom:20}}>
                  <h1 style={{fontSize:'clamp(1.5rem,2.5vw,2rem)',fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Add New Hotel</h1>
                  <p style={{fontSize:13,color:T.inkSoft,margin:'5px 0 0',fontWeight:500}}>Complete the steps below to publish your hotel</p>
                </div>
                <AddHotelForm
                  amenitiesOptions={AMENITIES}
                  roomFacilityOptions={ROOM_FACILITIES}
                  onHotelPublished={async () => {
                    await refreshHotels();
                    toast.success('Hotel published! 🎉');
                    setActiveTab('overview');
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
   APPROVAL STATUS PILL
══════════════════════════════════════════ */
function ApprovalPill({ status }) {
  const map = {
    approved:        { bg:'#d1fae5', color:'#065f46', border:'#a7f3d0', label:'Approved' },
    pending_approval:{ bg:'#fef3c7', color:'#92400e', border:'#fde68a', label:'Pending Approval' },
    hold:            { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', label:'On Hold' },
  };
  const v = map[status] || { bg:'#f1f5f9', color:'#475569', border:'#e2e8f0', label: status || 'Draft' };
  return (
    <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,background:v.bg,color:v.color,border:`1px solid ${v.border}`}}>
      {v.label}
    </span>
  );
}

/* ══════════════════════════════════════════
   HOTEL CARD
══════════════════════════════════════════ */
function HotelCard({ h, i, onClick, actionLabel, actionColor, onPublish, publishingId }) {
  const isPublishing = publishingId === h._id;
  const canPublish = onPublish && h.approvalStatus !== 'pending_approval' && h.approvalStatus !== 'approved';
  return (
    <div className={`card card-hover reveal`} style={{overflow:'hidden',animationDelay:`${i*45}ms`,cursor:onClick?'pointer':'default'}}
      onClick={onClick}>
      {h.images?.[0] && (
        <div style={{height:150,overflow:'hidden',position:'relative'}}>
          <img src={h.images[0]} alt={h.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.3),transparent 55%)'}} />
          <span style={{position:'absolute',bottom:10,left:12,color:'#fbbf24',fontSize:12,letterSpacing:'0.05em'}}>
            {'★'.repeat(h.starRating||h.stars||5)}
          </span>
        </div>
      )}
      <div style={{padding:'14px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
          <p style={{fontWeight:800,fontSize:14,color:T.ink,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,marginRight:8}}>{h.name}</p>
          <ApprovalPill status={h.approvalStatus} />
        </div>
        <p style={{fontSize:12,color:T.inkSoft,margin:'0 0 10px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
          📍 {h.location||h.address}
        </p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:10,borderTop:`1px solid ${T.paper4}`}}>
          <span style={{fontSize:12,fontWeight:800,color:T.amber}}>
            {h.pricePerNight ? `LKR ${Number(h.pricePerNight).toLocaleString()}/night` : ''}
          </span>
          <span style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,background:h.isActive!==false?'#d1fae5':'#fee2e2',color:h.isActive!==false?T.green:T.red}}>
            {h.isActive!==false?'Active':'Inactive'}
          </span>
        </div>
        {actionLabel && (
          <div style={{marginTop:10,padding:'9px 12px',background:'#fffbeb',border:`1px solid #fde68a`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <Edit3 size={12} color={actionColor||T.amber} />
            <span style={{fontSize:12,fontWeight:700,color:actionColor||T.amber}}>{actionLabel}</span>
          </div>
        )}
        {onPublish && (
          <div style={{marginTop:10}}>
            {h.approvalStatus === 'approved' ? (
              <div style={{padding:'8px 12px',background:'#d1fae5',border:'1px solid #a7f3d0',borderRadius:9,textAlign:'center',fontSize:12,fontWeight:700,color:'#065f46'}}>
                ✓ Live &amp; Approved
              </div>
            ) : h.approvalStatus === 'pending_approval' ? (
              <div style={{padding:'8px 12px',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:9,textAlign:'center',fontSize:12,fontWeight:700,color:'#92400e'}}>
                ⏳ Awaiting Admin Approval
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onPublish(h._id); }}
                disabled={isPublishing}
                className="btn-amber"
                style={{width:'100%',justifyContent:'center',padding:'9px'}}>
                {isPublishing
                  ? <><span className="spin" style={{width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',display:'block'}}/>Submitting…</>
                  : <>🚀 Submit for Approval</>
                }
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   EDIT HOTEL FORM — Full multi-step form
══════════════════════════════════════════ */
function EditHotelForm({ hotel, amenitiesOptions, roomFacilityOptions, onSuccess, onCancel }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const defaultRoom = { roomName:'', roomSize:'', bedType:'double', bedCount:1, roomFacilities:[], basePricePerNight:'', hasHotDeal:false, dealType:'percentage', discountPercentage:'', discountValue:'' };

  // Map existing rooms from hotel data
  const mapExistingRooms = (rooms) => (rooms||[]).map(r => ({
    roomName: r.type||r.roomName||'',
    roomSize: r.roomSize||'',
    bedType: r.bedType||'double',
    bedCount: r.bedCount||1,
    roomFacilities: r.amenities||r.roomFacilities||[],
    basePricePerNight: r.originalPricePerNight||r.pricePerNight||r.basePricePerNight||'',
    hasHotDeal: r.hasHotDeal||false,
    dealType: r.discountPercentage ? 'percentage' : r.discountValue ? 'value' : 'percentage',
    discountPercentage: r.discountPercentage||'',
    discountValue: r.discountValue||'',
    _id: r._id,
    existingImage: r.images?.[0]||null,
  }));

  const { register, control, handleSubmit, watch, setValue, formState:{errors} } = useForm({
    defaultValues: {
      hotelName: hotel.name||'',
      description: hotel.description||'',
      location: hotel.location||'',
      address: hotel.address||hotel.location||'',
      coordinates: { lat: hotel.coordinates?.lat||hotel.lat||6.9271, lng: hotel.coordinates?.lng||hotel.lng||79.8612 },
      starRating: hotel.starRating||hotel.stars||5,
      contactEmail: hotel.email||'',
      phone1: hotel.phone||'',
      phone2: hotel.phone2||'',
      hotelAmenities: hotel.amenities||[],
      isActive: hotel.isActive!==false,
      rooms: mapExistingRooms(hotel.rooms),
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name:'rooms' });
  const roomsWatch = watch('rooms');
  const latWatch = watch('coordinates.lat');
  const lngWatch = watch('coordinates.lng');
  const hotelAmenitiesSelected = watch('hotelAmenities');

  const [mainImageFile, setMainImageFile] = useState(null);
  const [secondaryImageFiles, setSecondaryImageFiles] = useState([]);
  const [roomImageFiles, setRoomImageFiles] = useState(() => (hotel.rooms||[]).map(() => null));

  useEffect(() => {
    setRoomImageFiles(prev => {
      const next = Array.from({length: fields.length}, (_,i) => prev[i]||null);
      return next;
    });
  }, [fields.length]);

  const toggleAmenity = a => {
    const cur = new Set(watch('hotelAmenities')||[]);
    cur.has(a) ? cur.delete(a) : cur.add(a);
    setValue('hotelAmenities', Array.from(cur));
  };

  const toggleRoomFacility = (idx, fac) => {
    const cur = new Set(watch(`rooms.${idx}.roomFacilities`)||[]);
    cur.has(fac) ? cur.delete(fac) : cur.add(fac);
    setValue(`rooms.${idx}.roomFacilities`, Array.from(cur));
  };

  const pickPin = c => { setValue('coordinates.lat', c.lat); setValue('coordinates.lng', c.lng); };

  const onSubmit = async values => {
    setSaving(true);
    try {
      const computedRooms = (values.rooms||[]).map(r => {
        const p = dealPreview(r);
        return {
          ...(r._id ? {_id: r._id} : {}),
          type: r.roomName,
          pricePerNight: p.final,
          originalPricePerNight: p.original,
          hasHotDeal: !!r.hasHotDeal,
          discountPercentage: r.dealType==='percentage' ? Number(r.discountPercentage||0) : undefined,
          discountValue: r.dealType==='value' ? Number(r.discountValue||0) : undefined,
          capacity: getCapacityFromBed(r.bedType, r.bedCount),
          roomSize: r.roomSize ? Number(r.roomSize) : undefined,
          bedType: r.bedType,
          bedCount: Number(r.bedCount||1),
          amenities: (r.roomFacilities||[]).filter(Boolean),
          images: r.existingImage ? [r.existingImage] : [],
        };
      });

      const minP = computedRooms.map(r => Number(r.pricePerNight||0)).filter(n => n>0);
      const payload = {
        name: values.hotelName,
        description: values.description,
        location: values.location,
        address: values.address||values.location,
        starRating: Number(values.starRating||5),
        phone: values.phone1||'',
        phone2: values.phone2||'',
        email: values.contactEmail||'',
        coordinates: { lat: Number(latWatch), lng: Number(lngWatch) },
        amenities: values.hotelAmenities||[],
        rooms: computedRooms,
        pricePerNight: minP.length ? Math.min(...minP) : 0,
        isActive: values.isActive,
      };

      const fd = new FormData();
      fd.append('data', JSON.stringify(payload));

      // If new hotel images selected, attach them
      if (mainImageFile) {
        [mainImageFile, ...(secondaryImageFiles||[])].filter(Boolean).forEach(f => fd.append('images', f));
      }
      // Room images
      roomImageFiles.forEach(f => { if (f) fd.append('roomImages', f); });

      await api.put(`/hotels/${hotel._id}`, fd, {headers:{'Content-Type':'multipart/form-data'}});
      await onSuccess?.();
    } catch(err) {
      toast.error(err.response?.data?.message||'Failed to update hotel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{display:'flex',flexDirection:'column',gap:18}}>
      {/* Step nav */}
      <div className="card" style={{padding:'18px 22px'}}>
        <StepBar step={step} steps={STEPS_EDIT} />
        <div style={{display:'flex',gap:8}}>
          {STEPS_EDIT.map((lbl,i) => (
            <button key={lbl} type="button" onClick={() => setStep(i)}
              style={{padding:'8px 18px',borderRadius:9,border:`1.5px solid ${step===i?'#fde68a':T.paper4}`,background:step===i?'#fffbeb':T.paper2,color:step===i?T.amber:T.inkMid,fontWeight:700,fontSize:12.5,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .18s'}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 0: Hotel Info ── */}
      {step===0 && (
        <div className="card reveal-sm" style={{padding:26}}>
          <h2 style={{fontSize:17,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:'0 0 20px'}}>Hotel Information</h2>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div>
              <Lbl required>Hotel Name</Lbl>
              <input className="inp" {...register('hotelName',{required:true})} placeholder="e.g. Cinnamon Grand Colombo" />
              {errors.hotelName && <p style={{color:T.red,fontSize:11,marginTop:4,fontWeight:600}}>Hotel name is required</p>}
            </div>
            <div>
              <Lbl required>Star Rating</Lbl>
              <select className="inp" {...register('starRating',{required:true})}>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
              </select>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <Lbl required>Description</Lbl>
            <textarea className="inp" {...register('description',{required:true})} rows={4} placeholder="Describe your hotel…" />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            <div><Lbl required>Contact Email</Lbl><input className="inp" {...register('contactEmail')} type="email" placeholder="hotel@email.com" /></div>
            <div><Lbl required>Phone 1</Lbl><input className="inp" {...register('phone1')} placeholder="+94 77 123 4567" /></div>
            <div><Lbl>Phone 2</Lbl><input className="inp" {...register('phone2')} placeholder="+94 11 234 5678" /></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:18,marginBottom:18}}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><Lbl required>City / Location</Lbl><input className="inp" {...register('location',{required:true})} placeholder="e.g. Colombo 03" /></div>
              <div><Lbl>Full Address</Lbl><input className="inp" {...register('address')} placeholder="77 Galle Road, Colombo 03" /></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><Lbl>Latitude</Lbl><input className="inp" {...register('coordinates.lat')} type="number" step="any" /></div>
                <div><Lbl>Longitude</Lbl><input className="inp" {...register('coordinates.lng')} type="number" step="any" /></div>
              </div>
              <div><Lbl>Status</Lbl>
                <select className="inp" value={watch('isActive')?'true':'false'} onChange={e=>setValue('isActive',e.target.value==='true')}>
                  <option value="true">Active</option><option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${T.paper4}`,height:300}}>
              <MapContainer center={[Number(latWatch)||6.9271,Number(lngWatch)||79.8612]} zoom={12} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickToPin onPick={pickPin} />
                <Marker position={[Number(latWatch)||6.9271,Number(lngWatch)||79.8612]} icon={pinIcon} />
              </MapContainer>
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <Lbl>Hotel Amenities</Lbl>
              <span style={{fontSize:11,fontWeight:700,color:T.amber,background:T.amberBg,padding:'2px 9px',borderRadius:99}}>
                {(hotelAmenitiesSelected||[]).length} selected
              </span>
            </div>
            <AmenityGrid options={amenitiesOptions} selected={hotelAmenitiesSelected||[]} onToggle={toggleAmenity} />
          </div>

          <div style={{marginBottom:20}}>
            <Lbl>Update Hotel Images</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {label:'New Main Image',multi:false,file:mainImageFile,setter:setMainImageFile},
                {label:'New Gallery Images',multi:true,file:secondaryImageFiles,setter:setSecondaryImageFiles},
              ].map(({label,multi,file,setter}) => (
                <div key={label} className={`upload-zone${(!multi&&file)||( multi&&file?.length>0)?' has-file':''}`}>
                  <Upload size={20} style={{color:T.amber,margin:'0 auto 8px'}} />
                  <p style={{fontSize:12,fontWeight:600,color:T.inkMid,marginBottom:8}}>{label}</p>
                  <input type="file" accept="image/*" multiple={multi} onChange={e=>setter(multi?Array.from(e.target.files||[]):(e.target.files?.[0]||null))} style={{fontSize:12,color:T.inkMid,maxWidth:'100%'}} />
                  {!multi && file && <p style={{fontSize:11,color:T.amber,marginTop:8,fontWeight:700}}>✓ {file.name}</p>}
                  {multi && file?.length>0 && <p style={{fontSize:11,color:T.amber,marginTop:8,fontWeight:700}}>✓ {file.length} file{file.length>1?'s':''} selected</p>}
                  {hotel.images?.[0] && !file && <p style={{fontSize:10,color:T.inkSoft,marginTop:6}}>Current image kept unless replaced</p>}
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="button" className="btn-amber" onClick={() => setStep(1)}>
              Continue to Rooms <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Rooms ── */}
      {step===1 && (
        <div className="card reveal-sm" style={{padding:26}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:22}}>
            <div>
              <h2 style={{fontSize:17,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Room Types</h2>
              <p style={{fontSize:12,color:T.inkSoft,margin:'4px 0 0'}}>Add, edit, or remove room types, pricing, facilities and images</p>
            </div>
            <button type="button" className="btn-amber" onClick={() => { append(defaultRoom); setRoomImageFiles(prev=>[...prev,null]); }}>
              <Plus size={14}/> Add Room
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {fields.map((field,idx) => {
              const room = roomsWatch?.[idx]||field;
              const p = dealPreview(room);
              return (
                <div key={field.id} className="room-card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{width:30,height:30,borderRadius:9,background:T.amberBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:T.amber}}>{idx+1}</span>
                      <span style={{fontWeight:700,fontSize:14,color:T.ink}}>{room?.roomName||`Room ${idx+1}`}</span>
                    </div>
                    {fields.length>1 && (
                      <button type="button" onClick={() => { remove(idx); setRoomImageFiles(prev=>prev.filter((_,i)=>i!==idx)); }}
                        style={{padding:'5px 12px',borderRadius:8,border:`1px solid #fca5a5`,background:'#fff5f5',color:T.red,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5,transition:'all .15s'}}
                        onMouseOver={e=>e.currentTarget.style.background='#fee2e2'}
                        onMouseOut={e=>e.currentTarget.style.background='#fff5f5'}>
                        <X size={12}/> Remove
                      </button>
                    )}
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
                    <div><Lbl required>Room Name</Lbl><input className="inp" {...register(`rooms.${idx}.roomName`,{required:true})} placeholder="Deluxe Ocean View" /></div>
                    <div><Lbl>Size (sq ft)</Lbl><input className="inp" {...register(`rooms.${idx}.roomSize`)} type="number" placeholder="250" /></div>
                    <div><Lbl>Bed Type</Lbl>
                      <select className="inp" {...register(`rooms.${idx}.bedType`)}>
                        {BED_TYPES.map(b=><option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>
                    <div><Lbl>Bed Count</Lbl><input className="inp" {...register(`rooms.${idx}.bedCount`,{valueAsNumber:true})} type="number" min={1} /></div>
                  </div>

                  <div style={{marginBottom:14}}>
                    <Lbl>Room Facilities</Lbl>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {roomFacilityOptions.map(fac => {
                        const on = (room?.roomFacilities||[]).includes(fac);
                        return (
                          <button key={fac} type="button" onClick={() => toggleRoomFacility(idx,fac)}
                            className={`chip${on?' on':''}`} style={{fontSize:12,padding:'5px 11px'}}>
                            {on?'✓ ':''}{fac}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Image */}
                  <div style={{marginBottom:14}}>
                    <Lbl>Room Image</Lbl>
                    {room?.existingImage && !roomImageFiles?.[idx] && (
                      <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                        <img src={room.existingImage} alt="existing" style={{width:60,height:44,objectFit:'cover',borderRadius:7,border:`1px solid ${T.paper4}`}} />
                        <span style={{fontSize:11,color:T.inkSoft}}>Current room image (upload new to replace)</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="inp" style={{padding:'9px 12px'}}
                      onChange={e => {
                        const f = e.target.files?.[0]||null;
                        setRoomImageFiles(prev => prev.map((x,i) => i===idx ? f : x));
                      }} />
                    {roomImageFiles?.[idx] && <p style={{fontSize:11,color:T.amber,marginTop:5,fontWeight:700}}>✓ {roomImageFiles[idx].name}</p>}
                  </div>

                  {/* Pricing */}
                  <div style={{background:'#fffbeb',border:`1.5px solid ${T.amberBg}`,borderRadius:12,padding:'16px 18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                      <p style={{fontWeight:700,fontSize:13.5,color:T.ink,margin:0}}>💰 Pricing</p>
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                        <input type="checkbox" {...register(`rooms.${idx}.hasHotDeal`)} style={{accentColor:T.amber,width:14,height:14}} />
                        <span style={{fontSize:12.5,fontWeight:600,color:T.inkMid}}>Hot Deal</span>
                        {room?.hasHotDeal && <span style={{fontSize:10,background:'#fee2e2',color:T.red,padding:'2px 8px',borderRadius:99,fontWeight:800}}>🔥 ON</span>}
                      </label>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div><Lbl required>Base Price / Night (LKR)</Lbl><input className="inp" {...register(`rooms.${idx}.basePricePerNight`,{required:true})} type="number" placeholder="32000" /></div>
                      <div>
                        <Lbl>Price Preview</Lbl>
                        <div style={{padding:'10px 14px',borderRadius:9,background:'#fff',border:`1.5px solid ${T.amberBg}`,display:'flex',alignItems:'center',gap:10}}>
                          {room?.hasHotDeal && p.original>0 && <span style={{fontSize:12,textDecoration:'line-through',color:T.inkSoft,fontWeight:600}}>{LKR(p.original)}</span>}
                          <span style={{fontSize:14,fontWeight:800,color:room?.hasHotDeal?T.amber:T.ink}}>{LKR(p.final)}</span>
                        </div>
                      </div>
                    </div>
                    {room?.hasHotDeal && (
                      <div style={{marginTop:12}}>
                        <div style={{display:'flex',gap:7,marginBottom:10}}>
                          {[{v:'percentage',l:'% Off'},{v:'value',l:'Fixed Amount'}].map(opt => (
                            <button key={opt.v} type="button" onClick={() => setValue(`rooms.${idx}.dealType`,opt.v)}
                              style={{padding:'6px 14px',borderRadius:8,border:`1.5px solid ${room?.dealType===opt.v?T.amberLt:T.paper4}`,background:room?.dealType===opt.v?T.amberBg:T.paper2,color:room?.dealType===opt.v?T.amber:T.inkMid,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        {room?.dealType==='percentage' ? (
                          <div style={{maxWidth:180}}><Lbl>Discount %</Lbl><input className="inp" {...register(`rooms.${idx}.discountPercentage`)} type="number" min={0} max={100} placeholder="20" /></div>
                        ) : (
                          <div style={{maxWidth:180}}><Lbl>Discount (LKR)</Lbl><input className="inp" {...register(`rooms.${idx}.discountValue`)} type="number" min={0} placeholder="5000" /></div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{fontSize:11,color:T.inkSoft,marginTop:10}}>
                    Estimated capacity: <strong style={{color:T.inkMid}}>{getCapacityFromBed(room?.bedType,room?.bedCount)} guests</strong>
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:20,flexWrap:'wrap',gap:12}}>
            <button type="button" className="btn-ghost" onClick={() => setStep(0)}><ChevronLeft size={14}/>Back</button>
            <button type="button" className="btn-amber" onClick={() => setStep(2)}>Review Changes <ChevronRight size={14}/></button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review ── */}
      {step===2 && (
        <div className="card reveal-sm" style={{padding:26}}>
          <h2 style={{fontSize:17,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:'0 0 20px'}}>Review & Save</h2>

          <div style={{background:T.paper2,border:`1px solid ${T.paper4}`,borderRadius:12,padding:'18px 20px',marginBottom:14}}>
            <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 14px'}}>Hotel Summary</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
              {[
                ['Hotel Name', watch('hotelName')||'—'],
                ['Location', watch('location')||'—'],
                ['Stars', `${'★'.repeat(Number(watch('starRating')||5))}`],
                ['Email', watch('contactEmail')||'—'],
                ['Phone', watch('phone1')||'—'],
                ['Amenities', `${(watch('hotelAmenities')||[]).length} selected`],
                ['Status', watch('isActive') ? 'Active' : 'Inactive'],
              ].map(([k,v]) => (
                <div key={k}>
                  <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 4px'}}>{k}</p>
                  <p style={{fontSize:13,fontWeight:700,color:T.ink,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:T.paper2,border:`1px solid ${T.paper4}`,borderRadius:12,overflow:'hidden',marginBottom:18}}>
            <div style={{padding:'12px 18px',borderBottom:`1px solid ${T.paper4}`,background:T.paper3}}>
              <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Rooms ({fields.length})</p>
            </div>
            {fields.map((f,idx) => {
              const room = roomsWatch?.[idx]||f;
              const p = dealPreview(room);
              return (
                <div key={f.id} style={{padding:'12px 18px',borderBottom:`1px solid ${T.paper3}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:13.5,color:T.ink,margin:'0 0 3px'}}>{room?.roomName||`Room ${idx+1}`}</p>
                    <p style={{fontSize:11,color:T.inkSoft,margin:0}}>{room?.bedType} · {room?.bedCount} bed · {getCapacityFromBed(room?.bedType,room?.bedCount)} guests</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {room?.hasHotDeal && <p style={{fontSize:11,textDecoration:'line-through',color:T.inkSoft,margin:'0 0 2px'}}>{LKR(p.original)}</p>}
                    <p style={{fontSize:14,fontWeight:800,color:T.amber,margin:0}}>{LKR(p.final)}<span style={{fontSize:11,color:T.inkSoft,fontWeight:500}}>/night</span></p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Checklist */}
          <div style={{background:'#f0fdf4',border:`1px solid #bbf7d0`,borderRadius:12,padding:'14px 16px',marginBottom:20}}>
            <p style={{fontSize:10,fontWeight:700,color:'#15803d',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>✅ Checklist</p>
            {[
              [!!watch('hotelName'),'Hotel name provided'],
              [!!watch('location'),'Location set'],
              [(watch('hotelAmenities')||[]).length>0,'Amenities selected'],
              [fields.length>0,'At least one room'],
              [fields.every((_,i)=>Number(watch(`rooms.${i}.basePricePerNight`))>0),'All rooms have pricing'],
            ].map(([ok,lbl]) => (
              <div key={lbl} style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
                <span style={{width:16,height:16,borderRadius:'50%',background:ok?'#d1fae5':'#fee2e2',border:`1px solid ${ok?'#6ee7b7':'#fca5a5'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {ok
                    ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  }
                </span>
                <span style={{fontSize:12.5,fontWeight:600,color:ok?T.inkMid:'#991b1b'}}>{lbl}</span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={14}/>Back to Rooms</button>
            <div style={{display:'flex',gap:10}}>
              <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
              <button type="submit" disabled={saving} className="btn-amber" style={{padding:'11px 28px'}}>
                {saving
                  ? <><span className="spin" style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',display:'block'}}/>Saving…</>
                  : <><CheckCircle size={15}/>Save All Changes</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

/* ══════════════════════════════════════════
   ADD HOTEL FORM
══════════════════════════════════════════ */
function AddHotelForm({ amenitiesOptions, roomFacilityOptions, onHotelPublished }) {
  const [step, setStep] = useState(0);
  const [publishLoading, setPublishLoading] = useState(false);

  const defaultRoom = { roomName:'', roomSize:'', bedType:'double', bedCount:1, roomFacilities:[], basePricePerNight:'', hasHotDeal:false, dealType:'percentage', discountPercentage:'', discountValue:'' };

  const { register, control, handleSubmit, watch, setValue, formState:{errors} } = useForm({
    defaultValues: { hotelName:'', description:'', location:'', address:'', coordinates:{lat:6.9271,lng:79.8612}, starRating:5, contactEmail:'', phone1:'', phone2:'', hotelAmenities:[], rooms:[defaultRoom] }
  });

  const { fields, append, remove } = useFieldArray({ control, name:'rooms' });
  const roomsWatch = watch('rooms');
  const latWatch = watch('coordinates.lat');
  const lngWatch = watch('coordinates.lng');
  const hotelAmenitiesSelected = watch('hotelAmenities');

  const [mainImageFile, setMainImageFile] = useState(null);
  const [secondaryImageFiles, setSecondaryImageFiles] = useState([]);
  const [roomImageFiles, setRoomImageFiles] = useState([null]);

  useEffect(() => {
    setRoomImageFiles(prev => {
      const next = Array.from({length: fields.length}, (_,i) => prev[i]||null);
      return next;
    });
  }, [fields.length]);

  const toggleAmenity = a => {
    const cur = new Set(watch('hotelAmenities')||[]);
    cur.has(a) ? cur.delete(a) : cur.add(a);
    setValue('hotelAmenities', Array.from(cur));
  };

  const toggleRoomFacility = (idx, fac) => {
    const cur = new Set(watch(`rooms.${idx}.roomFacilities`)||[]);
    cur.has(fac) ? cur.delete(fac) : cur.add(fac);
    setValue(`rooms.${idx}.roomFacilities`, Array.from(cur));
  };

  const pickPin = c => { setValue('coordinates.lat', c.lat); setValue('coordinates.lng', c.lng); };

  const publishHotel = async values => {
    for (let i = 0; i < fields.length; i++) {
      if (!roomImageFiles?.[i]) { toast.error(`Please upload an image for Room ${i+1}`); return; }
    }
    if (!mainImageFile) { toast.error('Please upload a main hotel image'); return; }

    const computedRooms = (values.rooms||[]).map(r => {
      const p = dealPreview(r);
      return {
        type: r.roomName, pricePerNight: p.final, originalPricePerNight: p.original,
        hasHotDeal: !!r.hasHotDeal,
        discountPercentage: r.dealType==='percentage' ? Number(r.discountPercentage||0) : undefined,
        discountValue: r.dealType==='value' ? Number(r.discountValue||0) : undefined,
        capacity: getCapacityFromBed(r.bedType, r.bedCount), count:1,
        roomSize: r.roomSize ? Number(r.roomSize) : undefined,
        bedType: r.bedType, bedCount: Number(r.bedCount||1),
        amenities: (r.roomFacilities||[]).filter(Boolean), images:[],
      };
    });

    const minP = computedRooms.map(r => Number(r.pricePerNight||0)).filter(n => n>0);
    const payload = {
      name: values.hotelName, description: values.description,
      location: values.location, address: values.address||values.location,
      starRating: Number(values.starRating||5), phone: values.phone1||'', email: values.contactEmail||'',
      coordinates: { lat: Number(latWatch), lng: Number(lngWatch) },
      amenities: values.hotelAmenities||[], rooms: computedRooms,
      pricePerNight: minP.length ? Math.min(...minP) : 0, discount:0, isActive:true,
    };

    const fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    [mainImageFile,...(secondaryImageFiles||[])].filter(Boolean).forEach(f => fd.append('images', f));
    roomImageFiles.slice(0, computedRooms.length).forEach(f => { if (f) fd.append('roomImages', f); });

    setPublishLoading(true);
    try {
      await api.post('/hotels', fd, {headers:{'Content-Type':'multipart/form-data'}});
      await onHotelPublished?.();
    } catch(err) { toast.error(err.response?.data?.message||'Failed to publish hotel'); }
    finally { setPublishLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit(publishHotel)} style={{display:'flex',flexDirection:'column',gap:18}}>
      <div className="card" style={{padding:'18px 22px'}}>
        <StepBar step={step} steps={STEPS_ADD} />
        <div style={{display:'flex',gap:8}}>
          {STEPS_ADD.map((lbl,i) => (
            <button key={lbl} type="button" onClick={() => setStep(i)}
              style={{padding:'8px 18px',borderRadius:9,border:`1.5px solid ${step===i?'#fde68a':T.paper4}`,background:step===i?'#fffbeb':T.paper2,color:step===i?T.amber:T.inkMid,fontWeight:700,fontSize:12.5,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .18s'}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 0 */}
      {step===0 && (
        <div className="card reveal-sm" style={{padding:26}}>
          <h2 style={{fontSize:17,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:'0 0 20px'}}>Hotel Information</h2>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div>
              <Lbl required>Hotel Name</Lbl>
              <input className="inp" {...register('hotelName',{required:true})} placeholder="e.g. Cinnamon Grand Colombo" />
              {errors.hotelName && <p style={{color:T.red,fontSize:11,marginTop:4,fontWeight:600}}>Required</p>}
            </div>
            <div>
              <Lbl required>Star Rating</Lbl>
              <select className="inp" {...register('starRating')}>
                {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Star{n>1?'s':''}</option>)}
              </select>
            </div>
          </div>

          <div style={{marginBottom:14}}>
            <Lbl required>Description</Lbl>
            <textarea className="inp" {...register('description',{required:true})} rows={4} placeholder="Describe your hotel…" />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            <div><Lbl required>Contact Email</Lbl><input className="inp" {...register('contactEmail')} type="email" placeholder="hotel@email.com" /></div>
            <div><Lbl required>Phone 1</Lbl><input className="inp" {...register('phone1')} placeholder="+94 77 123 4567" /></div>
            <div><Lbl>Phone 2</Lbl><input className="inp" {...register('phone2')} placeholder="+94 11 234 5678" /></div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:18,marginBottom:18}}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><Lbl required>City / Location</Lbl><input className="inp" {...register('location',{required:true})} placeholder="e.g. Colombo 03" /></div>
              <div><Lbl>Full Address</Lbl><input className="inp" {...register('address')} placeholder="77 Galle Road, Colombo 03" /></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><Lbl>Latitude</Lbl><input className="inp" {...register('coordinates.lat')} type="number" step="any" /></div>
                <div><Lbl>Longitude</Lbl><input className="inp" {...register('coordinates.lng')} type="number" step="any" /></div>
              </div>
              <div style={{background:T.amberBg,border:`1px solid #fde68a`,borderRadius:10,padding:'10px 13px'}}>
                <p style={{fontSize:10,fontWeight:700,color:T.amber,textTransform:'uppercase',margin:'0 0 3px',letterSpacing:'0.1em'}}>💡 Map Tip</p>
                <p style={{fontSize:12,color:T.inkMid,margin:0,lineHeight:1.6}}>Click the map to set exact coordinates.</p>
              </div>
            </div>
            <div style={{borderRadius:12,overflow:'hidden',border:`1px solid ${T.paper4}`,height:300}}>
              <MapContainer center={[Number(latWatch)||6.9271,Number(lngWatch)||79.8612]} zoom={12} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickToPin onPick={pickPin} />
                <Marker position={[Number(latWatch)||6.9271,Number(lngWatch)||79.8612]} icon={pinIcon} />
              </MapContainer>
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <Lbl>Hotel Amenities</Lbl>
              <span style={{fontSize:11,fontWeight:700,color:T.amber,background:T.amberBg,padding:'2px 9px',borderRadius:99}}>
                {(hotelAmenitiesSelected||[]).length} selected
              </span>
            </div>
            <AmenityGrid options={amenitiesOptions} selected={hotelAmenitiesSelected||[]} onToggle={toggleAmenity} />
          </div>

          <div style={{marginBottom:20}}>
            <Lbl>Hotel Images</Lbl>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {label:'Main Image *',multi:false,file:mainImageFile,setter:setMainImageFile},
                {label:'Gallery Images',multi:true,file:secondaryImageFiles,setter:setSecondaryImageFiles},
              ].map(({label,multi,file,setter}) => (
                <div key={label} className={`upload-zone${(!multi&&file)||(multi&&file?.length>0)?' has-file':''}`}>
                  <Upload size={20} style={{color:T.amber,margin:'0 auto 8px'}} />
                  <p style={{fontSize:12,fontWeight:600,color:T.inkMid,marginBottom:8}}>{label}</p>
                  <input type="file" accept="image/*" multiple={multi} onChange={e=>setter(multi?Array.from(e.target.files||[]):(e.target.files?.[0]||null))} style={{fontSize:12,color:T.inkMid,maxWidth:'100%'}} />
                  {!multi && file && <p style={{fontSize:11,color:T.amber,marginTop:8,fontWeight:700}}>✓ {file.name}</p>}
                  {multi && file?.length>0 && <p style={{fontSize:11,color:T.amber,marginTop:8,fontWeight:700}}>✓ {file.length} file{file.length>1?'s':''} selected</p>}
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button type="button" className="btn-amber" onClick={() => setStep(1)}>
              Continue to Rooms <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 */}
      {step===1 && (
        <div className="card reveal-sm" style={{padding:26}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:22}}>
            <div>
              <h2 style={{fontSize:17,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:0}}>Room Types</h2>
              <p style={{fontSize:12,color:T.inkSoft,margin:'4px 0 0'}}>Define your room types with pricing and facilities</p>
            </div>
            <button type="button" className="btn-amber" onClick={() => { append(defaultRoom); setRoomImageFiles(prev=>[...prev,null]); }}>
              <Plus size={14}/> Add Room
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {fields.map((field,idx) => {
              const room = roomsWatch?.[idx]||field;
              const p = dealPreview(room);
              return (
                <div key={field.id} className="room-card">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{width:30,height:30,borderRadius:9,background:T.amberBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:T.amber}}>{idx+1}</span>
                      <span style={{fontWeight:700,fontSize:14,color:T.ink}}>{room?.roomName||`Room ${idx+1}`}</span>
                    </div>
                    {fields.length>1 && (
                      <button type="button" onClick={() => { remove(idx); setRoomImageFiles(prev=>prev.filter((_,i)=>i!==idx)); }}
                        style={{padding:'5px 12px',borderRadius:8,border:`1px solid #fca5a5`,background:'#fff5f5',color:T.red,fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5,transition:'all .15s'}}
                        onMouseOver={e=>e.currentTarget.style.background='#fee2e2'}
                        onMouseOut={e=>e.currentTarget.style.background='#fff5f5'}>
                        <X size={12}/> Remove
                      </button>
                    )}
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
                    <div><Lbl required>Room Name</Lbl><input className="inp" {...register(`rooms.${idx}.roomName`,{required:true})} placeholder="Deluxe Ocean View" /></div>
                    <div><Lbl>Size (sq ft)</Lbl><input className="inp" {...register(`rooms.${idx}.roomSize`)} type="number" placeholder="250" /></div>
                    <div><Lbl>Bed Type</Lbl>
                      <select className="inp" {...register(`rooms.${idx}.bedType`)}>
                        {BED_TYPES.map(b=><option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>
                    <div><Lbl>Bed Count</Lbl><input className="inp" {...register(`rooms.${idx}.bedCount`,{valueAsNumber:true})} type="number" min={1} /></div>
                  </div>

                  <div style={{marginBottom:14}}>
                    <Lbl>Room Facilities</Lbl>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {roomFacilityOptions.map(fac => {
                        const on = (room?.roomFacilities||[]).includes(fac);
                        return (
                          <button key={fac} type="button" onClick={() => toggleRoomFacility(idx,fac)}
                            className={`chip${on?' on':''}`} style={{fontSize:12,padding:'5px 11px'}}>
                            {on?'✓ ':''}{fac}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{marginBottom:14}}>
                    <Lbl required>Room Image</Lbl>
                    <input type="file" accept="image/*" className="inp" style={{padding:'9px 12px'}}
                      onChange={e => {
                        const f = e.target.files?.[0]||null;
                        setRoomImageFiles(prev => prev.map((x,i) => i===idx ? f : x));
                      }} />
                    {roomImageFiles?.[idx] && <p style={{fontSize:11,color:T.amber,marginTop:5,fontWeight:700}}>✓ {roomImageFiles[idx].name}</p>}
                  </div>

                  <div style={{background:'#fffbeb',border:`1.5px solid ${T.amberBg}`,borderRadius:12,padding:'16px 18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                      <p style={{fontWeight:700,fontSize:13.5,color:T.ink,margin:0}}>💰 Pricing</p>
                      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                        <input type="checkbox" {...register(`rooms.${idx}.hasHotDeal`)} style={{accentColor:T.amber,width:14,height:14}} />
                        <span style={{fontSize:12.5,fontWeight:600,color:T.inkMid}}>Hot Deal</span>
                        {room?.hasHotDeal && <span style={{fontSize:10,background:'#fee2e2',color:T.red,padding:'2px 8px',borderRadius:99,fontWeight:800}}>🔥 ON</span>}
                      </label>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div><Lbl required>Base Price / Night (LKR)</Lbl><input className="inp" {...register(`rooms.${idx}.basePricePerNight`,{required:true})} type="number" placeholder="32000" /></div>
                      <div>
                        <Lbl>Preview</Lbl>
                        <div style={{padding:'10px 14px',borderRadius:9,background:'#fff',border:`1.5px solid ${T.amberBg}`,display:'flex',alignItems:'center',gap:10}}>
                          {room?.hasHotDeal && p.original>0 && <span style={{fontSize:12,textDecoration:'line-through',color:T.inkSoft}}>{LKR(p.original)}</span>}
                          <span style={{fontSize:14,fontWeight:800,color:room?.hasHotDeal?T.amber:T.ink}}>{LKR(p.final)}</span>
                        </div>
                      </div>
                    </div>
                    {room?.hasHotDeal && (
                      <div style={{marginTop:12}}>
                        <div style={{display:'flex',gap:7,marginBottom:10}}>
                          {[{v:'percentage',l:'% Off'},{v:'value',l:'Fixed Amount'}].map(opt => (
                            <button key={opt.v} type="button" onClick={() => setValue(`rooms.${idx}.dealType`,opt.v)}
                              style={{padding:'6px 14px',borderRadius:8,border:`1.5px solid ${room?.dealType===opt.v?T.amberLt:T.paper4}`,background:room?.dealType===opt.v?T.amberBg:T.paper2,color:room?.dealType===opt.v?T.amber:T.inkMid,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                              {opt.l}
                            </button>
                          ))}
                        </div>
                        {room?.dealType==='percentage' ? (
                          <div style={{maxWidth:180}}><Lbl>Discount %</Lbl><input className="inp" {...register(`rooms.${idx}.discountPercentage`)} type="number" min={0} max={100} placeholder="20" /></div>
                        ) : (
                          <div style={{maxWidth:180}}><Lbl>Discount (LKR)</Lbl><input className="inp" {...register(`rooms.${idx}.discountValue`)} type="number" min={0} placeholder="5000" /></div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{fontSize:11,color:T.inkSoft,marginTop:10}}>Estimated capacity: <strong style={{color:T.inkMid}}>{getCapacityFromBed(room?.bedType,room?.bedCount)} guests</strong></p>
                </div>
              );
            })}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',marginTop:20,flexWrap:'wrap',gap:12}}>
            <button type="button" className="btn-ghost" onClick={() => setStep(0)}><ChevronLeft size={14}/>Back</button>
            <button type="button" className="btn-amber" onClick={() => setStep(2)}>Review & Publish <ChevronRight size={14}/></button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step===2 && (
        <div className="card reveal-sm" style={{padding:26}}>
          <h2 style={{fontSize:17,fontWeight:400,fontFamily:"'Instrument Serif',serif",fontStyle:'italic',color:T.ink,margin:'0 0 20px'}}>Review & Publish</h2>

          <div style={{background:T.paper2,border:`1px solid ${T.paper4}`,borderRadius:12,padding:'18px 20px',marginBottom:14}}>
            <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 14px'}}>Hotel Summary</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
              {[
                ['Name',watch('hotelName')||'—'],['Location',watch('location')||'—'],
                ['Stars',`${'★'.repeat(Number(watch('starRating')||5))}`],
                ['Email',watch('contactEmail')||'—'],['Phone',watch('phone1')||'—'],
                ['Amenities',`${(watch('hotelAmenities')||[]).length} selected`],
              ].map(([k,v]) => (
                <div key={k}>
                  <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 3px'}}>{k}</p>
                  <p style={{fontSize:13,fontWeight:700,color:T.ink,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:T.paper2,border:`1px solid ${T.paper4}`,borderRadius:12,overflow:'hidden',marginBottom:16}}>
            <div style={{padding:'11px 18px',borderBottom:`1px solid ${T.paper4}`,background:T.paper3}}>
              <p style={{fontSize:10,fontWeight:700,color:T.inkSoft,textTransform:'uppercase',letterSpacing:'0.1em',margin:0}}>Rooms ({fields.length})</p>
            </div>
            {fields.map((f,idx) => {
              const room = roomsWatch?.[idx]||f;
              const p = dealPreview(room);
              return (
                <div key={f.id} style={{padding:'11px 18px',borderBottom:`1px solid ${T.paper3}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:13.5,color:T.ink,margin:'0 0 2px'}}>{room?.roomName||`Room ${idx+1}`}</p>
                    <p style={{fontSize:11,color:T.inkSoft,margin:0}}>{room?.bedType} · {room?.bedCount} bed · {getCapacityFromBed(room?.bedType,room?.bedCount)} guests</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {room?.hasHotDeal && <p style={{fontSize:11,textDecoration:'line-through',color:T.inkSoft,margin:'0 0 2px'}}>{LKR(p.original)}</p>}
                    <p style={{fontSize:14,fontWeight:800,color:T.amber,margin:0}}>{LKR(p.final)}<span style={{fontSize:11,color:T.inkSoft,fontWeight:500}}>/night</span></p>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{background:'#f0fdf4',border:`1px solid #bbf7d0`,borderRadius:12,padding:'14px 16px',marginBottom:20}}>
            <p style={{fontSize:10,fontWeight:700,color:'#15803d',textTransform:'uppercase',letterSpacing:'0.1em',margin:'0 0 10px'}}>✅ Pre-publish Checklist</p>
            {[
              [!!watch('hotelName'),'Hotel name provided'],
              [!!mainImageFile,'Main image uploaded'],
              [(watch('hotelAmenities')||[]).length>0,'At least one amenity'],
              [fields.length>0,'At least one room'],
              [fields.every((_,i)=>Number(watch(`rooms.${i}.basePricePerNight`))>0),'All rooms have pricing'],
              [fields.every((_,i)=>!!roomImageFiles?.[i]),'All rooms have images'],
            ].map(([ok,lbl]) => (
              <div key={lbl} style={{display:'flex',alignItems:'center',gap:9,marginBottom:6}}>
                <span style={{width:16,height:16,borderRadius:'50%',background:ok?'#d1fae5':'#fee2e2',border:`1px solid ${ok?'#6ee7b7':'#fca5a5'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {ok
                    ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  }
                </span>
                <span style={{fontSize:12.5,fontWeight:600,color:ok?T.inkMid:'#991b1b'}}>{lbl}</span>
              </div>
            ))}
          </div>

          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
            <button type="button" className="btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={14}/>Back to Rooms</button>
            <button type="submit" disabled={publishLoading} className="btn-amber" style={{padding:'11px 28px'}}>
              {publishLoading
                ? <><span className="spin" style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'#fff',borderRadius:'50%',display:'block'}}/>Publishing…</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7"/></svg>Publish Hotel</>
              }
            </button>
          </div>
        </div>
      )}
    </form>
  );
}