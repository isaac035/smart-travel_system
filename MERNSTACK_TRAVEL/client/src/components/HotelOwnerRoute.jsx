import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HotelOwnerRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/hotel-owner/login" replace />;
  if (user.role !== 'hotelOwner') return <Navigate to="/hotel-owner/login" replace />;
  return children;
}

