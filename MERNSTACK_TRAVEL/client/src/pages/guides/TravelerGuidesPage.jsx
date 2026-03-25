import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { formatLKR } from '../../utils/currency';


const STATUS_LABELS = {
  deposit_submitted: 'Deposit Submitted',
  pending_guide_review: 'Under Review',
  guide_accepted: 'Guide Accepted',
  guide_rejected: 'Guide Rejected',
  under_admin_review: 'Admin Review',
  admin_confirmed: 'Confirmed',
  remaining_payment_pending: 'Pay Remaining',
  remaining_payment_submitted: 'Payment Verifying',
  fully_paid: 'Fully Paid',
  completed: 'Completed',
  cancelled_by_user: 'Cancelled',
  cancelled_by_admin: 'Cancelled',
  refund_pending: 'Refund Pending',
  partially_refunded: 'Partial Refund',
  refunded: 'Refunded',
  no_refund: 'No Refund',
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

const STATUS_STYLES = {
  deposit_submitted: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  pending_guide_review: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  guide_accepted: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  guide_rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  under_admin_review: { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  admin_confirmed: { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  remaining_payment_pending: { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
  remaining_payment_submitted: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  fully_paid: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  completed: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  cancelled_by_user: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  cancelled_by_admin: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  refund_pending: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  partially_refunded: { bg: '#ffedd5', color: '#9a3412', border: '#fed7aa' },
  refunded: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  no_refund: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
  pending: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  confirmed: { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' },
};

const STATUS_MESSAGES = {
  deposit_submitted: 'Your deposit has been submitted. Our team will verify it shortly.',
  pending_guide_review: 'Deposit verified! The guide is reviewing your request.',
  guide_accepted: 'Great news — the guide accepted! Admin is checking availability.',
  guide_rejected: 'The guide is unavailable. Our team will look into alternatives.',
  remaining_payment_pending: 'Your booking is approved! Please upload the remaining payment.',
  remaining_payment_submitted: 'Payment received. Awaiting final verification.',
  fully_paid: 'All payments confirmed — your trip is fully booked!',
  completed: 'Trip completed. We hope you had an amazing experience!',
  cancelled_by_user: 'You cancelled this booking.',
  cancelled_by_admin: 'This booking was cancelled by our team.',
  refund_pending: 'Your refund is being processed.',
  refunded: 'Your deposit has been fully refunded.',
  partially_refunded: 'A partial refund has been processed to your account.',
  no_refund: 'No refund applies to this cancellation.',
};

const STEP_MAP = {
  deposit_submitted: 1,
  pending_guide_review: 2,
  guide_accepted: 3,
  remaining_payment_pending: 4,
  remaining_payment_submitted: 4,
  fully_paid: 5,
  completed: 5,
};

const CANCELLABLE = ['deposit_submitted', 'pending_guide_review', 'guide_accepted', 'under_admin_review', 'admin_confirmed', 'remaining_payment_pending', 'pending', 'confirmed'];

export default function TravelerGuidesPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [remainingSlipFile, setRemainingSlipFile] = useState(null);
  const [uploadingRemaining, setUploadingRemaining] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try { const { data } = await api.get('/guides/bookings/my'); setBookings(data); }
    catch { } finally { setLoading(false); }
  };

  const handleCancel = async (bookingId, startDate) => {
    const daysUntilTrip = Math.ceil((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24));
    let refundMsg = daysUntilTrip >= 3 ? 'Full deposit refund.' : daysUntilTrip >= 1 ? '50% deposit refund.' : 'No refund (same-day).';
    if (!window.confirm(`Cancel this booking?\n\n${refundMsg}`)) return;
    try {
      const { data } = await api.put(`/guides/bookings/${bookingId}/cancel`);
      toast.success(`Cancelled. ${data.refundEligibility === 'none' ? 'No refund.' : `Refund: ${formatLKR(data.refundAmount)}`}`);
      fetchBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
  };

  const handleRemainingPayment = async (bookingId) => {
    if (!remainingSlipFile) return toast.error('Please select your payment slip');
    setUploadingRemaining(bookingId);
    try {
      const fd = new FormData();
      fd.append('remainingSlip', remainingSlipFile);
      await api.put(`/guides/bookings/${bookingId}/submit-remaining`, fd);
      toast.success('Payment submitted!');
      setRemainingSlipFile(null);
      fetchBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setUploadingRemaining(null); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/guides/bookings/${reviewModal}/review`, reviewForm);
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      fetchBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const badgeStyle = (status) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return { background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' };
  };

  return (
    <Layout>
      <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>My Guide Bookings</h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} · Manage your travel guide requests
              </p>
            </div>
            <Link to="/services/guides" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
              fontWeight: 700, fontSize: 14, padding: '10px 22px', borderRadius: 12,
              textDecoration: 'none', boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              transition: 'transform 0.15s',
            }}>
              Browse Guides
            </Link>
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
                  <div style={{ width: 72, height: 72, background: '#f3f4f6', borderRadius: 14, flexShrink: 0 }} className="animate-pulse" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 14, background: '#f3f4f6', borderRadius: 8, width: '50%' }} className="animate-pulse" />
                    <div style={{ height: 12, background: '#f3f4f6', borderRadius: 8, width: '70%' }} className="animate-pulse" />
                    <div style={{ height: 12, background: '#f3f4f6', borderRadius: 8, width: '35%' }} className="animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            /* Empty */
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 80, height: 80, background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>
                🧭
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No guide bookings yet</p>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Find an experienced local guide for your Sri Lanka trip</p>
              <Link to="/services/guides" style={{
                display: 'inline-block', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 12,
                textDecoration: 'none', boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              }}>
                Find a Guide
              </Link>
            </div>

            /* Booking Cards */
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bookings.map((b) => {
                const guide = b.guideId;
                const statusMsg = STATUS_MESSAGES[b.status];
                const step = STEP_MAP[b.status] || 0;
                const isCancelled = ['cancelled_by_user', 'cancelled_by_admin', 'guide_rejected', 'no_refund'].includes(b.status);
                const isCompleted = ['completed', 'refunded', 'partially_refunded'].includes(b.status);

                return (
                  <div key={b._id} style={{
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18,
                    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                  >
                    {/* Top section: Guide info + Status */}
                    <div style={{ display: 'flex', gap: 16, padding: '20px 24px' }}>
                      {/* Guide image */}
                      <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6' }}>
                        {guide?.image ? (
                          <img src={guide.image} alt={guide.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b22, #d9770622)', fontSize: 28 }}>
                            🧭
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{guide?.name || 'Guide'}</h3>
                            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                              {b.location}
                            </p>
                          </div>
                          <span style={badgeStyle(b.status)}>{STATUS_LABELS[b.status] || b.status}</span>
                        </div>

                        {/* Details grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 14 }}>
                          <DetailItem label="Dates" value={b.startDate ? `${new Date(b.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(b.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : new Date(b.travelDate).toLocaleDateString()} />
                          <DetailItem label="Duration" value={`${b.days} day${b.days !== 1 ? 's' : ''}`} />
                          <DetailItem label="Travelers" value={b.travelers} />
                          <DetailItem label="Total" value={`${formatLKR(b.totalPrice)}`} highlight />
                        </div>
                      </div>
                    </div>

                    {/* Deposit / Remaining breakdown */}
                    {b.depositAmount > 0 && (
                      <div style={{ display: 'flex', gap: 0, margin: '0 24px', borderRadius: 10, overflow: 'hidden', border: '1px solid #f3f4f6' }}>
                        <div style={{ flex: 1, padding: '10px 16px', background: '#fffbeb' }}>
                          <span style={{ fontSize: 11, color: '#92400e', fontWeight: 500 }}>Deposit ({b.depositPercentage || 30}%)</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#d97706', margin: '2px 0 0' }}>{formatLKR(b.depositAmount)}</p>
                        </div>
                        <div style={{ width: 1, background: '#f3f4f6' }} />
                        <div style={{ flex: 1, padding: '10px 16px', background: '#f9fafb' }}>
                          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Remaining</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '2px 0 0' }}>{formatLKR(b.remainingAmount)}</p>
                        </div>
                      </div>
                    )}

                    {/* Progress Steps (for active bookings) */}
                    {step > 0 && !isCancelled && !isCompleted && (
                      <div style={{ padding: '16px 24px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                          {['Deposit', 'Review', 'Accepted', 'Payment', 'Confirmed'].map((label, i) => {
                            const stepNum = i + 1;
                            const done = step >= stepNum;
                            const active = step === stepNum;
                            return (
                              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                {i > 0 && (
                                  <div style={{
                                    position: 'absolute', top: 10, left: '-50%', right: '50%', height: 2,
                                    background: done ? '#f59e0b' : '#e5e7eb',
                                  }} />
                                )}
                                <div style={{
                                  width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700, zIndex: 1,
                                  background: done ? '#f59e0b' : active ? '#fff' : '#f3f4f6',
                                  color: done ? '#fff' : '#9ca3af',
                                  border: active ? '2px solid #f59e0b' : done ? 'none' : '1px solid #e5e7eb',
                                }}>
                                  {done ? '✓' : stepNum}
                                </div>
                                <span style={{ fontSize: 10, color: done ? '#d97706' : '#9ca3af', marginTop: 4, fontWeight: done ? 600 : 400 }}>
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Status message */}
                    {statusMsg && (
                      <div style={{
                        margin: '14px 24px 0', padding: '10px 14px', borderRadius: 10,
                        background: isCancelled ? '#fef2f2' : isCompleted ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${isCancelled ? '#fecaca' : isCompleted ? '#bbf7d0' : '#fde68a'}`,
                      }}>
                        <p style={{ fontSize: 13, color: isCancelled ? '#991b1b' : isCompleted ? '#166534' : '#92400e', margin: 0 }}>
                          {statusMsg}
                        </p>
                      </div>
                    )}

                    {/* Remaining Payment Upload */}
                    {b.status === 'remaining_payment_pending' && (
                      <div style={{
                        margin: '14px 24px 0', padding: 16, borderRadius: 12,
                        background: '#fff7ed', border: '1px solid #fed7aa',
                      }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#9a3412', marginBottom: 10 }}>
                          Upload Remaining Payment — {formatLKR(b.remainingAmount)}
                        </p>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <label style={{
                            flex: 1, minWidth: 180, padding: '10px 14px', borderRadius: 10,
                            border: '2px dashed #fed7aa', background: '#fff',
                            cursor: 'pointer', fontSize: 13, color: '#9a3412',
                            display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color 0.2s',
                          }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            {remainingSlipFile ? (
                              <span style={{ fontWeight: 600, color: '#ea580c' }}>{remainingSlipFile.name}</span>
                            ) : (
                              'Choose payment slip...'
                            )}
                            <input type="file" accept="image/*" onChange={e => setRemainingSlipFile(e.target.files[0])} style={{ display: 'none' }} />
                          </label>
                          <button onClick={() => handleRemainingPayment(b._id)}
                            disabled={uploadingRemaining === b._id}
                            style={{
                              padding: '10px 20px', borderRadius: 10, border: 'none',
                              background: uploadingRemaining === b._id ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                              color: '#fff', fontSize: 13, fontWeight: 700, cursor: uploadingRemaining === b._id ? 'not-allowed' : 'pointer',
                              boxShadow: '0 4px 12px rgba(245,158,11,0.25)', whiteSpace: 'nowrap',
                            }}>
                            {uploadingRemaining === b._id ? 'Uploading...' : 'Submit Payment'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Refund info */}
                    {b.cancellation?.refundAmount > 0 && (
                      <div style={{ margin: '10px 24px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <span style={{ color: '#6b7280' }}>Refund:</span>
                        <span style={{ fontWeight: 600, color: b.cancellation.refundStatus === 'processed' ? '#059669' : '#d97706' }}>
                          {formatLKR(b.cancellation.refundAmount)}
                        </span>
                        <span style={badgeStyle(b.cancellation.refundStatus === 'processed' ? 'refunded' : 'refund_pending')}>
                          {b.cancellation.refundStatus === 'processed' ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                    )}

                    {/* Review display */}
                    {b.review?.comment && (
                      <div style={{ margin: '14px 24px 0', padding: '12px 16px', borderRadius: 10, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 14, color: '#f59e0b' }}>{'★'.repeat(b.review.rating)}{'☆'.repeat(5 - b.review.rating)}</span>
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>Your review</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{b.review.comment}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, padding: '16px 24px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {CANCELLABLE.includes(b.status) && (
                        <button onClick={() => handleCancel(b._id, b.startDate || b.travelDate)}
                          style={{
                            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                            background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                        >
                          Cancel Booking
                        </button>
                      )}
                      {b.status === 'completed' && !b.review?.comment && (
                        <button onClick={() => { setReviewModal(b._id); setReviewForm({ rating: 5, comment: '' }); }}
                          style={{
                            padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
                            border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
                          }}>
                          Leave Review
                        </button>
                      )}
                      {b.depositSlip && (
                        <a href={b.depositSlip} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', padding: '8px 0' }}>
                          View deposit slip
                        </a>
                      )}
                      <div style={{ flex: 1 }} />
                      <Link to={`/guides/${guide?._id}`} style={{
                        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        color: '#d97706', textDecoration: 'none', border: '1px solid #fde68a',
                        background: '#fffbeb', transition: 'background 0.15s',
                      }}>
                        View Guide →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setReviewModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>Leave a Review</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Share your experience with this guide</p>
            </div>

            <form onSubmit={handleReviewSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>Rating</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                      style={{
                        fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
                        color: s <= reviewForm.rating ? '#f59e0b' : '#e5e7eb',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Tell us about your experience..."
                  required rows={4}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 14,
                    border: '1.5px solid #e5e7eb', outline: 'none', resize: 'vertical',
                    transition: 'border-color 0.2s', boxSizing: 'border-box', color: '#111827',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b'; }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={submitting} style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: submitting ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '0 4px 14px rgba(245,158,11,0.3)',
                }}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setReviewModal(null)} style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .detail-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </Layout>
  );
}

function DetailItem({ label, value, highlight }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
      <p style={{ fontSize: 14, fontWeight: highlight ? 700 : 600, color: highlight ? '#d97706' : '#111827', margin: '2px 0 0' }}>{value}</p>
    </div>
  );
}
