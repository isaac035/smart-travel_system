import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guideId, setGuideId] = useState(null);

  // On app load, restore session from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(async (res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          // If guide, fetch their guide profile ID
          if (res.data.role === 'guide') {
            try {
              const guideRes = await api.get('/guide-dashboard/profile');
              setGuideId(guideRes.data._id);
            } catch {}
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrToken, passwordOrUser, user) => {
    // If called with token and user directly (from registration)
    if (typeof emailOrToken === 'string' && passwordOrUser && typeof passwordOrUser === 'object') {
      const token = emailOrToken;
      const userData = passwordOrUser;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    
    // Traditional login with email/password
    const email = emailOrToken;
    const pass = passwordOrUser;
    const { data } = await api.post('/auth/login', { email, password: pass });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    const wasGuide = user?.role === 'guide';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setGuideId(null);
    return wasGuide;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, guideId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
