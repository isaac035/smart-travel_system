# Sri Lanka Travel Guide — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full MERN stack Sri Lanka travel guide platform with 8 modules: User Management, Locations + Trip Planner, Hotels, Travel Products, Travel Guides, Tour Packages, Weather, and Payments.

**Architecture:** Monorepo with `client/` (React + Vite) and `server/` (Node + Express) folders. MongoDB Atlas (`Ceylon` DB). Cloudinary for images. JWT auth. Manual slip upload for all payments.

**Tech Stack:** React 18, Vite, Tailwind CSS, Shadcn/ui, react-hot-toast, React Router DOM v6, React-Leaflet, Node.js, Express, MongoDB + Mongoose, Cloudinary, multer-storage-cloudinary, OpenWeatherMap API, @dnd-kit/core, jsPDF

---

## Task 1: Server Scaffolding

**Files:**
- Create: `server/package.json`
- Create: `server/server.js`
- Create: `server/config/db.js`
- Create: `server/config/cloudinary.js`
- Create: `server/.env`

**Step 1: Initialize server**
```bash
cd C:/Users/sanet/Desktop/MERNSTACK_TRAVEL
mkdir server && cd server
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer multer-storage-cloudinary cloudinary axios
npm install --save-dev nodemon
```

**Step 2: Create `server/.env`**
```
PORT=5000
MONGO_DB_URL=mongodb+srv://mackarg:Saneth1968@cluster0.ujwhtnc.mongodb.net/?appName=Cluster0
DATABASE_NAME=Ceylon
JWT_SECRET=ceylon_travel_secret_2026
CLOUDINARY_CLOUD_NAME=ddd0uboyd
CLOUDINARY_API_KEY=369469977584878
CLOUDINARY_API_SECRET=C6jAg7S8r8P4K8XYFihw7mg5ZCI
WEATHER_API_KEY=2a3155710ae721e38b9ec922aa9dc18d
```

**Step 3: Create `server/config/db.js`**
```js
const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_DB_URL, {
    dbName: process.env.DATABASE_NAME,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
```

**Step 4: Create `server/config/cloudinary.js`**
```js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'ceylon-travel', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
```

