import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import GuideRegisterPage from './pages/auth/GuideRegisterPage';
import GuideDashboardPage from './pages/guide/GuideDashboardPage';
import GuideSchedulePage from './pages/guide/GuideSchedulePage';
import HomePage from './pages/home/HomePage';
import ProfilePage from './pages/profile/ProfilePage';

import ExplorePage from './pages/explore/ExplorePage';
import CategoryPage from './pages/explore/CategoryPage';
import LocationDetailPage from './pages/explore/LocationDetailPage';

import HotelLandingPage from './pages/hotels/HotelLandingPage';
import HotelSearchPage from './pages/hotels/HotelSearchPage';
import HotelDetailsPage from './pages/hotels/HotelDetailsPage';
import HotelBookingPage from './pages/hotels/HotelBookingPage';

import ProductsPage from './pages/products/ProductsPage';
import CartPage from './pages/products/CartPage';
import ProductDetailsPage from './pages/products/ProductDetailsPage';

import GuidesPage from './pages/guides/GuidesPage';
import GuideDetailsPage from './pages/guides/GuideDetailsPage';
import GuideBookingPage from './pages/guides/GuideBookingPage';
import TravelerGuidesPage from './pages/guides/TravelerGuidesPage';

import WeatherPage from './pages/weather/WeatherPage';

import TourPackagesPage from './pages/tours/TourPackagesPage';
import TourDetailsPage from './pages/tours/TourDetailsPage';
import TourBookingPage from './pages/tours/TourBookingPage';
import MyToursPage from './pages/tours/MyToursPage';

import AdminDashboard from './pages/admin/AdminDashboard';

import AdminLocationsPage from './pages/admin/AdminLocationsPage';
import AdminHotelsPage from './pages/admin/AdminHotelsPage';
import AdminGuidesPage from './pages/admin/AdminGuidesPage';
import AdminToursPage from './pages/admin/AdminToursPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

import AboutPage from './pages/about/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' },
              success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
            }}
          />
          <ScrollToTop />
          <ErrorBoundary>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Explore */}
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/explore/location/:id" element={<LocationDetailPage />} />
              <Route path="/explore/:category" element={<CategoryPage />} />

              {/* Hotels */}
              <Route path="/hotels" element={<HotelLandingPage />} />
              <Route path="/hotels/search" element={<HotelSearchPage />} />
              <Route path="/hotels/:id" element={<HotelDetailsPage />} />
              <Route path="/hotels/:id/book" element={<PrivateRoute><HotelBookingPage /></PrivateRoute>} />

              {/* Travel Products */}
              <Route path="/services/travel-products" element={<ProductsPage />} />
              <Route path="/services/travel-products/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
              <Route path="/services/travel-products/:id" element={<ProductDetailsPage />} />

              {/* Travel Guides */}
              <Route path="/services/guides" element={<GuidesPage />} />
              <Route path="/guides/:id" element={<GuideDetailsPage />} />
              <Route path="/guide-booking/:id" element={<PrivateRoute><GuideBookingPage /></PrivateRoute>} />
              <Route path="/my-guides" element={<PrivateRoute><TravelerGuidesPage /></PrivateRoute>} />

              {/* Guide Auth & Dashboard */}
              <Route path="/guide/login" element={<Navigate to="/login" replace />} />
              <Route path="/guide/register" element={<GuideRegisterPage />} />
              <Route path="/guide/dashboard" element={<PrivateRoute><GuideDashboardPage /></PrivateRoute>} />
              <Route path="/guide/schedule" element={<PrivateRoute><GuideSchedulePage /></PrivateRoute>} />

              {/* Weather */}
              <Route path="/services/weather" element={<WeatherPage />} />

              {/* Tour Packages */}
              <Route path="/tours" element={<TourPackagesPage />} />
              <Route path="/tours/:id" element={<TourDetailsPage />} />
              <Route path="/tours/:id/book" element={<PrivateRoute><TourBookingPage /></PrivateRoute>} />
              <Route path="/my-tours" element={<PrivateRoute><MyToursPage /></PrivateRoute>} />

              {/* Protected */}
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              <Route path="/admin/locations" element={<AdminRoute><AdminLocationsPage /></AdminRoute>} />
              <Route path="/admin/hotels" element={<AdminRoute><AdminHotelsPage /></AdminRoute>} />
              <Route path="/admin/guides" element={<AdminRoute><AdminGuidesPage /></AdminRoute>} />
              <Route path="/admin/tours" element={<AdminRoute><AdminToursPage /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
