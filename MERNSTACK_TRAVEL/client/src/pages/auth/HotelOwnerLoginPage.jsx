import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { Mail, Lock, Phone, MapPin, User, Building2 } from 'lucide-react';

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes slideLeft  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
  @keyframes shimmer  { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes floatUp  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes gradShift {
    0%  { background-position:0% 50%; }
    50% { background-position:100% 50%; }
    100%{ background-position:0% 50%; }
  }

  .ho-page {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    background: #0f1623;
    position:relative;
    overflow:hidden;
    display:flex;
    align-items:center;
    justify-content:center;
  }

  /* Animated gradient background */
  .ho-bg-gradient {
    position:absolute; inset:0; z-index:0;
    background: linear-gradient(135deg, #0f1623 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%);
    background-size:400% 400%;
    animation:gradShift 12s ease infinite;
  }

  /* Floating orbs */
  .ho-orb {
    position:absolute; border-radius:50%; filter:blur(80px);
    pointer-events:none; z-index:0;
  }

  /* Card */
  .ho-card {
    position:relative; z-index:10;
    background:rgba(255,255,255,0.04);
    backdrop-filter:blur(24px);
    -webkit-backdrop-filter:blur(24px);
    border:1px solid rgba(255,255,255,0.09);
    border-radius:28px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07);
    animation:fadeUp .65s cubic-bezier(.22,1,.36,1) both;
  }

  /* Input field base */
  .ho-inp {
    width:100%; border-radius:14px;
    background:rgba(255,255,255,0.06);
    border:1.5px solid rgba(255,255,255,0.10);
    color:#fff; outline:none;
    font-family:'DM Sans',sans-serif;
    font-size:14px; font-weight:500;
    transition:border-color .2s, box-shadow .2s, background .2s;
  }
  .ho-inp::placeholder { color:rgba(255,255,255,0.28); }
  .ho-inp:focus {
    border-color:#f59e0b;
    background:rgba(255,255,255,0.09);
    box-shadow:0 0 0 3px rgba(245,158,11,0.18);
  }

  /* Tab pill */
  .ho-tab-active {
    background:linear-gradient(135deg,#f59e0b,#d97706) !important;
    color:#1a1a2e !important;
    box-shadow:0 4px 18px rgba(245,158,11,0.35) !important;
  }
  .ho-tab-inactive {
    color:rgba(255,255,255,0.45);
    background:transparent;
  }
  .ho-tab-inactive:hover { color:rgba(255,255,255,0.75); background:rgba(255,255,255,0.06); }

  /* Submit button */
  .ho-btn {
    width:100%; padding:14px;
    border-radius:16px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#f59e0b,#d97706);
    color:#1a1a2e; font-weight:900; font-size:15px;
    font-family:'DM Sans',sans-serif; letter-spacing:0.01em;
    box-shadow:0 8px 28px rgba(245,158,11,0.38);
    transition:transform .22s, box-shadow .22s, filter .22s;
    display:flex; align-items:center; justify-content:center; gap:10px;
  }
  .ho-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:0 14px 36px rgba(245,158,11,0.50);
    filter:brightness(1.06);
  }
  .ho-btn:disabled {
    background:rgba(245,158,11,0.35);
    color:rgba(255,255,255,0.45);
    cursor:not-allowed;
    box-shadow:none;
  }

  /* Divider line */
  .ho-divider {
    display:flex; align-items:center; gap:12; margin:20px 0;
  }
  .ho-divider::before,.ho-divider::after {
    content:''; flex:1; height:1px;
    background:rgba(255,255,255,0.09);
  }

  /* Form animation */
  .form-slide-in { animation:slideLeft .38s cubic-bezier(.22,1,.36,1) both; }
  .form-slide-in-rev { animation:slideRight .38s cubic-bezier(.22,1,.36,1) both; }

  /* Feature list item */
  .ho-feature {
    display:flex; align-items:center; gap:12;
    padding:12px 14px; border-radius:14px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.07);
    transition:background .2s, border-color .2s, transform .2s;
  }
  .ho-feature:hover {
    background:rgba(245,158,11,0.08);
    border-color:rgba(245,158,11,0.25);
    transform:translateX(4px);
  }

  /* Password strength bar */
  .pw-bar { height:4px; border-radius:99px; transition:width .4s, background .4s; }
