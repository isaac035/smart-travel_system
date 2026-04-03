const Location = require('../models/Location');
const axios = require('axios');

// ── Haversine distance (km) between two lat/lng points ──
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Weather cache (in-memory, 30-min TTL) ──
const weatherCache = {};
const WEATHER_TTL = 30 * 60 * 1000;

async function fetchWeather(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache[key];
  if (cached && Date.now() - cached.fetchedAt < WEATHER_TTL) return cached.data;

  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) return null;
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon: lng, appid: apiKey, units: 'metric' },
      timeout: 5000,
    });
    const weather = {
      temp: Math.round(data.main.temp),
      condition: data.weather[0]?.main || '',
      icon: data.weather[0]?.icon || '',
    };
    weatherCache[key] = { data: weather, fetchedAt: Date.now() };
    return weather;
  } catch {
    return null;
  }
}

async function fetchWeatherBatch(locations) {
  const results = await Promise.allSettled(
    locations.map((loc) => fetchWeather(loc.coordinates.lat, loc.coordinates.lng))
  );
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}

const VALID_PROVINCES = ['Central', 'Eastern', 'North Central', 'Northern', 'North Western', 'Sabaragamuwa', 'Southern', 'Uva', 'Western'];
const VALID_DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
const SL_BOUNDS = { south: 5.916, north: 9.851, west: 79.521, east: 81.879 };
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;

// @desc  Get all locations (with optional filters)

// @route GET /api/locations
const getLocations = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;
    if (req.query.province) filter.province = req.query.province;
    if (req.query.district) filter.district = req.query.district;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const locations = await Location.find(filter).sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single location
// @route GET /api/locations/:id
const getLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Create location (admin)
// @route POST /api/locations
const createLocation = async (req, res) => {
  try {
    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const { name, description, category, subcategory, province, district, coordinates, isFeatured } = body;

    // Validate required fields
    if (!name || !name.trim()) return res.status(400).json({ message: 'Location name is required' });
    if (/[0-9]/.test(name)) return res.status(400).json({ message: 'Numbers are not allowed in location name' });
    if (!description || !description.replace(/<[^>]*>/g, '').trim()) return res.status(400).json({ message: 'Description is required' });
    if (!category) return res.status(400).json({ message: 'Category is required' });
    if (!subcategory) return res.status(400).json({ message: 'Subcategory is required' });
    if (!district) return res.status(400).json({ message: 'District is required' });
    if (!VALID_DISTRICTS.includes(district)) return res.status(400).json({ message: `Invalid district "${district}"` });
    if (!province) return res.status(400).json({ message: 'Province is required' });
    if (!VALID_PROVINCES.includes(province)) return res.status(400).json({ message: `Invalid province "${province}"` });

    // Parse coordinates and validate Sri Lanka bounds
    let coords = coordinates;
    if (typeof coordinates === 'string') coords = JSON.parse(coordinates);
    if (!coords || coords.lat == null || coords.lng == null || isNaN(coords.lat) || isNaN(coords.lng)) {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }
    if (coords.lat < SL_BOUNDS.south || coords.lat > SL_BOUNDS.north) {
      return res.status(400).json({ message: `Latitude must be between ${SL_BOUNDS.south} and ${SL_BOUNDS.north}` });
    }
    if (coords.lng < SL_BOUNDS.west || coords.lng > SL_BOUNDS.east) {
      return res.status(400).json({ message: `Longitude must be between ${SL_BOUNDS.west} and ${SL_BOUNDS.east}` });
    }

    // Validate subcategory belongs to category
    const validSubs = Location.schema.statics.CATEGORIES[category];
    if (!validSubs || !validSubs.includes(subcategory)) {
      return res.status(400).json({ message: `Invalid subcategory "${subcategory}" for category "${category}"` });
    }

    // Validate images
    const imageFiles = req.files?.['images'] || [];
    const mapImageFile = req.files?.['mapImage']?.[0];
    if (imageFiles.length === 0) return res.status(400).json({ message: 'Please upload at least one image' });
    if (imageFiles.length > MAX_IMAGES) return res.status(400).json({ message: `Maximum ${MAX_IMAGES} images allowed` });
    for (const file of imageFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ message: `Invalid image format: ${file.originalname}. Only JPG, PNG, WEBP allowed` });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({ message: `File too large: ${file.originalname}. Max 5MB per image` });
      }
    }
    if (mapImageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(mapImageFile.mimetype)) {
        return res.status(400).json({ message: `Invalid map image format. Only JPG, PNG, WEBP allowed` });
      }
      if (mapImageFile.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({ message: `Map image too large. Max 5MB` });
      }
    }

    const images = imageFiles.map((f) => f.path);
    const mapImage = mapImageFile?.path || '';

    const location = await Location.create({
      name,
      description,
      category,
      subcategory,
      images,
      mapImage,
      province,
      district,
      coordinates: coords,
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update location (admin)
// @route PUT /api/locations/:id
const updateLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });

    const body = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
    const updates = { ...body };

    // Parse coordinates if sent as string
    if (typeof updates.coordinates === 'string') {
      updates.coordinates = JSON.parse(updates.coordinates);
    }

    // Handle images: use existingImages from body as base (supports removals)
    const existingImages = updates.existingImages || undefined;
    delete updates.existingImages;
    const existingMapImage = updates.existingMapImage || undefined;
    delete updates.existingMapImage;

    if (req.files?.['images']?.length > 0) {
      const newImages = req.files['images'].map((f) => f.path);
      const base = existingImages !== undefined ? existingImages : (location.images || []);
      updates.images = [...base, ...newImages];
    } else if (existingImages !== undefined) {
      updates.images = existingImages;
    }

    // If new mapImage uploaded, replace existing
    if (req.files?.['mapImage']?.[0]) {
      updates.mapImage = req.files['mapImage'][0].path;
    } else if (existingMapImage !== undefined) {
      updates.mapImage = existingMapImage;
    }

    if (updates.isFeatured !== undefined) {
      updates.isFeatured = updates.isFeatured === 'true' || updates.isFeatured === true;
    }

    const updated = await Location.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete location (admin)
