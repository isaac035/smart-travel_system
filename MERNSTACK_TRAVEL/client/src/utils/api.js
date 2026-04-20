import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
    });
    
    if (error.response?.status === 401) {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Keep each role on the correct login page after an expired/invalid token.
      const isAdmin = storedUser?.role === 'admin';
      const isHotelOwner = storedUser?.role === 'hotelOwner';
      window.location.href = isAdmin ? '/admin/login' : (isHotelOwner ? '/hotel-owner/login' : '/login');
    }
    return Promise.reject(error);
  }
);

export default api;
