import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { formatLKR } from '../../utils/currency';

const STEPS = ['Dates & Room', 'Guest Details', 'Payment'];

const inputStyle = {
  width: '100%',
  background: '#f9fafb',
  border: '2px solid #e5e7eb',
  color: '#111827',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' };
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' };

export default function HotelBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    specialRequests: '',
    checkIn: '',
    checkOut: '',
    roomType: '',
    roomCount: 1,
    adults: 1,
    children: 0,
  });

  const TAX_RATE = 0.10;

  useEffect(() => {
    api.get(`/hotels/${id}`)
      .then((res) => {
        setHotel(res.data);
        if (res.data.rooms?.length > 0) setForm((f) => ({ ...f, roomType: res.data.rooms[0].type }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;

  const selectedRoom = hotel?.rooms?.find((r) => r.type === form.roomType);
  const pricePerNight = selectedRoom?.pricePerNight || hotel?.pricePerNight || 0;
  const discountedPrice = pricePerNight * (1 - (hotel?.discount || 0) / 100);
  const subtotal = discountedPrice * form.roomCount * nights;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const totalGuests = Number(form.adults) + Number(form.children);
  const maxCapacity = (selectedRoom?.capacity || 2) * form.roomCount;
  const capacityWarning = totalGuests > maxCapacity;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to book');
    if (nights <= 0) return toast.error('Please select valid dates');
    if (!slipFile) return toast.error('Please upload your payment slip');
    setSubmitting(true);
    try {
      const bookingData = {
        hotelId: id, roomType: form.roomType, roomCount: form.roomCount,
        checkIn: form.checkIn, checkOut: form.checkOut,
        guests: { adults: form.adults, children: form.children },
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone, specialRequests: form.specialRequests,
        pricePerNight: discountedPrice, subtotal, tax, totalPrice: total,
      };
      const { data: booking } = await api.post('/hotels/bookings/create', bookingData);
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('source', 'hotel');
      formData.append('referenceId', booking._id);
      formData.append('amount', total);
      await api.post('/payments/upload-slip', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Booking confirmed! Payment slip submitted for approval.');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally { setSubmitting(false); }
  };

  const canProceed = () => {
    if (step === 0) return form.checkIn && form.checkOut && nights > 0 && !capacityWarning;
    if (step === 1) return form.firstName && form.lastName && form.email && form.phone;
    return true;
  };

  if (loading) return (
    <Layout><div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div></Layout>
  );

  if (!hotel) return (
    <Layout><div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
      Hotel not found. <Link to="/hotels" style={{ color: '#d97706', marginLeft: 4 }}>← Back</Link>
    </div></Layout>
  );

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#1a1a2e', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 60px' }}>
          {/* Back + Title */}
          <div style={{ marginBottom: '24px' }}>
            <Link to={`/hotels/${id}`} style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>← Back to {hotel.name}</Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginTop: '8px' }}>Complete Your Booking</h1>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', gap: '0' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, transition: 'all 0.3s',
                    background: i < step ? 'linear-gradient(135deg, #22c55e, #16a34a)' : i === step ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#e5e7eb',
                    color: i <= step ? '#fff' : '#9ca3af',
                    boxShadow: i === step ? '0 4px 15px rgba(245,158,11,0.4)' : i < step ? '0 4px 12px rgba(34,197,94,0.3)' : 'none',
                  }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600, color: i === step ? '#d97706' : i < step ? '#16a34a' : '#9ca3af' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: '80px', height: '3px', margin: '0 8px', marginBottom: '24px', borderRadius: '4px', background: i < step ? '#22c55e' : '#e5e7eb', transition: 'background 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px', alignItems: 'start' }}>
              {/* Left — Step Content */}
              <div>
                {step === 0 && (
                  <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Dates & Room</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>Check-in</label>
                        <input name="checkIn" type="date" value={form.checkIn} onChange={handleChange} required
                          min={new Date().toISOString().split('T')[0]} style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Check-out</label>
                        <input name="checkOut" type="date" value={form.checkOut} onChange={handleChange} required
                          min={form.checkIn || new Date().toISOString().split('T')[0]} style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      {hotel.rooms?.length > 0 && (
                        <div>
                          <label style={labelStyle}>Room Type</label>
                          <select name="roomType" value={form.roomType} onChange={handleChange} style={inputStyle}>
                            {hotel.rooms.map((r) => (
                              <option key={r.type} value={r.type}>{r.type} — {formatLKR(r.pricePerNight)}/night</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label style={labelStyle}>Rooms</label>
                        <input name="roomCount" type="number" min="1" max="10" value={form.roomCount} onChange={handleChange} style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Adults</label>
                        <input name="adults" type="number" min="1" value={form.adults} onChange={handleChange} style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Children</label>
                        <input name="children" type="number" min="0" value={form.children} onChange={handleChange} style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                    </div>
                    {capacityWarning && (
                      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }}>
                        ⚠️ Guest count exceeds room capacity ({maxCapacity}). Please add more rooms.
                      </div>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Guest Details</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={labelStyle}>First Name</label>
                        <input name="firstName" value={form.firstName} onChange={handleChange} required style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Last Name</label>
                        <input name="lastName" value={form.lastName} onChange={handleChange} required style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <input name="phone" value={form.phone} onChange={handleChange} required style={inputStyle}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                      </div>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <label style={labelStyle}>Special Requests (Optional)</label>
                      <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3}
                        placeholder="Late check-in, dietary requirements..."
                        style={{ ...inputStyle, resize: 'none' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={cardStyle}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Payment</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                      Upload your bank transfer or payment slip. Our team will verify within 24 hours.
                    </p>
                    <label style={labelStyle}>Payment Slip Image *</label>
                    <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files[0])}
                      style={{ display: 'block', width: '100%', fontSize: '14px', color: '#6b7280' }} />
                    {slipFile && (
                      <p style={{ fontSize: '13px', color: '#16a34a', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ✓ Selected: {slipFile.name}
                      </p>
                    )}
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#1d4ed8', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }}>
                      🔒 Free cancellation within 24 hours of booking.
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                  <button type="button" onClick={() => setStep((s) => s - 1)}
                    style={{
                      padding: '12px 24px', background: '#fff', border: '2px solid #e5e7eb', color: '#4b5563', fontWeight: 600,
                      borderRadius: '12px', fontSize: '14px', cursor: 'pointer', visibility: step === 0 ? 'hidden' : 'visible',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}>
                    ← Back
                  </button>
                  {step < 2 ? (
                    <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
                      style={{
                        padding: '12px 28px', background: canProceed() ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#e5e7eb',
                        color: canProceed() ? '#fff' : '#9ca3af', fontWeight: 700, borderRadius: '12px', border: 'none',
                        cursor: canProceed() ? 'pointer' : 'not-allowed', fontSize: '14px',
                        boxShadow: canProceed() ? '0 4px 15px rgba(245,158,11,0.4)' : 'none',
                      }}>
                      Continue →
                    </button>
                  ) : (
                    <button type="submit" disabled={submitting || !slipFile}
                      style={{
                        padding: '12px 32px', background: (submitting || !slipFile) ? '#e5e7eb' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: (submitting || !slipFile) ? '#9ca3af' : '#fff', fontWeight: 700, borderRadius: '12px', border: 'none',
                        cursor: (submitting || !slipFile) ? 'not-allowed' : 'pointer', fontSize: '14px',
                        boxShadow: (submitting || !slipFile) ? 'none' : '0 4px 15px rgba(245,158,11,0.4)',
                      }}>
                      {submitting ? 'Processing...' : `Pay & Book — ${formatLKR(Math.round(total))}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Right — Sticky Summary */}
              <div style={{ position: 'sticky', top: '96px' }}>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                  <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                    alt={hotel.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ color: '#111827', fontWeight: 700, fontSize: '18px' }}>{hotel.name}</h3>
                    <p style={{ color: '#f59e0b', fontSize: '14px', margin: '4px 0' }}>{'★'.repeat(hotel.starRating || 3)}</p>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>{hotel.location}</p>

                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                        <span>Room Type</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{form.roomType || 'Standard'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                        <span>{formatLKR(Math.round(discountedPrice))} x {form.roomCount} x {nights}n</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{formatLKR(Math.round(subtotal))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                        <span>Service Charge (10%)</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{formatLKR(Math.round(tax))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#111827' }}>Total</span>
                        <span style={{ color: '#d97706' }}>{formatLKR(Math.round(total))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