// @route DELETE /api/locations/:id
const deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return res.status(404).json({ message: 'Location not found' });
    await location.deleteOne();
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get categories map
// @route GET /api/locations/categories
const getCategories = (req, res) => {
  res.json(Location.schema.statics.CATEGORIES);
};

// @desc  Get smart location suggestions for trip planner
// @route GET /api/locations/suggestions
const getSuggestions = async (req, res) => {
  try {
    const { lat, lng, radius = 30, selectedIds = '', days = 3 } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'Valid lat and lng are required' });
    }
    const radiusKm = Math.min(Math.max(parseFloat(radius) || 30, 5), 200);

    const excluded = selectedIds ? selectedIds.split(',').filter(Boolean) : [];
    const excludedSet = new Set(excluded);

    const allLocations = await Location.find({
      'coordinates.lat': { $exists: true },
      'coordinates.lng': { $exists: true },
    }).select('name category subcategory district province coordinates images isFeatured');

    const candidates = allLocations
      .filter((loc) => !excludedSet.has(loc._id.toString()))
      .map((loc) => {
        const dist = haversineKm(userLat, userLng, loc.coordinates.lat, loc.coordinates.lng);
        return { ...loc.toObject(), distance: Math.round(dist * 10) / 10 };
      });

    // ── Nearby: within radius, sorted by distance ──
    const nearby = candidates
      .filter((loc) => loc.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    // ── Recommended: score-based ranking ──
    const selectedLocs = allLocations.filter((loc) => excludedSet.has(loc._id.toString()));
    const catCounts = {};
    selectedLocs.forEach((loc) => {
      catCounts[loc.category] = (catCounts[loc.category] || 0) + 1;
    });
    const totalSelected = selectedLocs.length;

    // Determine start point province from nearest location
    const startProvinceLoc = allLocations
      .map((loc) => ({
        province: loc.province,
        dist: haversineKm(userLat, userLng, loc.coordinates.lat, loc.coordinates.lng),
      }))
      .sort((a, b) => a.dist - b.dist)[0];
    const startProvince = startProvinceLoc?.province || '';

    const scored = candidates.map((loc) => {
      let score = 0;
      if (loc.province === startProvince) score += 30;
      const maxDist = 300;
      score += Math.max(0, 25 * (1 - loc.distance / maxDist));
      if (totalSelected > 0) {
        const catRatio = (catCounts[loc.category] || 0) / totalSelected;
        score += 20 * (1 - catRatio);
      } else {
        score += 10;
      }
      if (loc.isFeatured) score += 15;
      return { ...loc, score: Math.round(score) };
    });

    const recommended = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(12, parseInt(days) * 3));

    // ── Fetch weather for all unique suggestions ──
    const allSuggestions = [...recommended];
    nearby.forEach((n) => {
      if (!allSuggestions.find((r) => r._id.toString() === n._id.toString())) {
        allSuggestions.push(n);
      }
    });

    const weatherResults = await fetchWeatherBatch(allSuggestions);
    const weatherMap = {};
    allSuggestions.forEach((loc, i) => {
      weatherMap[loc._id.toString()] = weatherResults[i];
    });

    const addWeather = (loc) => ({ ...loc, weather: weatherMap[loc._id.toString()] || null });

    res.json({
      recommended: recommended.map(addWeather),
      nearby: nearby.map(addWeather),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLocations, getLocation, createLocation, updateLocation, deleteLocation, getCategories, getSuggestions };
