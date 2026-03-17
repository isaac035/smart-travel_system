import { useState, useRef, useEffect } from 'react';

export default function AdminTabs({ tabs, activeTab, onChange }) {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef([]);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      gap: 4,
      padding: 4,
      background: '#f1f5f9',
      borderRadius: 14,
      marginBottom: 24,
      width: 'fit-content',
    }}>
      {/* Sliding indicator */}
      <div style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: indicatorStyle.left || 0,
        width: indicatorStyle.width || 0,
        background: '#ffffff',
        borderRadius: 11,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)',
        transition: 'left 0.3s cubic-bezier(0.25, 1, 0.5, 1), width 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: 0,
      }} />

      {tabs.map((tab, i) => {
        const isActive = activeTab === i;
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            ref={el => tabRefs.current[i] = el}
            onClick={() => onChange(i)}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 18px',
              borderRadius: 11,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#0f172a' : '#64748b',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {Icon && <Icon size={15} style={{ color: isActive ? '#f59e0b' : '#94a3b8', transition: 'color 0.2s ease', flexShrink: 0 }} />}
            {tab.label}
            {tab.badge > 0 && (
              <span style={{
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#f59e0b' : '#e2e8f0',
                color: isActive ? '#fff' : '#64748b',
                transition: 'all 0.2s ease',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
