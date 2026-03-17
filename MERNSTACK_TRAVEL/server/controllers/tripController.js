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
