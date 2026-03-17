import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const vehicleIcons = { car: '🚗', van: '🚐', bus: '🚌' };
const PLACEHOLDER = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';

const sectionStyle = {
  background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
  padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const labelStyle = {
  display: 'block', fontSize: '13px', fontWeight: 700,
  color: '#374151', marginBottom: '8px',
};

const inputStyle = {
  width: '100%', background: '#f9fafb', color: '#111827',
  border: '2px solid #e5e7eb', borderRadius: '12px',
  padding: '12px 16px', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.2s',
};

export default function TourBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    vehicle: 'car',
    travelers: 1,
    startDate: '',
    notes: '',
    slip: null,
  });

  useEffect(() => {
    api.get(`/tours/${id}`).then((r) => { setPkg(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const multiplier = pkg?.vehicleMultipliers?.[form.vehicle] || 1;
  const totalPrice = pkg ? pkg.basePrice * multiplier * form.travelers : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate) return toast.error('Please select a start date');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('packageId', id);
      fd.append('vehicle', form.vehicle);
      fd.append('travelers', form.travelers);
      fd.append('startDate', form.startDate);
      fd.append('notes', form.notes);
      if (form.slip) fd.append('slip', form.slip);
      await api.post('/tours/bookings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Booking submitted! Awaiting confirmation.');
      navigate('/my-tours');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ height: '20px', background: '#e5e7eb', borderRadius: '10px', width: '200px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '28px', background: '#e5e7eb', borderRadius: '10px', width: '280px', marginBottom: '32px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: '100px', background: '#e5e7eb', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
            <div style={{ height: '340px', background: '#e5e7eb', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!pkg) return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>Package not found.</p>
      </div>
    </Layout>
  );

  const vehicles = pkg.vehicleOptions?.length ? pkg.vehicleOptions : ['car', 'van', 'bus'];

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#111827', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            <Link to="/tours" style={{ color: '#6b7280', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d97706'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}>
              Tours
            </Link>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link to={`/tours/${id}`} style={{ color: '#6b7280', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d97706'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}>
              {pkg.name}
            </Link>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span style={{ color: '#374151', fontWeight: 600 }}>Book</span>
          </nav>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '32px' }}>Complete Your Booking</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px', alignItems: 'start' }}>

            {/* LEFT: Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Vehicle Selector */}
              <div style={sectionStyle}>
                <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '16px' }}>Select Vehicle Type</h2>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vehicles.length}, 1fr)`, gap: '12px' }}>
                  {vehicles.map((v) => {
                    const price = (pkg.basePrice * (pkg.vehicleMultipliers?.[v] || 1)).toFixed(0);
                    const selected = form.vehicle === v;
                    return (
                      <button key={v} type="button"
                        onClick={() => setForm((f) => ({ ...f, vehicle: v }))}
                        style={{
                          padding: '18px 12px', borderRadius: '14px', textAlign: 'center',
                          cursor: 'pointer', transition: 'all 0.2s',
                          border: selected ? '2px solid #f59e0b' : '2px solid #e5e7eb',
                          background: selected ? '#fffbeb' : '#f9fafb',
                          boxShadow: selected ? '0 4px 15px rgba(245,158,11,0.2)' : 'none',
                        }}
                        onMouseEnter={(e) => { if (!selected) { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fffbeb'; } }}
                        onMouseLeave={(e) => { if (!selected) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; } }}
                      >
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>{vehicleIcons[v]}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'capitalize', color: selected ? '#92400e' : '#374151' }}>{v}</div>
                        <div style={{ fontSize: '12px', marginTop: '4px', color: selected ? '#d97706' : '#9ca3af', fontWeight: 600 }}>${price}/person</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travelers */}
              <div style={sectionStyle}>
                <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '16px' }}>Number of Travelers</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, travelers: Math.max(1, f.travelers - 1) }))}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#f3f4f6', border: '2px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#374151', fontSize: '20px', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}>
                    −
                  </button>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#111827', width: '40px', textAlign: 'center', userSelect: 'none' }}>
                    {form.travelers}
                  </span>
                  <button type="button"
                    onClick={() => setForm((f) => ({ ...f, travelers: Math.min(20, f.travelers + 1) }))}
                    style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#f3f4f6', border: '2px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#374151', fontSize: '20px', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}>
                    +
                  </button>
                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px' }}>
                    {form.travelers === 1 ? 'traveler' : 'travelers'}
                  </span>
                </div>
              </div>

              {/* Date & Notes */}
              <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    Start Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="date" value={form.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                    required />
                </div>
                <div>
                  <label style={labelStyle}>
                    Special Requests <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    placeholder="Dietary requirements, accessibility needs, special preferences..."
                    style={{ ...inputStyle, resize: 'none' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                </div>
              </div>

              {/* Payment Slip Upload */}
              <div style={sectionStyle}>
                <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '4px' }}>Payment Slip</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Upload your payment receipt. You can also upload this later.</p>
                <label
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${dragOver ? '#f59e0b' : '#d1d5db'}`,
                    background: dragOver ? '#fffbeb' : '#f9fafb',
                    borderRadius: '14px', padding: '36px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fffbeb'; } }}
                  onMouseLeave={(e) => { if (!dragOver) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb'; } }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) setForm((f) => ({ ...f, slip: file }));
                  }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={(e) => setForm((f) => ({ ...f, slip: e.target.files[0] }))} />
                  {form.slip ? (
                    <>
                      <span style={{ fontSize: '32px', marginBottom: '8px' }}>📎</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400e' }}>{form.slip.name}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Click to change file</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '32px', marginBottom: '8px' }}>📤</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>Drag & drop or click to upload</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>JPG, PNG, WebP accepted</span>
                    </>
                  )}
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting}
                style={{
                  width: '100%',
                  background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontWeight: 700, fontSize: '16px',
                  padding: '16px 0', borderRadius: '14px', border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 4px 15px rgba(245,158,11,0.4)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(245,158,11,0.5)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = submitting ? 'none' : '0 4px 15px rgba(245,158,11,0.4)'; }}>
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <svg style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                ) : 'Confirm Booking'}
              </button>
            </form>

            {/* RIGHT: Summary */}
            <div>
              <div style={{
                position: 'sticky', top: '96px',
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px',
                overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}>
                {/* Thumbnail */}
                <div style={{ height: '160px', overflow: 'hidden', background: '#f3f4f6' }}>
                  <img src={pkg.images?.[0] || PLACEHOLDER} alt={pkg.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} />
                </div>

                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontWeight: 800, color: '#111827', fontSize: '16px', lineHeight: 1.3, marginBottom: '4px' }}>{pkg.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                    {pkg.duration} {pkg.duration === 1 ? 'day' : 'days'} · {vehicleIcons[form.vehicle]} {form.vehicle}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>Base price</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>${pkg.basePrice} / person</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>Vehicle ({form.vehicle})</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>×{multiplier.toFixed(1)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>Travelers</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>×{form.travelers}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f3f4f6', paddingTop: '14px', marginTop: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#111827', fontSize: '16px' }}>Total</span>
                      <span style={{ fontWeight: 800, color: '#d97706', fontSize: '26px' }}>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirmed upon admin approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