`;

/* ─── HELPERS ─── */
function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: 'Too short', color: '#ef4444' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Good',      color: '#22c55e' },
    { label: 'Strong',    color: '#10b981' },
  ];
  return { score: s, ...map[s] };
}

function InputField({ icon: Icon, label, name, type = 'text', value, onChange, placeholder, required = true, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:8 }}>
        {Icon && <Icon size={12} style={{ color:'#f59e0b' }} />}
        {label}
      </label>
      <div style={{ position:'relative' }}>
        {Icon && (
          <Icon size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused ? '#f59e0b' : 'rgba(255,255,255,0.28)', transition:'color .2s', pointerEvents:'none' }} />
        )}
        <input
          className="ho-inp"
          name={name} type={type} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          style={{ padding: Icon ? '12px 14px 12px 42px' : '12px 14px' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {children}
      </div>
    </div>
  );
}

/* ─── SPINNER ─── */
function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      style={{ animation:'spin .7s linear infinite' }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function HotelOwnerLoginPage({ initialMode = 'signin' }) {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();

  const [mode, setMode]       = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);

  const [signIn, setSignIn] = useState({ email: '', password: '' });
  const [signUp, setSignUp] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '', location: '',
  });

  const updateSignIn = e => setSignIn(p => ({ ...p, [e.target.name]: e.target.value }));
  const updateSignUp = e => setSignUp(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSignIn = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/hotel-owner/login', {
        email: signIn.email,
        password: signIn.password,
      });
      // Store token and update auth context
      localStorage.setItem('token', data.token);
      updateUser(data.user);
      toast.success(`Welcome back, ${data.user?.name || 'Hotel Owner'}!`);
      navigate('/hotel-owner/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sign in failed');
    } finally { setLoading(false); }
  };

  const handleSignUp = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (signUp.password !== signUp.confirmPassword) { toast.error('Passwords do not match'); return; }
      const response = await api.post('/auth/hotel-owner/register', {
        fullName: signUp.fullName, email: signUp.email,
        password: signUp.password, confirmPassword: signUp.confirmPassword,
        phone: signUp.phone, location: signUp.location,
      });
      
      // Backend returns token+user on success; store token and update auth context.
      if (response?.data?.token && response?.data?.user) {
        localStorage.setItem('token', response.data.token);
        updateUser(response.data.user);
        toast.success(`Welcome, ${response.data.user.name || 'Hotel Owner'}! Your account has been created successfully.`);
        navigate('/hotel-owner/dashboard');
      } else {
        toast.success('Account created! Please sign in.');
        setMode('signin');
        setSignIn(p => ({ ...p, email: signUp.email }));
      }
      setSignUp({ fullName:'', email:signUp.email, password:'', confirmPassword:'', phone:'', location:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const pw = pwStrength(signUp.password);

  const FEATURES = [
    { icon:'🏨', title:'Manage All Hotels',  desc:'Add, edit and organise your properties' },
    { icon:'📅', title:'Live Reservations',  desc:'Track bookings in real time' },
    { icon:'📊', title:'Revenue Insights',   desc:'Earnings reports and analytics' },
    { icon:'⭐', title:'Guest Reviews',       desc:'Respond to reviews & boost ratings' },
  ];

  return (
    <Layout>
      <style>{STYLES}</style>

      <div className="ho-page" style={{ padding:'20px' }}>
        {/* ── Animated background ── */}
        <div className="ho-bg-gradient" />

        {/* Floating orbs */}
        <div className="ho-orb" style={{ width:500, height:500, background:'rgba(245,158,11,0.07)', top:'-120px', right:'-100px', animation:'floatUp 8s ease-in-out infinite' }} />
        <div className="ho-orb" style={{ width:400, height:400, background:'rgba(96,165,250,0.05)', bottom:'-100px', left:'-80px', animation:'floatUp 11s ease-in-out infinite', animationDelay:'3s' }} />
        <div className="ho-orb" style={{ width:250, height:250, background:'rgba(245,158,11,0.05)', top:'40%', left:'20%', animation:'floatUp 7s ease-in-out infinite', animationDelay:'1.5s' }} />

        {/* ── Main container ── */}
        <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:980, display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, minHeight:600, borderRadius:28, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.6)', animation:'fadeUp .65s cubic-bezier(.22,1,.36,1)' }}>

          {/* ═══════════════════════════
              LEFT PANEL — Branding
          ═══════════════════════════ */}
          <div style={{
            background:'linear-gradient(145deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)',
            padding:'48px 40px', display:'flex', flexDirection:'column', justifyContent:'space-between',
            borderRight:'1px solid rgba(255,255,255,0.07)',
            position:'relative', overflow:'hidden',
          }}>
            {/* Decorative corner gold accent */}
            <div style={{ position:'absolute', top:0, right:0, width:180, height:180, background:'radial-gradient(circle at top right,rgba(245,158,11,0.14),transparent 65%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:0, left:0, width:220, height:220, background:'radial-gradient(circle at bottom left,rgba(245,158,11,0.08),transparent 65%)', pointerEvents:'none' }} />

            {/* Logo & title */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:36 }}>
                <div style={{
                  width:52, height:52, borderRadius:16,
                  background:'linear-gradient(135deg,#f59e0b,#d97706)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 8px 24px rgba(245,158,11,0.4)', flexShrink:0,
                }}>
                  <Building2 size={24} color="#1a1a2e" strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize:10, fontWeight:800, color:'rgba(245,158,11,0.7)', textTransform:'uppercase', letterSpacing:'0.18em', margin:0 }}>Ceylon Compass</p>
                  <p style={{ fontSize:16, fontWeight:900, color:'#fff', margin:0, fontFamily:"'Playfair Display',serif" }}>Hotel Owner Portal</p>
                </div>
              </div>

              <h2 style={{ fontSize:'clamp(1.6rem,2.8vw,2.2rem)', fontWeight:900, color:'#fff', lineHeight:1.18, margin:'0 0 14px', fontFamily:"'Playfair Display',serif" }}>
                Grow Your <span style={{ color:'#f59e0b' }}>Hospitality</span>{' '}Business
              </h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.7, margin:'0 0 36px', maxWidth:320 }}>
                Join hundreds of Sri Lankan hotel owners managing bookings, guests, and revenue — all in one place.
              </p>

              {/* Feature list */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {FEATURES.map((f, i) => (
                  <div key={f.title} className="ho-feature" style={{ animationDelay:`${i*80}ms` }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>{f.icon}</span>
                    <div>
                      <p style={{ fontSize:13, fontWeight:800, color:'#fff', margin:0 }}>{f.title}</p>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.4)', margin:0 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom stat strip */}
            <div style={{ display:'flex', gap:24, paddingTop:28, borderTop:'1px solid rgba(255,255,255,0.08)', marginTop:28 }}>
              {[['200+','Hotels Listed'],['15K+','Bookings Managed'],['4.9★','Owner Rating']].map(([v,l])=>(
                <div key={l}>
                  <p style={{ fontSize:18, fontWeight:900, color:'#f59e0b', margin:0, lineHeight:1 }}>{v}</p>
                  <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)', margin:'4px 0 0', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════
              RIGHT PANEL — Form
          ═══════════════════════════ */}
          <div style={{
            background:'rgba(15,22,35,0.96)',
            backdropFilter:'blur(24px)',
            padding:'44px 40px',
            display:'flex', flexDirection:'column', justifyContent:'center',
            overflowY:'auto',
          }}>

            {/* Mode tabs */}
            <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:5, marginBottom:32 }}>
              {[['signin','Sign In'],['signup','Create Account']].map(([m,lbl])=>(
                <button key={m} type="button" onClick={()=>setMode(m)} style={{
                  flex:1, padding:'10px 0', borderRadius:12, border:'none', cursor:'pointer',
                  fontSize:13, fontWeight:800, transition:'all .25s', fontFamily:"'DM Sans',sans-serif",
                }} className={mode===m?'ho-tab-active':'ho-tab-inactive'}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* ── SIGN IN FORM ── */}
            {mode === 'signin' && (
              <div className="form-slide-in" style={{ display:'flex', flexDirection:'column', gap:18 }}>
                <div style={{ marginBottom:6 }}>
                  <h3 style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0, fontFamily:"'Playfair Display',serif" }}>Welcome back</h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:'5px 0 0' }}>Sign in to your owner dashboard</p>
                </div>

                <form onSubmit={handleSignIn} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <InputField icon={Mail} label="Email Address" name="email" type="email"
                    value={signIn.email} onChange={updateSignIn} placeholder="owner@email.com" />

                  <div>
                    <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:8 }}>
                      <Lock size={12} style={{ color:'#f59e0b' }} /> Password
                    </label>
                    <div style={{ position:'relative' }}>
                      <Lock size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.28)', pointerEvents:'none' }} />
                      <input className="ho-inp" name="password" type={showPw?'text':'password'}
                        value={signIn.password} onChange={updateSignIn}
                        placeholder="Enter your password" required
                        style={{ padding:'12px 42px 12px 42px' }} />
                      <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:13, padding:0, transition:'color .2s' }}
                        onMouseOver={e=>{e.currentTarget.style.color='#f59e0b';}}
                        onMouseOut={e=>{e.currentTarget.style.color='rgba(255,255,255,0.35)';}}>
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(245,158,11,0.7)', fontWeight:700, padding:0, transition:'color .2s' }}
                      onMouseOver={e=>{e.currentTarget.style.color='#f59e0b';}}
                      onMouseOut={e=>{e.currentTarget.style.color='rgba(245,158,11,0.7)';}}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="ho-btn" style={{ marginTop:4 }}>
                    {loading ? <><Spinner /> Signing in…</> : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                      Sign In to Dashboard
                    </>}
                  </button>
                </form>

                <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:6 }}>
                  New hotel owner?{' '}
                  <button type="button" onClick={()=>setMode('signup')} style={{ background:'none', border:'none', cursor:'pointer', color:'#f59e0b', fontWeight:800, fontSize:12, padding:0 }}>
                    Create an account →
                  </button>
                </p>
              </div>
            )}

            {/* ── SIGN UP FORM ── */}
            {mode === 'signup' && (
              <div className="form-slide-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ marginBottom:2 }}>
                  <h3 style={{ fontSize:22, fontWeight:900, color:'#fff', margin:0, fontFamily:"'Playfair Display',serif" }}>Create your account</h3>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', margin:'5px 0 0' }}>Start managing your hotel today</p>
                </div>

                <form onSubmit={handleSignUp} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <InputField icon={User} label="Full Name" name="fullName"
                    value={signUp.fullName} onChange={updateSignUp} placeholder="Your full name" />

                  <InputField icon={Mail} label="Email Address" name="email" type="email"
                    value={signUp.email} onChange={updateSignUp} placeholder="owner@email.com" />

                  {/* Password row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:8 }}>
                        <Lock size={12} style={{ color:'#f59e0b' }} /> Password
                      </label>
                      <div style={{ position:'relative' }}>
                        <input className="ho-inp" name="password" type={showPw?'text':'password'}
                          value={signUp.password} onChange={updateSignUp}
                          placeholder="Create password" required
                          style={{ padding:'12px 38px 12px 14px' }} />
                        <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:12, padding:0, transition:'color .2s' }}
                          onMouseOver={e=>{e.currentTarget.style.color='#f59e0b';}}
                          onMouseOut={e=>{e.currentTarget.style.color='rgba(255,255,255,0.3)';}}>
                          {showPw?'🙈':'👁'}
                        </button>
                      </div>
                      {/* Password strength */}
                      {signUp.password && (
                        <div style={{ marginTop:7 }}>
                          <div style={{ height:4, borderRadius:99, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                            <div className="pw-bar" style={{ width:`${(pw.score/4)*100}%`, background:pw.color }} />
                          </div>
                          <p style={{ fontSize:10, fontWeight:700, color:pw.color, margin:'4px 0 0' }}>{pw.label}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.13em', marginBottom:8 }}>
                        <Lock size={12} style={{ color:'#f59e0b' }} /> Confirm
                      </label>
                      <div style={{ position:'relative' }}>
                        <input className="ho-inp" name="confirmPassword" type={showCPw?'text':'password'}
                          value={signUp.confirmPassword} onChange={updateSignUp}
                          placeholder="Repeat password" required
                          style={{ padding:'12px 38px 12px 14px', borderColor: signUp.confirmPassword && signUp.confirmPassword !== signUp.password ? '#ef4444' : undefined }} />
                        <button type="button" onClick={()=>setShowCPw(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:12, padding:0 }}>
                          {showCPw?'🙈':'👁'}
                        </button>
                      </div>
                      {signUp.confirmPassword && signUp.confirmPassword !== signUp.password && (
                        <p style={{ fontSize:10, color:'#ef4444', margin:'5px 0 0', fontWeight:700 }}>Passwords don't match</p>
                      )}
                      {signUp.confirmPassword && signUp.confirmPassword === signUp.password && (
                        <p style={{ fontSize:10, color:'#10b981', margin:'5px 0 0', fontWeight:700 }}>✓ Passwords match</p>
                      )}
                    </div>
                  </div>

                  {/* Phone + Location row */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <InputField icon={Phone} label="Phone Number" name="phone"
                      value={signUp.phone} onChange={updateSignUp} placeholder="+94 77 123 4567" />
                    <InputField icon={MapPin} label="Location" name="location"
                      value={signUp.location} onChange={updateSignUp} placeholder="City / Address" />
                  </div>

                  {/* Terms notice */}
                  <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', lineHeight:1.6, margin:0 }}>
                    By creating an account you agree to our{' '}
                    <span style={{ color:'rgba(245,158,11,0.7)', cursor:'pointer', fontWeight:700 }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color:'rgba(245,158,11,0.7)', cursor:'pointer', fontWeight:700 }}>Privacy Policy</span>.
                  </p>

                  <button type="submit" disabled={loading} className="ho-btn">
                    {loading ? <><Spinner /> Creating account…</> : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6"/></svg>
                      Create Owner Account
                    </>}
                  </button>
                </form>

                <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4 }}>
                  Already have an account?{' '}
                  <button type="button" onClick={()=>setMode('signin')} style={{ background:'none', border:'none', cursor:'pointer', color:'#f59e0b', fontWeight:800, fontSize:12, padding:0 }}>
                    Sign in →
                  </button>
                </p>
              </div>
            )}

            {/* Back to user login */}
            <div style={{ marginTop:24, paddingTop:18, borderTop:'1px solid rgba(255,255,255,0.07)', textAlign:'center' }}>
              <Link to="/login" style={{ fontSize:12, color:'rgba(255,255,255,0.28)', fontWeight:600, textDecoration:'none', transition:'color .2s', display:'inline-flex', alignItems:'center', gap:6 }}
                onMouseOver={e=>{e.currentTarget.style.color='rgba(255,255,255,0.6)';}}
                onMouseOut={e=>{e.currentTarget.style.color='rgba(255,255,255,0.28)';}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back to guest login
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}