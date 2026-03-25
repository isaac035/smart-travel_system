import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const cardStyle = {
  display: 'block',
  borderRadius: '16px',
  overflow: 'hidden',
  background: '#fff',
  boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  aspectRatio: '1 / 1',
};

const cardHoverStyle = {
  transform: 'translateY(-6px)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
};

export default function LocationCard({ location }) {
  return (
    <Link
      to={`/explore/location/${location._id}`}
      style={cardStyle}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
      }}
    >
      {/* Image section - 70% height */}
      <div style={{ position: 'relative', height: '70%', overflow: 'hidden' }}>
        {location.images && location.images.length > 0 ? (
          <img
            src={location.images[0]}
            alt={location.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}>
            🏝️
          </div>
        )}

      </div>


      {/* Content section - 30% height */}
      <div style={{
        height: '30%',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '700',
          color: '#1a1a1a',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {location.name}
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginTop: '6px',
          color: '#888',
          fontSize: '13px',
        }}>
          <MapPin size={14} style={{ flexShrink: 0 }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {location.district}, {location.province}
          </span>
        </div>
      </div>
    </Link>
  );
}
