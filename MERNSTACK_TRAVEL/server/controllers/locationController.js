const Location = require('../models/Location');

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

    // Validate subcategory belongs to category
    const validSubs = Location.schema.statics.CATEGORIES[category];
    if (!validSubs || !validSubs.includes(subcategory)) {
      return res.status(400).json({ message: `Invalid subcategory "${subcategory}" for category "${category}"` });
    }

    const images = req.files?.['images']?.map((f) => f.path) || [];
    const mapImage = req.files?.['mapImage']?.[0]?.path || '';

    // Parse coordinates if sent as string (from FormData)
    let coords = coordinates;
    if (typeof coordinates === 'string') {
      coords = JSON.parse(coordinates);
    }

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

module.exports = { getLocations, getLocation, createLocation, updateLocation, deleteLocation, getCategories };
