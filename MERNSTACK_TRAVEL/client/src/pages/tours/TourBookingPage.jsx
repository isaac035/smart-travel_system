import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { formatLKR } from '../../utils/currency';

const vehicleIcons = { car: '🚗', van: '🚐', bus: '🚌' };
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';

const sectionStyle = {
  background: '#fff',
  borderRadius: '16px',
  border: '1px solid #e5e7eb',
  padding: '28px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#374151',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  background: '#f9fafb',
  color: '#111827',
  border: '2px solid #e5e7eb',
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const inputErrorStyle = {
  ...inputStyle,
  border: '2px solid #ef4444',
  background: '#fff5f5',
};

const errorMsgStyle = {
  fontSize: '12px',
  color: '#ef4444',
  fontWeight: 600,
  marginTop: '5px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p style={errorMsgStyle}>
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
      {msg}
    </p>
  );
}

function getRecommendedVehicle(travelers, pkg) {
  if (!pkg) return null;
  const options = pkg.vehicleOptions?.length ? pkg.vehicleOptions : ['car', 'van', 'bus'];
  const capacities = { car: 4, van: 8, bus: 50 };
  const caps = { ...capacities, ...(pkg.maxTravelersByVehicle || {}) };
  const order = ['car', 'van', 'bus'];
  return order.find((v) => options.includes(v) && caps[v] >= travelers) || options[options.length - 1];
}

const NOTES_MAX = 500;
const TODAY = new Date().toISOString().split('T')[0];
const MAX_DURATION_DAYS = 60;

