import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateNumber,
  normalizeValue,
  isAllowedNumericKey,
  validatePaymentSlip,
} from '../../utils/guideValidation';

const inputStyle = {
  width: '100%', background: '#f9fafb', color: '#111827', fontSize: 14,
  border: '1.5px solid #e5e7eb', borderRadius: 12,
  padding: '12px 16px', outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3,
};

const card = {
  background: '#fff', border: '1px solid #e8eaed', borderRadius: 18,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const DEPOSIT_PERCENTAGE = 30;

export default function GuideBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    travelerName: user?.name || '',
    email: user?.email || '',
    phone: '',
    travelDate: '',
    days: 1,
    travelers: 1,
    location: '',
    specialRequests: '',
  });

  useEffect(() => {
    api.get(`/guides/${id}`)
      .then((res) => setGuide(res.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [id]);

  const validateField = (name, value, currentSlip = slipFile) => {
    if (name === 'travelerName') return validateName(value);
    if (name === 'email') return validateEmail(value);
    if (name === 'phone') return validatePhone(value);
    if (name === 'travelers') {
      return validateNumber(value, {
        min: 1,
        max: 20,
        invalidMessage: 'Enter valid number of travelers',
        rangeMessage: 'Enter valid number of travelers',
        requiredMessage: 'Enter valid number of travelers',
      });
    }
    if (name === 'travelDate') {
      const normalized = normalizeValue(value);
      if (!normalized) return 'Start date must be in the future';
      const selected = new Date(normalized);
      if (Number.isNaN(selected.getTime())) return 'Start date must be in the future';
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const selectedStart = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return selectedStart > todayStart ? '' : 'Start date must be in the future';
    }
    if (name === 'days') {
      return validateNumber(value, {
        min: 1,
        max: 30,
        invalidMessage: 'Number of days must be valid',
        rangeMessage: 'Number of days must be valid',
        requiredMessage: 'Number of days must be valid',
      });
    }
    if (name === 'location') return normalizeValue(value) ? '' : 'This field is required';
    if (name === 'depositSlip') return validatePaymentSlip(currentSlip);
    return '';
  };

  const validateForm = (currentForm = form, currentSlip = slipFile) => ({
    travelerName: validateField('travelerName', currentForm.travelerName, currentSlip),
    email: validateField('email', currentForm.email, currentSlip),
    phone: validateField('phone', currentForm.phone, currentSlip),
    travelers: validateField('travelers', currentForm.travelers, currentSlip),
    travelDate: validateField('travelDate', currentForm.travelDate, currentSlip),
    days: validateField('days', currentForm.days, currentSlip),
    location: validateField('location', currentForm.location, currentSlip),
    depositSlip: validateField('depositSlip', null, currentSlip),
  });

  const hasErrors = (formErrors) => Object.values(formErrors).some(Boolean);
  const getFieldStyle = (field) => ({ ...inputStyle, border: errors[field] ? '1.5px solid #ef4444' : inputStyle.border });

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'travelers' || name === 'days') && !/^\d*$/.test(value)) return;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, slipFile) }));
    }
  };

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSlipFile(file);
    if (touched.depositSlip) {
      setErrors((prev) => ({ ...prev, depositSlip: validateField('depositSlip', null, file) }));
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!user) {
      setError('Please login to book a guide');
      return;
    }

    const formErrors = validateForm();
    setErrors(formErrors);
    setTouched({
      travelerName: true,
      email: true,
      phone: true,
      travelers: true,
      travelDate: true,
      days: true,
      location: true,
      depositSlip: true,
    });

    if (hasErrors(formErrors)) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('guideId', id);
      formData.append('travelerName', normalizeValue(form.travelerName));
      formData.append('email', normalizeValue(form.email));
      formData.append('phone', normalizeValue(form.phone));
      formData.append('startDate', form.travelDate);
      formData.append('days', Number(form.days));
      formData.append('travelers', Number(form.travelers));
      formData.append('location', normalizeValue(form.location));
      formData.append('specialRequests', normalizeValue(form.specialRequests));
      formData.append('depositSlip', slipFile);

      await api.post('/guides/bookings/create', formData);

      toast.success('Booking request submitted!');
      navigate('/my-guides');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Booking failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const totalPrice = guide ? guide.pricePerDay * Number(form.days) : 0;
  const depositAmount = Math.round(totalPrice * DEPOSIT_PERCENTAGE / 100);
  const remainingAmount = totalPrice - depositAmount;

  const startDate = form.travelDate ? new Date(form.travelDate) : null;
  const endDate = startDate ? new Date(new Date(startDate).setDate(startDate.getDate() + Number(form.days) - 1)) : null;
  const canSubmit = !hasErrors(validateForm()) && !submitting;

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
      </div>
    </Layout>
  );

  if (!guide) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9ca3af' }}>
        Guide not found. <Link to="/services/guides" style={{ color: '#d97706' }}>Back</Link>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px 60px' }}>

          <div style={{ marginBottom: 28 }}>
            <Link to={`/guides/${id}`} style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => { e.target.style.color = '#d97706'; }} onMouseLeave={(e) => { e.target.style.color = '#9ca3af'; }}>
              Back to {guide.name}
            </Link>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '8px 0 0' }}>Request Your Guide</h1>
            <p style={{ fontSize: 14, color: '#9ca3af', marginTop: 4 }}>Fill in the details below to request {guide.name} for your trip</p>
          </div>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28, alignItems: 'start' }} className="booking-grid">

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ ...card, padding: '24px 26px' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</span>
                    Your Details
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input name="travelerName" value={form.travelerName} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('travelerName')} />
                      {errors.travelerName && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.travelerName}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('email')} />
                      {errors.email && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} style={getFieldStyle('phone')} placeholder="07XXXXXXXX" />
                      {errors.phone && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Travelers</label>
                      <input name="travelers" type="number" min="1" max="20" value={form.travelers} onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => { if (!isAllowedNumericKey(e)) e.preventDefault(); }} style={getFieldStyle('travelers')} />
                      {errors.travelers && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.travelers}</p>}
                    </div>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px 26px' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🗺️</span>
                    Trip Details
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Start Date</label>
                      <input name="travelDate" type="date" value={form.travelDate} onChange={handleChange} onBlur={handleBlur}
                        min={new Date().toISOString().split('T')[0]} style={getFieldStyle('travelDate')} />
                      {errors.travelDate && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.travelDate}</p>}
                    </div>
                    <div>
                      <label style={labelStyle}>Number of Days</label>
                      <input name="days" type="number" min="1" max="30" value={form.days} onChange={handleChange} onBlur={handleBlur} onKeyDown={(e) => { if (!isAllowedNumericKey(e)) e.preventDefault(); }} style={getFieldStyle('days')} />
                      {errors.days && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.days}</p>}
                    </div>
                    {endDate && (
                      <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
                        Trip: {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} ({form.days} day{Number(form.days) > 1 ? 's' : ''})
                      </div>
                    )}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Destination / Meeting Location</label>
                      <input name="location" value={form.location} onChange={handleChange} onBlur={handleBlur}
                        placeholder="e.g. Kandy, Ella, Sigiriya..." style={getFieldStyle('location')} />
                      {errors.location && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.location}</p>}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Special Requests (Optional)</label>
                      <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3}
                        placeholder="Any special requirements, preferences or accessibility needs..."
                        style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
                    </div>
                  </div>
                </div>

                <div style={{ ...card, padding: '24px 26px' }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💳</span>
                    Advance Deposit Payment
                  </h2>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
                    Upload your bank transfer slip for the advance deposit. Your booking request will be reviewed by the guide and our team before final confirmation.
                  </p>

                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '28px 20px', borderRadius: 14,
                    border: errors.depositSlip ? '2px dashed #ef4444' : '2px dashed #e5e7eb', background: '#fafafa',
                    cursor: 'pointer', transition: 'all 0.2s',
                    minHeight: 100,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = errors.depositSlip ? '#ef4444' : '#fcd34d'; e.currentTarget.style.background = '#fffbeb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = errors.depositSlip ? '#ef4444' : '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p style={{ fontSize: 14, color: '#6b7280', margin: '10px 0 0', textAlign: 'center' }}>
                      {slipFile ? (
                        <span style={{ color: '#059669', fontWeight: 600 }}>{slipFile.name}</span>
                      ) : (
                        <>Click to upload deposit payment slip</>
                      )}
                    </p>
                    <input type="file" accept="image/*,application/pdf" onChange={handleSlipChange} style={{ display: 'none' }} />
                  </label>
                  {errors.depositSlip && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{errors.depositSlip}</p>}

                  <div style={{
                    background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10,
                    padding: '12px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.6, marginTop: 14
                  }}>
                    <strong>Important:</strong> This payment secures your booking request and will be reviewed before final confirmation. Paying the deposit does not guarantee the selected guide until approval is completed.
                  </div>
                </div>

                <div style={{
                  ...card, padding: '20px 24px',
                }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>📋</span>
                    Cancellation Policy
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#6b7280', lineHeight: 2 }}>
                    <li>3+ days before trip: <strong style={{ color: '#059669' }}>Full deposit refund</strong></li>
                    <li>1-2 days before trip: <strong style={{ color: '#d97706' }}>50% deposit refund</strong></li>
                    <li>On trip date: <strong style={{ color: '#dc2626' }}>No refund</strong></li>
                    <li>Admin/guide cancellation: <strong style={{ color: '#059669' }}>Full deposit refund</strong></li>
                  </ul>
                </div>
              </div>

              <div style={{ ...card, overflow: 'hidden', position: 'sticky', top: 90 }}>
                {guide.image && (
                  <div style={{ height: 180, overflow: 'hidden' }}>
                    <img src={guide.image} alt={guide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '20px 22px 24px' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{guide.name}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
                      <span>📍</span> {guide.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
                      <span>🗣️</span> {guide.languages?.join(', ')}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Trip Summary</p>

                    <div style={{ fontSize: 14, color: '#374151' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Price Per Day</span>
                        <span>LKR {guide.pricePerDay?.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Duration</span>
                        <span>{form.days} day{Number(form.days) > 1 ? 's' : ''}</span>
                      </div>
                      {startDate && endDate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span>Dates</span>
                          <span style={{ fontSize: 12 }}>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 12, paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                        <span style={{ color: '#374151' }}>Total Trip Amount</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>LKR {totalPrice.toLocaleString()}</span>
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', marginBottom: 8,
                        padding: '10px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a'
                      }}>
                        <span style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>Advance Deposit ({DEPOSIT_PERCENTAGE}%)</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: '#d97706' }}>LKR {depositAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                        <span>Remaining Balance (pay later)</span>
                        <span>LKR {remainingAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div style={{
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                      padding: '10px 14px', marginTop: 16, fontSize: 13, color: '#dc2626',
                      fontWeight: 500, textAlign: 'center',
                    }}>
                      {error}
                    </div>
                  )}

                  <button type="button" onClick={handleSubmit} disabled={!canSubmit}
                    style={{
                      width: '100%', marginTop: 20, padding: '14px 0',
                      fontSize: 14, fontWeight: 700, color: '#fff',
                      background: !canSubmit ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: 'none', borderRadius: 14,
                      cursor: !canSubmit ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: !canSubmit ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
                    }}
                  >
                    {submitting ? 'Submitting...' : `Submit Request & Pay Deposit - LKR ${depositAmount.toLocaleString()}`}
                  </button>
                  <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 1.4 }}>
                    Your request will be reviewed by the guide and our team before confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
