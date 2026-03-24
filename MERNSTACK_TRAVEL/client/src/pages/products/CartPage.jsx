import { useState, useEffect } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatLKR } from '../../utils/currency';
import {
  validateTravelProductCheckoutField,
  validateTravelProductCheckoutForm,
} from '../../utils/validators';

const card = {
  background: '#fff', border: '1px solid #e8eaed', borderRadius: 18,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

export default function CartPage() {
  const { cart, updateQty, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slipFile, setSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);

  // User details form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [checkoutTouched, setCheckoutTouched] = useState({});

  // Fetch bank accounts on mount
  useEffect(() => {
    api.get('/bank-accounts').then(r => setBankAccounts(r.data)).catch(() => {});
  }, []);

  const items = cart.items || [];

  const getItemPrice = (item) => {
    if (!item.details) return 0;
    if (item.type === 'bundle') {
      return item.details.totalPrice * (1 - (item.details.discount || 0) / 100);
    }
    return item.details.price || 0;
  };

  const subtotal = items.reduce((sum, item) => sum + getItemPrice(item) * item.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const checkoutValues = {
    customerName: user?.name || '',
    phone,
    address,
    items,
    slipFile,
  };

  const updateCheckoutError = (field, message) => {
    setCheckoutErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const onCheckoutFieldBlur = (field) => () => {
    setCheckoutTouched((prev) => ({ ...prev, [field]: true }));
    updateCheckoutError(field, validateTravelProductCheckoutField(field, checkoutValues));
  };

  const onPhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    if (checkoutTouched.phone) {
      updateCheckoutError('phone', validateTravelProductCheckoutField('phone', { ...checkoutValues, phone: value }));
    }
  };

  const onAddressChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    if (checkoutTouched.address) {
      updateCheckoutError('address', validateTravelProductCheckoutField('address', { ...checkoutValues, address: value }));
    }
  };

  const canPlaceOrder =
    !!slipFile &&
    phone.trim() !== '' &&
    address.trim() !== '' &&
    !checkoutErrors.phone &&
    !checkoutErrors.address;

  const handleCheckout = async () => {
    if (!user) return toast.error('Please login to checkout');
    const result = validateTravelProductCheckoutForm(checkoutValues);
    if (!result.isValid) {
      setCheckoutErrors(result.errors);
      setCheckoutTouched({ customerName: true, phone: true, address: true, slipFile: true });
      toast.error('Please fix the highlighted checkout fields');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('source', 'product');
      formData.append('referenceId', user.id);
      formData.append('amount', total);
      formData.append('phone', result.sanitized.phone);
      formData.append('address', result.sanitized.address);
      await api.post('/payments/upload-slip', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await clearCart();
      toast.success('Order placed! Payment slip submitted for approval.');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  /* ── Empty Cart ── */
  if (items.length === 0) {
    return (
      <Layout>
        <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: '#fffbeb', border: '2px solid #fde68a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 44,
            }}>
              🛒
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Your cart is empty</h2>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
              Browse our travel products and add items to your cart.
            </p>
            <Link to="/services/travel-products" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,11,0.3)'; }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Browse Products
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  /* ── Cart with items ── */
  return (
    <Layout>
      <div style={{ background: '#f8f9fb', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <Link to="/services/travel-products" style={{
              fontSize: 13, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={(e) => { e.target.style.color = '#d97706'; }}
              onMouseLeave={(e) => { e.target.style.color = '#9ca3af'; }}
            >
              ← Continue Shopping
            </Link>
            <span style={{ width: 1, height: 16, background: '#e5e7eb' }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>Your Cart</h1>
            <span style={{
              padding: '4px 12px', borderRadius: 20,
              background: '#fffbeb', border: '1px solid #fde68a',
              fontSize: 12, fontWeight: 700, color: '#92400e',
            }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }} className="cart-grid">

            {/* ── Cart Items ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((item, idx) => {
                const price = getItemPrice(item);
                const details = item.details;
                if (!details) return null;

                return (
                  <div key={item._id} style={{
                    ...card, padding: '16px 18px',
                    display: 'flex', gap: 16, alignItems: 'center',
                    animation: `cartFadeIn 0.4s ease ${idx * 0.06}s both`,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Image */}
                    <div style={{
                      width: 88, height: 88, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                      background: '#f3f4f6',
                    }}>
                      {details.images?.[0] ? (
                        <img src={details.images[0]} alt={details.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 28, background: item.type === 'bundle' ? '#f5f3ff' : '#fffbeb',
                        }}>
                          {item.type === 'bundle' ? '🎒' : '🛍️'}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <span style={{
                            display: 'inline-block', fontSize: 10, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20,
                            textTransform: 'uppercase', letterSpacing: 0.5,
                            background: item.type === 'bundle' ? '#f5f3ff' : '#fffbeb',
                            color: item.type === 'bundle' ? '#7c3aed' : '#92400e',
                            border: `1px solid ${item.type === 'bundle' ? '#ddd6fe' : '#fde68a'}`,
                          }}>
                            {item.type === 'bundle' ? 'Bundle' : 'Product'}
                          </span>
                          <h3 style={{
                            fontSize: 15, fontWeight: 700, color: '#111827',
                            margin: '6px 0 0', lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{details.name}</h3>
                          {details.location && (
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {details.location}
                            </p>
                          )}
                        </div>

                        {/* Remove btn */}
                        <button onClick={() => removeItem(item._id)} style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: '1px solid #f3f4f6', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                          color: '#9ca3af',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.color = '#9ca3af'; }}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Qty + Price row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        {/* Qty controls */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: '#f3f4f6', borderRadius: 10,
                          border: '1px solid #e5e7eb',
                        }}>
                          <button onClick={() => updateQty(item._id, Math.max(1, item.qty - 1))} style={{
                            width: 32, height: 32, border: 'none', background: 'transparent',
                            cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.2s', borderRadius: '10px 0 0 10px',
                          }}
                            onMouseEnter={(e) => { e.target.style.color = '#111827'; }}
                            onMouseLeave={(e) => { e.target.style.color = '#6b7280'; }}
                          >−</button>
                          <span style={{
                            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: '#111827',
                            borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                            background: '#fff',
                          }}>{item.qty}</span>
                          <button onClick={() => updateQty(item._id, item.qty + 1)} style={{
                            width: 32, height: 32, border: 'none', background: 'transparent',
                            cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.2s', borderRadius: '0 10px 10px 0',
                          }}
                            onMouseEnter={(e) => { e.target.style.color = '#111827'; }}
                            onMouseLeave={(e) => { e.target.style.color = '#6b7280'; }}
                          >+</button>
                        </div>

                        <span style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>
                          {formatLKR(Math.round(price * item.qty))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear cart link */}
              <div style={{ textAlign: 'right', paddingTop: 4 }}>
                <button onClick={clearCart} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#9ca3af', transition: 'color 0.2s',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Cart
                </button>
              </div>
            </div>

            {/* ── Right: Order Summary + Bank + Payment + User Details ── */}
            <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ─ 1. Order Summary card ─ */}
              <div style={{ ...card, padding: '24px 24px' }}>
                <h2 style={{
                  fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 20px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: '#fffbeb', border: '1px solid #fde68a',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>🧾</span>
                  Order Summary
                </h2>

                {/* Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {items.map((item) => {
                    const price = getItemPrice(item);
                    return (
                      <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                          {item.details?.name} × {item.qty}
                        </span>
                        <span style={{ color: '#374151', fontWeight: 500 }}>
                          {formatLKR(Math.round(price * item.qty))}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    <span>Subtotal</span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{formatLKR(Math.round(subtotal))}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280', marginBottom: 14 }}>
                    <span>Tax (5%)</span>
                    <span style={{ color: '#374151', fontWeight: 500 }}>{formatLKR(Math.round(tax))}</span>
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 16, fontWeight: 700, color: '#111827',
                    paddingTop: 14, borderTop: '1px solid #f3f4f6',
                  }}>
                    <span>Total</span>
                    <span style={{ color: '#d97706', fontSize: 20 }}>{formatLKR(Math.round(total))}</span>
                  </div>
                </div>
              </div>

              {/* ─ 2. Bank Transfer Details card ─ */}
              {bankAccounts.length > 0 && (
                <div style={{ ...card, padding: '22px 24px' }}>
                  <h2 style={{
                    fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 16px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>🏦</span>
                    Bank Transfer Details
                  </h2>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14, lineHeight: 1.5 }}>
                    Transfer the total amount to one of the accounts below, then upload your payment slip.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {bankAccounts.map((acc) => (
                      <div key={acc._id} style={{
                        background: '#f8fafc', borderRadius: 12,
                        border: '1px solid #e2e8f0', padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 14 }}>🏛️</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{acc.bankName}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Account No.</span>
                            <span style={{ color: '#111827', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{acc.accountNumber}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>Branch</span>
                            <span style={{ color: '#374151', fontWeight: 500 }}>{acc.branch}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─ 3. Payment slip upload card ─ */}
              <div style={{ ...card, padding: '24px 24px' }}>
                <h2 style={{
                  fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: '#eff6ff', border: '1px solid #bfdbfe',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>💳</span>
                  Payment Slip
                </h2>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
                  Upload your bank transfer slip to complete your order.
                </p>

                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 16px', borderRadius: 14,
                  border: `2px dashed ${checkoutErrors.slipFile ? '#ef4444' : slipFile ? '#10b981' : '#e5e7eb'}`,
                  background: checkoutErrors.slipFile ? '#fef2f2' : slipFile ? '#f0fdf4' : '#fafafa',
                  cursor: 'pointer', transition: 'all 0.2s',
                  minHeight: 90,
                }}
                  onMouseEnter={(e) => { if (!slipFile) { e.currentTarget.style.borderColor = '#fcd34d'; e.currentTarget.style.background = '#fffbeb'; } }}
                  onMouseLeave={(e) => { if (!slipFile) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafafa'; } }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"
                    stroke={slipFile ? '#10b981' : '#9ca3af'} strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0', textAlign: 'center' }}>
                    {slipFile ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>✓ {slipFile.name}</span>
                    ) : (
                      <>Click to upload payment slip</>
                    )}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0] || null;
                      setSlipFile(file);
                      setCheckoutTouched((prev) => ({ ...prev, slipFile: true }));
                      updateCheckoutError('slipFile', file ? '' : 'Please upload your payment slip');
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {checkoutErrors.slipFile && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>{checkoutErrors.slipFile}</p>}
              </div>

              {/* ─ 4. User Details card (only shown after slip is uploaded) ─ */}
              {slipFile && (
                <div style={{ ...card, padding: '24px 24px', animation: 'cartFadeIn 0.35s ease both' }}>
                  <h2 style={{
                    fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>👤</span>
                    Your Details
                  </h2>
                  <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 18 }}>
                    Please confirm your details to complete the order.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Name — read-only */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                        Full Name
                      </label>
                      <div style={{
                        padding: '10px 14px', background: '#f3f4f6', borderRadius: 10,
                        border: `1.5px solid ${checkoutErrors.customerName ? '#ef4444' : '#e5e7eb'}`, fontSize: 13, color: '#374151', fontWeight: 600,
                      }}>
                        {user?.name || '—'}
                      </div>
                      {checkoutErrors.customerName && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 5 }}>{checkoutErrors.customerName}</p>}
                    </div>

                    {/* Email — read-only */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                        Email Address
                      </label>
                      <div style={{
                        padding: '10px 14px', background: '#f3f4f6', borderRadius: 10,
                        border: '1.5px solid #e5e7eb', fontSize: 13, color: '#374151', fontWeight: 600,
                      }}>
                        {user?.email || '—'}
                      </div>
                    </div>

                    {/* Phone — manual */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                        Phone Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 0771234567"
                        value={phone}
                        onChange={onPhoneChange}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, color: '#111827',
                          border: `1.5px solid ${checkoutErrors.phone ? '#ef4444' : phone.trim() ? '#10b981' : '#e5e7eb'}`,
                          background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#f59e0b'; }}
                        onBlur={onCheckoutFieldBlur('phone')}
                      />
                      {checkoutErrors.phone && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 5 }}>{checkoutErrors.phone}</p>}
                    </div>

                    {/* Address — manual */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                        Delivery Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <textarea
                        placeholder="Enter your full delivery address..."
                        value={address}
                        rows={3}
                        onChange={onAddressChange}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, color: '#111827',
                          border: `1.5px solid ${checkoutErrors.address ? '#ef4444' : address.trim() ? '#10b981' : '#e5e7eb'}`,
                          background: '#fff', outline: 'none', boxSizing: 'border-box', resize: 'vertical',
                          transition: 'border-color 0.2s', fontFamily: 'inherit', lineHeight: 1.5,
                        }}
                        onFocus={e => { e.target.style.borderColor = '#f59e0b'; }}
                        onBlur={onCheckoutFieldBlur('address')}
                      />
                      {checkoutErrors.address && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 5 }}>{checkoutErrors.address}</p>}
                    </div>

                    {/* ── Place Order button ── */}
                    <button
                      onClick={handleCheckout}
                      disabled={submitting || !canPlaceOrder}
                      style={{
                        width: '100%', padding: '15px 0', marginTop: 4,
                        fontSize: 15, fontWeight: 700, color: '#fff',
                        background: (submitting || !canPlaceOrder)
                          ? '#d1d5db'
                          : 'linear-gradient(135deg, #f59e0b, #d97706)',
                        border: 'none', borderRadius: 14,
                        cursor: (submitting || !canPlaceOrder) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: (submitting || !canPlaceOrder) ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
                      }}
                      onMouseEnter={(e) => { if (!submitting && canPlaceOrder) e.target.style.boxShadow = '0 6px 20px rgba(245,158,11,0.4)'; }}
                      onMouseLeave={(e) => { if (!submitting && canPlaceOrder) e.target.style.boxShadow = '0 4px 14px rgba(245,158,11,0.3)'; }}
                    >
                      {submitting ? 'Processing...' : `Place Order — ${formatLKR(Math.round(total))}`}
                    </button>

                    {!canPlaceOrder && !submitting && (
                      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: '-6px 0 0' }}>
                        {!slipFile ? 'Upload payment slip first' : (!phone.trim() || !address.trim()) ? 'Fill in valid phone & address to place order' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Animations + Responsive */}
      <style>{`
        @keyframes cartFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .cart-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