export default function TourBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceData, setPriceData] = useState(null);

  const [form, setForm] = useState({
    vehicle: 'car',
    travelers: 1,
    customDuration: null,
    startDate: '',
    notes: '',
    slip: null,
  });

  const [errors, setErrors] = useState({
    customDuration: '',
    startDate: '',
    vehicle: '',
    travelers: '',
    notes: '',
    slip: '',
  });

  useEffect(() => {
    api
      .get(`/tours/${id}`)
      .then((r) => {
        const data = r.data;
        setPkg(data);
        const defaultVehicle =
          data?.vehicleOptions?.length && data.vehicleOptions.includes('car')
            ? 'car'
            : data?.vehicleOptions?.[0] || 'car';

        setForm((prev) => ({
          ...prev,
          vehicle: defaultVehicle,
          customDuration: data?.duration || 1,
        }));
      })
      .catch(() => {
        setPkg(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const validateStartDate = (value) => {
    if (!value) return 'Start date is required.';
    const chosen = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosen < today) return 'Start date must be today or a future date.';
    return '';
  };

  const validateTravelers = (value) => {
    return validateTravelersForVehicle(value, form.vehicle);
  };

  const validateDuration = (value) => {
    const n = Number(value);
    if (value === '' || value === null || value === undefined || Number.isNaN(n)) {
      return 'Enter a valid duration.';
    }
    if (!Number.isInteger(n) || n < 1 || n > MAX_DURATION_DAYS) {
      return 'Enter a valid duration.';
    }
    return '';
  };

  const validateVehicle = (value) => {
    if (!value) return 'Please select a vehicle.';
    return '';
  };

  const validateSlip = (value) => {
    if (!value) return 'Please upload your payment slip before continuing.';
    return '';
  };

  const validateTravelersForVehicle = (value, vehicle) => {
    const n = Number(value);
    if (value === '' || value === null || value === undefined) {
      return 'Number of travelers is required.';
    }
    if (!Number.isInteger(n) || n < 1) {
      return 'Travelers must be at least 1.';
    }
    const caps = { car: 4, van: 8, bus: 50, ...(pkg?.maxTravelersByVehicle || {}) };
    const vehicleCapacity = caps[vehicle] ?? 50;
    if (n > vehicleCapacity) {
      return 'Travelers cannot exceed vehicle capacity.';
    }
    return '';
  };

  const validateNotes = (value) => {
    if (value && value.length > NOTES_MAX) {
      return `Maximum ${NOTES_MAX} characters (${value.length} used).`;
    }
    return '';
  };

  const setTravelers = (val) => {
    setForm((f) => ({ ...f, travelers: val }));
    setErrors((e) => ({ ...e, travelers: validateTravelers(val) }));
  };

  const setCustomDuration = (val) => {
    setForm((f) => ({ ...f, customDuration: val }));
    setErrors((e) => ({ ...e, customDuration: validateDuration(val) }));
  };

  useEffect(() => {
    if (!pkg) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const { data } = await api.post('/tours/calculate-price', {
          packageId: id,
          vehicle: form.vehicle,
          travelers: Number(form.travelers),
          customDuration: Number(form.customDuration || pkg.duration),
        });
        setPriceData(data);
      } catch {
        const multiplier = pkg.vehicleMultipliers?.[form.vehicle] || 1;
        const defaultCaps = { car: 4, van: 8, bus: 50 };
        const caps = { ...defaultCaps, ...(pkg.maxTravelersByVehicle || {}) };
        const vehicleCapacity = caps[form.vehicle] ?? 50;
        const baseDuration = pkg.duration || 1;
        const duration = Number(form.customDuration || baseDuration);
        const pricePerDay = Number(pkg.basePrice || 0) / baseDuration;
        const totalPrice = pricePerDay * duration * multiplier * Number(form.travelers || 1);

        setPriceData({
          basePrice: Number(pkg.basePrice || 0),
          vehicleMultiplier: multiplier,
          pricePerDay,
          travelers: Number(form.travelers || 1),
          customDuration: duration,
          baseDuration,
          totalPrice,
          vehicleCapacity,
          exceedsCapacity: Number(form.travelers) > vehicleCapacity,
        });
      } finally {
        setPriceLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [pkg, id, form.vehicle, form.travelers, form.customDuration]);

  if (loading) {
    return (
      <Layout>
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
            <div style={{ height: '20px', background: '#e5e7eb', borderRadius: '10px', width: '200px', marginBottom: '16px' }} />
            <div style={{ height: '28px', background: '#e5e7eb', borderRadius: '10px', width: '280px', marginBottom: '32px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ height: '100px', background: '#e5e7eb', borderRadius: '16px' }} />
                ))}
              </div>
              <div style={{ height: '340px', background: '#e5e7eb', borderRadius: '16px' }} />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!pkg) {
    return (
      <Layout>
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '18px' }}>Package not found.</p>
        </div>
      </Layout>
    );
  }

  const vehicles = pkg.vehicleOptions?.length ? pkg.vehicleOptions : ['car', 'van', 'bus'];
  const pkgCaps = { car: 4, van: 8, bus: 50, ...(pkg.maxTravelersByVehicle || {}) };
  const recommended = getRecommendedVehicle(Number(form.travelers), pkg);
  const capacityExceeded = Boolean(priceData?.exceedsCapacity);
  const multiplier = Number(pkg.vehicleMultipliers?.[form.vehicle] || 1);
  const totalPrice = Number(priceData?.totalPrice || 0);
  const pricePerPerson =
    pkg.duration && Number(form.customDuration || pkg.duration) > 0
      ? (Number(pkg.basePrice) / Number(pkg.duration)) * multiplier * Number(form.customDuration || pkg.duration)
      : Number(pkg.basePrice) * multiplier;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const durationErr = validateDuration(form.customDuration || pkg.duration);
    const dateErr = validateStartDate(form.startDate);
    const vehicleErr = validateVehicle(form.vehicle);
    const travelersErr = validateTravelers(form.travelers);
    const notesErr = validateNotes(form.notes);
    const slipErr = validateSlip(form.slip);

    setErrors({
      customDuration: durationErr,
      startDate: dateErr,
      vehicle: vehicleErr,
      travelers: travelersErr,
      notes: notesErr,
      slip: slipErr,
    });

    if (durationErr || dateErr || vehicleErr || travelersErr || notesErr || slipErr) {
      toast.error('Please fix the highlighted errors before submitting.');
      return;
    }

    if (capacityExceeded) {
      toast.error(`Selected vehicle can't accommodate ${form.travelers} travelers. Please choose a larger vehicle.`);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('packageId', id);
      fd.append('vehicle', form.vehicle);
      fd.append('travelers', String(form.travelers));
      fd.append('startDate', form.startDate);
      fd.append('notes', form.notes.trim());
      fd.append('customDuration', String(form.customDuration || pkg.duration));
      if (form.slip) fd.append('slip', form.slip);

      await api.post('/tours/bookings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Booking submitted! Awaiting confirmation.');
      navigate('/my-tours');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', color: '#111827', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
            <Link to="/tours" style={{ color: '#6b7280', textDecoration: 'none' }}>Tours</Link>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link
              to={`/tours/${id}`}
              style={{ color: '#6b7280', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}
            >
              {pkg.name}
            </Link>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span style={{ color: '#374151', fontWeight: 600 }}>Book</span>
          </nav>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '32px' }}>
            Complete Your Booking
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px', alignItems: 'start' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '4px' }}>
                      Customize Duration
                    </h2>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>
                      Base package:{' '}
                      <strong style={{ color: '#374151' }}>
                        {pkg.duration} {pkg.duration === 1 ? 'day' : 'days'}
                      </strong>
                    </p>
                  </div>

                  {Number(form.customDuration) !== Number(pkg.duration) && (
                    <button
                      type="button"
                      onClick={() => setCustomDuration(pkg.duration)}
                      style={{
                        border: 'none',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setCustomDuration(Math.max(1, Number(form.customDuration) - 1))}
                    disabled={Number(form.customDuration) <= 1}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: Number(form.customDuration) <= 1 ? '#f9fafb' : '#f3f4f6',
                      border: '2px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      cursor: Number(form.customDuration) <= 1 ? 'not-allowed' : 'pointer',
                      color: Number(form.customDuration) <= 1 ? '#d1d5db' : '#374151',
                    }}
                  >
                    −
                  </button>

                  <div style={{ textAlign: 'center', minWidth: '80px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                      {form.customDuration}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
                      {Number(form.customDuration) === 1 ? 'day' : 'days'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomDuration(Math.min(MAX_DURATION_DAYS, Number(form.customDuration) + 1))}
                    disabled={Number(form.customDuration) >= MAX_DURATION_DAYS}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#f3f4f6',
                      border: '2px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#374151',
                      cursor: Number(form.customDuration) >= MAX_DURATION_DAYS ? 'not-allowed' : 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ position: 'relative', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                    <span>1 day</span>
                    <span>Base: {pkg.duration}d</span>
                    <span>{MAX_DURATION_DAYS} days</span>
                  </div>
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '99px',
                        width: `${Math.min(100, (Number(form.customDuration) / MAX_DURATION_DAYS) * 100)}%`,
                        background:
                          Number(form.customDuration) > pkg.duration
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : Number(form.customDuration) < pkg.duration
                              ? 'linear-gradient(90deg, #6366f1, #f59e0b)'
                              : 'linear-gradient(90deg, #10b981, #f59e0b)',
                      }}
                    />
                  </div>
                </div>

                {Number(form.customDuration) !== Number(pkg.duration) && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: Number(form.customDuration) > pkg.duration ? '#fff7ed' : '#eff6ff',
                      border: `1px solid ${Number(form.customDuration) > pkg.duration ? '#fed7aa' : '#bfdbfe'}`,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: Number(form.customDuration) > pkg.duration ? '#c2410c' : '#1d4ed8',
                    }}
                  >
                    {Number(form.customDuration) > pkg.duration
                      ? `📈 Extended by ${Number(form.customDuration) - pkg.duration} day(s)`
                      : `📉 Shortened by ${pkg.duration - Number(form.customDuration)} day(s)`}
                  </div>
                )}

                <FieldError msg={errors.customDuration} />
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '16px' }}>
                  Number of Travelers
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setTravelers(Math.max(1, Number(form.travelers) - 1))}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#f3f4f6',
                      border: `2px solid ${errors.travelers ? '#ef4444' : '#e5e7eb'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#374151',
                      fontSize: '20px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>

                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      color: errors.travelers ? '#ef4444' : '#111827',
                      width: '40px',
                      textAlign: 'center',
                    }}
                  >
                    {form.travelers}
                  </span>

                  <button
                    type="button"
                    onClick={() => setTravelers(Math.min(pkgCaps[form.vehicle] ?? 50, Number(form.travelers) + 1))}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#f3f4f6',
                      border: `2px solid ${errors.travelers ? '#ef4444' : '#e5e7eb'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#374151',
                      fontSize: '20px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>

                  <span style={{ fontSize: '14px', color: '#6b7280', marginLeft: '4px' }}>
                    {Number(form.travelers) === 1 ? 'traveler' : 'travelers'}{' '}
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>(max {pkgCaps[form.vehicle] ?? 50})</span>
                  </span>
                </div>

                <FieldError msg={errors.travelers} />

                {recommended && recommended !== form.vehicle && (
                  <div
                    style={{
                      marginTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '10px 14px',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{vehicleIcons[recommended]}</span>
                    <span style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
                      <strong style={{ textTransform: 'capitalize' }}>{recommended}</strong> is recommended for{' '}
                      {form.travelers} travelers
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, vehicle: recommended }));
                        setErrors((e) => ({
                          ...e,
                          vehicle: validateVehicle(recommended),
                          travelers: validateTravelersForVehicle(form.travelers, recommended),
                        }));
                      }}
                      style={{
                        marginLeft: 'auto',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#fff',
                        background: '#2563eb',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      Switch
                    </button>
                  </div>
                )}
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '16px' }}>
                  Select Vehicle Type
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${vehicles.length}, 1fr)`, gap: '12px' }}>
                  {vehicles.map((v) => {
                    const selected = form.vehicle === v;
                    const cap = pkgCaps[v] ?? 50;
                    const tooSmall = Number(form.travelers) > cap;

                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, vehicle: v }));
                          setErrors((e) => ({
                            ...e,
                            vehicle: validateVehicle(v),
                            travelers: validateTravelersForVehicle(form.travelers, v),
                          }));
                        }}
                        style={{
                          padding: '18px 12px',
                          borderRadius: '14px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          border: errors.vehicle && !form.vehicle
                            ? '2px solid #ef4444'
                            : tooSmall
                            ? '2px solid #fca5a5'
                            : selected
                              ? '2px solid #f59e0b'
                              : '2px solid #e5e7eb',
                          background: errors.vehicle && !form.vehicle ? '#fff5f5' : tooSmall ? '#fff1f2' : selected ? '#fffbeb' : '#f9fafb',
                          boxShadow: selected ? '0 4px 15px rgba(245,158,11,0.2)' : 'none',
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>{vehicleIcons[v]}</div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            color: tooSmall ? '#dc2626' : selected ? '#92400e' : '#374151',
                          }}
                        >
                          {v}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            marginTop: '2px',
                            color: tooSmall ? '#ef4444' : selected ? '#d97706' : '#9ca3af',
                            fontWeight: 600,
                          }}
                        >
                          {formatLKR(pricePerPerson)} / person
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '2px', color: tooSmall ? '#dc2626' : '#9ca3af' }}>
                          up to {cap} people
                        </div>

                        {recommended === v && form.vehicle !== v && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              background: '#2563eb',
                              color: '#fff',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '20px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {capacityExceeded && (
                  <div
                    style={{
                      marginTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '10px',
                      padding: '10px 14px',
                    }}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                      This vehicle can only carry up to {priceData?.vehicleCapacity} travelers. Please select a larger vehicle.
                    </span>
                  </div>
                )}

                <FieldError msg={errors.vehicle} />
              </div>

              <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>
                    Start Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    min={TODAY}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, startDate: e.target.value }));
                      setErrors((er) => ({ ...er, startDate: '' }));
                    }}
                    onBlur={(e) => setErrors((er) => ({ ...er, startDate: validateStartDate(e.target.value) }))}
                    style={errors.startDate ? inputErrorStyle : inputStyle}
                    required
                  />
                  <FieldError msg={errors.startDate} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
                      Special Requests <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color:
                          form.notes.length > NOTES_MAX
                            ? '#ef4444'
                            : form.notes.length > NOTES_MAX * 0.8
                              ? '#f59e0b'
                              : '#9ca3af',
                      }}
                    >
                      {form.notes.length}/{NOTES_MAX}
                    </span>
                  </div>

                  <textarea
                    value={form.notes}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, notes: e.target.value }));
                      setErrors((er) => ({ ...er, notes: validateNotes(e.target.value) }));
                    }}
                    rows={3}
                    placeholder="Dietary requirements, accessibility needs, special preferences..."
                    style={{ ...(errors.notes ? inputErrorStyle : inputStyle), resize: 'none' }}
                  />
                  <FieldError msg={errors.notes} />
                </div>
              </div>

              <div style={sectionStyle}>
                <h2 style={{ fontWeight: 700, color: '#111827', fontSize: '16px', marginBottom: '4px' }}>
                  Payment Slip
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                  Upload your payment receipt before submitting your booking.
                </p>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px dashed ${errors.slip ? '#ef4444' : dragOver ? '#f59e0b' : '#d1d5db'}`,
                    background: errors.slip ? '#fff5f5' : dragOver ? '#fffbeb' : '#f9fafb',
                    borderRadius: '14px',
                    padding: '36px',
                    cursor: 'pointer',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setForm((f) => ({ ...f, slip: file }));
                      setErrors((er) => ({ ...er, slip: '' }));
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setForm((f) => ({ ...f, slip: file }));
                      setErrors((er) => ({ ...er, slip: validateSlip(file) }));
                    }}
                  />

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
                <FieldError msg={errors.slip} />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '16px',
                  padding: '16px 0',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 4px 15px rgba(245,158,11,0.4)',
                }}
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </form>

            <div>
              <div
                style={{
                  position: 'sticky',
                  top: '96px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ height: '160px', overflow: 'hidden', background: '#f3f4f6' }}>
                  <img
                    src={pkg.images?.[0] || PLACEHOLDER}
                    alt={pkg.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER;
                    }}
                  />
                </div>

                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontWeight: 800, color: '#111827', fontSize: '16px', lineHeight: 1.3, marginBottom: '4px' }}>
                    {pkg.name}
                  </h3>

                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                    {form.customDuration || pkg.duration} {Number(form.customDuration || pkg.duration) === 1 ? 'day' : 'days'} ·{' '}
                    {vehicleIcons[form.vehicle]} {form.vehicle}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>Base price</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{formatLKR(pkg.basePrice)} / pkg</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>Vehicle ({form.vehicle})</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>×{multiplier.toFixed(1)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                      <span>Travelers</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>×{form.travelers}</span>
                    </div>

                    {Number(form.customDuration) !== Number(pkg.duration) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                        <span>Custom duration</span>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{form.customDuration} days</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '2px solid #f3f4f6',
                        paddingTop: '14px',
                        marginTop: '6px',
                      }}
                    >
                      <span style={{ fontWeight: 800, color: '#111827', fontSize: '16px' }}>Total</span>
                      {priceLoading ? (
                        <span style={{ fontSize: '20px', color: '#d1d5db', fontWeight: 800 }}>Calculating…</span>
                      ) : (
                        <span
                          style={{
                            fontWeight: 800,
                            color: capacityExceeded ? '#ef4444' : '#d97706',
                            fontSize: '26px',
                          }}
                        >
                          {formatLKR(totalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {capacityExceeded && (
                    <div
                      style={{
                        marginTop: '12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        color: '#dc2626',
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      ⚠️ Exceeds vehicle capacity ({priceData?.vehicleCapacity} max)
                    </div>
                  )}

                  {(errors.customDuration || errors.startDate || errors.vehicle || errors.travelers || errors.notes || errors.slip) && (
                    <div
                      style={{
                        marginTop: '12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        padding: '10px 14px',
                      }}
                    >
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                        ⚠️ Please fix these errors:
                      </p>
                      {errors.startDate && <p style={{ fontSize: '11px', color: '#dc2626', marginBottom: '2px' }}>• {errors.startDate}</p>}
                      {errors.travelers && <p style={{ fontSize: '11px', color: '#dc2626', marginBottom: '2px' }}>• {errors.travelers}</p>}
                      {errors.notes && <p style={{ fontSize: '11px', color: '#dc2626' }}>• {errors.notes}</p>}
                    </div>
                  )}

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
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

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Layout>
  );
}
