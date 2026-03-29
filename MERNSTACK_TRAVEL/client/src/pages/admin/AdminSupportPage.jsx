import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';

const STATUS_STYLES = {
  pending:  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b', label: 'Pending' },
  accepted: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', dot: '#10b981', label: 'Accepted' },
  rejected: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444', label: 'Rejected' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: s.bg, border: `1px solid ${s.border}`, color: s.text,
      borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export default function AdminSupportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [replyMap, setReplyMap] = useState({});   // id -> reply text
  const [savingMap, setSavingMap] = useState({});  // id -> bool
  const [clearing, setClearing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const { data } = await api.get(`/admin/support${params}`);
      setRequests(data);
    } catch {
      toast.error('Failed to load support requests.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleStatusChange = async (id, status) => {
    setSavingMap((m) => ({ ...m, [id]: true }));
    try {
      const { data } = await api.put(`/admin/support/${id}`, { status });
      setRequests((prev) => prev.map((r) => r._id === id ? data : r));
      toast.success(`Marked as ${status}.`);
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setSavingMap((m) => ({ ...m, [id]: false }));
    }
  };

  const handleSendReply = async (id) => {
    const reply = (replyMap[id] || '').trim();
    if (!reply) { toast.error('Please enter a reply message.'); return; }
    setSavingMap((m) => ({ ...m, [id]: true }));
    try {
      const { data } = await api.put(`/admin/support/${id}`, { adminReply: reply, status: 'accepted' });
      setRequests((prev) => prev.map((r) => r._id === id ? data : r));
      setReplyMap((m) => ({ ...m, [id]: '' }));
      toast.success('Reply sent successfully.');
    } catch {
      toast.error('Failed to send reply.');
    } finally {
      setSavingMap((m) => ({ ...m, [id]: false }));
    }
  };

  const handleClearRejected = async () => {
    const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
    if (rejectedCount === 0) { toast('No rejected requests to clear.'); return; }
    if (!window.confirm(`Clear ${rejectedCount} rejected request(s)? This cannot be undone.`)) return;
    setClearing(true);
    try {
      const { data } = await api.delete('/admin/support/rejected');
      setRequests((prev) => prev.filter((r) => r.status !== 'rejected'));
      toast.success(data.message);
    } catch {
      toast.error('Failed to clear rejected requests.');
    } finally {
      setClearing(false);
    }
  };

  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8" style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
            🆘 Emergency Support Management
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            View, manage, and reply to user support requests.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Stats */}
          {pendingCount > 0 && (
            <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>
              ⏳ {pendingCount} pending
            </span>
          )}
          {/* Clear rejected button */}
          <button
            onClick={handleClearRejected}
            disabled={clearing || rejectedCount === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: rejectedCount === 0 ? '#f9fafb' : '#fef2f2',
              border: `1px solid ${rejectedCount === 0 ? '#e5e7eb' : '#fecaca'}`,
              color: rejectedCount === 0 ? '#9ca3af' : '#dc2626',
              borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 700,
              cursor: rejectedCount === 0 || clearing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {clearing ? 'Clearing...' : `Clear Rejected (${rejectedCount})`}
          </button>
          <button
            onClick={fetchRequests}
            style={{
              background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151',
              borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #f3f4f6', marginBottom: 24 }}>
        {['all', 'pending', 'accepted', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '9px 18px', fontSize: 13, fontWeight: filterStatus === s ? 700 : 500,
              color: filterStatus === s ? '#d97706' : '#9ca3af',
              background: 'none', border: 'none',
              borderBottom: filterStatus === s ? '2px solid #d97706' : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}{' '}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: filterStatus === s ? '#fef3c7' : '#f3f4f6', color: filterStatus === s ? '#92400e' : '#6b7280', marginLeft: 4 }}>
              {s === 'all' ? requests.length : requests.filter(r => r.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 100, background: '#f3f4f6', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🆘</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>No support requests</p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {filterStatus === 'all' ? 'No support requests have been submitted yet.' : `No ${filterStatus} requests.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map((req) => {
            const isExpanded = expandedId === req._id;
            const saving = savingMap[req._id];
            const user = req.userId;

            return (
              <div key={req._id} style={{
                background: '#fff', border: '1px solid #e8eaed',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s',
              }}>
                {/* Card header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  style={{ padding: '18px 22px', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                >
                  {/* User avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 16,
                  }}>
                    {user?.avatar
                      ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (user?.name?.[0] || '?').toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{user?.name || 'Unknown User'}</span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{user?.email}</span>
                      <StatusBadge status={req.status} />
                      {req.adminReply && (
                        <span style={{ fontSize: 11, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>
                          ✓ Replied
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {req.subject}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}
                    style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f3f4f6', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* User message */}
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>User Message</p>
                      <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
                        {req.message}
                      </div>
                    </div>

                    {/* Admin reply (if exists) */}
                    {req.adminReply && (
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Your Reply</p>
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', fontSize: 14, color: '#1e40af', lineHeight: 1.6 }}>
                          {req.adminReply}
                        </div>
                        {req.repliedAt && (
                          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                            Replied {new Date(req.repliedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Status actions */}
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Change Status</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['pending', 'accepted', 'rejected'].map((s) => {
                          const style = STATUS_STYLES[s];
                          const isActive = req.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(req._id, s)}
                              disabled={saving || isActive}
                              style={{
                                padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                background: isActive ? style.bg : '#f9fafb',
                                border: `1.5px solid ${isActive ? style.border : '#e5e7eb'}`,
                                color: isActive ? style.text : '#6b7280',
                                cursor: saving || isActive ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                textTransform: 'capitalize',
                                opacity: saving ? 0.6 : 1,
                              }}
                            >
                              {isActive ? '✓ ' : ''}{s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reply box */}
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                        {req.adminReply ? 'Update Reply' : 'Send Reply'}
                      </p>
                      <textarea
                        rows={3}
                        placeholder="Type your reply to the user..."
                        value={replyMap[req._id] || ''}
                        onChange={(e) => setReplyMap((m) => ({ ...m, [req._id]: e.target.value }))}
                        style={{
                          width: '100%', background: '#f9fafb', border: '1.5px solid #e5e7eb',
                          borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#111827',
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                          transition: 'border-color 0.2s', fontFamily: 'inherit', lineHeight: 1.5,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <button
                          onClick={() => handleSendReply(req._id)}
                          disabled={saving}
                          style={{
                            background: saving ? '#d4d4d4' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#fff', fontWeight: 700, fontSize: 13,
                            padding: '9px 22px', borderRadius: 10, border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: saving ? 'none' : '0 2px 8px rgba(245,158,11,0.3)',
                          }}
                        >
                          {saving ? 'Sending...' : req.adminReply ? '✓ Update Reply' : '→ Send Reply'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </AdminLayout>
  );
}
