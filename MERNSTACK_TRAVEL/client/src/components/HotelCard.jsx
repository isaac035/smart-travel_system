import { Link } from 'react-router-dom';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

export default function HotelCard({ hotel, highlight, onHover, variant = 'horizontal' }) {
  const discountedPrice = hotel.pricePerNight * (1 - (hotel.discount || 0) / 100);

  if (variant === 'vertical') {
    return (
      <Link
        to={`/hotels/${hotel._id}`}
        onMouseEnter={() => onHover && onHover(hotel._id)}
        onMouseLeave={() => onHover && onHover(null)}
        className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'; }}
        onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={hotel.images?.[0] || PLACEHOLDER}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          {hotel.discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>
              -{hotel.discount}% OFF
            </span>
          )}
          {hotel.starRating && (
            <span className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-amber-400 text-xs font-bold px-2 py-1 rounded-full">
              {'★'.repeat(hotel.starRating)}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-gray-900 font-bold text-base group-hover:text-amber-600 transition-colors line-clamp-1">
            {hotel.name}
          </h3>
          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {hotel.location}
          </p>

          {hotel.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hotel.amenities.slice(0, 3).map((a) => (
                <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">{a}</span>
              ))}
              {hotel.amenities.length > 3 && (
                <span className="text-[11px] text-gray-400 font-medium">+{hotel.amenities.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              {hotel.discount > 0 && (
                <span className="text-xs text-gray-400 line-through block">LKR {hotel.pricePerNight?.toLocaleString()}</span>
              )}
              <span className="font-bold text-lg text-amber-600">
                LKR {Math.round(discountedPrice).toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 ml-1">/night</span>
            </div>
            {hotel.reviewCount > 0 && (
              <div className="text-right">
                <span className="text-amber-500 font-bold text-sm">★ {hotel.averageRating}</span>
                <span className="text-gray-400 text-[11px] block">{hotel.reviewCount} reviews</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal variant
  return (
    <Link
      to={`/hotels/${hotel._id}`}
      onMouseEnter={() => onHover && onHover(hotel._id)}
      onMouseLeave={() => onHover && onHover(null)}
      className="group flex bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 border border-gray-100"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
      onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }}
      onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; }}
    >
      {/* Image */}
      <div className="w-44 sm:w-56 flex-shrink-0 overflow-hidden relative">
        <img
          src={hotel.images?.[0] || PLACEHOLDER}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
        />
        {hotel.discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
            style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.4)' }}>
            -{hotel.discount}%
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 p-5 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-gray-900 font-bold text-base group-hover:text-amber-600 transition-colors line-clamp-1">
              {hotel.name}
            </h3>
            <p className={`text-sm mt-1 flex items-center gap-1 ${
              highlight === 'location' ? 'text-amber-600 font-medium' : 'text-gray-500'
            }`}>
              <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {hotel.location}
            </p>
          </div>
          {hotel.starRating && (
            <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
              highlight === 'rating'
                ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {'★'.repeat(hotel.starRating)} {hotel.starRating}
            </span>
          )}
        </div>

        {hotel.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hotel.amenities.slice(0, 4).map((a) => (
              <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">{a}</span>
            ))}
            {hotel.amenities.length > 4 && (
              <span className="text-[11px] text-gray-400 font-medium self-center">+{hotel.amenities.length - 4} more</span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div className={`${highlight === 'price' ? 'bg-amber-50 ring-2 ring-amber-200 rounded-lg px-3 py-1.5' : ''}`}>
            {hotel.discount > 0 && (
              <span className="text-xs text-gray-400 line-through block">LKR {hotel.pricePerNight?.toLocaleString()}</span>
            )}
            <span className={`font-bold text-lg ${highlight === 'price' ? 'text-amber-600' : 'text-gray-900'}`}>
              LKR {Math.round(discountedPrice).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 ml-1">/night</span>
          </div>
          {hotel.reviewCount > 0 && (
            <div className={`text-right ${highlight === 'rating' ? 'text-amber-600' : ''}`}>
              <span className="text-amber-500 font-bold">★ {hotel.averageRating}</span>
              <span className="text-gray-400 text-xs ml-1">({hotel.reviewCount})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
