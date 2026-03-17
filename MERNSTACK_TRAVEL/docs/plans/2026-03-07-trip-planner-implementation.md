# Trip Planner Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Trip Planner as a 4-step wizard with smart auto-grouping, OpenRouteService routing, light theme UI, and profile page integration.

**Architecture:** Step-by-step wizard (Setup > Select Locations > Itinerary > Save) inside the existing ExplorePage "Plan Your Trip" tab. Backend adds OpenRouteService proxy endpoints for distance matrix and route directions. TripPlan model updated with start point, pace, and distance fields. Profile page gets a new "Trip Plans" tab.

**Tech Stack:** React + Tailwind (light theme), react-leaflet, @dnd-kit, jsPDF, OpenRouteService API, Express/Mongoose backend, axios

---

## Task 1: Add OpenRouteService Environment Variable

**Files:**
- Modify: `server/.env` (add new key)

**Step 1: Add the ORS API key to .env**

Add this line to the end of `server/.env`:

```
ORS_API_KEY=your_openrouteservice_api_key_here
```

> Get a free API key from https://openrouteservice.org/dev/#/signup — free tier allows 2000 requests/day.

**Step 2: Verify the server reads it**

Run: `cd server && node -e "require('dotenv').config(); console.log('ORS key set:', !!process.env.ORS_API_KEY)"`
Expected: `ORS key set: true`

---

## Task 2: Update TripPlan Model

**Files:**
- Modify: `server/models/TripPlan.js`

**Step 1: Add new fields to the TripPlan schema**

Replace the entire file with:

```javascript
const mongoose = require('mongoose');

const tripLocationSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
});

const tripDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  locations: [tripLocationSchema],
});

const tripPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    days: [tripDaySchema],
    startPoint: {
      lat: { type: Number },
      lng: { type: Number },
      name: { type: String, default: 'Colombo' },
    },
    pace: {
      type: String,
      enum: ['relaxed', 'moderate', 'packed'],
      default: 'moderate',
    },
    totalDistance: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TripPlan', tripPlanSchema);
```

**Step 2: Verify model loads**

Run: `cd server && node -e "require('dotenv').config(); const m = require('mongoose'); m.connect(process.env.MONGO_DB_URL).then(() => { const T = require('./models/TripPlan'); console.log('Model fields:', Object.keys(T.schema.paths)); process.exit(0); })"`

Expected: Should list all field paths including `startPoint.lat`, `pace`, `totalDistance`, `totalDuration`.

---

## Task 3: Create Route Proxy Controller + Routes

**Files:**
- Create: `server/controllers/routeController.js`
- Create: `server/routes/routeRoutes.js`
- Modify: `server/server.js` (register new route)

**Step 1: Create the route controller**

Create `server/controllers/routeController.js`:

```javascript
const axios = require('axios');

const ORS_BASE = 'https://api.openrouteservice.org';

// POST /api/routes/matrix
// Body: { locations: [[lng, lat], [lng, lat], ...] }
exports.getMatrix = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!locations || locations.length < 2) {
      return res.status(400).json({ message: 'At least 2 locations required' });
    }
    const response = await axios.post(
      `${ORS_BASE}/v2/matrix/driving-car`,
      { locations, metrics: ['distance', 'duration'] },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message;
    res.status(status).json({ message });
  }
};

// POST /api/routes/directions
// Body: { coordinates: [[lng, lat], [lng, lat], ...] }
exports.getDirections = async (req, res) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || coordinates.length < 2) {
      return res.status(400).json({ message: 'At least 2 coordinates required' });
    }
    const response = await axios.post(
      `${ORS_BASE}/v2/directions/driving-car/geojson`,
      { coordinates },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.error?.message || err.message;
    res.status(status).json({ message });
  }
};
```

**Step 2: Create the route file**

Create `server/routes/routeRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { getMatrix, getDirections } = require('../controllers/routeController');

router.post('/matrix', getMatrix);
router.post('/directions', getDirections);

module.exports = router;
```

**Step 3: Register in server.js**

Add this line after the trips route in `server/server.js` (after line 34):

```javascript
app.use('/api/routes', require('./routes/routeRoutes'));
```

**Step 4: Test the endpoint**

Run server: `cd server && npm start`

Test with curl (use your ORS key):
```bash
curl -X POST http://localhost:5000/api/routes/matrix \
  -H "Content-Type: application/json" \
  -d '{"locations":[[79.8612,6.9271],[80.6350,7.2906]]}'
```

Expected: JSON with `durations` and `distances` arrays.

---

## Task 4: Update Trip Controller for New Fields

**Files:**
- Modify: `server/controllers/tripController.js`

**Step 1: Update createTrip and updateTrip to accept new fields**

Replace the entire file with:

```javascript
const TripPlan = require('../models/TripPlan');

// GET /api/trips/my
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await TripPlan.find({ userId: req.user._id })
      .populate('days.locations.locationId', 'name district coordinates images category mapImage')
      .sort({ updatedAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/trips/:id
exports.getTrip = async (req, res) => {
  try {
    const trip = await TripPlan.findOne({ _id: req.params.id, userId: req.user._id }).populate(
      'days.locations.locationId',
      'name district province coordinates images category subcategory mapImage'
    );
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/trips
exports.createTrip = async (req, res) => {
  try {
    const { name, days, startPoint, pace, totalDistance, totalDuration } = req.body;
    const trip = await TripPlan.create({
      userId: req.user._id,
      name,
      days: days || [],
      startPoint: startPoint || { lat: 6.9271, lng: 79.8612, name: 'Colombo' },
      pace: pace || 'moderate',
      totalDistance: totalDistance || 0,
      totalDuration: totalDuration || 0,
    });
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/trips/:id
exports.updateTrip = async (req, res) => {
  try {
    const { name, days, startPoint, pace, totalDistance, totalDuration } = req.body;
    const update = { name, days };
    if (startPoint) update.startPoint = startPoint;
    if (pace) update.pace = pace;
    if (totalDistance !== undefined) update.totalDistance = totalDistance;
    if (totalDuration !== undefined) update.totalDuration = totalDuration;

    const trip = await TripPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    ).populate('days.locations.locationId', 'name district coordinates images category mapImage');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/trips/:id
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await TripPlan.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Step 5: Commit backend changes**

```bash
git add server/models/TripPlan.js server/controllers/tripController.js server/controllers/routeController.js server/routes/routeRoutes.js server/server.js
git commit -m "feat: add OpenRouteService proxy endpoints and update TripPlan model"
```

---

## Task 5: Create TripSetupStep Component

**Files:**
- Create: `client/src/pages/explore/trip-planner/TripSetupStep.jsx`

**Step 1: Create the component**

Create `client/src/pages/explore/trip-planner/TripSetupStep.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 8px rgba(0,0,0,0.3);animation:pulse 2s infinite"></div>`,
  iconAnchor: [9, 9],
});

const startIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#f59e0b;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.3),0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconAnchor: [10, 10],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const PACE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed', desc: '2-3 stops/day', icon: '🌴' },
  { value: 'moderate', label: 'Moderate', desc: '4-5 stops/day', icon: '🚶' },
  { value: 'packed', label: 'Packed', desc: '6-7 stops/day', icon: '⚡' },
];

export default function TripSetupStep({ config, setConfig, onNext }) {
  const [userLocation, setUserLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My Location' };
        setUserLocation(loc);
        setConfig((prev) => ({ ...prev, startPoint: loc }));
        setDetectingLocation(false);
      },
      () => setDetectingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const handleMapClick = (latlng) => {
    setConfig((prev) => ({
      ...prev,
      startPoint: { lat: latlng.lat, lng: latlng.lng, name: 'Custom Point' },
    }));
  };

  const canProceed = config.tripName.trim() && config.duration > 0 && config.startPoint;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Form */}
      <div className="space-y-6">
        {/* Trip Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Trip Name</label>
          <input
            type="text"
            value={config.tripName}
            onChange={(e) => setConfig((prev) => ({ ...prev, tripName: e.target.value }))}
            placeholder="My Sri Lanka Adventure"
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Trip Duration</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <button
                key={d}
                onClick={() => setConfig((prev) => ({ ...prev, duration: d }))}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  config.duration === d
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                {d} {d === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Pace */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Travel Pace</label>
          <div className="grid grid-cols-3 gap-3">
            {PACE_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setConfig((prev) => ({ ...prev, pace: p.value }))}
                className={`p-4 rounded-xl text-center transition-all ${
                  config.pace === p.value
                    ? 'bg-amber-50 border-2 border-amber-500 shadow-md shadow-amber-100'
                    : 'bg-white border-2 border-gray-200 hover:border-amber-300'
                }`}
              >
                <div className="text-2xl mb-1">{p.icon}</div>
                <div className={`text-sm font-semibold ${config.pace === p.value ? 'text-amber-700' : 'text-gray-700'}`}>{p.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Point */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">Start Point</label>
          <div className="flex gap-2 mb-3">
            <button
              onClick={detectLocation}
              disabled={detectingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              {detectingLocation ? 'Detecting...' : 'Use My Location'}
            </button>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, startPoint: { lat: 6.9271, lng: 79.8612, name: 'Colombo' } }))}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:border-amber-300 transition-colors"
            >
              Colombo (Default)
            </button>
          </div>
          {config.startPoint && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-sm text-amber-800 font-medium">{config.startPoint.name}</span>
              <span className="text-xs text-amber-600">({config.startPoint.lat.toFixed(4)}, {config.startPoint.lng.toFixed(4)})</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Or click on the map to set your start point</p>
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors shadow-md shadow-amber-200 disabled:shadow-none"
        >
          Next: Select Locations →
        </button>
      </div>

      {/* Right: Mini Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[500px]">
        <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup><strong>Your Location</strong></Popup>
            </Marker>
          )}
          {config.startPoint && (
            <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={startIcon}>
              <Popup><strong>Start Point:</strong> {config.startPoint.name}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/explore/trip-planner/TripSetupStep.jsx
git commit -m "feat: add TripSetupStep wizard component"
```

---

## Task 6: Create LocationSelectStep Component

**Files:**
- Create: `client/src/pages/explore/trip-planner/LocationSelectStep.jsx`

**Step 1: Create the component**

Create `client/src/pages/explore/trip-planner/LocationSelectStep.jsx`:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../../utils/api';

const CATEGORIES = [
  { name: 'All', icon: '🌍' },
  { name: 'Nature', icon: '🌿' },
  { name: 'Beach', icon: '🏖️' },
  { name: 'Wildlife', icon: '🦁' },
  { name: 'Historical', icon: '🏛️' },
  { name: 'Religious', icon: '🛕' },
  { name: 'Hill Country', icon: '🍃' },
  { name: 'Adventure', icon: '⛺' },
  { name: 'City', icon: '🏙️' },
  { name: 'Entertainment', icon: '🎡' },
];

const pinIcon = (selected) =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="28" height="38">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.314 16 28 16 28s16-16.686 16-28C32 7.163 24.837 0 16 0z" fill="${selected ? '#f59e0b' : '#94a3b8'}"/>
      <circle cx="16" cy="15" r="6" fill="white"/>
      ${selected ? '<text x="16" y="18" text-anchor="middle" fill="#f59e0b" font-size="10" font-weight="bold">✓</text>' : ''}
    </svg>`,
    iconAnchor: [14, 38],
    iconSize: [28, 38],
  });

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3),0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconAnchor: [8, 8],
});

function MapFitter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

export default function LocationSelectStep({ selectedIds, setSelectedIds, startPoint, onNext, onBack }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api.get('/locations')
      .then((r) => setLocations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = locations;
    if (category !== 'All') list = list.filter((l) => l.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || l.district?.toLowerCase().includes(q));
    }
    return list;
  }, [locations, category, search]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedLocations = locations.filter((l) => selectedIds.includes(l._id));

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Select Destinations</h3>
          <p className="text-sm text-gray-500">Choose places you want to visit</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
            {selectedIds.length} selected
          </span>
          <button onClick={onBack} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={selectedIds.length < 1}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Generate Itinerary →
          </button>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                category === c.name
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
              }`}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main content: Grid + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '520px' }}>
        {/* Location Grid */}
        <div className="lg:col-span-2 overflow-y-auto pr-1 space-y-2" style={{ maxHeight: '520px' }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No locations found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            filtered.map((loc) => {
              const isSelected = selectedIds.includes(loc._id);
              return (
                <button
                  key={loc._id}
                  onClick={() => toggleSelect(loc._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-amber-50 border-2 border-amber-400 shadow-sm'
                      : 'bg-white border-2 border-gray-100 hover:border-amber-200 hover:shadow-sm'
                  }`}
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {loc.images?.[0] ? (
                      <img src={loc.images[0]} alt={loc.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📍</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>{loc.name}</p>
                    <p className="text-xs text-gray-500 truncate">{loc.district} · {loc.category}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%', minHeight: '520px' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {startPoint && (
              <Marker position={[startPoint.lat, startPoint.lng]} icon={userIcon}>
                <Popup><strong>Start Point</strong><br />{startPoint.name}</Popup>
              </Marker>
            )}
            {locations.filter((l) => l.coordinates?.lat).map((loc) => (
              <Marker
                key={loc._id}
                position={[loc.coordinates.lat, loc.coordinates.lng]}
                icon={pinIcon(selectedIds.includes(loc._id))}
                eventHandlers={{ click: () => toggleSelect(loc._id) }}
              >
                <Popup>
                  <div style={{ width: '180px' }}>
                    {loc.images?.[0] && (
                      <img src={loc.images[0]} alt={loc.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }} />
                    )}
                    <strong style={{ fontSize: '13px' }}>{loc.name}</strong>
                    <br />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{loc.district} · {loc.category}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
            {selectedLocations.length > 0 && <MapFitter coords={selectedLocations.filter((l) => l.coordinates?.lat).map((l) => l.coordinates)} />}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/explore/trip-planner/LocationSelectStep.jsx
git commit -m "feat: add LocationSelectStep with map selection and filtering"
```

---

## Task 7: Create Auto-Grouping Utility

**Files:**
- Create: `client/src/pages/explore/trip-planner/autoGroup.js`

**Step 1: Create the auto-grouping algorithm**

Create `client/src/pages/explore/trip-planner/autoGroup.js`:

```javascript
import api from '../../../utils/api';

const PACE_LIMITS = {
  relaxed: { min: 2, max: 3 },
  moderate: { min: 4, max: 5 },
  packed: { min: 6, max: 7 },
};

/**
 * Get distance matrix from OpenRouteService via our backend proxy.
 * @param {Array} points - Array of { lat, lng } objects. First element is start point.
 * @returns {{ distances: number[][], durations: number[][] }}
 */
export async function getDistanceMatrix(points) {
  // ORS expects [lng, lat] format
  const locations = points.map((p) => [p.lng, p.lat]);
  const { data } = await api.post('/routes/matrix', { locations });
  return data;
}

/**
 * Get route directions (polyline) from OpenRouteService.
 * @param {Array} points - Array of { lat, lng } objects in order.
 * @returns {Object} GeoJSON response with route geometry.
 */
export async function getRouteDirections(points) {
  const coordinates = points.map((p) => [p.lng, p.lat]);
  const { data } = await api.post('/routes/directions', { coordinates });
  return data;
}

/**
 * Auto-group selected locations into days using nearest-neighbor clustering.
 *
 * @param {Object} startPoint - { lat, lng }
 * @param {Array} locations - Array of location objects with coordinates
 * @param {number} numDays - Number of trip days
 * @param {string} pace - 'relaxed' | 'moderate' | 'packed'
 * @param {boolean} reverse - If true, start from farthest location (alternative route)
 * @returns {{ days: Array, warning: string|null }}
 */
export async function autoGroupLocations(startPoint, locations, numDays, pace, reverse = false) {
  const maxPerDay = PACE_LIMITS[pace]?.max || 5;
  const totalCapacity = maxPerDay * numDays;

  let warning = null;
  if (locations.length > totalCapacity) {
    warning = `You have ${locations.length} locations but only ${totalCapacity} slots (${numDays} days × ${maxPerDay} stops). Consider adding more days or switching to a faster pace.`;
  }

  const validLocations = locations.filter((l) => l.coordinates?.lat && l.coordinates?.lng);
  if (validLocations.length === 0) return { days: [], warning: 'No locations with valid coordinates.' };

  // Build points array: [startPoint, ...locations]
  const allPoints = [startPoint, ...validLocations.map((l) => l.coordinates)];

  let matrix;
  try {
    matrix = await getDistanceMatrix(allPoints);
  } catch {
    // Fallback to Haversine if ORS fails
    matrix = buildHaversineMatrix(allPoints);
  }

  const distances = matrix.distances; // meters
  const durations = matrix.durations; // seconds

  // Nearest-neighbor assignment
  const visited = new Set();
  const days = [];
  let currentIdx = 0; // start from startPoint (index 0)

  if (reverse) {
    // Find farthest location from start for alternative route
    let maxDist = 0;
    let farthestIdx = 1;
    for (let i = 1; i < allPoints.length; i++) {
      if (distances[0][i] > maxDist) {
        maxDist = distances[0][i];
        farthestIdx = i;
      }
    }
    // Start day 1 from the farthest location
    visited.add(farthestIdx);
    days.push({
      dayNumber: 1,
      locations: [{ location: validLocations[farthestIdx - 1], distFromPrev: distances[0][farthestIdx], durationFromPrev: durations[0][farthestIdx] }],
    });
    currentIdx = farthestIdx;
  }

  for (let day = days.length; day < numDays; day++) {
    const dayLocations = [];

    while (dayLocations.length < maxPerDay) {
      // Find nearest unvisited location
      let nearest = -1;
      let nearestDist = Infinity;
      for (let i = 1; i < allPoints.length; i++) {
        if (visited.has(i)) continue;
        const dist = distances[currentIdx][i];
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }

      if (nearest === -1) break; // All visited

      visited.add(nearest);
      dayLocations.push({
        location: validLocations[nearest - 1],
        distFromPrev: distances[currentIdx][nearest],
        durationFromPrev: durations[currentIdx][nearest],
      });
      currentIdx = nearest;
    }

    if (dayLocations.length > 0) {
      days.push({ dayNumber: day + 1, locations: dayLocations });
    }
  }

  return { days, warning };
}

/**
 * Haversine fallback when ORS is unavailable.
 */
function buildHaversineMatrix(points) {
  const n = points.length;
  const distances = Array.from({ length: n }, () => Array(n).fill(0));
  const durations = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = haversine(points[i], points[j]);
      distances[i][j] = d;
      durations[i][j] = (d / 1000 / 50) * 3600; // Assume 50 km/h average
    }
  }
  return { distances, durations };
}

function haversine(a, b) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Calculate per-day and total distances from grouped days.
 */
export function calculateTripStats(days) {
  let totalDistance = 0;
  let totalDuration = 0;

  const dayStats = days.map((day) => {
    let dayDist = 0;
    let dayDur = 0;
    day.locations.forEach((loc) => {
      dayDist += loc.distFromPrev || 0;
      dayDur += loc.durationFromPrev || 0;
    });
    totalDistance += dayDist;
    totalDuration += dayDur;
    return {
      dayNumber: day.dayNumber,
      stops: day.locations.length,
      distance: dayDist,
      duration: dayDur,
    };
  });

  return { dayStats, totalDistance, totalDuration };
}
```

**Step 2: Commit**

```bash
git add client/src/pages/explore/trip-planner/autoGroup.js
git commit -m "feat: add auto-grouping algorithm with ORS matrix and Haversine fallback"
```

---

## Task 8: Create ItineraryStep Component

**Files:**
- Create: `client/src/pages/explore/trip-planner/ItineraryStep.jsx`

**Step 1: Create the component**

Create `client/src/pages/explore/trip-planner/ItineraryStep.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { autoGroupLocations, getRouteDirections, calculateTripStats } from './autoGroup';

const DAY_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#f43f5e'];

const makeIcon = (color, label) =>
  L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${label}</div>`,
    iconAnchor: [13, 13],
  });

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
  iconAnchor: [8, 8],
});

function MapFitter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
}

function formatDist(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function SortableItem({ item, dayColor, onRemove, onNoteChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
      <button {...attributes} {...listeners} className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" /></svg>
      </button>
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {item.location?.images?.[0] ? (
          <img src={item.location.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">📍</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.location?.name}</p>
        <p className="text-xs text-gray-500">{item.location?.district}</p>
        <input
          type="text"
          placeholder="Add a note..."
          value={item.notes}
          onChange={(e) => onNoteChange(item.uid, e.target.value)}
          className="mt-1.5 w-full bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-transparent"
        />
      </div>
      <button onClick={() => onRemove(item.uid)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

function RouteConnector({ distance, duration }) {
  return (
    <div className="flex items-center gap-2 px-6 py-1">
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDist(distance)} · {formatTime(duration)}</span>
      <div className="flex-1 border-t border-dashed border-gray-300" />
    </div>
  );
}

export default function ItineraryStep({ config, selectedLocations, onBack, onSave }) {
  const [days, setDays] = useState([]);
  const [routeGeoJSON, setRouteGeoJSON] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(null);
  const [isAlternative, setIsAlternative] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const generatePlan = useCallback(async (reverse = false) => {
    setLoading(true);
    try {
      const result = await autoGroupLocations(config.startPoint, selectedLocations, config.duration, config.pace, reverse);
      setWarning(result.warning);

      // Convert to UI format with uids
      const uiDays = result.days.map((d) => ({
        dayNumber: d.dayNumber,
        items: d.locations.map((loc, i) => ({
          uid: `${loc.location._id}-${d.dayNumber}-${i}`,
          location: loc.location,
          locationId: loc.location._id,
          notes: '',
          distFromPrev: loc.distFromPrev,
          durationFromPrev: loc.durationFromPrev,
        })),
      }));
      setDays(uiDays);

      const tripStats = calculateTripStats(result.days);
      setStats(tripStats);

      // Fetch route polylines per day
      const geoJSONMap = {};
      for (let i = 0; i < uiDays.length; i++) {
        const dayItems = uiDays[i].items.filter((it) => it.location?.coordinates?.lat);
        if (dayItems.length < 2) continue;
        const points = i === 0
          ? [config.startPoint, ...dayItems.map((it) => it.location.coordinates)]
          : dayItems.map((it) => it.location.coordinates);
        try {
          const geo = await getRouteDirections(points);
          geoJSONMap[i] = geo;
        } catch {
          // Skip if directions fail for this day
        }
      }
      setRouteGeoJSON(geoJSONMap);
    } catch {
      setWarning('Failed to generate plan. Using basic grouping.');
    } finally {
      setLoading(false);
    }
  }, [config, selectedLocations]);

  useEffect(() => {
    generatePlan(false);
  }, [generatePlan]);

  const handleAlternative = () => {
    setIsAlternative((prev) => !prev);
    generatePlan(!isAlternative);
  };

  const removeItem = (uid) => setDays((prev) => prev.map((d) => ({ ...d, items: d.items.filter((i) => i.uid !== uid) })));
  const updateNote = (uid, notes) => setDays((prev) => prev.map((d) => ({ ...d, items: d.items.map((i) => i.uid === uid ? { ...i, notes } : i) })));

  const findDayOfItem = (uid) => days.find((d) => d.items.some((i) => i.uid === uid));

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const sourceDay = findDayOfItem(active.id);
    const destDay = findDayOfItem(over.id);
    if (!sourceDay || !destDay) return;

    if (sourceDay.dayNumber === destDay.dayNumber) {
      setDays((prev) =>
        prev.map((d) => {
          if (d.dayNumber !== sourceDay.dayNumber) return d;
          const oi = d.items.findIndex((i) => i.uid === active.id);
          const ni = d.items.findIndex((i) => i.uid === over.id);
          return { ...d, items: arrayMove(d.items, oi, ni) };
        })
      );
    } else {
      const item = sourceDay.items.find((i) => i.uid === active.id);
      setDays((prev) =>
        prev.map((d) => {
          if (d.dayNumber === sourceDay.dayNumber) return { ...d, items: d.items.filter((i) => i.uid !== active.id) };
          if (d.dayNumber === destDay.dayNumber) return { ...d, items: [...d.items, item] };
          return d;
        })
      );
    }
  };

  // Collect all map markers
  const allMarkers = days.flatMap((d, di) =>
    d.items.filter((it) => it.location?.coordinates?.lat).map((it, i) => ({
      lat: it.location.coordinates.lat,
      lng: it.location.coordinates.lng,
      name: it.location.name,
      label: `${i + 1}`,
      color: DAY_COLORS[di % DAY_COLORS.length],
    }))
  );

  const allCoords = allMarkers.map((m) => [m.lat, m.lng]);
  if (config.startPoint) allCoords.unshift([config.startPoint.lat, config.startPoint.lng]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{config.tripName}</h3>
          <p className="text-sm text-gray-500">{config.duration} days · {config.pace} pace</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAlternative} className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            🔄 Alternative Route
          </button>
          <button onClick={onBack} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            ← Back
          </button>
          <button
            onClick={() => onSave(days, stats)}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-amber-200"
          >
            Save & Export →
          </button>
        </div>
      </div>

      {/* Warning */}
      {warning && (
        <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
          ⚠️ {warning}
        </div>
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.dayStats.map((ds, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }} />
              <p className="text-xs font-semibold text-gray-800">Day {ds.dayNumber}</p>
              <p className="text-xs text-gray-500">{ds.stops} stops · {formatDist(ds.distance)}</p>
              <p className="text-xs text-gray-400">{formatTime(ds.duration)} drive</p>
            </div>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-amber-800">Total</p>
            <p className="text-sm font-bold text-amber-600">{formatDist(stats.totalDistance)}</p>
            <p className="text-xs text-amber-500">{formatTime(stats.totalDuration)} drive</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Generating your itinerary...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '480px' }}>
          {/* Day Cards */}
          <div className="lg:col-span-2 overflow-y-auto pr-1 space-y-4" style={{ maxHeight: '500px' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {days.map((day, di) => (
                <div key={day.dayNumber} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DAY_COLORS[di % DAY_COLORS.length] }} />
                    <span className="text-sm font-bold text-gray-800">Day {day.dayNumber}</span>
                    <span className="text-xs text-gray-400">({day.items.length} stops)</span>
                  </div>
                  <SortableContext items={day.items.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0">
                      {day.items.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl py-4 text-center text-gray-400 text-sm">
                          No stops — drag locations here
                        </div>
                      ) : (
                        day.items.map((item, idx) => (
                          <div key={item.uid}>
                            {idx > 0 && item.distFromPrev > 0 && (
                              <RouteConnector distance={item.distFromPrev} duration={item.durationFromPrev} />
                            )}
                            <SortableItem item={item} dayColor={DAY_COLORS[di % DAY_COLORS.length]} onRemove={removeItem} onNoteChange={updateNote} />
                          </div>
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              ))}
            </DndContext>
          </div>

          {/* Route Map */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%', minHeight: '480px' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {allCoords.length > 1 && <MapFitter coords={allCoords} />}

              {/* Start point */}
              {config.startPoint && (
                <Marker position={[config.startPoint.lat, config.startPoint.lng]} icon={userIcon}>
                  <Popup><strong>Start:</strong> {config.startPoint.name}</Popup>
                </Marker>
              )}

              {/* Route polylines from GeoJSON */}
              {Object.entries(routeGeoJSON).map(([dayIdx, geo]) => (
                <GeoJSON
                  key={`route-${dayIdx}-${isAlternative}`}
                  data={geo}
                  style={{ color: DAY_COLORS[parseInt(dayIdx) % DAY_COLORS.length], weight: 4, opacity: 0.7 }}
                />
              ))}

              {/* Fallback polylines if no GeoJSON */}
              {days.map((day, di) => {
                if (routeGeoJSON[di]) return null;
                const positions = day.items.filter((it) => it.location?.coordinates?.lat).map((it) => [it.location.coordinates.lat, it.location.coordinates.lng]);
                if (di === 0 && config.startPoint) positions.unshift([config.startPoint.lat, config.startPoint.lng]);
                return positions.length > 1 ? (
                  <Polyline key={`fallback-${di}`} positions={positions} color={DAY_COLORS[di % DAY_COLORS.length]} weight={3} opacity={0.6} dashArray="8 6" />
                ) : null;
              })}

              {/* Day markers */}
              {allMarkers.map((m, i) => (
                <Marker key={i} position={[m.lat, m.lng]} icon={makeIcon(m.color, m.label)}>
                  <Popup>
                    <strong>{m.name}</strong><br />
                    <span style={{ color: '#6b7280', fontSize: '12px' }}>Stop {m.label}</span>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/explore/trip-planner/ItineraryStep.jsx
git commit -m "feat: add ItineraryStep with route map, drag-drop, distance display"
```

---

## Task 9: Create TripSaveBar Component

**Files:**
- Create: `client/src/pages/explore/trip-planner/TripSaveBar.jsx`

**Step 1: Create the save/export component**

Create `client/src/pages/explore/trip-planner/TripSaveBar.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

function formatDist(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TripSaveBar({ config, days, stats, tripId, setTripId, onBack, onReset }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const saveTrip = async () => {
    if (!user) return toast.error('Please login to save trips', { icon: '🔒' });
    setSaving(true);
    try {
      const payload = {
        name: config.tripName,
        startPoint: config.startPoint,
        pace: config.pace,
        totalDistance: stats?.totalDistance || 0,
        totalDuration: stats?.totalDuration || 0,
        days: days.map((d) => ({
          dayNumber: d.dayNumber,
          locations: d.items.map((item, order) => ({
            locationId: item.locationId || item.location?._id,
            notes: item.notes,
            order,
          })),
        })),
      };
      if (tripId) {
        await api.put(`/trips/${tripId}`, payload);
        toast.success('Trip updated!');
      } else {
        const r = await api.post('/trips', payload);
        setTripId(r.data._id);
        toast.success('Trip saved!');
      }
    } catch {
      toast.error('Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text(config.tripName, 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Ceylon Travel · ${new Date().toLocaleDateString()} · ${config.duration} days · ${config.pace} pace`, 14, 33);

    if (stats) {
      doc.setFontSize(10);
      doc.setTextColor(180, 120, 20);
      doc.text(`Total: ${formatDist(stats.totalDistance)} · ${formatTime(stats.totalDuration)} driving`, 14, 40);
    }

    // Divider
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 44, pageWidth - 14, 44);

    let y = 52;

    days.forEach((d) => {
      if (d.items.length === 0) return;
      if (y > 260) { doc.addPage(); y = 20; }

      const dayStat = stats?.dayStats?.find((s) => s.dayNumber === d.dayNumber);

      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(`Day ${d.dayNumber}`, 14, y);

      if (dayStat) {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`${dayStat.stops} stops · ${formatDist(dayStat.distance)} · ${formatTime(dayStat.duration)}`, 50, y);
      }
      y += 8;

      d.items.forEach((item, i) => {
        if (y > 272) { doc.addPage(); y = 20; }

        // Distance connector
        if (i > 0 && item.distFromPrev > 0) {
          doc.setFontSize(8);
          doc.setTextColor(180, 180, 180);
          doc.text(`    ↓ ${formatDist(item.distFromPrev)} · ${formatTime(item.durationFromPrev)}`, 18, y);
          y += 5;
        }

        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`${i + 1}. ${item.location?.name || 'Unknown'}`, 18, y);

        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text(`${item.location?.district || ''}`, 18, y + 4.5);
        y += 5;

        if (item.notes) {
          doc.setTextColor(160, 160, 160);
          doc.text(`  Note: ${item.notes}`, 22, y + 4);
          y += 5;
        }
        y += 5;
      });
      y += 4;
    });

    doc.save(`${config.tripName.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF exported!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{config.tripName}</h3>
        <p className="text-gray-500 mb-4">{config.duration} days · {days.reduce((s, d) => s + d.items.length, 0)} stops · {config.pace} pace</p>
        {stats && (
          <div className="flex justify-center gap-6 mb-6">
            <div>
              <p className="text-2xl font-bold text-amber-600">{formatDist(stats.totalDistance)}</p>
              <p className="text-xs text-gray-500">Total Distance</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{formatTime(stats.totalDuration)}</p>
              <p className="text-xs text-gray-500">Driving Time</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <button
            onClick={saveTrip}
            disabled={saving}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-colors shadow-md shadow-amber-200 disabled:shadow-none"
          >
            {saving ? 'Saving...' : tripId ? '✓ Update Trip' : '💾 Save Trip'}
          </button>
          <button
            onClick={exportPDF}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            📄 Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            🖨️ Print
          </button>
        </div>

        {!user && (
          <p className="text-sm text-gray-400 mt-4">
            <button onClick={() => navigate('/login')} className="text-amber-500 hover:text-amber-600 font-medium">Login</button> to save your trip plan
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          ← Edit Itinerary
        </button>
        <button onClick={onReset} className="px-5 py-2.5 text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Plan New Trip
        </button>
        {user && tripId && (
          <button onClick={() => navigate('/profile')} className="px-5 py-2.5 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors">
            View in Profile →
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/explore/trip-planner/TripSaveBar.jsx
git commit -m "feat: add TripSaveBar with save, PDF export, and print"
```

---

## Task 10: Rebuild TripPlannerPage as Wizard

**Files:**
- Rewrite: `client/src/pages/explore/TripPlannerPage.jsx`

**Step 1: Read the current file (already read in exploration)**

**Step 2: Replace the entire file**

Rewrite `client/src/pages/explore/TripPlannerPage.jsx`:

```jsx
import { useState, useCallback } from 'react';
import TripSetupStep from './trip-planner/TripSetupStep';
import LocationSelectStep from './trip-planner/LocationSelectStep';
import ItineraryStep from './trip-planner/ItineraryStep';
import TripSaveBar from './trip-planner/TripSaveBar';

const STEPS = ['Setup', 'Select Locations', 'Itinerary', 'Save & Export'];

const DEFAULT_CONFIG = {
  tripName: 'My Sri Lanka Trip',
  duration: 3,
  pace: 'moderate',
  startPoint: null,
};

export default function TripPlannerPage({ editTrip }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState(editTrip ? {
    tripName: editTrip.name,
    duration: editTrip.days?.length || 3,
    pace: editTrip.pace || 'moderate',
    startPoint: editTrip.startPoint || null,
  } : { ...DEFAULT_CONFIG });

  const [selectedIds, setSelectedIds] = useState(
    editTrip ? editTrip.days?.flatMap((d) => d.locations.map((l) => l.locationId?._id || l.locationId)).filter(Boolean) : []
  );
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [itineraryDays, setItineraryDays] = useState([]);
  const [itineraryStats, setItineraryStats] = useState(null);
  const [tripId, setTripId] = useState(editTrip?._id || null);

  // When moving from Select → Itinerary, we need the full location objects
  const handleSelectNext = useCallback(() => {
    // LocationSelectStep keeps locations in its own state, so we fetch them here
    // We pass a callback that will be set by LocationSelectStep
    setStep(2);
  }, []);

  const handleItinerarySave = useCallback((days, stats) => {
    setItineraryDays(days);
    setItineraryStats(stats);
    setStep(3);
  }, []);

  const handleReset = () => {
    setStep(0);
    setConfig({ ...DEFAULT_CONFIG });
    setSelectedIds([]);
    setSelectedLocations([]);
    setItineraryDays([]);
    setItineraryStats(null);
    setTripId(null);
  };

  return (
    <div>
      {/* Step Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i === step
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : i < step
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? 'bg-white/20 text-white' : i < step ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 ${i < step ? 'bg-amber-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 0 && (
        <TripSetupStep config={config} setConfig={setConfig} onNext={() => setStep(1)} />
      )}

      {step === 1 && (
        <LocationSelectStep
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          startPoint={config.startPoint}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          onLocationsReady={setSelectedLocations}
        />
      )}

      {step === 2 && (
        <ItineraryStep
          config={config}
          selectedLocations={selectedLocations}
          onBack={() => setStep(1)}
          onSave={handleItinerarySave}
        />
      )}

      {step === 3 && (
        <TripSaveBar
          config={config}
          days={itineraryDays}
          stats={itineraryStats}
          tripId={tripId}
          setTripId={setTripId}
          onBack={() => setStep(2)}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
```

**Step 3: Update LocationSelectStep to pass selected location objects up**

Add `onLocationsReady` prop handling to `LocationSelectStep.jsx`. After the `toggleSelect` function, add a useEffect:

In `client/src/pages/explore/trip-planner/LocationSelectStep.jsx`, add inside the component (after `toggleSelect`):

```jsx
useEffect(() => {
  if (onLocationsReady) {
    onLocationsReady(locations.filter((l) => selectedIds.includes(l._id)));
  }
}, [selectedIds, locations, onLocationsReady]);
```

And update the function signature to include `onLocationsReady`:

```jsx
export default function LocationSelectStep({ selectedIds, setSelectedIds, startPoint, onNext, onBack, onLocationsReady }) {
```

**Step 4: Commit**

```bash
git add client/src/pages/explore/TripPlannerPage.jsx client/src/pages/explore/trip-planner/LocationSelectStep.jsx
git commit -m "feat: rebuild TripPlannerPage as 4-step wizard"
```

---

## Task 11: Update ExplorePage for Light Theme Consistency

**Files:**
- Modify: `client/src/pages/explore/ExplorePage.jsx`

**Step 1: Read the current file (already read)**

**Step 2: Update to pass editTrip support and ensure light theme**

Replace `client/src/pages/explore/ExplorePage.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TripPlannerPage from './TripPlannerPage';

const CATEGORIES = [
  { name: 'Nature', icon: '🌿', desc: 'Mountains, waterfalls, forests & more' },
  { name: 'Beach', icon: '🏖️', desc: 'Beaches, lagoons and islands' },
  { name: 'Wildlife', icon: '🦁', desc: 'National parks & safaris' },
  { name: 'Historical', icon: '🏛️', desc: 'Forts, ruins & museums' },
  { name: 'Religious', icon: '🛕', desc: 'Temples, churches & mosques' },
  { name: 'Hill Country', icon: '🍃', desc: 'Tea estates & viewpoints' },
  { name: 'Adventure', icon: '⛺', desc: 'Hiking, diving & boat tours' },
  { name: 'City', icon: '🏙️', desc: 'Urban attractions & street food' },
  { name: 'Entertainment', icon: '🎡', desc: 'Zoos, water parks & aquariums' },
];

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'tripplan' ? 'tripplan' : 'locations';
  const [tab, setTab] = useState(defaultTab);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ height: '56px' }} />

      {/* Hero Banner */}
      <div className="relative h-64 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: "url('/src/assets/images/explore-banner.png')" }}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Explore <span className="text-amber-400">Sri Lanka</span>
          </h1>
          <p className="text-gray-300 text-lg">Discover the Pearl of the Indian Ocean</p>
        </div>
      </div>

      {/* Tab Header */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8 justify-center py-4">
            <button
              onClick={() => setTab('locations')}
              className={`pb-2 text-lg font-semibold transition-all duration-200 border-b-3 ${tab === 'locations'
                ? 'text-gray-900 border-amber-500'
                : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
            >
              Explore Locations
            </button>
            <button
              onClick={() => setTab('tripplan')}
              className={`pb-2 text-lg font-semibold transition-all duration-200 border-b-3 ${tab === 'tripplan'
                ? 'text-gray-900 border-amber-500'
                : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
            >
              Plan Your Trip
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Locations Tab */}
        {tab === 'locations' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Browse by Category</h2>
              <p className="text-gray-500">Select a category to explore destinations</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => navigate(`/explore/${encodeURIComponent(cat.name)}`)}
                  className="group bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-400 rounded-2xl p-5 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                    {cat.icon}
                  </div>
                  <h3 className="text-gray-800 font-semibold text-sm group-hover:text-amber-600 transition-colors mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed hidden sm:block">
                    {cat.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trip Planner Tab */}
        {tab === 'tripplan' && <TripPlannerPage />}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/pages/explore/ExplorePage.jsx
git commit -m "feat: update ExplorePage with light theme, sticky tabs, query param support"
```

---

## Task 12: Add "Trip Plans" Tab to Profile Page

**Files:**
- Modify: `client/src/pages/profile/ProfilePage.jsx`

**Step 1: Read the current file (already read)**

**Step 2: Add trip plans tab**

The changes needed in `client/src/pages/profile/ProfilePage.jsx`:

1. Update TABS array (line 15):
```javascript
const TABS = ['Hotel Bookings', 'Guide Bookings', 'Tour Bookings', 'Travel Products', 'Trip Plans'];
```

2. Add state for trips (after line 29):
```javascript
const [tripPlans, setTripPlans] = useState([]);
```

3. Add trip plans fetch in the Promise.all (update the useEffect starting at line 31):
```javascript
useEffect(() => {
  Promise.all([
    api.get('/hotels/bookings/my'),
    api.get('/guides/bookings/my'),
    api.get('/tours/bookings/my'),
    api.get('/payments/my-orders'),
    api.get('/trips/my').catch(() => ({ data: [] })),
  ]).then(([h, g, t, p, tr]) => {
    setHotelBookings(h.data);
    setGuideBookings(g.data);
    setTourBookings(t.data);
    setProductOrders(p.data);
    setTripPlans(tr.data);
  }).catch(() => {}).finally(() => setLoadingBookings(false));
}, []);
```

4. Add the Trip Plans tab content (after the Travel Products tab block, before the closing `</>` — around line 293):
```jsx
{/* Trip Plans */}
{tab === 4 && (
  tripPlans.length === 0 ? <EmptyState label="trip plans" to="/explore?tab=tripplan" /> :
  <div className="space-y-3">
    {tripPlans.map((trip) => (
      <div key={trip._id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg">🗺️</div>
            <div>
              <h3 className="font-medium text-white">{trip.name}</h3>
              <p className="text-xs text-gray-400">
                {trip.days?.length || 0} days · {trip.days?.reduce((s, d) => s + (d.locations?.length || 0), 0) || 0} stops
                {trip.totalDistance > 0 && ` · ${(trip.totalDistance / 1000).toFixed(0)} km`}
                {trip.pace && ` · ${trip.pace}`}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{new Date(trip.updatedAt || trip.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Location thumbnails */}
        {trip.days?.some((d) => d.locations?.some((l) => l.locationId?.images?.[0])) && (
          <div className="flex gap-1.5 mb-3 overflow-hidden">
            {trip.days.flatMap((d) => d.locations).filter((l) => l.locationId?.images?.[0]).slice(0, 4).map((l, i) => (
              <img key={i} src={l.locationId.images[0]} alt={l.locationId.name} className="w-16 h-12 object-cover rounded-lg" />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link to={`/explore?tab=tripplan&edit=${trip._id}`} className="text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-lg transition-colors">
            Edit
          </Link>
          <button
            onClick={async () => {
              if (!window.confirm('Delete this trip?')) return;
              try {
                await api.delete(`/trips/${trip._id}`);
                setTripPlans((prev) => prev.filter((t) => t._id !== trip._id));
                toast.success('Trip deleted');
              } catch { toast.error('Failed to delete'); }
            }}
            className="text-xs text-gray-500 hover:text-red-400 border border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
)}
```

5. Update the quick links section (around line 133) — add a trip plans link:
```jsx
<Link to="/explore?tab=tripplan" className="text-xs text-gray-400 hover:text-amber-400 border border-gray-700 hover:border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors text-center">My Trip Plans</Link>
```

**Step 3: Commit**

```bash
git add client/src/pages/profile/ProfilePage.jsx
git commit -m "feat: add Trip Plans tab to profile page"
```

---

## Task 13: Add CSS Animation for Pulsing Blue Marker

**Files:**
- Modify: `client/index.html` OR `client/src/index.css` (whichever has global styles)

**Step 1: Add pulse keyframe**

Add to `client/src/index.css` (or the main CSS file):

```css
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
}
```

**Step 2: Commit**

```bash
git add client/src/index.css
git commit -m "feat: add pulse animation for user location marker"
```

---

## Task 14: Manual Testing Checklist

Run both servers:
```bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev
```

**Test each step:**

1. **Setup Step**: Go to `/explore`, click "Plan Your Trip" tab
   - [ ] Can enter trip name
   - [ ] Can select duration (pill buttons highlight)
   - [ ] Can select pace (cards highlight)
   - [ ] "Use My Location" detects GPS and shows blue marker
   - [ ] Clicking map sets start point with amber marker
   - [ ] "Colombo (Default)" button works
   - [ ] "Next" button disabled until name + duration + start point set

2. **Select Locations Step**:
   - [ ] All admin locations load in grid and on map
   - [ ] Category filter works
   - [ ] Search filter works
   - [ ] Clicking card toggles selection (amber border + checkmark)
   - [ ] Clicking map marker toggles selection
   - [ ] Selected count badge updates
   - [ ] Back button returns to setup
   - [ ] "Generate Itinerary" button works

3. **Itinerary Step**:
   - [ ] Loading spinner appears while generating
   - [ ] Days are created with color-coded cards
   - [ ] Route polylines appear on map
   - [ ] Distance + time shown between stops
   - [ ] Day summary stats shown
   - [ ] Total stats shown
   - [ ] Drag-and-drop reordering works
   - [ ] "Alternative Route" recalculates
   - [ ] Can add notes per location
   - [ ] Can remove locations

4. **Save & Export Step**:
   - [ ] Summary card shows trip stats
   - [ ] "Save Trip" works when logged in
   - [ ] Shows login prompt when not logged in
   - [ ] "Download PDF" generates PDF with distances
   - [ ] "Print" opens print dialog
   - [ ] "View in Profile" navigates to profile

5. **Profile Integration**:
   - [ ] "Trip Plans" tab appears in profile
   - [ ] Saved trips listed with thumbnails
   - [ ] Edit link navigates to planner
   - [ ] Delete works with confirmation

**Step 1: Commit final state**

```bash
git add -A
git commit -m "feat: complete Trip Planner redesign with wizard, auto-grouping, routing, and profile integration"
```

---

## File Summary

### New Files (7)
| File | Purpose |
|---|---|
| `server/controllers/routeController.js` | OpenRouteService proxy (matrix + directions) |
| `server/routes/routeRoutes.js` | Route definitions for ORS proxy |
| `client/src/pages/explore/trip-planner/TripSetupStep.jsx` | Step 1: Name, duration, pace, start point |
| `client/src/pages/explore/trip-planner/LocationSelectStep.jsx` | Step 2: Location selection with map |
| `client/src/pages/explore/trip-planner/autoGroup.js` | Auto-grouping algorithm + ORS helpers |
| `client/src/pages/explore/trip-planner/ItineraryStep.jsx` | Step 3: Generated itinerary with drag-drop |
| `client/src/pages/explore/trip-planner/TripSaveBar.jsx` | Step 4: Save, PDF export, print |

### Modified Files (5)
| File | Change |
|---|---|
| `server/.env` | Add `ORS_API_KEY` |
| `server/server.js` | Register `/api/routes` |
| `server/models/TripPlan.js` | Add startPoint, pace, totalDistance, totalDuration |
| `server/controllers/tripController.js` | Accept new fields in create/update |
| `client/src/pages/explore/ExplorePage.jsx` | Light theme, sticky tabs, query param support |
| `client/src/pages/explore/TripPlannerPage.jsx` | Complete rewrite as 4-step wizard |
| `client/src/pages/profile/ProfilePage.jsx` | Add "Trip Plans" tab |
| `client/src/index.css` | Add pulse animation keyframe |
