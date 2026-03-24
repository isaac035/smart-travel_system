import { useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';


export default function AdminDrawer({ open, onClose, title, saving, onSubmit, submitLabel = 'Save', children }) {
  const contentRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const content = contentRef.current;
    if (!wrap || !content) return;
    if (open) {
      wrap.style.height = content.scrollHeight + 'px';
      const onEnd = () => { wrap.style.height = 'auto'; };
      wrap.addEventListener('transitionend', onEnd, { once: true });
    } else {
      wrap.style.height = content.scrollHeight + 'px';
      wrap.offsetHeight;
      wrap.style.height = '0px';
    }
  }, [open]);

  useEffect(() => {
    if (open && wrapRef.current) {
      setTimeout(() => { wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
    }
  }, [open]);

  return (
    <div
      ref={wrapRef}
      style={{
        height: 0,
        overflow: 'hidden',
        transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        marginBottom: open ? 20 : 0,
      }}
    >
      <div ref={contentRef}>
        {/* Centered max-width container */}
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1.5px solid #e2e5ea',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              borderBottom: '1px solid #fcd34d',
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: '#92400e', margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: 'none',
                  background: 'rgba(146,64,14,0.08)', color: '#92400e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(146,64,14,0.16)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(146,64,14,0.08)'}
              >
                <ChevronUp size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit}>
              <div className="adm-modal-body" style={{ padding: '20px 28px 14px' }}>
                {children}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '12px 24px',
                borderTop: '1px solid #f0f0f0',
                background: '#fafbfc',
                borderRadius: '0 0 14px 14px',
              }}>
                <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="adm-btn-primary">
                  {saving ? 'Saving...' : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
