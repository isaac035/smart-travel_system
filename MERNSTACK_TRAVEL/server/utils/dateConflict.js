const GuideBooking = require('../models/GuideBooking');

// Statuses that block guide availability
const BLOCKING_STATUSES = [
  'admin_confirmed',
  'remaining_payment_pending',
  'remaining_payment_submitted',
  'fully_paid',
  'completed'
];

/**
 * Check if a guide has conflicting bookings for a date range
 */
const checkDateConflicts = async (guideId, startDate, endDate, excludeBookingId = null) => {
  const query = {
    guideId,
    status: { $in: BLOCKING_STATUSES },
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) }
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflicts = await GuideBooking.find(query)
    .select('startDate endDate status travelerName location')
    .sort({ startDate: 1 });

  return conflicts;
};

/**
 * Get all booked date ranges for a guide (for schedule view)
 */
const getGuideSchedule = async (guideId) => {
  const bookings = await GuideBooking.find({
    guideId,
    status: { $in: BLOCKING_STATUSES }
  })
    .select('startDate endDate status travelerName location')
    .sort({ startDate: 1 });

  return bookings;
};

module.exports = { checkDateConflicts, getGuideSchedule, BLOCKING_STATUSES };