**Step 5: Create `server/server.js`**
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes (added per task)
app.get('/', (req, res) => res.json({ message: 'Ceylon Travel API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**Step 6: Update `server/package.json` scripts**
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

**Step 7: Start server and verify**
```bash
npm run dev
# Expected: "Server running on port 5000" + "MongoDB Connected"
```

**Step 8: Commit**
```bash
cd ..
git init
git add server/
git commit -m "feat: server scaffolding with DB and Cloudinary config"
```

---

## Task 2: Client Scaffolding

**Files:**
- Create: `client/` (Vite project)
- Create: `client/.env`
- Create: `client/src/utils/api.js`

**Step 1: Create React + Vite project**
```bash
cd C:/Users/sanet/Desktop/MERNSTACK_TRAVEL
npm create vite@latest client -- --template react
cd client
npm install
npm install axios react-router-dom react-hot-toast @dnd-kit/core @dnd-kit/sortable leaflet react-leaflet jspdf
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Configure Tailwind — update `client/vite.config.js`**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Step 3: Update `client/src/index.css`**
```css
@import "tailwindcss";
```

**Step 4: Install Shadcn/ui**
```bash
npx shadcn@latest init
# Choose: Default style, Zinc color, CSS variables: yes
```

**Step 5: Create `client/.env`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Step 6: Create `client/src/utils/api.js`**
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

**Step 7: Create folder structure**
```bash
mkdir -p client/src/{assets,components,context,hooks,pages,utils}
mkdir -p client/src/pages/{auth,explore,hotels,products,guides,tours,weather,admin,profile}
```

**Step 8: Verify Vite dev server**
```bash
npm run dev
# Expected: Vite app running on http://localhost:5173
```

**Step 9: Commit**
```bash
cd ..
git add client/
git commit -m "feat: client scaffolding with Vite, Tailwind, Shadcn, React Router"
```

---

## Task 3: Auth — Backend (User Model + Routes)

**Files:**
- Create: `server/models/User.js`
- Create: `server/middleware/authMiddleware.js`
- Create: `server/controllers/authController.js`
- Create: `server/routes/authRoutes.js`
- Modify: `server/server.js`

**Step 1: Create `server/models/User.js`**
```js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  avatar: { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**Step 2: Create `server/middleware/authMiddleware.js`**
```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};

module.exports = { protect, adminOnly };
```

**Step 3: Create `server/controllers/authController.js`**
```js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { cloudinary, upload } = require('../config/cloudinary');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
};

const getMe = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name) user.name = req.body.name;
  if (req.body.avatar) user.avatar = req.body.avatar;
  await user.save();
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
};

module.exports = { register, login, getMe, updateProfile };
```

**Step 4: Create `server/routes/authRoutes.js`**
```js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
```

**Step 5: Mount routes in `server/server.js`**
```js
app.use('/api/auth', require('./routes/authRoutes'));
```

**Step 6: Test with curl**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'
# Expected: { token: "...", user: { ... } }
```

**Step 7: Commit**
```bash
git add server/
git commit -m "feat: auth backend - register, login, JWT middleware"
```

---

## Task 4: Auth — Frontend (Context + Pages)

**Files:**
- Create: `client/src/context/AuthContext.jsx`
- Create: `client/src/pages/auth/LoginPage.jsx`
- Create: `client/src/pages/auth/RegisterPage.jsx`
- Create: `client/src/App.jsx`

**Step 1: Create `client/src/context/AuthContext.jsx`**
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Step 2: Create `client/src/pages/auth/LoginPage.jsx`**
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none" type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold transition" type="submit">Login</button>
        </form>
        <p className="text-center mt-4 text-gray-300">No account? <Link to="/register" className="text-amber-400 hover:underline">Register</Link></p>
      </div>
    </div>
  );
}
```

**Step 3: Create `client/src/pages/auth/RegisterPage.jsx`**
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none" type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <input className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none" type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none" type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <input className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none" type="password" placeholder="Confirm Password" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
          <button className="w-full py-3 bg-amber-500 hover:bg-amber-600 rounded-lg font-semibold transition" type="submit">Register</button>
        </form>
        <p className="text-center mt-4 text-gray-300">Have account? <Link to="/login" className="text-amber-400 hover:underline">Login</Link></p>
      </div>
    </div>
  );
}
```

**Step 4: Create `client/src/App.jsx`**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Placeholder pages (expand per task)
const Home = () => <div className="text-white p-8">Home — Coming soon</div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**Step 5: Update `client/src/main.jsx`**
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Step 6: Verify — open browser to `/login`, register a user, check token in localStorage**

**Step 7: Commit**
```bash
git add client/
git commit -m "feat: auth frontend - login, register, AuthContext, JWT"
```

---

## Task 5: Navbar Component

**Files:**
- Create: `client/src/components/Navbar.jsx`
- Create: `client/src/components/Layout.jsx`
- Modify: `client/src/App.jsx`

**Step 1: Create `client/src/components/Navbar.jsx`**
```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const serviceLinks = [
  { label: 'Transport', to: '/services/transport' },
  { label: 'Travel Product', to: '/services/travel-products' },
  { label: 'Travel Guider', to: '/services/guides' },
  { label: 'Hotel', to: '/hotels' },
  { label: 'Weather', to: '/services/weather' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-amber-400">Ceylon Travel</Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="hover:text-amber-400 transition">Home</Link>
          <Link to="/about" className="hover:text-amber-400 transition">About Us</Link>
          <Link to="/explore" className="hover:text-amber-400 transition">Explore</Link>

          {/* Service Dropdown */}
          <div className="relative" onMouseEnter={() => setDropOpen(true)} onMouseLeave={() => setDropOpen(false)}>
            <button className="hover:text-amber-400 transition flex items-center gap-1">
              Service <span className="text-xs">▼</span>
            </button>
            {dropOpen && (
              <div className="absolute top-full left-0 mt-1 bg-black/90 rounded-lg shadow-xl min-w-[160px] py-2">
                {serviceLinks.map(s => (
                  <Link key={s.label} to={s.to} className="block px-4 py-2 hover:bg-amber-500/20 hover:text-amber-400 transition text-sm">
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="hover:text-amber-400 transition">{user.name}</Link>
              {user.role === 'admin' && <Link to="/admin" className="hover:text-amber-400 transition">Admin</Link>}
              <button onClick={handleLogout} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-full text-sm font-medium transition">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-full text-sm font-medium transition">Login</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="text-2xl">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/90 px-4 pb-4 flex flex-col gap-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-amber-400">Home</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="hover:text-amber-400">About Us</Link>
          <Link to="/explore" onClick={() => setMenuOpen(false)} className="hover:text-amber-400">Explore</Link>
          {serviceLinks.map(s => (
            <Link key={s.label} to={s.to} onClick={() => setMenuOpen(false)} className="pl-4 text-gray-300 hover:text-amber-400 text-sm">{s.label}</Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="hover:text-amber-400">{user.name}</Link>
              <button onClick={handleLogout} className="text-left text-red-400">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="text-amber-400">Login</Link>
          )}
        </div>
      )}
    </nav>
  );
}
```

**Step 2: Create `client/src/components/Layout.jsx`**
```jsx
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="pt-16">{children}</main>
    </div>
  );
}
```

**Step 3: Wrap pages in Layout in `client/src/App.jsx`**
- Import Layout and wrap the `<Routes>` block inside `<Layout>`

**Step 4: Verify — navbar renders, dropdown works, mobile hamburger works**

**Step 5: Commit**
```bash
git add client/src/components/
git commit -m "feat: navbar with dropdown, mobile menu, auth-aware links"
```

---

## Task 6: Location Model + Admin CRUD (Backend)

**Files:**
- Create: `server/models/Location.js`
- Create: `server/controllers/locationController.js`
- Create: `server/routes/locationRoutes.js`
- Modify: `server/server.js`

**Step 1: Create `server/models/Location.js`**
```js
const mongoose = require('mongoose');

const CATEGORIES = {
  Nature: ['Mountain','Waterfall','River','Forest','Cave','Botanical Garden','Farm'],
  Beach: ['Beach','Lagoon','Island'],
  Wildlife: ['National Park','Safari','Wildlife Sanctuary'],
  Historical: ['Fort','Archaeological Site','Museum'],
  Religious: ['Temple','Church','Mosque','Kovil'],
  'Hill Country': ['Tea Estate','View Point'],
  Adventure: ['Hiking','Camping','Diving','Boat Tour'],
  City: ['Urban Attractions','Street Food Area','Shopping'],
  Entertainment: ['Zoo','Water Park and Aquarium'],
};

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: Object.keys(CATEGORIES) },
  subcategory: { type: String, required: true },
  images: [{ type: String }],
  province: { type: String, required: true },
  district: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
```

**Step 2: Create `server/controllers/locationController.js`**
```js
const Location = require('../models/Location');
const { cloudinary, upload } = require('../config/cloudinary');

const getLocations = async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.subcategory) filter.subcategory = req.query.subcategory;
  if (req.query.province) filter.province = req.query.province;
  const locations = await Location.find(filter);
  res.json(locations);
};

const getLocation = async (req, res) => {
  const loc = await Location.findById(req.params.id);
  if (!loc) return res.status(404).json({ message: 'Location not found' });
  res.json(loc);
};

const createLocation = async (req, res) => {
  const images = req.files ? req.files.map(f => f.path) : [];
  const loc = await Location.create({ ...req.body, images });
  res.status(201).json(loc);
};

const updateLocation = async (req, res) => {
  const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(loc);
};

const deleteLocation = async (req, res) => {
  await Location.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

module.exports = { getLocations, getLocation, createLocation, updateLocation, deleteLocation };
```

**Step 3: Create `server/routes/locationRoutes.js`**
```js
const express = require('express');
const router = express.Router();
const { getLocations, getLocation, createLocation, updateLocation, deleteLocation } = require('../controllers/locationController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getLocations);
router.get('/:id', getLocation);
router.post('/', protect, adminOnly, upload.array('images', 10), createLocation);
router.put('/:id', protect, adminOnly, updateLocation);
router.delete('/:id', protect, adminOnly, deleteLocation);

module.exports = router;
```

**Step 4: Mount in `server/server.js`**
```js
app.use('/api/locations', require('./routes/locationRoutes'));
```

**Step 5: Test**
```bash
curl http://localhost:5000/api/locations
# Expected: [] (empty array)
```

**Step 6: Commit**
```bash
git add server/
git commit -m "feat: location model and CRUD API with Cloudinary image upload"
```

---

## Task 7: Explore Page + Location Frontend

**Files:**
- Create: `client/src/pages/explore/ExplorePage.jsx`
- Create: `client/src/pages/explore/CategoryPage.jsx`
- Create: `client/src/components/LocationCard.jsx`
- Modify: `client/src/App.jsx`

**Step 1: Create `client/src/components/LocationCard.jsx`**
```jsx
import { Link } from 'react-router-dom';

export default function LocationCard({ location }) {
  return (
    <Link to={`/explore/location/${location._id}`} className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-amber-500/20 transition">
      <div className="h-48 overflow-hidden">
        <img src={location.images[0] || '/placeholder.jpg'} alt={location.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
      </div>
      <div className="bg-gray-800 p-4">
        <span className="text-xs text-amber-400 uppercase tracking-wider">{location.subcategory}</span>
        <h3 className="text-white font-semibold mt-1">{location.name}</h3>
        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{location.description}</p>
        <p className="text-gray-500 text-xs mt-2">{location.district}, {location.province}</p>
      </div>
    </Link>
  );
}
```

**Step 2: Create `client/src/pages/explore/ExplorePage.jsx`**
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const CATEGORIES = ['Nature','Beach','Wildlife','Historical','Religious','Hill Country','Adventure','City','Entertainment'];

const CATEGORY_ICONS = {
  Nature: '🌿', Beach: '🏖️', Wildlife: '🦁', Historical: '🏛️',
  Religious: '🛕', 'Hill Country': '🍃', Adventure: '⛺', City: '🏙️', Entertainment: '🎡',
};

export default function ExplorePage() {
  const [tab, setTab] = useState('locations');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 pt-4 px-4">
      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 border-b border-gray-700 mb-8">
          <button onClick={() => setTab('locations')} className={`pb-3 px-2 font-medium transition ${tab === 'locations' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
            Locations
          </button>
          <button onClick={() => setTab('tripplan')} className={`pb-3 px-2 font-medium transition ${tab === 'tripplan' ? 'border-b-2 border-amber-400 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
            Trip Planner
          </button>
        </div>

        {tab === 'locations' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Explore Sri Lanka</h1>
            <p className="text-gray-400 mb-8">Discover amazing destinations across the pearl of the Indian Ocean</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => navigate(`/explore/${encodeURIComponent(cat)}`)}
                  className="group bg-gray-800 hover:bg-amber-500/10 border border-gray-700 hover:border-amber-500 rounded-xl p-6 text-center transition">
                  <div className="text-4xl mb-3">{CATEGORY_ICONS[cat]}</div>
                  <h3 className="text-white font-semibold group-hover:text-amber-400 transition">{cat}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'tripplan' && (
          <div className="text-center text-gray-400 py-20">
            <p className="text-2xl mb-2">Trip Planner</p>
            <p>Interactive map with route planning — built in Task 13</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create `client/src/pages/explore/CategoryPage.jsx`**
```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import LocationCard from '../../components/LocationCard';

export default function CategoryPage() {
  const { category } = useParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/locations?category=${encodeURIComponent(category)}`)
      .then(r => setLocations(r.data))
      .finally(() => setLoading(false));
  }, [category]);

  if (loading) return <div className="text-center text-white pt-20">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">{category}</h1>
      <p className="text-gray-400 mb-8">{locations.length} locations found</p>
      {locations.length === 0 ? (
        <p className="text-gray-500">No locations added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(loc => <LocationCard key={loc._id} location={loc} />)}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Add routes to `client/src/App.jsx`**
```jsx
import ExplorePage from './pages/explore/ExplorePage';
import CategoryPage from './pages/explore/CategoryPage';
// In <Routes>:
<Route path="/explore" element={<ExplorePage />} />
<Route path="/explore/:category" element={<CategoryPage />} />
```

**Step 5: Commit**
```bash
git add client/
git commit -m "feat: explore page with category cards and location listing"
```

---

## Task 8: Hotel Backend (Model + Routes)

**Files:**
- Create: `server/models/Hotel.js`
- Create: `server/models/HotelBooking.js`
- Create: `server/controllers/hotelController.js`
- Create: `server/routes/hotelRoutes.js`
- Modify: `server/server.js`

**Step 1: Create `server/models/Hotel.js`**
```js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type: String,
  pricePerNight: Number,
  capacity: Number,
  count: Number,
  amenities: [String],
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  images: [String],
  location: { type: String, required: true },
  coordinates: { lat: Number, lng: Number },
  starRating: { type: Number, min: 1, max: 5 },
  pricePerNight: Number,
  amenities: [String],
  rooms: [roomSchema],
  phone: String,
  email: String,
  website: String,
  address: String,
  discount: { type: Number, default: 0 },
  isPopular: { type: Boolean, default: false },
  reviewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  weddings: { available: Boolean, image: String },
  events: { available: Boolean, image: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Hotel', hotelSchema);
```

**Step 2: Create `server/models/HotelBooking.js`**
```js
const mongoose = require('mongoose');

const hotelBookingSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomType: String,
  roomCount: { type: Number, default: 1 },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { adults: Number, children: Number },
  totalPrice: Number,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  specialRequests: String,
  paymentSlip: String,
  status: { type: String, enum: ['pending','confirmed','cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('HotelBooking', hotelBookingSchema);
```

**Step 3: Create `server/controllers/hotelController.js`**
```js
const Hotel = require('../models/Hotel');
const HotelBooking = require('../models/HotelBooking');

const getHotels = async (req, res) => {
  const filter = { isActive: true };
  if (req.query.location) filter.location = new RegExp(req.query.location, 'i');
  if (req.query.rating) filter.starRating = { $gte: Number(req.query.rating) };
  if (req.query.minPrice) filter.pricePerNight = { $gte: Number(req.query.minPrice) };
  if (req.query.maxPrice) filter.pricePerNight = { ...filter.pricePerNight, $lte: Number(req.query.maxPrice) };
  if (req.query.filter === 'hot-deals') filter.discount = { $gt: 0 };
  if (req.query.filter === 'popular') filter.isPopular = true;
  const sort = req.query.sort === 'rating_desc' ? { averageRating: -1 } : { createdAt: -1 };
  const hotels = await Hotel.find(filter).sort(sort);
  res.json(hotels);
};

const getHotel = async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return res.status(404).json({ message: 'Hotel not found' });
  res.json(hotel);
};

const createHotel = async (req, res) => {
  const images = req.files ? req.files.map(f => f.path) : [];
  const hotel = await Hotel.create({ ...req.body, images });
  res.status(201).json(hotel);
};

const updateHotel = async (req, res) => {
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(hotel);
};

const deleteHotel = async (req, res) => {
  await Hotel.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

const createBooking = async (req, res) => {
  const booking = await HotelBooking.create({ ...req.body, userId: req.user._id });
  res.status(201).json(booking);
};

const getMyBookings = async (req, res) => {
  const bookings = await HotelBooking.find({ userId: req.user._id }).populate('hotelId', 'name images location starRating');
  res.json(bookings);
};

module.exports = { getHotels, getHotel, createHotel, updateHotel, deleteHotel, createBooking, getMyBookings };
```

**Step 4: Create `server/routes/hotelRoutes.js`**
```js
const express = require('express');
const router = express.Router();
const { getHotels, getHotel, createHotel, updateHotel, deleteHotel, createBooking, getMyBookings } = require('../controllers/hotelController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getHotels);
router.get('/:id', getHotel);
router.post('/', protect, adminOnly, upload.array('images', 20), createHotel);
router.put('/:id', protect, adminOnly, updateHotel);
router.delete('/:id', protect, adminOnly, deleteHotel);
router.post('/bookings', protect, createBooking);
router.get('/bookings/my', protect, getMyBookings);

module.exports = router;
```

**Step 5: Mount in `server/server.js`**
```js
app.use('/api/hotels', require('./routes/hotelRoutes'));
```

**Step 6: Commit**
```bash
git add server/
git commit -m "feat: hotel model, bookings model, and CRUD API"
```

---

## Task 9: Hotel Frontend (4 Pages)

**Files:**
- Create: `client/src/pages/hotels/HotelLandingPage.jsx`
- Create: `client/src/pages/hotels/HotelSearchPage.jsx`
- Create: `client/src/pages/hotels/HotelDetailsPage.jsx`
- Create: `client/src/pages/hotels/HotelBookingPage.jsx`
- Create: `client/src/components/HotelCard.jsx`
- Modify: `client/src/App.jsx`

**Step 1: Create `client/src/components/HotelCard.jsx`**
```jsx
import { Link } from 'react-router-dom';

export default function HotelCard({ hotel, highlight, onHover }) {
  return (
    <Link to={`/hotels/${hotel._id}`}
      onMouseEnter={() => onHover && onHover(hotel._id)}
      onMouseLeave={() => onHover && onHover(null)}
      className="flex gap-4 bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition p-0 group">
      <img src={hotel.images?.[0] || '/placeholder.jpg'} alt={hotel.name} className="w-40 h-32 object-cover flex-shrink-0" />
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-white group-hover:text-amber-400">{hotel.name}</h3>
          <span className={`text-sm font-bold ${highlight === 'rating' ? 'text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded' : 'text-gray-300'}`}>
            {'★'.repeat(hotel.starRating)}
          </span>
        </div>
        <p className={`text-sm mt-1 ${highlight === 'location' ? 'text-amber-400 font-medium' : 'text-gray-400'}`}>{hotel.location}</p>
        <div className={`mt-2 ${highlight === 'price' ? 'text-amber-400 font-bold text-lg' : 'text-white font-medium'}`}>
          {hotel.discount > 0 && <span className="text-xs line-through text-gray-500 mr-2">LKR {hotel.pricePerNight?.toLocaleString()}</span>}
          LKR {(hotel.pricePerNight * (1 - hotel.discount / 100))?.toLocaleString()}/night
          {hotel.discount > 0 && <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">{hotel.discount}% OFF</span>}
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Build `HotelLandingPage.jsx`** — hero search widget, hot deals section, popular section, top-rated section, interactive map with react-leaflet pins.

- Fetch from `/api/hotels?filter=hot-deals`, `/api/hotels?filter=popular`, `/api/hotels?sort=rating_desc`
- Search widget: location text, check-in/check-out date pickers, adults + children inputs
- On search: `navigate('/hotels/search?' + new URLSearchParams(...))`
- Map: `<MapContainer>` with `<Marker>` per hotel, popup shows name + image + price

**Step 3: Build `HotelSearchPage.jsx`** — split-screen layout, read `useSearchParams`, filter panel, hover state lifted to map, pagination (15/page), nearby attractions if `?location=` is set.

**Step 4: Build `HotelDetailsPage.jsx`** — hero + CTA, contact info, gallery grid, conditional events/weddings cards, amenities icons, reviews carousel (dark theme), dining section.

**Step 5: Build `HotelBookingPage.jsx`** — two-column layout, guest form, real-time price calc (`pricePerNight × rooms × nights × 1.10`), capacity warning, slip upload input, payment slip POST to `/api/payments/upload-slip`.

**Step 6: Add routes**
```jsx
<Route path="/hotels" element={<HotelLandingPage />} />
<Route path="/hotels/search" element={<HotelSearchPage />} />
<Route path="/hotels/:id" element={<HotelDetailsPage />} />
<Route path="/hotels/:id/book" element={<HotelBookingPage />} />
```

**Step 7: Commit**
```bash
git add client/
git commit -m "feat: hotel frontend - landing, search, details, booking pages"
```

---

## Task 10: Travel Product Backend + Frontend

**Files:**
- Create: `server/models/Product.js`
- Create: `server/models/Bundle.js`
- Create: `server/models/Cart.js`
- Create: `server/routes/productRoutes.js`
- Create: `client/src/pages/products/ProductsPage.jsx`
- Create: `client/src/pages/products/CartPage.jsx`

**Step 1: Create `server/models/Product.js`**
```js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [String],
  location: String,
  weatherType: { type: String, enum: ['DRY', 'RAINY', 'BOTH'], default: 'BOTH' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
```

**Step 2: Create `server/models/Bundle.js`**
```js
const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  totalPrice: Number,
  discount: { type: Number, default: 0 },
  images: [String],
}, { timestamps: true });

module.exports = mongoose.model('Bundle', bundleSchema);
```

**Step 3: Create `server/models/Cart.js`**
```js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, enum: ['product', 'bundle'] },
    qty: { type: Number, default: 1 },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
```

**Step 4: Create product + cart routes and controllers, mount in server.js**
```js
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/bundles', require('./routes/bundleRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
```

**Step 5: Create `client/src/context/CartContext.jsx`**
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const { user } = useAuth();

  const fetchCart = async () => {
    if (!user) return setCart([]);
    const { data } = await api.get('/cart');
    setCart(data.items || []);
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (itemId, type) => {
    await api.post('/cart/add', { itemId, type });
    fetchCart();
  };

  const removeFromCart = async (itemId) => {
    await api.delete(`/cart/remove/${itemId}`);
    fetchCart();
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
```

**Step 6: Build `ProductsPage.jsx`** — banner with tagline, two tabs (Products | Bundles), cart icon top-right with item count badge, left sidebar filters (name search, location + nested weather type DRY/RAINY, price range slider, in-stock toggle).

**Step 7: Build `CartPage.jsx`** — list cart items, qty adjust, remove, total price, slip upload for checkout.

**Step 8: Add routes + wrap app in CartProvider**
```jsx
<Route path="/services/travel-products" element={<ProductsPage />} />
<Route path="/services/travel-products/cart" element={<CartPage />} />
```

**Step 9: Commit**
```bash
git add .
git commit -m "feat: travel products, bundles, cart - backend and frontend"
```

---

## Task 11: Travel Guide Backend + Frontend

**Files:**
- Create: `server/models/Guide.js`
- Create: `server/models/GuideBooking.js`
- Create: `server/routes/guideRoutes.js`
- Create: `client/src/pages/guides/GuidesPage.jsx`
- Create: `client/src/pages/guides/GuideDetailsPage.jsx`
- Create: `client/src/pages/guides/GuideBookingPage.jsx`
- Create: `client/src/pages/guides/TravelerGuidesPage.jsx`

**Step 1: Create `server/models/Guide.js`**
```js
const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: String,
  languages: [String],
  experience: Number,
  location: String,
  rating: { type: Number, default: 0 },
  pricePerDay: Number,
  certifications: [String],
  services: [String],
  reviewCount: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Guide', guideSchema);
```

**Step 2: Create `server/models/GuideBooking.js`**
```js
const mongoose = require('mongoose');

const guideBookingSchema = new mongoose.Schema({
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  travelerName: String,
  email: String,
  phone: String,
  travelDate: Date,
  days: { type: Number, default: 1 },
  travelers: Number,
  location: String,
  specialRequests: String,
  totalPrice: Number,
  paymentSlip: String,
  status: { type: String, enum: ['pending','confirmed','completed','cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('GuideBooking', guideBookingSchema);
```

**Step 3: Create guide routes (list, detail, reviews, booking CRUD) and mount**
```js
app.use('/api/guides', require('./routes/guideRoutes'));
app.use('/api/guide-bookings', require('./routes/guideBookingRoutes'));
```

**Step 4: Build `GuidesPage.jsx`** — card grid with filters (location, language, rating, price range). Each GuideCard shows: photo, name, languages, experience, location, rating stars, price/day, "View Profile" button.

**Step 5: Build `GuideDetailsPage.jsx`** — guide image + info, certifications, services list, reviews section (from GET /api/guides/:id/reviews), "Hire Guide" button → /guide-booking/:id.

**Step 6: Build `GuideBookingPage.jsx`** — form with traveler details, date picker, days input, auto-calculated total (pricePerDay × days), slip upload, POST to /api/guide-bookings.

**Step 7: Build `TravelerGuidesPage.jsx`** — list user's bookings, status badges (Pending/Confirmed/Completed), cancel button, leave review modal.

**Step 8: Add routes**
```jsx
<Route path="/services/guides" element={<GuidesPage />} />
<Route path="/guides/:id" element={<GuideDetailsPage />} />
<Route path="/guide-booking/:id" element={<GuideBookingPage />} />
<Route path="/my-guides" element={<TravelerGuidesPage />} />
```

**Step 9: Commit**
```bash
git add .
git commit -m "feat: travel guide management - backend and all 4 frontend pages"
```

---

## Task 12: Weather Module

**Files:**
- Create: `server/routes/weatherRoutes.js`
- Create: `client/src/pages/weather/WeatherPage.jsx`
- Create: `client/src/components/WeatherCard.jsx`
- Create: `client/src/components/ForecastCard.jsx`

**Step 1: Create `server/routes/weatherRoutes.js`**
```js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const { city = 'Colombo' } = req.query;
  const { data } = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
  );
  res.json(data);
});

router.get('/forecast', async (req, res) => {
  const { city = 'Colombo' } = req.query;
  const { data } = await axios.get(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric&cnt=56`
  );
  res.json(data);
});

module.exports = router;
```

**Step 2: Mount in `server/server.js`**
```js
app.use('/api/weather', require('./routes/weatherRoutes'));
```

**Step 3: Build `WeatherPage.jsx`**
- Search bar at top (city input)
- Current weather card: temp, condition icon (from OpenWeatherMap icon URL), humidity, wind speed, location + date
- 7-day forecast row (group forecast data by day, pick midday entry)
- Warning system: check condition codes — thunderstorm (2xx) = Red, rain (5xx) = Yellow, clear (800) = Green
- Travel recommendation: sunny → beach, rainy → indoor, etc.
- Skeleton loading while fetching

**Step 4: Add route**
```jsx
<Route path="/services/weather" element={<WeatherPage />} />
```

**Step 5: Commit**
```bash
git add .
git commit -m "feat: weather module - proxy API, dashboard, forecast, warnings"
```

---

## Task 13: Tour Package Backend + Frontend

**Files:**
- Create: `server/models/TourPackage.js`
- Create: `server/models/TourBooking.js`
- Create: `server/routes/tourRoutes.js`
- Create: `client/src/pages/tours/TourPackagesPage.jsx`
- Create: `client/src/pages/tours/TourDetailsPage.jsx`
- Create: `client/src/pages/tours/TourBookingPage.jsx`

**Step 1: Create `server/models/TourPackage.js`**
```js
const mongoose = require('mongoose');

const tourPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  images: [String],
  locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  duration: Number,
  basePrice: Number,
  vehicleOptions: [{ type: String, enum: ['car', 'van', 'bus'] }],
  vehicleMultiplier: { car: { type: Number, default: 1 }, van: { type: Number, default: 1.3 }, bus: { type: Number, default: 1.6 } },
  guideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guide' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('TourPackage', tourPackageSchema);
```

**Step 2: Create `server/models/TourBooking.js`**
```js
const mongoose = require('mongoose');

const tourBookingSchema = new mongoose.Schema({
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TourPackage', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleType: String,
  travelers: Number,
  days: Number,
  totalPrice: Number,
  advancePayment: Number,
  paymentSlip: String,
  assignedGuides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Guide' }],
  suggestedHotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
  status: { type: String, enum: ['pending','confirmed','cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('TourBooking', tourBookingSchema);
```

**Step 3: Tour booking controller logic:**
- `advancePayment = totalPrice * 0.05`
- `totalPrice = basePrice × vehicleMultiplier[vehicleType] × days × travelers`
- On create booking: find hotels near package locations (match location field), reserve guides for the booking duration

**Step 4: Build `TourPackagesPage.jsx`** — listing grid, each card shows name, image, duration, base price, destinations count.

**Step 5: Build `TourDetailsPage.jsx`** — package info, image gallery, locations listed, assigned guides listed. Vehicle selector + travelers + days inputs with live total price calculation. "Book Now" → /tour-packages/:id/book.

**Step 6: Build `TourBookingPage.jsx`** — booking summary (package, locations, price breakdown showing 5% advance), slip upload, POST to /api/tour-bookings. Show suggested hotels from nearby Hotel DB.

**Step 7: Add routes**
```jsx
<Route path="/tour-packages" element={<TourPackagesPage />} />
<Route path="/tour-packages/:id" element={<TourDetailsPage />} />
<Route path="/tour-packages/:id/book" element={<TourBookingPage />} />
```

**Step 8: Commit**
```bash
git add .
git commit -m "feat: tour package management - backend and booking frontend"
```

---

## Task 14: Payment Management (Backend + Admin Panel)

**Files:**
- Create: `server/models/Payment.js`
- Create: `server/routes/paymentRoutes.js`
- Create: `client/src/pages/admin/AdminPaymentsPage.jsx`
- Create: `client/src/components/SlipUpload.jsx`

**Step 1: Create `server/models/Payment.js`**
```js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  source: { type: String, enum: ['hotel', 'product', 'guide', 'tour'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: Number,
  slipImage: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
```

**Step 2: Create `server/routes/paymentRoutes.js`**
```js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Upload slip — any authenticated user
router.post('/upload-slip', protect, upload.single('slip'), async (req, res) => {
  const { source, referenceId, amount } = req.body;
  const payment = await Payment.create({
    source, referenceId, amount,
    userId: req.user._id,
    slipImage: req.file.path,
  });
  res.status(201).json(payment);
});

// Admin: view all
router.get('/', protect, adminOnly, async (req, res) => {
  const filter = {};
  if (req.query.source) filter.source = req.query.source;
  if (req.query.status) filter.status = req.query.status;
  const payments = await Payment.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
  res.json(payments);
});

// Admin: approve/reject
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, { status: req.body.status, adminNote: req.body.adminNote }, { new: true });
  res.json(payment);
});

// User: own payments
router.get('/my', protect, async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = router;
```

**Step 3: Mount in `server/server.js`**
```js
app.use('/api/payments', require('./routes/paymentRoutes'));
```

**Step 4: Create reusable `client/src/components/SlipUpload.jsx`**
```jsx
import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function SlipUpload({ source, referenceId, amount, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a slip image');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('slip', file);
      formData.append('source', source);
      formData.append('referenceId', referenceId);
      formData.append('amount', amount);
      await api.post('/payments/upload-slip', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Payment slip uploaded! Awaiting approval.');
      onSuccess?.();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">Upload Payment Slip</label>
      <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-white file:cursor-pointer" />
      {file && <p className="text-xs text-gray-400">Selected: {file.name}</p>}
      <button onClick={handleUpload} disabled={uploading} className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-semibold text-white transition">
        {uploading ? 'Uploading...' : 'Submit Payment Slip'}
      </button>
    </div>
  );
}
```

**Step 5: Build `AdminPaymentsPage.jsx`** — table of all payments, filter by source/status tabs, slip image preview (click to enlarge), approve/reject buttons with optional admin note.

**Step 6: Commit**
```bash
git add .
git commit -m "feat: centralized payment management - slip upload, admin approve/reject"
```

---

## Task 15: Trip Planner (Map-based)

**Files:**
- Create: `client/src/pages/explore/TripPlannerPage.jsx`
- Create: `client/src/components/TripMap.jsx`
- Create: `server/models/TripPlan.js`
- Create: `server/routes/tripRoutes.js`

**Step 1: Create `server/models/TripPlan.js`**
```js
const mongoose = require('mongoose');

const tripPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Trip' },
  locations: [{
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    day: Number,
    order: Number,
  }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  isShared: { type: Boolean, default: false },
  shareToken: String,
}, { timestamps: true });

module.exports = mongoose.model('TripPlan', tripPlanSchema);
```

**Step 2: Create trip CRUD routes (save, edit, delete, share)**
```js
app.use('/api/trips', require('./routes/tripRoutes'));
```

**Step 3: Build `TripPlannerPage.jsx`**
- Left panel: search & add locations from Location DB, day assignment, drag-and-drop reorder with @dnd-kit
- Right panel: react-leaflet map with polyline route between locations
- Below map: distance calculation (Haversine formula), estimated time (avg 60km/h)
- Suggested hotels, guides, weather per location fetched from their APIs
- Budget estimator: sum of selected services
- Risk indicator: check weather warnings for locations
- PDF download with jsPDF (trip summary)
- Save/share button

**Step 4: Update Explore page tab 2 to use TripPlannerPage**

**Step 5: Commit**
```bash
git add .
git commit -m "feat: trip planner with map, route, day planning, drag-drop, PDF export"
```

---

## Task 16: Admin Dashboard

**Files:**
- Create: `client/src/pages/admin/AdminDashboard.jsx`
- Create: `client/src/pages/admin/AdminLocationsPage.jsx`
- Create: `client/src/pages/admin/AdminHotelsPage.jsx`
- Create: `client/src/pages/admin/AdminProductsPage.jsx`
- Create: `client/src/pages/admin/AdminGuidesPage.jsx`
- Create: `client/src/pages/admin/AdminTourPackagesPage.jsx`
- Create: `client/src/components/AdminLayout.jsx`

**Step 1: Create `AdminLayout.jsx`** — sidebar with nav links to all admin sections, breadcrumbs, admin-only route guard.

**Step 2: Create `AdminDashboard.jsx`** — stats cards: total users, total bookings (sum all sources), total revenue (sum approved payments per source), recent payments table.

**Step 3: Build CRUD pages for each resource** — each page has:
- Data table with edit/delete actions
- "Add New" form (inline or modal) with Cloudinary image upload
- Confirmation dialogs before delete
- Toast notifications on success/error

**Step 4: Add admin route guard component**
```jsx
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/login" />;
  return children;
};
```

**Step 5: Add admin routes**
```jsx
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<AdminDashboard />} />
  <Route path="locations" element={<AdminLocationsPage />} />
  <Route path="hotels" element={<AdminHotelsPage />} />
  <Route path="products" element={<AdminProductsPage />} />
  <Route path="guides" element={<AdminGuidesPage />} />
  <Route path="tour-packages" element={<AdminTourPackagesPage />} />
  <Route path="payments" element={<AdminPaymentsPage />} />
</Route>
```

**Step 6: Commit**
```bash
git add .
git commit -m "feat: admin dashboard with CRUD panels for all modules"
```

---

## Task 17: User Profile + Home Page

**Files:**
- Create: `client/src/pages/profile/ProfilePage.jsx`
- Create: `client/src/pages/HomePage.jsx`

**Step 1: Build `ProfilePage.jsx`**
- Avatar upload (Cloudinary via PUT /api/auth/profile)
- Personal info edit
- Tabs: Hotel Bookings | Guide Bookings | Tour Bookings | Products Orders | Payment History
- Tour package tab: shows package details, locations on interactive react-leaflet map, assigned hotels
- Favorite locations list

**Step 2: Build `HomePage.jsx`**
- Hero section: full-screen video/image background, headline "Discover the Pearl of the Indian Ocean", CTA buttons
- Featured locations section (from /api/locations, 6 cards)
- Featured hotels (from /api/hotels?filter=popular, 4 cards)
- Tour packages preview (3 cards)
- Weather widget for Colombo
- "Why Sri Lanka" section with icons
- Footer with links

**Step 3: Add routes**
```jsx
<Route path="/" element={<HomePage />} />
<Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
```

**Step 4: Commit**
```bash
git add .
git commit -m "feat: home page and user profile with booking history and map"
```

---

## Task 18: Polish + Production Readiness

**Step 1: Add error boundaries to all major pages**

**Step 2: Add loading skeletons (Shadcn Skeleton) to all data-fetching pages**
- Hotel cards skeleton
- Guide cards skeleton
- Weather skeleton
- Location cards skeleton

**Step 3: Verify mobile responsiveness** — test all pages at 375px, 768px, 1280px

**Step 4: Add 404 page**
```jsx
<Route path="*" element={<NotFoundPage />} />
```

**Step 5: Add About Us page (`/about`)**

**Step 6: Set up Leaflet CSS import in `client/src/main.jsx`**
```js
import 'leaflet/dist/leaflet.css';
```

**Step 7: Fix Leaflet default marker icons (known Vite issue)**
```js
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });
```

**Step 8: Final commit**
```bash
git add .
git commit -m "feat: polish - skeletons, error handling, mobile responsive, 404 page"
```

---

## Dependency Reference

### Server
```json
{
  "dependencies": {
    "axios": "^1.x",
    "bcryptjs": "^2.x",
    "cloudinary": "^1.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "express": "^4.x",
    "jsonwebtoken": "^9.x",
    "mongoose": "^8.x",
    "multer": "^1.x",
    "multer-storage-cloudinary": "^4.x"
  }
}
```

### Client
```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^7.x",
    "axios": "^1.x",
    "jspdf": "^2.x",
    "leaflet": "^1.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-hot-toast": "^2.x",
    "react-leaflet": "^4.x",
    "react-router-dom": "^6.x"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "vite": "^6.x"
  }
}
```
