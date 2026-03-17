export default function RatingStars({ rating = 0, max = 5, size = 'sm' }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  return (
    <span className={sizes[size]}>
      {[...Array(max)].map((_, i) => (
        <span key={i} className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}>★</span>
      ))}
    </span>
  );
}
