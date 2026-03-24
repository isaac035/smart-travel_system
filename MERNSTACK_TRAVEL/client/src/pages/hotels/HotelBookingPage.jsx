import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn   { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes slideL    { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideR    { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes shimmer   { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes successPop { 0%{transform:scale(0) rotate(-15deg)} 60%{transform:scale(1.15) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
  @keyframes checkDraw { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
  @keyframes floatBob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes gradMove  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.55} }

  .bk-page {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    background:#f4f5f7;
    color:#111827;
  }

  /* Input focus ring */
  .bk-inp {
    width:100%;
    background:#fff;
    border:1.5px solid #e5e7eb;
    color:#111827;
    border-radius:13px;
    padding:12px 16px;
    font-size:14px;
    font-weight:500;
    outline:none;
    font-family:'DM Sans',sans-serif;
    transition:border-color .2s,box-shadow .2s,background .2s;
  }
  .bk-inp:focus {
    border-color:#f59e0b;
    box-shadow:0 0 0 3px rgba(245,158,11,0.16);
    background:#fffef7;
  }
  .bk-inp::placeholder { color:#9ca3af; }
  select.bk-inp option { background:#fff; color:#111827; }

  /* Card */
  .bk-card {
    background:#fff;
    border:1px solid #e5e7eb;
    border-radius:22px;
    box-shadow:0 2px 18px rgba(0,0,0,0.06);
    transition:box-shadow .3s;
  }

  /* Step content animation */
  .step-enter { animation:slideL .35s cubic-bezier(.22,1,.36,1) both; }

  /* File upload drop zone */
  .drop-zone {
    border:2px dashed #d1d5db;
    border-radius:16px;
    padding:32px 24px;
    text-align:center;
    cursor:pointer;
    transition:all .25s;
  }
  .drop-zone:hover,.drop-zone.active {
    border-color:#f59e0b;
    background:rgba(245,158,11,0.04);
  }

  /* Summary skeleton */
  .sk { background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:600px 100%; animation:shimmer 1.5s infinite; border-radius:8px; }

  /* Spinning loader */
  .spin { animation:spin .7s linear infinite; }

  /* Success check path */
  .check-path { stroke-dasharray:60; stroke-dashoffset:60; animation:checkDraw .5s cubic-bezier(.22,1,.36,1) .4s forwards; }

  /* Capacity warning pulse */
  .warn-pulse { animation:pulse 2s ease-in-out infinite; }
`;

const T = {
  gold:'#f59e0b', goldDk:'#d97706', goldLt:'#fbbf24',
  goldBg:'#fffbeb', goldBorder:'#fcd34d',
  navy:'#1a1a2e', navyMid:'#16213e',
  emerald:'#10b981', emeraldBg:'#ecfdf5',
  red:'#ef4444', redBg:'#fef2f2',
  text:'#111827', textMid:'#374151', textLight:'#6b7280',
  border:'#e5e7eb', bg:'#f4f5f7',
};

const STEPS = [
  { label:'Dates & Room', icon:'📅' },
  { label:'Guest Details', icon:'👤' },
  { label:'Payment',       icon:'💳' },
];

function LKR(v) { return `LKR ${Math.round(Number(v||0)).toLocaleString()}`; }
function Lbl({ children }) {
  return <label style={{ display:'block', fontSize:11, fontWeight:800, color:T.textLight, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:7 }}>{children}</label>;
}

/* ─── STEP BAR ─── */
function StepBar({ step }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:36 }}>
      {STEPS.map((s, i) => (
        <div key={s.label} style={{ display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{
              width:48, height:48, borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, fontWeight:900, transition:'all .35s',
              background: i < step
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : i === step
                  ? `linear-gradient(135deg,${T.gold},${T.goldDk})`
                  : '#f3f4f6',
              color: i <= step ? '#fff' : '#9ca3af',
              boxShadow: i === step ? `0 6px 20px rgba(245,158,11,0.38)`
                       : i < step  ? '0 4px 14px rgba(16,185,129,0.3)'
                       : 'none',
              transform: i === step ? 'scale(1.1)' : 'scale(1)',
            }}>
              {i < step
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : <span style={{ fontSize:16 }}>{s.icon}</span>
              }
            </div>
            <span style={{ fontSize:11, fontWeight:800, color: i === step ? T.goldDk : i < step ? T.emerald : '#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width:72, height:3, margin:'0 10px', marginBottom:26, borderRadius:99, transition:'background .4s', background: i < step ? T.emerald : '#e5e7eb' }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── INPUT FIELD WRAPPER ─── */
function Field({ label, children, error }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      {children}
      {error && <p style={{ fontSize:11, color:T.red, marginTop:5, fontWeight:700 }}>{error}</p>}
    </div>
  );
}

/* ─── COUNTER ─── */
function Counter({ label, sub, value, onChange, min=0, max=20 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'#f9fafb', border:`1.5px solid ${T.border}`, borderRadius:13 }}>
      <div>
        <p style={{ margin:0, fontSize:14, fontWeight:700, color:T.text }}>{label}</p>
        {sub && <p style={{ margin:0, fontSize:11, color:T.textLight }}>{sub}</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button type="button" onClick={() => onChange(Math.max(min, value-1))} style={{
          width:32, height:32, borderRadius:'50%', border:`1.5px solid ${T.border}`,
          background:'#fff', cursor:'pointer', fontWeight:900, fontSize:17,
          display:'flex', alignItems:'center', justifyContent:'center', color:T.textMid,
          transition:'all .2s',
        }}
          onMouseOver={e=>{e.currentTarget.style.borderColor=T.goldBorder;e.currentTarget.style.background=T.goldBg;}}
          onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background='#fff';}}>
          −
        </button>
        <span style={{ fontWeight:900, fontSize:16, color:T.text, minWidth:20, textAlign:'center' }}>{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value+1))} style={{
          width:32, height:32, borderRadius:'50%', border:'none',
          background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,
          cursor:'pointer', fontWeight:900, fontSize:17,
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
          transition:'all .2s', boxShadow:`0 4px 12px rgba(245,158,11,0.3)`,
        }}
          onMouseOver={e=>{e.currentTarget.style.transform='scale(1.1)';}}
          onMouseOut={e=>{e.currentTarget.style.transform='scale(1)';}}>
          +
        </button>
      </div>
    </div>
  );
}

/* ─── SUCCESS MODAL ─── */
function SuccessModal({ data, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(7px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn .3s ease' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:28, padding:'44px 36px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(0,0,0,0.28)', animation:'scaleIn .4s cubic-bezier(.22,1,.36,1)', position:'relative', overflow:'hidden' }}>
        {/* Top gold bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg,${T.gold},${T.goldDk},${T.gold})`, backgroundSize:'200% 100%', animation:'gradMove 2s linear infinite' }} />

        {/* Success icon */}
        <div style={{ width:88, height:88, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', margin:'0 auto 22px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 32px rgba(16,185,129,0.4)', animation:'successPop .6s cubic-bezier(.22,1,.36,1)' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path className="check-path" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 style={{ fontSize:26, fontWeight:900, color:T.text, margin:'0 0 8px', fontFamily:"'Playfair Display',serif" }}>Booking Confirmed!</h2>
        <p style={{ fontSize:13, color:T.textLight, margin:'0 0 24px', lineHeight:1.7 }}>
          Your payment slip has been submitted. The hotel will verify and confirm within <strong>24 hours</strong>.
        </p>

        {/* Booking summary card */}
        <div style={{ background:T.bg, borderRadius:18, padding:'20px 22px', border:`1.5px solid ${T.border}`, marginBottom:20, textAlign:'left' }}>
          <p style={{ fontSize:10, fontWeight:800, color:T.textLight, textTransform:'uppercase', letterSpacing:'0.13em', margin:'0 0 14px' }}>Booking Summary</p>
          {[
            ['Booking ID',   `#${data?.bookingId?.slice(-6).toUpperCase()}`],
            ['Hotel',         data?.hotelName],
            ['Check-in',      data?.checkIn  ? new Date(data.checkIn).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) : '—'],
            ['Check-out',     data?.checkOut ? new Date(data.checkOut).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) : '—'],
            ['Room',          data?.roomType],
          ].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:13 }}>
              <span style={{ color:T.textLight, fontWeight:600 }}>{k}</span>
              <span style={{ color:T.text, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:240 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop:`2px dashed ${T.border}`, marginTop:10, paddingTop:14, display:'flex', justifyContent:'space-between', fontSize:17, fontWeight:900 }}>
            <span style={{ color:T.text }}>Total Paid</span>
            <span style={{ color:T.goldDk }}>{LKR(data?.total)}</span>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#fef3c7', border:`1.5px solid ${T.goldBorder}`, borderRadius:99, padding:'8px 20px', marginBottom:24 }}>
          <span style={{ animation:'floatBob 2s ease-in-out infinite', fontSize:18 }}>⏳</span>
          <span style={{ fontSize:12, fontWeight:800, color:'#92400e', textTransform:'uppercase', letterSpacing:'0.1em' }}>Pending Hotel Approval</span>
        </div>

        {/* Buttons */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <button onClick={() => { onClose(); window.location.href='/profile'; }} style={{
            padding:'13px 20px', background:'#fff', border:`1.5px solid ${T.border}`,
            color:T.textMid, fontWeight:700, borderRadius:14, cursor:'pointer', fontSize:13,
            transition:'all .2s', fontFamily:"'DM Sans',sans-serif",
          }}
            onMouseOver={e=>{e.currentTarget.style.borderColor=T.goldBorder;e.currentTarget.style.color=T.goldDk;}}
            onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textMid;}}>
            My Bookings →
          </button>
          <button onClick={() => { onClose(); window.location.href='/hotels'; }} style={{
            padding:'13px 20px', background:`linear-gradient(135deg,${T.gold},${T.goldDk})`,
            color:'#fff', fontWeight:800, borderRadius:14, border:'none', cursor:'pointer',
            fontSize:13, boxShadow:`0 6px 20px rgba(245,158,11,0.38)`,
            transition:'all .2s', fontFamily:"'DM Sans',sans-serif",
          }}
            onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 28px rgba(245,158,11,0.48)`;}}
            onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 6px 20px rgba(245,158,11,0.38)`;}}>
            Browse Hotels
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function HotelBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const dropRef = useRef(null);

  const [hotel, setHotel]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [slipFile, setSlipFile]       = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [step, setStep]               = useState(0);
  const [dropActive, setDropActive]   = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [errors, setErrors]           = useState({});

  const [form, setForm] = useState({
    firstName:   user?.name?.split(' ')[0] || '',
    lastName:    user?.name?.split(' ').slice(1).join(' ') || '',
    email:       user?.email || '',
    phone:       '',
    specialRequests: '',
    checkIn:     searchParams.get('checkIn')  || '',
    checkOut:    searchParams.get('checkOut') || '',
    roomType:    searchParams.get('roomType') || '',
    roomCount:   1,
    adults:      Number(searchParams.get('adults'))   || 2,
    children:    Number(searchParams.get('children')) || 0,
    pricePerNight: Number(searchParams.get('pricePerNight')) || 0,
  });

  const TAX_RATE = 0.10;

  useEffect(() => {
    api.get(`/hotels/${id}`)
      .then(res => {
        setHotel(res.data);
        if (res.data.rooms?.length > 0 && !form.roomType)
          setForm(f => ({ ...f, roomType: res.data.rooms[0].type }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 0;

  const selectedRoom     = hotel?.rooms?.find(r => r.type === form.roomType);
  const pricePerNight    = form.pricePerNight || selectedRoom?.pricePerNight || hotel?.pricePerNight || 0;
  const discountedPrice  = pricePerNight * (1 - (hotel?.discount || 0) / 100);
  const subtotal         = discountedPrice * form.roomCount * nights;
  const tax              = subtotal * TAX_RATE;
  const total            = subtotal + tax;
  const totalGuests      = Number(form.adults) + Number(form.children);
  const maxCapacity      = (selectedRoom?.capacity || 2) * form.roomCount;
  const capacityWarning  = totalGuests > maxCapacity;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSlipFile = file => {
    if (!file) return;
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = e => setSlipPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!form.checkIn)  errs.checkIn  = 'Required';
      if (!form.checkOut) errs.checkOut = 'Required';
      if (nights <= 0)    errs.checkOut = 'Check-out must be after check-in';
    }
    if (step === 1) {
      if (!form.firstName) errs.firstName = 'Required';
      if (!form.lastName)  errs.lastName  = 'Required';
      if (!form.email)     errs.email     = 'Required';
      if (!form.phone)     errs.phone     = 'Required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const canProceed = () => {
    if (step === 0) return form.checkIn && form.checkOut && nights > 0 && !capacityWarning;
    if (step === 1) return form.firstName && form.lastName && form.email && form.phone;
    return true;
  };

  const goNext = () => { if (validateStep() && canProceed()) setStep(s => s + 1); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user)      return toast.error('Please login to book');
    if (nights <= 0) return toast.error('Please select valid dates');
    if (!slipFile)  return toast.error('Please upload your payment slip');
    setSubmitting(true);
    try {
      const payload = {
        hotelId: id, roomType: form.roomType, roomCount: form.roomCount,
        checkIn: form.checkIn, checkOut: form.checkOut,
        guests: { adults: form.adults, children: form.children },
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone, specialRequests: form.specialRequests,
        pricePerNight: discountedPrice, subtotal, tax, totalPrice: total,
      };
      const { data: booking } = await api.post('/hotels/bookings/create', payload);
      const fd = new FormData();
      fd.append('slip', slipFile);
      fd.append('source', 'hotel');
      fd.append('referenceId', booking._id);
      fd.append('amount', total);
      await api.post('/payments/upload-slip', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBookingData({ bookingId: booking._id, hotelName: hotel.name, checkIn: form.checkIn, checkOut: form.checkOut, roomType: form.roomType, total });
      setBookingSuccess(true);
      toast.success('Booking confirmed! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally { setSubmitting(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <Layout>
      <style>{STYLES}</style>
      <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:52, height:52, border:`4px solid ${T.goldBorder}`, borderTopColor:T.gold, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
          <p style={{ color:T.textLight, fontSize:13, fontWeight:600 }}>Loading hotel details…</p>
        </div>
      </div>
    </Layout>
  );

  if (!hotel) return (
    <Layout>
      <style>{STYLES}</style>
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
        <span style={{ fontSize:48 }}>🏨</span>
        <p style={{ color:T.textLight, fontWeight:700 }}>Hotel not found.</p>
        <Link to="/hotels" style={{ color:T.goldDk, fontWeight:800, textDecoration:'none' }}>← Back to Hotels</Link>
      </div>
    </Layout>
  );

  const inpFocus = { onFocus:e=>{e.target.style.borderColor=T.gold;e.target.style.boxShadow=`0 0 0 3px rgba(245,158,11,0.16)`;}, onBlur:e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow='none';} };

  return (
    <Layout>
      <style>{STYLES}</style>

      <div className="bk-page">
        {/* ── Top navy band ── */}
        <div style={{ background:T.navyMid, borderBottom:`3px solid ${T.goldBorder}`, padding:'18px 24px' }}>
          <div style={{ maxWidth:1120, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <Link to={`/hotels/${id}`} style={{ display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.65)', fontSize:13, fontWeight:700, textDecoration:'none', transition:'color .2s' }}
              onMouseOver={e=>{e.currentTarget.style.color='#fff';}}
              onMouseOut={e=>{e.currentTarget.style.color='rgba(255,255,255,0.65)';}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back to {hotel.name}
            </Link>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:`linear-gradient(135deg,${T.gold},${T.goldDk})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🏨</div>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:900, color:'#fff', fontFamily:"'Playfair Display',serif" }}>{hotel.name}</p>
                <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{hotel.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1120, margin:'0 auto', padding:'36px 24px 72px' }}>
          {/* Page title */}
          <div style={{ marginBottom:28, textAlign:'center', animation:'fadeUp .5s cubic-bezier(.22,1,.36,1)' }}>
            <h1 style={{ fontSize:'clamp(1.6rem,3vw,2.2rem)', fontWeight:900, color:T.text, margin:'0 0 6px', fontFamily:"'Playfair Display',serif" }}>
              Complete Your Booking
            </h1>
            <p style={{ fontSize:13, color:T.textLight, margin:0 }}>You're just a few steps away from your perfect stay</p>
          </div>

          {/* Step bar */}
          <StepBar step={step} />

          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:28, alignItems:'start' }}>

              {/* ═══════════════════════════════
                  LEFT — STEP CONTENT
              ═══════════════════════════════ */}
              <div>

                {/* ── STEP 0: Dates & Room ── */}
                {step === 0 && (
                  <div className="bk-card step-enter" style={{ padding:28 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                      <span style={{ width:36, height:36, borderRadius:10, background:T.goldBg, border:`1px solid ${T.goldBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📅</span>
                      <h2 style={{ fontSize:18, fontWeight:900, color:T.text, margin:0, fontFamily:"'Playfair Display',serif" }}>Dates & Room Selection</h2>
                    </div>

                    {/* Date pickers */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
                      <Field label="Check-in Date" error={errors.checkIn}>
                        <input className="bk-inp" name="checkIn" type="date" value={form.checkIn} onChange={handleChange} required
                          min={new Date().toISOString().split('T')[0]} {...inpFocus} style={{ borderColor: errors.checkIn ? T.red : undefined }} />
                      </Field>
                      <Field label="Check-out Date" error={errors.checkOut}>
                        <input className="bk-inp" name="checkOut" type="date" value={form.checkOut} onChange={handleChange} required
                          min={form.checkIn || new Date().toISOString().split('T')[0]} {...inpFocus} style={{ borderColor: errors.checkOut ? T.red : undefined }} />
                      </Field>
                    </div>

                    {/* Nights pill */}
                    {nights > 0 && (
                      <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:7, background:`linear-gradient(135deg,${T.gold},${T.goldDk})`, color:'#fff', fontWeight:800, fontSize:13, padding:'7px 20px', borderRadius:99, boxShadow:`0 4px 14px rgba(245,158,11,0.32)` }}>
                          🌙 {nights} night{nights!==1?'s':''} selected
                        </span>
                      </div>
                    )}

                    {/* Room type */}
                    {hotel.rooms?.length > 0 && (
                      <div style={{ marginBottom:16 }}>
                        <Lbl>Room Type</Lbl>
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          {hotel.rooms.map(r => {
                            const active = form.roomType === r.type;
                            return (
                              <label key={r.type} style={{ cursor:'pointer' }}>
                                <input type="radio" name="roomType" value={r.type} checked={active} onChange={handleChange} style={{ display:'none' }} />
                                <div style={{
                                  padding:'14px 18px', borderRadius:14, border:`1.5px solid ${active?T.gold:T.border}`,
                                  background: active ? T.goldBg : '#fff',
                                  display:'flex', alignItems:'center', justifyContent:'space-between',
                                  transition:'all .2s',
                                  boxShadow: active ? `0 0 0 3px rgba(245,158,11,0.14)` : 'none',
                                }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                    <span style={{ width:10, height:10, borderRadius:'50%', background:active?T.gold:T.border, flexShrink:0, transition:'background .2s' }} />
                                    <div>
                                      <p style={{ margin:0, fontSize:14, fontWeight:800, color:active?T.goldDk:T.text }}>{r.type}</p>
                                      {r.capacity && <p style={{ margin:0, fontSize:11, color:T.textLight, fontWeight:600 }}>Up to {r.capacity} guests</p>}
                                    </div>
                                  </div>
                                  <div style={{ textAlign:'right' }}>
                                    <span style={{ fontSize:16, fontWeight:900, color:active?T.goldDk:T.text }}>LKR {r.pricePerNight?.toLocaleString()}</span>
                                    <span style={{ fontSize:11, color:T.textLight, fontWeight:600 }}>/night</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Room count */}
                    <div style={{ marginBottom:16 }}>
                      <Lbl>Number of Rooms</Lbl>
                      <Counter label="Rooms" value={form.roomCount} min={1} max={10} onChange={v=>setForm(f=>({...f,roomCount:v}))} />
                    </div>

                    {/* Guests */}
                    <div style={{ marginBottom:4 }}>
                      <Lbl>Guests</Lbl>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        <Counter label="Adults" sub="Age 13+" value={form.adults} min={1} max={20} onChange={v=>setForm(f=>({...f,adults:v}))} />
                        <Counter label="Children" sub="Age 0–12" value={form.children} min={0} max={20} onChange={v=>setForm(f=>({...f,children:v}))} />
                      </div>
                    </div>

                    {/* Capacity warning */}
                    {capacityWarning && (
                      <div className="warn-pulse" style={{ marginTop:14, display:'flex', alignItems:'center', gap:10, background:'#fef2f2', border:`1.5px solid #fca5a5`, color:T.red, borderRadius:13, padding:'12px 16px', fontSize:13, fontWeight:700 }}>
                        ⚠️ {totalGuests} guests exceeds room capacity of {maxCapacity}. Add more rooms or reduce guests.
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 1: Guest Details ── */}
                {step === 1 && (
                  <div className="bk-card step-enter" style={{ padding:28 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                      <span style={{ width:36, height:36, borderRadius:10, background:T.goldBg, border:`1px solid ${T.goldBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👤</span>
                      <h2 style={{ fontSize:18, fontWeight:900, color:T.text, margin:0, fontFamily:"'Playfair Display',serif" }}>Guest Information</h2>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                      <Field label="First Name" error={errors.firstName}>
                        <input className="bk-inp" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="John" {...inpFocus} />
                      </Field>
                      <Field label="Last Name" error={errors.lastName}>
                        <input className="bk-inp" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Smith" {...inpFocus} />
                      </Field>
                      <Field label="Email Address" error={errors.email}>
                        <input className="bk-inp" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@email.com" {...inpFocus} />
                      </Field>
                      <Field label="Phone Number" error={errors.phone}>
                        <input className="bk-inp" name="phone" value={form.phone} onChange={handleChange} required placeholder="+94 77 123 4567" {...inpFocus} />
                      </Field>
                    </div>

                    <Field label="Special Requests (Optional)">
                      <textarea className="bk-inp" name="specialRequests" value={form.specialRequests} onChange={handleChange}
                        rows={3} placeholder="Late check-in, dietary requirements, room preferences…"
                        style={{ resize:'vertical' }} {...inpFocus} />
                    </Field>

                    {/* Info notice */}
                    <div style={{ marginTop:16, display:'flex', alignItems:'flex-start', gap:12, background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:13, padding:'14px 16px' }}>
                      <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🔒</span>
                      <p style={{ fontSize:12, color:'#1e40af', fontWeight:600, margin:0, lineHeight:1.6 }}>
                        Your personal details are encrypted and securely stored. We never share your information with third parties.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Payment ── */}
                {step === 2 && (
                  <div className="bk-card step-enter" style={{ padding:28 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ width:36, height:36, borderRadius:10, background:T.goldBg, border:`1px solid ${T.goldBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>💳</span>
                      <h2 style={{ fontSize:18, fontWeight:900, color:T.text, margin:0, fontFamily:"'Playfair Display',serif" }}>Payment</h2>
                    </div>
                    <p style={{ fontSize:13, color:T.textLight, marginBottom:22, lineHeight:1.65 }}>
                      Complete your bank transfer and upload the payment slip below. Our team verifies slips within 24 hours.
                    </p>

                    {/* Bank details card */}
                    <div style={{ background:`linear-gradient(135deg,${T.navyMid},${T.navy})`, borderRadius:18, padding:'20px 22px', marginBottom:22, border:`1px solid rgba(255,255,255,0.08)` }}>
                      <p style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.13em', margin:'0 0 14px' }}>Bank Transfer Details</p>
                      {[
                        ['Bank', 'Commercial Bank of Ceylon'],
                        ['Account Name', 'Ceylon Compass (Pvt) Ltd'],
                        ['Account Number', '1234 5678 9012'],
                        ['Branch', 'Colombo Main'],
                        ['Reference', `HTL-${id?.slice(-6).toUpperCase()}`],
                      ].map(([k,v])=>(
                        <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12 }}>
                          <span style={{ color:'rgba(255,255,255,0.45)', fontWeight:600 }}>{k}</span>
                          <span style={{ color:'#fff', fontWeight:800, fontFamily: k==='Account Number'?'monospace':undefined }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:12, paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ color:T.goldLt, fontWeight:800, fontSize:12 }}>Total Amount</span>
                        <span style={{ color:T.gold, fontWeight:900, fontSize:18 }}>{LKR(total)}</span>
                      </div>
                    </div>

                    {/* File upload */}
                    <Lbl>Upload Payment Slip *</Lbl>
                    <div
                      ref={dropRef}
                      className={`drop-zone${dropActive?' active':''}`}
                      onClick={() => document.getElementById('slip-input').click()}
                      onDragOver={e => { e.preventDefault(); setDropActive(true); }}
                      onDragLeave={() => setDropActive(false)}
                      onDrop={e => { e.preventDefault(); setDropActive(false); const f=e.dataTransfer.files[0]; if(f) handleSlipFile(f); }}
                    >
                      {slipPreview ? (
                        <div style={{ position:'relative' }}>
                          <img src={slipPreview} alt="Slip preview" style={{ maxHeight:180, borderRadius:10, objectFit:'contain', display:'block', margin:'0 auto' }} />
                          <button type="button" onClick={e=>{e.stopPropagation();setSlipFile(null);setSlipPreview(null);}} style={{ position:'absolute', top:-8, right:0, width:28, height:28, borderRadius:'50%', background:T.red, border:'none', color:'#fff', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>×</button>
                          <p style={{ fontSize:12, color:T.emerald, fontWeight:800, marginTop:10, marginBottom:0 }}>✓ {slipFile?.name}</p>
                        </div>
                      ) : (
                        <>
                          <div style={{ width:48, height:48, borderRadius:14, background:T.goldBg, border:`1px solid ${T.goldBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22 }}>📎</div>
                          <p style={{ fontWeight:800, color:T.text, margin:'0 0 4px', fontSize:14 }}>Drop your slip here or click to browse</p>
                          <p style={{ color:T.textLight, fontSize:12, margin:0 }}>Supports JPG, PNG, PDF · Max 10 MB</p>
                        </>
                      )}
                    </div>
                    <input id="slip-input" type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleSlipFile(e.target.files?.[0]||null)} />

                    {/* Guarantees */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:18 }}>
                      {[
                        ['🔒','Secure Booking','256-bit encryption'],
                        ['✅','Verified Hotels','Quality assured'],
                        ['⏰','24h Confirmation','Fast processing'],
                        ['📞','24/7 Support','Always here to help'],
                      ].map(([ic,t,s])=>(
                        <div key={t} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#f9fafb', border:`1px solid ${T.border}` }}>
                          <span style={{ fontSize:18 }}>{ic}</span>
                          <div>
                            <p style={{ margin:0, fontSize:12, fontWeight:800, color:T.text }}>{t}</p>
                            <p style={{ margin:0, fontSize:10, color:T.textLight, fontWeight:600 }}>{s}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Navigation buttons ── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:20 }}>
                  <button type="button" onClick={() => setStep(s => s-1)} style={{
                    visibility: step === 0 ? 'hidden' : 'visible',
                    padding:'12px 24px', background:'#fff', border:`1.5px solid ${T.border}`,
                    color:T.textMid, fontWeight:700, borderRadius:14, fontSize:14, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:8, transition:'all .2s',
                    fontFamily:"'DM Sans',sans-serif",
                  }}
                    onMouseOver={e=>{e.currentTarget.style.borderColor=T.borderMid;e.currentTarget.style.transform='translateX(-2px)';}}
                    onMouseOut={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform='translateX(0)';}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                    Back
                  </button>

                  {step < 2 ? (
                    <button type="button" onClick={goNext} disabled={!canProceed()} style={{
                      padding:'13px 30px', borderRadius:14, border:'none', cursor: canProceed() ? 'pointer' : 'not-allowed',
                      background: canProceed() ? `linear-gradient(135deg,${T.gold},${T.goldDk})` : '#e5e7eb',
                      color: canProceed() ? '#fff' : '#9ca3af',
                      fontWeight:800, fontSize:14,
                      boxShadow: canProceed() ? `0 6px 20px rgba(245,158,11,0.38)` : 'none',
                      transition:'all .25s', display:'flex', alignItems:'center', gap:8,
                      fontFamily:"'DM Sans',sans-serif",
                    }}
                      onMouseOver={e=>{ if(canProceed()){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 28px rgba(245,158,11,0.48)`;} }}
                      onMouseOut={e=>{ e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=canProceed()?`0 6px 20px rgba(245,158,11,0.38)`:'none'; }}>
                      Continue
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <button type="submit" disabled={submitting || !slipFile} style={{
                      padding:'13px 28px', borderRadius:14, border:'none',
                      cursor: (submitting || !slipFile) ? 'not-allowed' : 'pointer',
                      background: (submitting || !slipFile) ? '#e5e7eb' : `linear-gradient(135deg,${T.gold},${T.goldDk})`,
                      color: (submitting || !slipFile) ? '#9ca3af' : '#fff',
                      fontWeight:900, fontSize:14,
                      boxShadow: (!submitting && slipFile) ? `0 6px 22px rgba(245,158,11,0.42)` : 'none',
                      transition:'all .25s', display:'flex', alignItems:'center', gap:10,
                      fontFamily:"'DM Sans',sans-serif",
                    }}
                      onMouseOver={e=>{ if(!submitting&&slipFile){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 12px 30px rgba(245,158,11,0.52)`;} }}
                      onMouseOut={e=>{ e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=(!submitting&&slipFile)?`0 6px 22px rgba(245,158,11,0.42)`:'none'; }}>
                      {submitting
                        ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>Processing…</>
                        : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>Pay & Confirm — {LKR(total)}</>
                      }
                    </button>
                  )}
                </div>
              </div>

              {/* ═══════════════════════════════
                  RIGHT — STICKY SUMMARY
              ═══════════════════════════════ */}
              <div style={{ position:'sticky', top:24 }}>
                <div className="bk-card" style={{ overflow:'hidden' }}>
                  {/* Hotel image */}
                  <div style={{ position:'relative', height:170, overflow:'hidden' }}>
                    <img src={hotel.images?.[0]||'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'} alt={hotel.name}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform .5s' }}
                      onMouseOver={e=>{e.currentTarget.style.transform='scale(1.05)';}}
                      onMouseOut={e=>{e.currentTarget.style.transform='scale(1)';}} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.45),transparent 55%)' }} />
                    <div style={{ position:'absolute', bottom:12, left:14 }}>
                      <p style={{ color:'#fff', fontWeight:900, fontSize:16, margin:0, fontFamily:"'Playfair Display',serif", textShadow:'0 2px 6px rgba(0,0,0,0.4)' }}>{hotel.name}</p>
                      <p style={{ color:T.goldLt, fontSize:13, margin:'3px 0 0' }}>{'★'.repeat(hotel.starRating||3)}</p>
                    </div>
                  </div>

                  {/* Summary body */}
                  <div style={{ padding:'20px 22px' }}>
                    <p style={{ fontSize:11, fontWeight:800, color:T.textLight, textTransform:'uppercase', letterSpacing:'0.12em', margin:'0 0 16px' }}>Booking Summary</p>

                    {/* Date row */}
                    {form.checkIn && form.checkOut && (
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'11px 14px', background:T.goldBg, border:`1px solid ${T.goldBorder}`, borderRadius:12 }}>
                        <span style={{ fontSize:16 }}>🗓️</span>
                        <div style={{ fontSize:12, fontWeight:700, color:T.goldDk }}>
                          {form.checkIn} → {form.checkOut}
                          {nights > 0 && <span style={{ marginLeft:8, background:T.gold, color:'#fff', padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:800 }}>{nights}n</span>}
                        </div>
                      </div>
                    )}

                    {/* Line items */}
                    <div style={{ display:'flex', flexDirection:'column', gap:10, borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
                      {[
                        ['Room Type', form.roomType||'Standard'],
                        ['Location', hotel.location],
                        [`${LKR(discountedPrice)} × ${form.roomCount} × ${nights}n`, LKR(subtotal)],
                        ['Service Charge (10%)', LKR(tax)],
                      ].map(([k,v])=>(
                        <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13 }}>
                          <span style={{ color:T.textLight, fontWeight:600, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:8 }}>{k}</span>
                          <span style={{ color:T.text, fontWeight:700, flexShrink:0 }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div style={{ marginTop:14, paddingTop:14, borderTop:`2px dashed ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontWeight:900, fontSize:15, color:T.text }}>Total</span>
                      <span style={{ fontWeight:900, fontSize:22, color:T.goldDk }}>{LKR(total)}</span>
                    </div>

                    {/* Savings */}
                    {hotel.discount > 0 && (
                      <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8, background:T.emeraldBg, border:'1px solid #a7f3d0', borderRadius:10, padding:'9px 13px' }}>
                        <span style={{ fontSize:14 }}>🎉</span>
                        <span style={{ fontSize:12, fontWeight:800, color:T.emerald }}>
                          You're saving {LKR(pricePerNight * (hotel.discount/100) * nights * form.roomCount)} with the {hotel.discount}% deal!
                        </span>
                      </div>
                    )}

                    {/* Free cancellation */}
                    <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, padding:'9px 13px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10 }}>
                      <span style={{ fontSize:14 }}>✅</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#166534' }}>Free cancellation within 24 hours</span>
                    </div>

                    {/* Step indicator in summary */}
                    <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
                      <p style={{ fontSize:10, fontWeight:800, color:T.textLight, textTransform:'uppercase', letterSpacing:'0.1em', margin:'0 0 10px' }}>Your Progress</p>
                      <div style={{ display:'flex', gap:6 }}>
                        {STEPS.map((s,i)=>(
                          <div key={s.label} style={{ flex:1, height:4, borderRadius:99, background: i<=step ? T.gold : T.border, transition:'background .4s' }} />
                        ))}
                      </div>
                      <p style={{ fontSize:11, color:T.textLight, margin:'8px 0 0', fontWeight:600 }}>Step {step+1} of {STEPS.length} — {STEPS[step].label}</p>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div style={{ marginTop:14, display:'flex', justifyContent:'center', gap:20 }}>
                  {['🔒 Secure','⭐ Verified','📞 Support'].map(b=>(
                    <span key={b} style={{ fontSize:11, fontWeight:700, color:T.textLight }}>{b}</span>
                  ))}
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>

      {bookingSuccess && <SuccessModal data={bookingData} onClose={() => { setBookingSuccess(false); navigate('/profile'); }} />}
    </Layout>
  );
}