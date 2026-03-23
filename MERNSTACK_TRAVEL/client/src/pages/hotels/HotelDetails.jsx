import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Star, MapPin, Phone, Mail, Globe,
  ChevronDown, ChevronUp, CalendarDays, Users,
  Tag, CheckCircle, ShieldCheck, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';

/* ─────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes shimmer  { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
  @keyframes progressFill { from{width:0} to{width:var(--w)} }
  @keyframes heartBeat { 0%,100%{transform:scale(1)} 30%{transform:scale(1.45)} 60%{transform:scale(.9)} }
  @keyframes starPop { 0%{transform:scale(1)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }

  .hd-page { font-family:'DM Sans',sans-serif; background:#f4f5f7; min-height:100vh; color:#111827; }
  .hd-shimmer { background:linear-gradient(90deg,#efefef 25%,#e0e0e0 50%,#efefef 75%); background-size:700px 100%; animation:shimmer 1.6s infinite; border-radius:12px; }
  .hd-card { background:#fff; border-radius:20px; border:1px solid #e5e7eb; }
  .hd-fade-up { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
  .hd-scale-in { animation:scaleIn .45s cubic-bezier(.22,1,.36,1) both; }

  /* Gallery zoom */
  .gallery-cell img { transition:transform .55s cubic-bezier(.22,1,.36,1); }
  /* Thumbnail gold bar on hover */
  .gallery-cell:hover .thumb-bar { transform: scaleX(1) !important; }
  .gallery-cell:hover img { transform: scale(1.06); }

  /* Room card active ring */
  .room-active { border:2px solid #f59e0b !important; box-shadow:0 0 0 4px rgba(245,158,11,.14) !important; }

  /* Smooth progress bars */
  .prog-bar { animation:progressFill .8s cubic-bezier(.22,1,.36,1) both; }

  /* Booking widget on mobile */
  @media (max-width:1023px) {
    .booking-widget { position:fixed; bottom:0; left:0; right:0; z-index:50; border-radius:24px 24px 0 0 !important; box-shadow:0 -8px 40px rgba(0,0,0,.18) !important; max-height:70vh; overflow-y:auto; }
  }

  /* Star rating interactive */
  .star-rating-input {
    cursor:pointer;
    transition:transform .15s ease;
  }
  .star-rating-input:hover {
    transform:scale(1.15);
  }
`;

/* ─── THEME ─── */
const T = {
  navy:'#1a1a2e', navyMid:'#16213e',
  gold:'#f59e0b', goldDk:'#d97706', goldLt:'#fbbf24',
  goldBg:'#fffbeb', goldBorder:'#fcd34d',
  emerald:'#059669', emeraldBg:'#ecfdf5',
  red:'#ef4444',
  text:'#111827', textMid:'#374151', textLight:'#6b7280',
  border:'#e5e7eb', bg:'#f4f5f7',
  shadow:'0 2px 12px rgba(0,0,0,0.07)',
  shadowMd:'0 8px 28px rgba(0,0,0,0.10)',
  shadowHov:'0 20px 50px rgba(0,0,0,0.14)',
};

/* ─── MAP ICON ─── */
const goldIcon = new L.Icon({
  iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[30,48], iconAnchor:[15,48], popupAnchor:[1,-40],
});

/* ─── HELPERS ─── */
function clampText(t, n) { if(!t) return ''; return t.length<=n ? t : `${t.slice(0,n).trim()}…`; }
function isoFromDate(d) { const c=new Date(d); c.setHours(12,0,0,0); return c.toISOString().slice(0,10); }
function nightsBetween(ci, co) {
  if(!ci||!co) return 0;
  const diff = new Date(`${co}T12:00:00`) - new Date(`${ci}T12:00:00`);
  const n = Math.floor(diff/(1000*60*60*24));
  return n>0?n:0;
}
function LKR(v) { return `LKR ${Number(v||0).toLocaleString()}`; }

/* ─── SKELETON ─── */
function Sk({ w='100%', h=16, r=10, style={} }) {
  return <div className="hd-shimmer" style={{width:w,height:h,borderRadius:r,...style}} />;
}

/* ─── STAR ROW ─── */
function StarRow({ n }) {
  const full = Math.floor(n||0);
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <span style={{color:T.gold,fontSize:15,letterSpacing:1}}>
        {'★'.repeat(full)}{'☆'.repeat(5-full)}
      </span>
      <span style={{fontSize:12,fontWeight:800,color:T.goldDk,background:T.goldBg,border:`1px solid ${T.goldBorder}`,padding:'3px 10px',borderRadius:99}}>
        {(n||0).toFixed(1)} Star Hotel
      </span>
    </div>
  );
}

/* ─── PROGRESS BAR ─── */
function ProgressBar({ label, value }) {
  const pct = Math.max(0,Math.min(100,(Number(value||0)/10)*100));
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontSize:12,fontWeight:700,color:T.textMid}}>{label}</span>
        <span style={{fontSize:12,fontWeight:900,color:T.text}}>{Number(value||0).toFixed(1)}</span>
      </div>
      <div style={{height:6,borderRadius:99,background:'#f3f4f6',overflow:'hidden'}}>
        <div className="prog-bar" style={{height:'100%',borderRadius:99,background:`linear-gradient(90deg,${T.gold},${T.goldDk})`,width:`${pct}%`,'--w':`${pct}%`}} />
      </div>
    </div>
  );
}

/* ─── GALLERY MODAL ─── */
function GalleryModal({ open, images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex||0);
  useEffect(() => {
    if(!open) return;
    const h = e => {
      if(e.key==='Escape') onClose?.();
      if(e.key==='ArrowLeft') setIdx(p=>(p-1+images.length)%images.length);
      if(e.key==='ArrowRight') setIdx(p=>(p+1)%images.length);
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[open,images.length,onClose]);
  if(!open) return null;

  return (
    <div
      onClick={e=>{ if(e.target===e.currentTarget) onClose?.(); }}
      style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.88)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'fadeIn .25s ease'}}
    >
      <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.12)',border:'none',color:'#fff',width:40,height:40,borderRadius:'50%',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .2s'}}
        onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.22)';}}
        onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';}}
      >✕</button>

      <div style={{width:'100%',maxWidth:960,animation:'scaleIn .3s cubic-bezier(.22,1,.36,1)'}}>
        <div style={{borderRadius:20,overflow:'hidden',background:'#000',position:'relative'}}>
          <img src={images[idx]} alt="" style={{width:'100%',height:'68vh',objectFit:'cover',display:'block'}} />
          <div style={{position:'absolute',bottom:16,left:16,right:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            {['← Prev','Next →'].map((lbl,i)=>(
              <button key={lbl} onClick={()=>setIdx(p=>i===0?(p-1+images.length)%images.length:(p+1)%images.length)}
                style={{background:'rgba(255,255,255,0.12)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',padding:'8px 20px',borderRadius:99,fontWeight:700,fontSize:13,cursor:'pointer',transition:'background .2s'}}
                onMouseOver={e=>{e.currentTarget.style.background=`rgba(245,158,11,.35)`;}}
                onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';}}
              >{lbl}</button>
            ))}
            <span style={{color:'rgba(255,255,255,0.75)',fontWeight:700,fontSize:13}}>{idx+1} / {images.length}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10,overflowX:'auto',paddingBottom:4}}>
          {images.map((src,i)=>(
            <button key={i} onClick={()=>setIdx(i)} style={{flexShrink:0,width:80,height:54,borderRadius:10,overflow:'hidden',border:`2px solid ${i===idx?T.gold:'transparent'}`,padding:0,cursor:'pointer',transition:'border-color .2s'}}>
              <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────── */
export default function HotelDetails() {
  const { id: hotelId } = useParams();
  const [loading, setLoading]         = useState(true);
  const [hotelData, setHotelData]     = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx]   = useState(0);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [wishlisted, setWishlisted]   = useState(false);

  const today = useMemo(()=>new Date(),[]);
  const defaultCheckIn  = useMemo(()=>isoFromDate(new Date(today.getTime()+86400000)),[today]);
  const defaultCheckOut = useMemo(()=>isoFromDate(new Date(today.getTime()+3*86400000)),[today]);

  const [checkIn,  setCheckIn]  = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const guestsRef = useRef(null);
  const locationRef = useRef(null);

  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(()=>{
    const h=e=>{ if(guestsOpen && guestsRef.current && !guestsRef.current.contains(e.target)) setGuestsOpen(false); };
    window.addEventListener('mousedown',h);
    return()=>window.removeEventListener('mousedown',h);
  },[guestsOpen]);

  /* Mock data */
  const mockHotelData = useMemo(()=>({
    _id:hotelId||'mock-1',
    name:'Cinnamon Grand Colombo',
    starRating:5,
    locationLabel:'Colombo 03, Western Province',
    address:'77 Galle Road, Colombo 03, Sri Lanka',
    district:'Colombo 03',
    phone:'+94 11 234 5678',
    email:'reservations@cinnamon-grand.example',
    website:'https://example.com/cinnamon-grand',
    checkInTime:'14:00',
    checkOutTime:'12:00',
    coordinates:{ lat:6.9337, lng:79.8511 },
    images:[
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400',
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=1400',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1400',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400',
      'https://images.unsplash.com/photo-1501117716987-c8e2a2f0c5a6?w=1400',
    ],
    quickAmenities:['Free WiFi','Spa','Pool','Breakfast Included','Gym'],
    amenities:['Free WiFi','Pool','Spa','Gym','Restaurant','Free Parking','Room Service','Air Conditioning','Concierge','Family Friendly','Business Center','24/7 Reception'],
    description:'Set in the heart of Colombo, Cinnamon Grand Colombo blends sophisticated design with warm Sri Lankan hospitality. Guests enjoy spacious rooms, world-class dining, and a calm spa experience after a day in the city. Whether you are visiting for business or leisure, you will find thoughtful service and comfortable amenities throughout your stay.',
    rooms:[
      { _id:'room-deluxe-king', type:'Deluxe King', capacity:{adults:2,children:1}, bedType:'King Bed', amenities:['City view','Workspace','Soundproofed','Rain shower'], pricePerNight:32000, images:['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900'] },
      { _id:'room-superior-twin', type:'Superior Twin', capacity:{adults:2,children:2}, bedType:'Twin Beds', amenities:['Balcony','Free WiFi','Premium linens','Tea/coffee maker'], pricePerNight:27000, images:['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=900'] },
      { _id:'room-family-suite', type:'Family Suite', capacity:{adults:3,children:3}, bedType:'1 King + 1 Sofa Bed', amenities:['Separate lounge','Microwave','Extra storage','Kids welcome kit'], pricePerNight:45000, images:['https://images.unsplash.com/photo-1551887373-6b5bd7c0d4f7?w=900'] },
    ],
    cleaningFeePerStay:2500,
    serviceFeePerStay:3200,
    reviews:[
      { _id:'r1', userName:'Nuwan Perera',     userAvatar:'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200', createdAt:new Date('2026-02-18'), rating:5, comment:'Excellent service and very clean rooms. The breakfast spread was fantastic and the staff were genuinely helpful.' },
      { _id:'r2', userName:'Sasika Jayasinghe',userAvatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', createdAt:new Date('2026-01-29'), rating:4, comment:'Great location and comfortable beds. Would love more variety in the evening dining options, but overall a great stay.' },
      { _id:'r3', userName:'Chamath Silva',    userAvatar:'https://images.unsplash.com/photo-1550525811-e5869dd03032?w=200', createdAt:new Date('2025-12-07'), rating:5, comment:'Smooth check-in and super friendly concierge. The spa experience was amazing—highly recommend.' },
      { _id:'r4', userName:'Tharushi Fernando',userAvatar:'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=200', createdAt:new Date('2025-11-12'), rating:4, comment:'Good value for money with excellent cleanliness. Location made it easy to explore the city.' },
      { _id:'r5', userName:'Malaka Bandara',   userAvatar:'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=200', createdAt:new Date('2025-10-03'), rating:5, comment:'Rooms are spacious and quiet. WiFi was strong and the team responded quickly to our requests.' },
    ],
    reviewSummary:{ averageRating:9.4, reviewCount:512, subCategories:[{key:'Cleanliness',rating:9.6},{key:'Comfort',rating:9.3},{key:'Location',rating:9.7}] },
    nearbyAttractions:[
      { name:'Galle Face Green', distanceKm:1.8 },
      { name:'Dutch Hospital Shopping Precinct', distanceKm:2.6 },
      { name:'Colombo National Museum', distanceKm:4.1 },
    ],
  }),[hotelId]);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      setLoading(true);
      try {
        const res = await api.get(`/hotels/${hotelId}`);
        if(!cancelled) setHotelData(res.data);
      } catch {
        if(!cancelled) setHotelData(mockHotelData);
      } finally {
        if(!cancelled) setLoading(false);
      }
    })();
    return()=>{ cancelled=true; };
  },[hotelId,mockHotelData]);

  useEffect(()=>{ if(hotelData?.rooms?.length && !selectedRoomId) setSelectedRoomId(hotelData.rooms[0]._id); },[hotelData,selectedRoomId]);

  const images = hotelData?.images?.length ? hotelData.images : [];
  const heroImgs = useMemo(()=>{ const out=[]; for(let i=0;i<7;i++) out.push(images[i%images.length]||''); return out; },[images]);

  const selectedRoom = useMemo(()=>{
    if(!hotelData?.rooms?.length) return null;
    return hotelData.rooms.find(r=>r._id===selectedRoomId)||hotelData.rooms[0];
  },[hotelData,selectedRoomId]);

  const nights       = nightsBetween(checkIn,checkOut);
  const roomTotal    = (selectedRoom?.pricePerNight||0)*nights;
  const cleaningFee  = Number(hotelData?.cleaningFeePerStay||0);
  const serviceFee   = Number(hotelData?.serviceFeePerStay||0);
  const totalPrice   = roomTotal+cleaningFee+serviceFee;
  const startPrice   = selectedRoom?.pricePerNight||hotelData?.rooms?.[0]?.pricePerNight||0;
  
  // Calculate average rating from actual reviews
  const avgRating = useMemo(() => {
    if (!hotelData?.reviews || hotelData.reviews.length === 0) return 0;
    const total = hotelData.reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return Math.round((total / hotelData.reviews.length) * 10) / 10;
  }, [hotelData?.reviews]);
  
  // Get actual review count from reviews array
  const reviewCount = hotelData?.reviews?.length || 0;
  
  const coords       = hotelData?.coordinates||{ lat:6.93, lng:79.85 };

  const handleReserveNow = ()=>{
    if(!selectedRoom)    { toast.error('Select a room first.'); return; }
    if(!checkIn||!checkOut) { toast.error('Please choose your dates.'); return; }
    if(nights<=0)        { toast.error('Check-out must be after check-in.'); return; }
    toast.success('Reservation request created (demo).');
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (reviewForm.rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a comment for your review');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/hotels/${hotelId}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      toast.success('Review submitted successfully!');
      setReviewForm({ rating: 0, comment: '' });
      
      // Refresh hotel data to show new review
      const res = await api.get(`/hotels/${hotelId}`);
      setHotelData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ── INPUT STYLE ── */
  const inp = {
    width:'100%', padding:'10px 14px', borderRadius:12,
    border:`1.5px solid ${T.border}`, fontSize:13, fontWeight:600,
    background:'#f9fafb', color:T.text, outline:'none',
    fontFamily:"'DM Sans',sans-serif", transition:'border-color .2s,box-shadow .2s',
  };
  const focusE = {
    onFocus:e=>{ e.target.style.borderColor=T.gold; e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.18)`; },
    onBlur:e=>{  e.target.style.borderColor=T.border; e.target.style.boxShadow='none'; },
  };

  /* ── LOADING ── */
  if(loading) return (
    <Layout>
      <style>{STYLES}</style>
      <div className="hd-page" style={{padding:'24px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          {/* Gallery skeleton */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gridTemplateRows:'210px 210px',gap:8,marginBottom:32}}>
            <div className="hd-shimmer" style={{gridColumn:'1',gridRow:'1/3',borderRadius:20}} />
            {[1,2,3,4].map(i=><div key={i} className="hd-shimmer" style={{borderRadius:16}} />)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:28}}>
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <Sk h={36} w="60%" r={10} />
              <Sk h={18} w="40%" r={8} />
              {[1,2,3,4].map(i=><Sk key={i} h={120} r={16} />)}
            </div>
            <Sk h={480} r={20} />
          </div>
        </div>
      </div>
    </Layout>
  );

  if(!hotelData) return (
    <Layout>
      <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <p style={{color:T.textLight,fontWeight:600}}>Hotel not found.</p>
          <Link to="/hotels" style={{color:T.goldDk,fontWeight:800}}>← Back to Hotels</Link>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <style>{STYLES}</style>
      <div className="hd-page">

        {/* ═══════════════════════════════
            HERO GALLERY
            Top : large panoramic (66%) + 1 full-height right (34%)
            Bottom : 5-thumbnail strip
        ═══════════════════════════════ */}
        <div style={{maxWidth:1280,margin:'0 auto',padding:'24px 24px 0'}}>

          {/* ── TOP ROW ── */}
          <div style={{display:'flex',gap:6,height:460,borderRadius:'22px 22px 0 0',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.10)'}}>

            {/* Large panoramic left */}
            <div className="gallery-cell" onClick={()=>{ setGalleryIdx(0); setGalleryOpen(true); }}
              style={{flex:'0 0 66%',position:'relative',overflow:'hidden',cursor:'pointer'}}>
              <img src={heroImgs[0]} alt={hotelData.name}
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
              {/* gradient vignette */}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(0,0,0,0.22) 0%,transparent 45%,rgba(0,0,0,0.18) 100%)'}} />
              {/* Hotel name overlay */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'28px 24px 20px',background:'linear-gradient(to top,rgba(0,0,0,0.62),transparent)'}}>
                <p style={{color:'rgba(255,255,255,0.75)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.14em',margin:'0 0 5px'}}>
                  📍 {hotelData.district || hotelData.locationLabel}
                </p>
                <h2 style={{color:'#fff',fontSize:'clamp(1.1rem,2vw,1.5rem)',fontWeight:900,margin:0,fontFamily:"'Playfair Display',serif",lineHeight:1.2,textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>
                  {hotelData.name}
                </h2>
              </div>
              {/* Wishlist btn */}
              <button onClick={e=>{e.stopPropagation();setWishlisted(v=>!v);}}
                style={{position:'absolute',top:18,left:18,width:42,height:42,borderRadius:'50%',border:`2px solid ${wishlisted?'#fca5a5':'rgba(255,255,255,0.35)'}`,cursor:'pointer',
                  background:wishlisted?'rgba(254,226,226,0.92)':'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,
                  boxShadow:'0 4px 14px rgba(0,0,0,0.2)',
                  animation:wishlisted?'heartBeat .4s ease':'none',transition:'all .25s'}}>
                <span style={{color:wishlisted?T.red:'#fff',lineHeight:1}}>{wishlisted?'♥':'♡'}</span>
              </button>
              {/* Photo count badge */}
              <div style={{position:'absolute',top:18,right:18,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(6px)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:99,padding:'5px 12px',display:'flex',alignItems:'center',gap:6}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                <span style={{color:'#fff',fontSize:11,fontWeight:700}}>{images.length} photos</span>
              </div>
            </div>

            {/* Single full-height right image */}
            <div className="gallery-cell" onClick={()=>{ setGalleryIdx(1); setGalleryOpen(true); }}
              style={{flex:'0 0 calc(34% - 6px)',position:'relative',overflow:'hidden',cursor:'pointer'}}>
              <img src={heroImgs[1]} alt=""
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.18))'}} />
              {/* View all pill — shows on hover via inline CSS trick */}
              <button onClick={e=>{e.stopPropagation();setGalleryIdx(0);setGalleryOpen(true);}}
                style={{position:'absolute',bottom:16,right:16,background:'rgba(255,255,255,0.92)',border:'none',borderRadius:99,padding:'8px 16px',display:'flex',alignItems:'center',gap:7,cursor:'pointer',fontSize:12,fontWeight:800,color:T.text,boxShadow:'0 4px 18px rgba(0,0,0,0.22)',transition:'all .22s',backdropFilter:'blur(6px)'}}
                onMouseOver={e=>{e.currentTarget.style.background=T.gold;e.currentTarget.style.color='#fff';e.currentTarget.style.boxShadow=`0 6px 22px rgba(245,158,11,0.4)`;}}
                onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.92)';e.currentTarget.style.color=T.text;e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,0.22)';}}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                View all photos
              </button>
            </div>
          </div>

          {/* ── BOTTOM THUMBNAIL STRIP ── */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6,marginTop:6,borderRadius:'0 0 22px 22px',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
            {[2,3,4,5,6].map((imgI,pos)=>{
              const isLast = pos === 4;
              const remaining = images.length - 7;
              return (
                <div key={imgI} className="gallery-cell"
                  onClick={()=>{ setGalleryIdx(imgI); setGalleryOpen(true); }}
                  style={{position:'relative',height:148,overflow:'hidden',cursor:'pointer'}}>
                  <img src={heroImgs[imgI]} alt=""
                    style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />

                  {/* Subtle dark tint on each thumb */}
                  <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.08)',transition:'background .25s'}}
                    onMouseOver={e=>{e.currentTarget.style.background='rgba(0,0,0,0)';}}
                    onMouseOut={e=>{e.currentTarget.style.background='rgba(0,0,0,0.08)';}}
                  />

                  {/* "+N photos" overlay on last thumb */}
                  {isLast && remaining > 0 && (
                    <>
                      <div style={{position:'absolute',inset:0,background:'rgba(17,24,39,0.62)',backdropFilter:'blur(2px)'}} />
                      <button onClick={e=>{e.stopPropagation();setGalleryIdx(0);setGalleryOpen(true);}}
                        style={{position:'absolute',inset:0,background:'none',border:'none',cursor:'pointer',
                          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6}}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        <span style={{color:'#fff',fontSize:16,fontWeight:900,letterSpacing:'-0.01em'}}>+{remaining}</span>
                        <span style={{color:'rgba(255,255,255,0.70)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>more photos</span>
                      </button>
                    </>
                  )}

                  {/* Thin gold bottom border on hover — done via onMouseOver */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.gold},${T.goldDk})`,transform:'scaleX(0)',transformOrigin:'left',transition:'transform .3s'}}
                    className="thumb-bar"
                  />
                </div>
              );
            })}
          </div>

        </div>

        {/* ═══════════════════════════════
            CONTENT GRID
        ═══════════════════════════════ */}
        <div style={{maxWidth:1280,margin:'0 auto',padding:'28px 24px 60px',display:'grid',gridTemplateColumns:'1fr 380px',gap:28,alignItems:'start'}}>

          {/* ── LEFT COLUMN ── */}
          <div style={{display:'flex',flexDirection:'column',gap:24}}>

            {/* ── Hotel Header ── */}
            <div className="hd-fade-up hd-card" style={{padding:'28px 28px 24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:16,marginBottom:16}}>
                <div>
                  <h1 style={{fontSize:'clamp(1.6rem,3vw,2.2rem)',fontWeight:900,color:T.text,margin:'0 0 10px',lineHeight:1.15,fontFamily:"'Playfair Display',serif"}}>
                    {hotelData.name}
                  </h1>
                  <StarRow n={hotelData.starRating||5} />
                  <p style={{margin:'10px 0 0',fontSize:13,color:T.textLight,display:'flex',alignItems:'center',gap:6}}>
                    <svg width="13" height="13" fill="currentColor" style={{color:T.gold,flexShrink:0}} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {hotelData.address||hotelData.locationLabel}
                  </p>
                </div>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  {/* Rating badge */}
                  <div style={{background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:14,padding:'10px 18px',textAlign:'center',flexShrink:0}}>
                    <div style={{fontSize:26,fontWeight:900,color:T.goldDk,lineHeight:1}}>{avgRating.toFixed(1)}</div>
                    <div style={{fontSize:10,fontWeight:800,color:T.goldDk,textTransform:'uppercase',letterSpacing:'0.08em',marginTop:2}}>Excellent</div>
                  </div>
                  <button onClick={()=>locationRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}
                    style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:12,background:T.goldBg,border:`1.5px solid ${T.goldBorder}`,color:T.goldDk,fontWeight:800,fontSize:13,cursor:'pointer',transition:'all .2s'}}
                    onMouseOver={e=>{e.currentTarget.style.background=T.gold;e.currentTarget.style.color='#fff';}}
                    onMouseOut={e=>{e.currentTarget.style.background=T.goldBg;e.currentTarget.style.color=T.goldDk;}}
                  >
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    View on Map
                  </button>
                </div>
              </div>

              {/* Quick amenity chips */}
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {(hotelData.quickAmenities||hotelData.amenities||[]).slice(0,6).map(a=>(
                  <span key={a} style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,fontWeight:700,padding:'6px 14px',background:'#f9fafb',border:`1px solid ${T.border}`,borderRadius:99,color:T.textMid}}>
                    <svg width="12" height="12" fill="currentColor" style={{color:T.gold}} viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Contact + About ── */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}} className="hd-fade-up" data-animation-delay="80ms">
              {/* Contact */}
              <div className="hd-card" style={{padding:24}}>
                <h2 style={{fontSize:16,fontWeight:900,color:T.text,margin:'0 0 16px',fontFamily:"'Playfair Display',serif"}}>Contact Info</h2>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {[
                    [hotelData.phone, '📞', hotelData.phone, `tel:${hotelData.phone}`],
                    [hotelData.email, '✉️', hotelData.email, `mailto:${hotelData.email}`],
                    [hotelData.website, '🌐', hotelData.website, hotelData.website],
                  ].filter(([v])=>v).map(([,icon,label,href])=>(
                    <a key={href} href={href} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none',color:T.textMid,fontSize:13,fontWeight:600,overflow:'hidden'}}>
                      <span style={{width:32,height:32,borderRadius:10,background:T.goldBg,border:`1px solid ${T.goldBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{icon}</span>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
                    </a>
                  ))}
                  <div style={{paddingTop:12,borderTop:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:8,fontSize:12,color:T.textLight,fontWeight:600}}>
                    <span style={{color:T.gold}}>🕐</span>
                    Check-in <strong style={{color:T.text}}>{hotelData.checkInTime}</strong> · Check-out <strong style={{color:T.text}}>{hotelData.checkOutTime}</strong>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="hd-card" style={{padding:24}}>
                <h2 style={{fontSize:16,fontWeight:900,color:T.text,margin:'0 0 12px',fontFamily:"'Playfair Display',serif"}}>About This Hotel</h2>
                <p style={{fontSize:13,color:T.textLight,lineHeight:1.7,margin:0}}>
                  {aboutExpanded ? hotelData.description : clampText(hotelData.description,190)}
                </p>
                <button onClick={()=>setAboutExpanded(p=>!p)} style={{marginTop:12,display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:800,color:T.goldDk,background:'none',border:'none',cursor:'pointer',padding:0,transition:'color .2s'}}
                  onMouseOver={e=>{e.currentTarget.style.color=T.gold;}}
                  onMouseOut={e=>{e.currentTarget.style.color=T.goldDk;}}
                >
                  {aboutExpanded?'Read Less ▲':'Read More ▼'}
                </button>
              </div>
            </div>

            {/* ── Available Rooms ── */}
            <div className="hd-fade-up" style={{animationDelay:'120ms'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h2 style={{fontSize:20,fontWeight:900,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>Available Rooms</h2>
                <span style={{fontSize:12,fontWeight:700,color:T.textLight,background:'#f3f4f6',padding:'4px 12px',borderRadius:99}}>{hotelData.rooms?.length||0} options</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {hotelData.rooms?.map((room,ri)=>{
                  const active = room._id===selectedRoomId;
                  return (
                    <div key={room._id}
                      className={`hd-card${active?' room-active':''}`}
                      style={{padding:0,overflow:'hidden',display:'flex',transition:'all .3s cubic-bezier(.22,1,.36,1)',transform:active?'translateY(-2px)':'translateY(0)',animationDelay:`${ri*60}ms`}}
                    >
                      {/* Room image */}
                      <div style={{width:140,flexShrink:0,position:'relative',overflow:'hidden'}}>
                        <img 
                          src={room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900'} 
                          alt={room.type || room.name}
                          style={{width:'100%',height:'100%',objectFit:'cover',display:'block',minHeight:130,transition:'transform .5s cubic-bezier(.22,1,.36,1)',transform:active?'scale(1.06)':'scale(1)'}} 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900'; }}
                        />
                        {active && <div style={{position:'absolute',inset:0,background:'rgba(245,158,11,0.12)'}} />}
                      </div>

                      {/* Room details */}
                      <div style={{flex:1,padding:'18px 20px',display:'flex',gap:16,alignItems:'flex-start'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8}}>
                            <div>
                              <h3 style={{fontSize:15,fontWeight:900,color:active?T.goldDk:T.text,margin:'0 0 4px',transition:'color .2s'}}>{room.name}</h3>
                              <p style={{fontSize:12,color:T.textLight,margin:'0 0 2px'}}>
                                Capacity: <strong style={{color:T.text}}>{room.capacity?.adults||2}</strong> adults{room.capacity?.children?`, ${room.capacity.children} children`:''}
                              </p>
                              <p style={{fontSize:12,color:T.textLight,margin:0}}>
                                Bed: <strong style={{color:T.text}}>{room.bedType}</strong>
                              </p>
                            </div>
                            <div style={{textAlign:'right',flexShrink:0}}>
                              <div style={{fontSize:18,fontWeight:900,color:T.goldDk}}>{LKR(room.pricePerNight)}</div>
                              <div style={{fontSize:11,color:T.textLight,fontWeight:600}}>per night</div>
                            </div>
                          </div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                            {room.amenities?.slice(0,4).map(a=>(
                              <span key={a} style={{fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:8,background:'#f3f4f6',color:T.textMid,display:'flex',alignItems:'center',gap:4}}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} style={{color:T.gold}}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button onClick={()=>setSelectedRoomId(room._id)} style={{
                          flexShrink:0, padding:'9px 20px', borderRadius:12, fontWeight:800, fontSize:13, cursor:'pointer',
                          background:active?T.gold:'#fff', color:active?'#fff':T.goldDk,
                          border:`1.5px solid ${active?T.gold:T.goldBorder}`,
                          boxShadow:active?`0 6px 18px rgba(245,158,11,0.3)`:'none',
                          transition:'all .25s', whiteSpace:'nowrap',
                        }}
                          onMouseOver={e=>{ if(!active){e.currentTarget.style.background=T.goldBg;} }}
                          onMouseOut={e=>{ if(!active){e.currentTarget.style.background='#fff';} }}
                        >
                          {active?'✓ Selected':'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Property Amenities ── */}
            <div className="hd-fade-up" style={{animationDelay:'160ms'}}>
              <h2 style={{fontSize:20,fontWeight:900,color:T.text,margin:'0 0 16px',fontFamily:"'Playfair Display',serif"}}>Property Amenities</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:10}}>
                {(hotelData.amenities||[]).slice(0,12).map((a,i)=>(
                  <div key={a} className="hd-card" style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12,transition:'all .25s',animationDelay:`${i*30}ms'`}}
                    onMouseOver={e=>{e.currentTarget.style.borderColor=T.goldBorder;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px rgba(245,158,11,0.12)`;}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
                  >
                    <div style={{width:36,height:36,borderRadius:10,background:T.goldBg,border:`1px solid ${T.goldBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.goldDk} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:13,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a}</div>
                      <div style={{fontSize:10,color:T.textLight,fontWeight:600}}>Included</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Location ── */}
            <div id="location" ref={locationRef} className="hd-fade-up" style={{animationDelay:'200ms'}}>
              <h2 style={{fontSize:20,fontWeight:900,color:T.text,margin:'0 0 16px',fontFamily:"'Playfair Display',serif"}}>Location</h2>

              <div className="hd-card" style={{overflow:'hidden',marginBottom:14}}>
                <div style={{height:360}}>
                  <MapContainer center={[coords.lat,coords.lng]} zoom={13} style={{height:'100%',width:'100%'}} scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[coords.lat,coords.lng]} icon={goldIcon}>
                      <Popup>{hotelData.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div style={{padding:'16px 20px',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:14,color:T.text}}>{hotelData.district}</div>
                    <div style={{fontSize:12,color:T.textLight,marginTop:2}}>{hotelData.address}</div>
                  </div>
                  <a href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} target="_blank" rel="noreferrer"
                    style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:12,background:T.goldBg,border:`1.5px solid ${T.goldBorder}`,color:T.goldDk,fontWeight:800,fontSize:13,textDecoration:'none',transition:'all .2s',whiteSpace:'nowrap'}}
                    onMouseOver={e=>{e.currentTarget.style.background=T.gold;e.currentTarget.style.color='#fff';}}
                    onMouseOut={e=>{e.currentTarget.style.background=T.goldBg;e.currentTarget.style.color=T.goldDk;}}
                  >
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Open in Maps
                  </a>
                </div>
              </div>

              {/* Nearby attractions */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
                {(hotelData.nearbyAttractions||[]).slice(0,3).map(a=>(
                  <div key={a.name} className="hd-card" style={{padding:'16px 18px',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:38,height:38,borderRadius:10,background:T.emeraldBg,border:'1px solid #a7f3d0',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16}}>🏛️</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:800,fontSize:13,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                      <div style={{fontSize:11,color:T.textLight,fontWeight:600,marginTop:2}}>{Number(a.distanceKm).toFixed(1)} km away</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Guest Reviews ── */}
            <div className="hd-fade-up" data-delay="240ms" style={{paddingBottom:24}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <h2 style={{fontSize:20,fontWeight:900,color:T.text,margin:0,fontFamily:"'Playfair Display',serif"}}>Guest Reviews</h2>
                <span style={{fontSize:12,fontWeight:700,color:T.textLight}}>{reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span>
              </div>

              {/* Review summary */}
              <div className="hd-card" style={{padding:24,marginBottom:16}}>
                <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:24,alignItems:'center'}}>
                  <div style={{textAlign:'center',padding:'16px 24px',background:T.goldBg,border:`2px solid ${T.goldBorder}`,borderRadius:18}}>
                    <div style={{fontSize:48,fontWeight:900,color:T.goldDk,lineHeight:1}}>{avgRating.toFixed(1)}</div>
                    <div style={{fontSize:10,fontWeight:800,color:T.goldDk,textTransform:'uppercase',letterSpacing:'0.1em',marginTop:4}}>out of 10</div>
                    <div style={{color:T.gold,fontSize:16,marginTop:6}}>★★★★★</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    {(hotelData.reviewSummary?.subCategories||[]).slice(0,3).map(c=>(
                      <ProgressBar key={c.key} label={c.key} value={c.rating} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
                {(hotelData.reviews||[]).slice(0,12).map((r,ri)=>(
                  <div key={r._id} className="hd-card" style={{padding:20,display:'flex',flexDirection:'column',gap:14,animationDelay:`${ri*50}ms`,transition:'all .3s'}}
                    onMouseOver={e=>{e.currentTarget.style.borderColor=T.goldBorder;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 32px rgba(245,158,11,0.1)`;}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
                  >
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:42,height:42,borderRadius:'50%',overflow:'hidden',background:'#f3f4f6',border:`2px solid ${T.border}`,flexShrink:0}}>
                        {r.userAvatar
                          ? <img src={r.userAvatar} alt={r.userName} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                          : <span style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontWeight:900,color:T.textMid}}>{(r.userName||'?')[0].toUpperCase()}</span>
                        }
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:900,fontSize:14,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.userName}</div>
                        <div style={{fontSize:11,color:T.textLight,fontWeight:600,marginTop:1}}>{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4,background:T.goldBg,border:`1px solid ${T.goldBorder}`,padding:'4px 10px',borderRadius:99,flexShrink:0}}>
                        <span style={{color:T.gold,fontSize:12}}>★</span>
                        <span style={{fontWeight:900,fontSize:13,color:T.goldDk}}>{r.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p style={{fontSize:13,color:T.textLight,lineHeight:1.65,margin:0}}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Write a Review Form ── */}
            <div className="hd-fade-up" style={{animationDelay:'300ms',paddingTop:24,borderTop:`1px solid ${T.border}`,marginTop:24}}>
              <h2 style={{fontSize:20,fontWeight:900,color:T.text,margin:'0 0 20px',fontFamily:"'Playfair Display',serif"}}>Write a Review</h2>
              
              <div className="hd-card" style={{padding:24}}>
                <form onSubmit={handleReviewSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
                  {/* Star Rating */}
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:800,color:T.text,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>
                      Your Rating *
                    </label>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      {[1,2,3,4,5].map((star)=>(
                        <span
                          key={star}
                          className="star-rating-input"
                          onClick={()=>setReviewForm(p=>({...p, rating: star}))}
                          onMouseEnter={()=>setHoverRating(star)}
                          onMouseLeave={()=>setHoverRating(0)}
                          style={{
                            fontSize:32,
                            color: star <= (hoverRating || reviewForm.rating) ? T.gold : '#d1d5db',
                            transition:'all .15s ease',
                            cursor:'pointer',
                          }}
                        >
                          ★
                        </span>
                      ))}
                      {reviewForm.rating > 0 && (
                        <span style={{marginLeft:12,fontSize:13,fontWeight:700,color:T.goldDk}}>
                          {['Poor','Fair','Good','Very Good','Excellent'][reviewForm.rating-1]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:800,color:T.text,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>
                      Your Review *
                    </label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e)=>setReviewForm(p=>({...p, comment: e.target.value}))}
                      placeholder="Share your experience at this hotel... What did you like? What could be improved?"
                      rows={5}
                      style={{
                        width:'100%',
                        padding:'12px 16px',
                        borderRadius:12,
                        border:`1.5px solid ${T.border}`,
                        fontSize:13,
                        fontWeight:500,
                        background:'#f9fafb',
                        color:T.text,
                        outline:'none',
                        fontFamily:"'DM Sans',sans-serif",
                        resize:'vertical',
                        transition:'border-color .2s,box-shadow .2s',
                      }}
                      onFocus={(e)=>{
                        e.target.style.borderColor=T.gold;
                        e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.18)`;
                      }}
                      onBlur={(e)=>{
                        e.target.style.borderColor=T.border;
                        e.target.style.boxShadow='none';
                      }}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim()}
                    style={{
                      alignSelf:'flex-start',
                      padding:'12px 32px',
                      borderRadius:14,
                      background: submittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim() 
                        ? '#e5e7eb' 
                        : `linear-gradient(135deg,${T.gold},${T.goldDk})`,
                      color: submittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim()
                        ? T.textLight
                        : '#fff',
                      fontWeight:900,
                      fontSize:14,
                      border:'none',
                      cursor: submittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim()
                        ? 'not-allowed'
                        : 'pointer',
                      boxShadow: submittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim()
                        ? 'none'
                        : `0 8px 28px rgba(245,158,11,0.38)`,
                      transition:'all .25s',
                      display:'flex',
                      alignItems:'center',
                      gap:10,
                      fontFamily:"'DM Sans',sans-serif",
                      minWidth:180,
                    }}
                    onMouseOver={(e)=>{
                      if(!submittingReview && reviewForm.rating > 0 && reviewForm.comment.trim()){
                        e.currentTarget.style.transform='translateY(-2px)';
                        e.currentTarget.style.boxShadow=`0 14px 36px rgba(245,158,11,0.48)`;
                      }
                    }}
                    onMouseOut={(e)=>{
                      e.currentTarget.style.transform='translateY(0)';
                      if(!submittingReview && reviewForm.rating > 0 && reviewForm.comment.trim()){
                        e.currentTarget.style.boxShadow=`0 8px 28px rgba(245,158,11,0.38)`;
                      }
                    }}
                  >
                    {submittingReview ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{animation:'spin .7s linear infinite'}}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Submit Review
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>{/* end left col */}

          {/* ── RIGHT COLUMN: Booking Widget ── */}
          <div>
            <div className="booking-widget hd-scale-in" style={{
              background:'#fff', borderRadius:22, border:`1px solid ${T.border}`,
              boxShadow:'0 12px 48px rgba(0,0,0,0.12)', padding:24,
              position:'sticky', top:24,
            }}>
              {/* Price header */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,paddingBottom:18,borderBottom:`1px solid ${T.border}`}}>
                <div>
                  <div style={{fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:4}}>Starting from</div>
                  <div style={{fontSize:30,fontWeight:900,color:T.text,lineHeight:1}}>
                    {LKR(startPrice)}
                  </div>
                  <div style={{fontSize:12,color:T.textLight,fontWeight:600,marginTop:3}}>/night</div>
                </div>
                <div style={{background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:12,padding:'8px 14px',display:'flex',alignItems:'center',gap:6}}>
                  <span style={{color:T.gold,fontSize:14}}>★</span>
                  <span style={{fontWeight:900,fontSize:15,color:T.goldDk}}>{avgRating.toFixed(1)}</span>
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {/* Dates */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    ['📅 Check-in', checkIn, setCheckIn],
                    ['📅 Check-out', checkOut, setCheckOut],
                  ].map(([label, val, setter])=>(
                    <div key={label}>
                      <label style={{display:'block',fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{label}</label>
                      <input type="date" value={val} onChange={e=>setter(e.target.value)} style={inp} {...focusE} />
                    </div>
                  ))}
                </div>

                {/* Guests dropdown */}
                <div ref={guestsRef} style={{position:'relative'}}>
                  <label style={{display:'block',fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>👥 Guests</label>
                  <button onClick={()=>setGuestsOpen(p=>!p)} style={{...inp,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderColor:guestsOpen?T.gold:T.border,boxShadow:guestsOpen?`0 0 0 3px rgba(245,158,11,0.18)`:'none'}}>
                    <span>{adults} Adults{children>0?`, ${children} Children`:''}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{transform:guestsOpen?'rotate(180deg)':'',transition:'transform .2s',opacity:.5}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {guestsOpen && (
                    <div style={{position:'absolute',top:'calc(100% + 8px)',left:0,right:0,zIndex:50,background:'#fff',border:`1px solid ${T.border}`,borderRadius:16,padding:18,boxShadow:'0 20px 50px rgba(0,0,0,0.15)',animation:'dropIn .22s cubic-bezier(.22,1,.36,1)'}}>
                      {[['Adults','Age 13+',adults,setAdults,1,6],['Children','Age 0–12',children,setChildren,0,6]].map(([lbl,sub,val,setter,mn,mx])=>(
                        <div key={lbl} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:800,color:T.text}}>{lbl}</div>
                            <div style={{fontSize:11,color:T.textLight,fontWeight:600}}>{sub}</div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <button onClick={()=>setter(p=>Math.max(mn,p-1))} style={{width:32,height:32,borderRadius:10,border:`1px solid ${T.border}`,background:'#f3f4f6',cursor:'pointer',fontWeight:700,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .18s'}}
                              onMouseOver={e=>{e.currentTarget.style.background=T.goldBg;e.currentTarget.style.borderColor=T.goldBorder;}}
                              onMouseOut={e=>{e.currentTarget.style.background='#f3f4f6';e.currentTarget.style.borderColor=T.border;}}>−</button>
                            <span style={{fontWeight:900,fontSize:14,color:T.text,minWidth:18,textAlign:'center'}}>{val}</span>
                            <button onClick={()=>setter(p=>Math.min(mx,p+1))} style={{width:32,height:32,borderRadius:10,border:'none',background:T.gold,color:'#fff',cursor:'pointer',fontWeight:700,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'background .18s'}}
                              onMouseOver={e=>{e.currentTarget.style.background=T.goldDk;}}
                              onMouseOut={e=>{e.currentTarget.style.background=T.gold;}}>+</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>setGuestsOpen(false)} style={{width:'100%',padding:'10px',borderRadius:12,background:T.gold,color:'#fff',border:'none',cursor:'pointer',fontWeight:800,fontSize:13,transition:'background .18s'}}
                        onMouseOver={e=>{e.currentTarget.style.background=T.goldDk;}}
                        onMouseOut={e=>{e.currentTarget.style.background=T.gold;}}>Done ✓</button>
                    </div>
                  )}
                </div>

                {/* Room select */}
                <div>
                  <label style={{display:'block',fontSize:10,fontWeight:800,color:T.textLight,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>🛏️ Room Type</label>
                  <select value={selectedRoomId} onChange={e=>setSelectedRoomId(e.target.value)} style={{...inp,appearance:'none',cursor:'pointer'}} {...focusE}>
                    {hotelData.rooms?.map(r=>(
                      <option key={r._id} value={r._id}>{r.name} ({LKR(r.pricePerNight)}/night)</option>
                    ))}
                  </select>
                </div>

                {/* Price breakdown */}
                <div style={{background:'#f9fafb',borderRadius:16,border:`1px solid ${T.border}`,padding:18}}>
                  {[
                    [`Room × ${nights} night${nights!==1?'s':''}`, nights>0?`${LKR(selectedRoom?.pricePerNight)} × ${nights}`:LKR(0)],
                    ['Cleaning Fee', LKR(cleaningFee)],
                    ['Service Fee', LKR(serviceFee)],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13,fontWeight:600,color:T.textMid}}>
                      <span>{k}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{borderTop:`1px solid ${T.border}`,paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontWeight:900,fontSize:14,color:T.text}}>Total</span>
                    <span style={{fontWeight:900,fontSize:22,color:T.text}}>{LKR(totalPrice)}</span>
                  </div>
                  <div style={{fontSize:11,color:T.textLight,fontWeight:600,marginTop:8}}>
                    {nights>0?`${nights} night${nights!==1?'s':''} · ${adults} adult${adults!==1?'s':''}${children?`, ${children} children`:''}`:
                    'Choose dates to calculate total'}
                  </div>
                </div>

                {/* CTA */}
                <button onClick={handleReserveNow} disabled={nights<=0} style={{
                  width:'100%', padding:'15px', borderRadius:16,
                  background: nights>0 ? `linear-gradient(135deg,${T.gold},${T.goldDk})` : '#e5e7eb',
                  color: nights>0 ? '#fff' : T.textLight,
                  fontWeight:900, fontSize:15, border:'none',
                  cursor: nights>0 ? 'pointer' : 'not-allowed',
                  boxShadow: nights>0 ? `0 8px 28px rgba(245,158,11,0.38)` : 'none',
                  transition:'all .25s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  fontFamily:"'DM Sans',sans-serif",
                }}
                  onMouseOver={e=>{ if(nights>0){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 14px 36px rgba(245,158,11,0.48)`;} }}
                  onMouseOut={e=>{ e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=nights>0?`0 8px 28px rgba(245,158,11,0.38)`:'none'; }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                  Reserve Now
                </button>

                {/* Trust badges */}
                <div style={{display:'flex',justifyContent:'center',gap:20,paddingTop:4}}>
                  {['🔒 Secure','✅ Verified','💳 Safe Pay'].map(b=>(
                    <span key={b} style={{fontSize:11,fontWeight:700,color:T.textLight}}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>{/* end grid */}
      </div>

      {galleryOpen && (
        <GalleryModal open={galleryOpen} images={hotelData.images||[]} startIndex={galleryIdx} onClose={()=>setGalleryOpen(false)} />
      )}
    </Layout>
  );
}