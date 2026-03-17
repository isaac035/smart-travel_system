import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Decorative */}
          <div className="relative mb-8 inline-block">
            <div className="text-[10rem] font-black text-gray-800 leading-none select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center text-6xl">🏝️</div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Page Not Found</h1>
          <p className="text-gray-400 text-lg mb-8">
            Looks like this destination doesn't exist on our map. Let's get you back on track.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="border border-gray-600 hover:border-amber-500 text-gray-300 hover:text-amber-400 font-medium px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              ← Go Back
            </button>
            <Link
              to="/"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Home
            </Link>
            <Link
              to="/explore"
              className="border border-gray-600 hover:border-amber-500 text-gray-300 hover:text-amber-400 font-medium px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              Explore Sri Lanka
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hotels', to: '/hotels', icon: '🏨' },
              { label: 'Tours', to: '/tours', icon: '🗺️' },
              { label: 'Guides', to: '/services/guides', icon: '🧭' },
              { label: 'Weather', to: '/services/weather', icon: '☀️' },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-500/30 rounded-xl p-3 text-center transition-all">
                <div className="text-2xl mb-1">{l.icon}</div>
                <div className="text-sm text-gray-300">{l.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
