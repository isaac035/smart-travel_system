# Guide Booking Workflow Enhancement — Deposit-Based Request System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the existing instant-booking guide system into a real-world deposit-based request workflow with 3 actors (User, Guide, Admin), guide authentication, date conflict prevention, and cancellation/refund policies.

**Architecture:** Extend the existing User model with a `role: 'guide'` value (alongside 'user' and 'admin') rather than creating a separate Guide auth model. The existing Guide model gets a `userId` field linking to the authenticated guide account. GuideBooking model is heavily extended with new statuses, deposit/balance fields, refund tracking, and date ranges. New middleware `guideOnly` gates guide dashboard routes.

**Tech Stack:** MongoDB/Mongoose, Express 5, React 19, Vite, Tailwind CSS v4, JWT, bcryptjs, Cloudinary, axios

---

## Table of Contents

1. [Task 1: Extend User Model — Add 'guide' Role](#task-1)
2. [Task 2: Link Guide Model to User Account](#task-2)
3. [Task 3: Extend GuideBooking Model — Statuses, Deposits, Refunds, Date Range](#task-3)
4. [Task 4: Add Guide Auth Middleware](#task-4)
5. [Task 5: Guide Authentication Routes (Register/Login)](#task-5)
6. [Task 6: Guide Dashboard API — Booking Requests & Actions](#task-6)
7. [Task 7: Update Guide Booking Controller — Deposit Flow](#task-7)
8. [Task 8: Date Conflict Detection Logic](#task-8)
9. [Task 9: Admin Workflow — Enhanced Booking Management](#task-9)
10. [Task 10: Cancellation & Refund API](#task-10)
11. [Task 11: Remaining Payment API](#task-11)
12. [Task 12: Guide Registration Page (Frontend)](#task-12)
13. [Task 13: Guide Login Page (Frontend)](#task-13)
14. [Task 14: Guide Dashboard Page (Frontend)](#task-14)
15. [Task 15: Guide Booking Request Detail View (Frontend)](#task-15)
16. [Task 16: Guide Schedule/Calendar View (Frontend)](#task-16)
17. [Task 17: Update GuideDetailsPage — "Request This Guide"](#task-17)
18. [Task 18: Update GuideBookingPage — Deposit Flow UI](#task-18)
19. [Task 19: Update TravelerGuidesPage — Enhanced Status & Remaining Payment](#task-19)
20. [Task 20: Update AdminGuidesPage — Enhanced Booking Management](#task-20)
21. [Task 21: Update Navbar — Guide Login Link](#task-21)
22. [Task 22: Update App.jsx — Guide Routes](#task-22)
23. [Task 23: User Notification Messages](#task-23)
24. [Task 24: Admin Date Conflict UI & Guide Reassignment](#task-24)

---

<a id="task-1"></a>
### Task 1: Extend User Model — Add 'guide' Role

**Files:**
- Modify: `server/models/User.js`

**Why:** The existing User model has `role: enum ['admin', 'user']`. We add `'guide'` so travel guides can authenticate with the same JWT system. No separate auth model needed.

**Step 1: Update the role enum**

```javascript
// server/models/User.js — line 8, change role field
role: { type: String, enum: ['admin', 'user', 'guide'], default: 'user' },
```

**Step 2: Verify no breaking changes**

The existing `adminOnly` middleware checks `req.user.role === 'admin'` — this still works because guide role is a new distinct value. No changes needed to existing auth flow.

**Step 3: Commit**

```bash
git add server/models/User.js
git commit -m "feat(model): add 'guide' role to User enum for guide authentication"
```

---

<a id="task-2"></a>
### Task 2: Link Guide Model to User Account

**Files:**
- Modify: `server/models/Guide.js`

**Why:** Currently Guide is a standalone document with no login capability. Adding `userId` links a Guide profile to an authenticated User account with role='guide'. Also add `email` and `phone` fields for the guide's own contact info.

**Step 1: Add userId, email, phone fields to Guide schema**

```javascript
// server/models/Guide.js — add these fields to the schema object

userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
email: { type: String, default: '' },
phone: { type: String, default: '' },
```

- `sparse: true` allows existing guides (created by admin without accounts) to have `null` userId without unique constraint violations.
- `email` and `phone` are the guide's professional contact info (separate from User.email).

**Step 2: Commit**

```bash
git add server/models/Guide.js
git commit -m "feat(model): add userId link, email, phone to Guide for account binding"
```

---

<a id="task-3"></a>
### Task 3: Extend GuideBooking Model — Statuses, Deposits, Refunds, Date Range

**Files:**
- Modify: `server/models/GuideBooking.js`

**Why:** The current model has only 4 statuses (pending/confirmed/completed/cancelled) and no deposit/balance tracking. This is the core data model change for the entire workflow.

**Step 1: Rewrite GuideBooking schema with new fields**

Replace the existing schema (keep the review sub-schema as-is). The new schema:

```javascript
const mongoose = require('mongoose');

// Keep existing review schema
const guideReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const guideBookingSchema = new mongoose.Schema({
  guideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Traveler info
  travelerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  // Trip details — now with startDate + endDate instead of just travelDate
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true, min: 1 },
  travelers: { type: Number, default: 1 },
  location: { type: String, required: true },
  specialRequests: { type: String },

  // Pricing — deposit-based
  totalPrice: { type: Number, required: true },
  depositPercentage: { type: Number, default: 30 },
  depositAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },

  // Payment slips
  depositSlip: { type: String },
  remainingSlip: { type: String },

  // Status workflow
  status: {
    type: String,
    enum: [
      'pending_deposit',
      'deposit_submitted',
      'pending_guide_review',
      'guide_accepted',
      'guide_rejected',
      'under_admin_review',
      'admin_confirmed',
      'remaining_payment_pending',
      'remaining_payment_submitted',
      'fully_paid',
      'completed',
      'cancelled_by_user',
      'cancelled_by_admin',
      'refund_pending',
      'partially_refunded',
      'refunded',
      'no_refund'
    ],
    default: 'deposit_submitted'
  },

  // Guide decision tracking
  guideDecision: {
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    decidedAt: Date,
    reason: String
  },

  // Admin decision tracking
  adminDecision: {
    depositVerified: { type: Boolean, default: false },
    remainingVerified: { type: Boolean, default: false },
    confirmedAt: Date,
    rejectedAt: Date,
    reason: String
  },

  // Cancellation & refund
  cancellation: {
    cancelledBy: { type: String, enum: ['user', 'admin', 'guide'] },
    cancelledAt: Date,
    reason: String,
    refundEligibility: { type: String, enum: ['full', 'partial', 'none'] },
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, enum: ['pending', 'processed', 'none'], default: 'none' }
  },

  // Review (keep existing)
  review: guideReviewSchema,

  // Legacy field support — keep travelDate as alias
  travelDate: { type: Date }

}, { timestamps: true });

// Pre-save: sync travelDate with startDate for backward compat
guideBookingSchema.pre('save', function(next) {
  if (this.startDate && !this.travelDate) {
    this.travelDate = this.startDate;
  }
  next();
});

module.exports = mongoose.model('GuideBooking', guideBookingSchema);
```

**Key Design Decisions:**
- `travelDate` kept as optional legacy field (old bookings still work)
- `startDate` + `endDate` enable date conflict detection
- `depositPercentage` defaults to 30 but is configurable per booking
- `guideDecision` and `adminDecision` are embedded sub-objects for audit trail
- `cancellation` tracks who cancelled, when, and refund details

**Step 2: Commit**

```bash
git add server/models/GuideBooking.js
git commit -m "feat(model): extend GuideBooking with deposit flow, statuses, refund tracking"
```

---

<a id="task-4"></a>
### Task 4: Add Guide Auth Middleware

**Files:**
- Modify: `server/middleware/authMiddleware.js`

**Why:** We need a `guideOnly` middleware (similar to `adminOnly`) that checks `req.user.role === 'guide'`. Also add `guideOrAdmin` for routes both can access.

**Step 1: Add guideOnly and guideOrAdmin middleware**

```javascript
// server/middleware/authMiddleware.js — add after adminOnly function

const guideOnly = (req, res, next) => {
  if (req.user && req.user.role === 'guide') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Guide only.' });
  }
};

const guideOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'guide' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Guide or Admin only.' });
  }
};

module.exports = { protect, adminOnly, guideOnly, guideOrAdmin };
```

**Step 2: Update existing module.exports**

Current file exports `protect` and `adminOnly` separately. Update to export all four.

**Step 3: Commit**

```bash
git add server/middleware/authMiddleware.js
git commit -m "feat(middleware): add guideOnly and guideOrAdmin auth middleware"
```

---

<a id="task-5"></a>
### Task 5: Guide Authentication Routes (Register/Login)

**Files:**
- Modify: `server/controllers/authController.js`
- Modify: `server/routes/authRoutes.js`

**Why:** Guides need dedicated register/login endpoints that set `role: 'guide'` and auto-create a linked Guide profile.

**Step 1: Add guideRegister controller**

```javascript
// server/controllers/authController.js — add new function

const Guide = require('../models/Guide');

const guideRegister = async (req, res) => {
  try {
    const { name, email, password, phone, languages, location, experience, bio, services, certifications } = req.body;

    if (!name || !email || !password || !location) {
      return res.status(400).json({ message: 'Name, email, password, and location are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with guide role
    const user = await User.create({ name, email, password, role: 'guide', phone: phone || '' });

    // Create linked Guide profile
    const guide = await Guide.create({
      name,
      email,
      phone: phone || '',
      userId: user._id,
      location,
      languages: languages || [],
      experience: experience || 1,
      bio: bio || '',
      services: services || [],
      certifications: certifications || [],
      pricePerDay: 0,
      isAvailable: false
    });

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: formatUser(user),
      guideId: guide._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const guideLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email, role: 'guide' });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid guide credentials' });
    }

    // Find linked guide profile
    const guide = await Guide.findOne({ userId: user._id });

    const token = generateToken(user._id);
    res.json({
      token,
      user: formatUser(user),
      guideId: guide ? guide._id : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Step 2: Export new functions and add routes**

```javascript
// server/routes/authRoutes.js — add new routes
router.post('/guide/register', guideRegister);
router.post('/guide/login', guideLogin);
```

**Step 3: Commit**

```bash
git add server/controllers/authController.js server/routes/authRoutes.js
git commit -m "feat(auth): add guide registration and login endpoints"
```

---

<a id="task-6"></a>
### Task 6: Guide Dashboard API — Booking Requests & Actions

**Files:**
- Create: `server/controllers/guideDashboardController.js`
- Create: `server/routes/guideDashboardRoutes.js`
- Modify: `server/server.js`

**Why:** Guides need their own API to view assigned booking requests, accept/reject them, view their schedule, and manage their profile.

**Step 1: Create guideDashboardController.js**

```javascript
// server/controllers/guideDashboardController.js

const Guide = require('../models/Guide');
const GuideBooking = require('../models/GuideBooking');

// GET /api/guide-dashboard/profile — get guide's own profile
const getMyGuideProfile = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });
    res.json(guide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/guide-dashboard/profile — update guide's own profile
const updateMyGuideProfile = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const { bio, languages, services, certifications, location, pricePerDay, isAvailable, phone } = req.body;
    if (bio !== undefined) guide.bio = bio;
    if (languages) guide.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
    if (services) guide.services = typeof services === 'string' ? JSON.parse(services) : services;
    if (certifications) guide.certifications = typeof certifications === 'string' ? JSON.parse(certifications) : certifications;
    if (location) guide.location = location;
    if (pricePerDay !== undefined) guide.pricePerDay = pricePerDay;
    if (isAvailable !== undefined) guide.isAvailable = isAvailable;
    if (phone) guide.phone = phone;

    if (req.file) guide.image = req.file.path;

    await guide.save();
    res.json(guide);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/guide-dashboard/bookings — get all booking requests for this guide
const getMyBookingRequests = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const bookings = await GuideBooking.find({ guideId: guide._id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/guide-dashboard/bookings/:id/accept — guide accepts a booking request
const acceptBookingRequest = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.guideId.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'This booking is not assigned to you' });
    }

    if (booking.status !== 'pending_guide_review') {
      return res.status(400).json({ message: `Cannot accept booking with status: ${booking.status}` });
    }

    booking.status = 'guide_accepted';
    booking.guideDecision = {
      status: 'accepted',
      decidedAt: new Date()
    };

    await booking.save();
    res.json({ message: 'Booking request accepted. Forwarded to admin for review.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/guide-dashboard/bookings/:id/reject — guide rejects a booking request
const rejectBookingRequest = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.guideId.toString() !== guide._id.toString()) {
      return res.status(403).json({ message: 'This booking is not assigned to you' });
    }

    if (booking.status !== 'pending_guide_review') {
      return res.status(400).json({ message: `Cannot reject booking with status: ${booking.status}` });
    }

    booking.status = 'guide_rejected';
    booking.guideDecision = {
      status: 'rejected',
      decidedAt: new Date(),
      reason: req.body.reason || ''
    };

    await booking.save();
    res.json({ message: 'Booking request rejected.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/guide-dashboard/schedule — get guide's booked date ranges
const getMySchedule = async (req, res) => {
  try {
    const guide = await Guide.findOne({ userId: req.user._id });
    if (!guide) return res.status(404).json({ message: 'Guide profile not found' });

    const activeStatuses = [
      'guide_accepted', 'under_admin_review', 'admin_confirmed',
      'remaining_payment_pending', 'remaining_payment_submitted', 'fully_paid', 'completed'
    ];

    const bookings = await GuideBooking.find({
      guideId: guide._id,
      status: { $in: activeStatuses }
    }).select('startDate endDate status travelerName location').sort({ startDate: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMyGuideProfile,
  updateMyGuideProfile,
  getMyBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
  getMySchedule
};
```

**Step 2: Create guideDashboardRoutes.js**

```javascript
// server/routes/guideDashboardRoutes.js

const express = require('express');
const router = express.Router();
const { protect, guideOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
  getMyGuideProfile,
  updateMyGuideProfile,
  getMyBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
  getMySchedule
} = require('../controllers/guideDashboardController');

router.use(protect, guideOnly);

router.get('/profile', getMyGuideProfile);
router.put('/profile', upload.single('image'), updateMyGuideProfile);
router.get('/bookings', getMyBookingRequests);
router.put('/bookings/:id/accept', acceptBookingRequest);
router.put('/bookings/:id/reject', rejectBookingRequest);
router.get('/schedule', getMySchedule);

module.exports = router;
```

**Step 3: Mount routes in server.js**

```javascript
// server/server.js — add with other route imports
const guideDashboardRoutes = require('./routes/guideDashboardRoutes');

// add with other app.use() calls
app.use('/api/guide-dashboard', guideDashboardRoutes);
```

**Step 4: Commit**

```bash
git add server/controllers/guideDashboardController.js server/routes/guideDashboardRoutes.js server/server.js
git commit -m "feat(api): add guide dashboard endpoints for bookings, profile, schedule"
```

---

<a id="task-7"></a>
### Task 7: Update Guide Booking Controller — Deposit Flow

**Files:**
- Modify: `server/controllers/guideController.js`

**Why:** The `createBooking` function currently creates a booking with full payment. It must now calculate deposit/remaining and set initial status to `deposit_submitted`. Also update `getMyBookings` to return new fields.

**Step 1: Update createBooking function**

Replace the existing `createBooking` (lines 101-116) with:

```javascript
const createBooking = async (req, res) => {
  try {
    const { travelerName, email, phone, startDate, days, travelers, location, specialRequests } = req.body;

    const guide = await Guide.findById(req.body.guideId);
    if (!guide) return res.status(404).json({ message: 'Guide not found' });

    const totalPrice = guide.pricePerDay * Number(days);
    const depositPercentage = 30;
    const depositAmount = Math.round(totalPrice * depositPercentage / 100);
    const remainingAmount = totalPrice - depositAmount;

    // Calculate endDate from startDate + days
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(days) - 1);

    const booking = await GuideBooking.create({
      guideId: guide._id,
      userId: req.user._id,
      travelerName,
      email,
      phone,
      startDate: start,
      endDate: end,
      travelDate: start,
      days: Number(days),
      travelers: Number(travelers) || 1,
      location,
      specialRequests,
      totalPrice,
      depositPercentage,
      depositAmount,
      remainingAmount,
      status: 'deposit_submitted',
      guideDecision: { status: 'pending' },
      adminDecision: { depositVerified: false, remainingVerified: false }
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Step 2: Update the cancelBooking function**

Replace existing `cancelBooking` (lines 141-153) with cancellation policy logic:

```javascript
const cancelBooking = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const nonCancellable = ['completed', 'fully_paid', 'cancelled_by_user', 'cancelled_by_admin', 'refunded', 'partially_refunded', 'no_refund'];
    if (nonCancellable.includes(booking.status)) {
      return res.status(400).json({ message: 'This booking cannot be cancelled' });
    }

    // Calculate refund eligibility
    const now = new Date();
    const tripStart = new Date(booking.startDate);
    const daysUntilTrip = Math.ceil((tripStart - now) / (1000 * 60 * 60 * 24));

    let refundEligibility = 'none';
    let refundAmount = 0;

    if (daysUntilTrip >= 3) {
      refundEligibility = 'full';
      refundAmount = booking.depositAmount;
    } else if (daysUntilTrip >= 1) {
      refundEligibility = 'partial';
      refundAmount = Math.round(booking.depositAmount * 0.5);
    } else {
      refundEligibility = 'none';
      refundAmount = 0;
    }

    booking.status = 'cancelled_by_user';
    booking.cancellation = {
      cancelledBy: 'user',
      cancelledAt: new Date(),
      reason: req.body.reason || '',
      refundEligibility,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'pending' : 'none'
    };

    await booking.save();
    res.json({
      message: 'Booking cancelled',
      refundEligibility,
      refundAmount,
      booking
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Step 3: Commit**

```bash
git add server/controllers/guideController.js
git commit -m "feat(controller): update guide booking to deposit-based flow with cancellation policy"
```

---

<a id="task-8"></a>
### Task 8: Date Conflict Detection Logic

**Files:**
- Create: `server/utils/dateConflict.js`

**Why:** Before admin confirms a booking, we must check that the guide is not already booked for overlapping dates. This utility is reused by admin controller and can be called from guide dashboard too.

**Step 1: Create dateConflict.js**

```javascript
// server/utils/dateConflict.js

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
 * @param {ObjectId} guideId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {ObjectId} excludeBookingId - optional, exclude this booking from check (for updates)
 * @returns {Array} conflicting bookings
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
 * @param {ObjectId} guideId
 * @returns {Array} booked ranges
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
```

**Step 2: Commit**

```bash
git add server/utils/dateConflict.js
git commit -m "feat(utils): add date conflict detection for guide availability"
```

---

<a id="task-9"></a>
### Task 9: Admin Workflow — Enhanced Booking Management

**Files:**
- Modify: `server/controllers/guideController.js`

**Why:** The existing `updateBookingStatus` (line 182) is a simple status setter. Admin now needs: deposit verification, date conflict check before confirmation, remaining payment verification, guide reassignment, and refund processing.

**Step 1: Replace updateBookingStatus with enhanced admin actions**

Remove the existing `updateBookingStatus` and add multiple admin action functions:

```javascript
const { checkDateConflicts } = require('../utils/dateConflict');

// Admin moves deposit_submitted → pending_guide_review (after verifying deposit slip)
const verifyDeposit = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'deposit_submitted') {
      return res.status(400).json({ message: `Cannot verify deposit for status: ${booking.status}` });
    }

    booking.status = 'pending_guide_review';
    booking.adminDecision.depositVerified = true;

    await booking.save();
    res.json({ message: 'Deposit verified. Sent to guide for review.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin confirms booking after guide accepted (checks date conflicts)
const adminConfirmBooking = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'guide_accepted') {
      return res.status(400).json({ message: `Cannot confirm booking with status: ${booking.status}` });
    }

    // Check date conflicts
    const conflicts = await checkDateConflicts(booking.guideId, booking.startDate, booking.endDate, booking._id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'This guide is already booked for the selected date range.',
        conflicts
      });
    }

    booking.status = 'remaining_payment_pending';
    booking.adminDecision.confirmedAt = new Date();

    await booking.save();
    res.json({ message: 'Booking confirmed. User notified to pay remaining balance.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin rejects booking
const adminRejectBooking = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'cancelled_by_admin';
    booking.adminDecision.rejectedAt = new Date();
    booking.adminDecision.reason = req.body.reason || '';
    booking.cancellation = {
      cancelledBy: 'admin',
      cancelledAt: new Date(),
      reason: req.body.reason || '',
      refundEligibility: 'full',
      refundAmount: booking.depositAmount,
      refundStatus: 'pending'
    };

    await booking.save();
    res.json({ message: 'Booking rejected. Deposit refund pending.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin verifies remaining payment
const verifyRemainingPayment = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.status !== 'remaining_payment_submitted') {
      return res.status(400).json({ message: `Cannot verify remaining payment for status: ${booking.status}` });
    }

    booking.status = 'fully_paid';
    booking.adminDecision.remainingVerified = true;

    await booking.save();
    res.json({ message: 'Booking fully paid and confirmed.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin reassigns a different guide
const reassignGuide = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const newGuide = await Guide.findById(req.body.newGuideId);
    if (!newGuide) return res.status(404).json({ message: 'New guide not found' });

    // Check conflicts for new guide
    const conflicts = await checkDateConflicts(newGuide._id, booking.startDate, booking.endDate, booking._id);
    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'The new guide is also booked for these dates.',
        conflicts
      });
    }

    // Recalculate price with new guide's rate
    booking.guideId = newGuide._id;
    booking.totalPrice = newGuide.pricePerDay * booking.days;
    booking.depositAmount = Math.round(booking.totalPrice * booking.depositPercentage / 100);
    booking.remainingAmount = booking.totalPrice - booking.depositAmount;

    // Reset to pending_guide_review so new guide can accept
    booking.status = 'pending_guide_review';
    booking.guideDecision = { status: 'pending' };

    await booking.save();
    res.json({ message: 'Guide reassigned. New guide will review the request.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin processes refund
const processRefund = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const { refundStatus } = req.body; // 'processed' or 'none'

    if (booking.cancellation.refundAmount > 0 && refundStatus === 'processed') {
      if (booking.cancellation.refundEligibility === 'full') {
        booking.status = 'refunded';
      } else if (booking.cancellation.refundEligibility === 'partial') {
        booking.status = 'partially_refunded';
      }
      booking.cancellation.refundStatus = 'processed';
    } else {
      booking.status = 'no_refund';
      booking.cancellation.refundStatus = 'none';
    }

    await booking.save();
    res.json({ message: 'Refund processed.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin gets guide schedule (for conflict checking UI)
const getGuideScheduleAdmin = async (req, res) => {
  try {
    const { getGuideSchedule } = require('../utils/dateConflict');
    const schedule = await getGuideSchedule(req.params.guideId);
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Step 2: Commit**

```bash
git add server/controllers/guideController.js
git commit -m "feat(controller): add admin booking management — verify, confirm, reject, reassign, refund"
```

---

<a id="task-10"></a>
### Task 10: Update Guide Routes — New Admin Endpoints

**Files:**
- Modify: `server/routes/guideRoutes.js`

**Why:** Wire up all the new admin booking management endpoints.

**Step 1: Add new admin routes**

```javascript
// server/routes/guideRoutes.js — add these after existing routes

// Admin booking management
router.put('/bookings/:id/verify-deposit', protect, adminOnly, verifyDeposit);
router.put('/bookings/:id/admin-confirm', protect, adminOnly, adminConfirmBooking);
router.put('/bookings/:id/admin-reject', protect, adminOnly, adminRejectBooking);
router.put('/bookings/:id/verify-remaining', protect, adminOnly, verifyRemainingPayment);
router.put('/bookings/:id/reassign', protect, adminOnly, reassignGuide);
router.put('/bookings/:id/process-refund', protect, adminOnly, processRefund);
router.get('/schedule/:guideId', protect, guideOrAdmin, getGuideScheduleAdmin);
```

**Step 2: Update imports at top of file**

Add `guideOrAdmin` to the destructured imports from authMiddleware. Add all new controller functions to the destructured imports from guideController.

**Step 3: Commit**

```bash
git add server/routes/guideRoutes.js
git commit -m "feat(routes): add admin booking management and schedule endpoints"
```

---

<a id="task-11"></a>
### Task 11: Remaining Payment API

**Files:**
- Modify: `server/controllers/guideController.js`
- Modify: `server/routes/guideRoutes.js`

**Why:** After admin confirms booking, user must submit the remaining balance payment slip.

**Step 1: Add submitRemainingPayment controller**

```javascript
// server/controllers/guideController.js — add new function

const submitRemainingPayment = async (req, res) => {
  try {
    const booking = await GuideBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'remaining_payment_pending') {
      return res.status(400).json({ message: 'Remaining payment is not expected at this stage' });
    }

    booking.status = 'remaining_payment_submitted';
    await booking.save();

    res.json({ message: 'Remaining payment submitted. Awaiting admin verification.', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

**Step 2: Add route**

```javascript
// server/routes/guideRoutes.js
router.put('/bookings/:id/submit-remaining', protect, submitRemainingPayment);
```

**Step 3: Commit**

```bash
git add server/controllers/guideController.js server/routes/guideRoutes.js
git commit -m "feat(api): add remaining payment submission endpoint for users"
```

---

<a id="task-12"></a>
### Task 12: Guide Registration Page (Frontend)

**Files:**
- Create: `client/src/pages/auth/GuideRegisterPage.jsx`

**Why:** Guides need a dedicated registration page. Follow the exact same UI pattern as the existing RegisterPage (glassmorphic card with amber accents).

**Step 1: Create GuideRegisterPage.jsx**

```jsx
// client/src/pages/auth/GuideRegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const LANGUAGES = ['English', 'Sinhala', 'Tamil', 'Hindi', 'French', 'German', 'Japanese', 'Chinese'];
const LOCATIONS = ['Colombo', 'Kandy', 'Galle', 'Ella', 'Sigiriya', 'Nuwara Eliya', 'Jaffna', 'Trincomalee', 'Anuradhapura'];

export default function GuideRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    phone: '', location: '', experience: 1, bio: '',
    languages: [], services: '', certifications: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!form.location) return toast.error('Please select a location');

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        location: form.location,
        experience: Number(form.experience),
        bio: form.bio,
        languages: form.languages,
        services: form.services ? form.services.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      const { data } = await api.post('/auth/guide/register', payload);
      localStorage.setItem('token', data.token);
      toast.success('Registration successful! Complete your profile to start receiving bookings.');
      navigate('/guide/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s'
  };

  const labelStyle = { display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 4, fontWeight: 500 };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 16px'
    }}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)', borderRadius: 20, padding: '36px 32px',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ color: '#f59e0b', fontSize: 26, fontWeight: 700, margin: 0 }}>
            Become a Travel Guide
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>
            Register to receive booking requests from travelers
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Personal Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="Your full name" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} style={inputStyle} placeholder="+94 7X XXX XXXX" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} placeholder="guide@email.com" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required style={inputStyle} placeholder="Min 6 characters" />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handleChange} required style={inputStyle} placeholder="Confirm password" />
            </div>
          </div>

          {/* Professional Info */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 4 }}>
            <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Professional Details</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Location *</label>
              <select name="location" value={form.location} onChange={handleChange} required style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select location</option>
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Experience (years)</label>
              <input name="experience" type="number" min="1" value={form.experience} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Languages</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {LANGUAGES.map(lang => (
                <button type="button" key={lang} onClick={() => toggleLanguage(lang)} style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  border: form.languages.includes(lang) ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                  background: form.languages.includes(lang) ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                  color: form.languages.includes(lang) ? '#f59e0b' : '#9ca3af',
                  transition: 'all 0.2s'
                }}>
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Tell travelers about yourself and your expertise..." />
          </div>

          <div>
            <label style={labelStyle}>Services (comma separated)</label>
            <input name="services" value={form.services} onChange={handleChange} style={inputStyle}
              placeholder="City Tours, Wildlife Safaris, Trekking" />
          </div>

          <div>
            <label style={labelStyle}>Certifications (comma separated)</label>
            <input name="certifications" value={form.certifications} onChange={handleChange} style={inputStyle}
              placeholder="Licensed Tour Guide, First Aid Certified" />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: loading ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 8, transition: 'opacity 0.2s'
          }}>
            {loading ? 'Creating Account...' : 'Register as Guide'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 20 }}>
          Already have a guide account?{' '}
          <Link to="/guide/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
        </p>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
          Looking to book a guide?{' '}
          <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>User Login</Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/auth/GuideRegisterPage.jsx
git commit -m "feat(ui): add guide registration page with professional details form"
```

---

<a id="task-13"></a>
### Task 13: Guide Login Page (Frontend)

**Files:**
- Create: `client/src/pages/auth/GuideLoginPage.jsx`

**Why:** Guides need a dedicated login page. Same glassmorphic style as existing LoginPage but with guide-specific branding and links.

**Step 1: Create GuideLoginPage.jsx**

```jsx
// client/src/pages/auth/GuideLoginPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function GuideLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/guide/login', form);
      localStorage.setItem('token', data.token);
      toast.success('Welcome back!');
      // Force page reload to pick up new auth state
      window.location.href = '/guide/dashboard';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none', transition: 'border 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      padding: '40px 16px'
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)', borderRadius: 20, padding: '40px 32px',
        border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
          }}>
            🧭
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            Guide Portal
          </h1>
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 6 }}>
            Sign in to manage your bookings
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Email
            </label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              required style={inputStyle} placeholder="guide@email.com" />
          </div>

          <div>
            <label style={{ display: 'block', color: '#d1d5db', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              required style={inputStyle} placeholder="Enter your password" />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
            background: loading ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 4, transition: 'opacity 0.2s'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 24 }}>
          New guide?{' '}
          <Link to="/guide/register" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 500 }}>
            Register Here
          </Link>
        </p>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 12, marginTop: 8 }}>
          <Link to="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>User Login</Link>
          {' · '}
          <Link to="/admin/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Admin Login</Link>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/auth/GuideLoginPage.jsx
git commit -m "feat(ui): add guide login page with portal branding"
```

---

<a id="task-14"></a>
### Task 14: Guide Dashboard Page (Frontend)

**Files:**
- Create: `client/src/pages/guide/GuideDashboardPage.jsx`

**Why:** This is the guide's private area — shows their profile summary, booking request stats, and a filterable list of all booking requests with accept/reject actions.

**Step 1: Create GuideDashboardPage.jsx**

```jsx
// client/src/pages/guide/GuideDashboardPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_LABELS = {
  deposit_submitted: 'Deposit Submitted',
  pending_guide_review: 'Awaiting Your Review',
  guide_accepted: 'You Accepted',
  guide_rejected: 'You Rejected',
  under_admin_review: 'Under Admin Review',
  admin_confirmed: 'Admin Confirmed',
  remaining_payment_pending: 'Remaining Payment Pending',
  remaining_payment_submitted: 'Remaining Payment Submitted',
  fully_paid: 'Fully Paid',
  completed: 'Completed',
  cancelled_by_user: 'Cancelled by User',
  cancelled_by_admin: 'Cancelled by Admin',
  refund_pending: 'Refund Pending',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
  no_refund: 'No Refund'
};

const STATUS_COLORS = {
  pending_guide_review: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  guide_accepted: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  guide_rejected: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  remaining_payment_pending: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  fully_paid: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  completed: { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  cancelled_by_user: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  cancelled_by_admin: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const getStatusStyle = (status) => STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };

export default function GuideDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, bookingsRes] = await Promise.all([
        api.get('/guide-dashboard/profile'),
        api.get('/guide-dashboard/bookings')
      ]);
      setProfile(profileRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/guide/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.put(`/guide-dashboard/bookings/${bookingId}/accept`);
      toast.success('Booking request accepted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal);
    try {
      await api.put(`/guide-dashboard/bookings/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Booking request rejected');
      setRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending_guide_review').length;
  const activeCount = bookings.filter(b => ['guide_accepted', 'remaining_payment_pending', 'remaining_payment_submitted', 'fully_paid'].includes(b.status)).length;

  const filteredBookings = filter === 'all' ? bookings
    : filter === 'pending' ? bookings.filter(b => b.status === 'pending_guide_review')
    : filter === 'active' ? bookings.filter(b => ['guide_accepted', 'under_admin_review', 'admin_confirmed', 'remaining_payment_pending', 'remaining_payment_submitted', 'fully_paid'].includes(b.status))
    : bookings.filter(b => ['completed', 'cancelled_by_user', 'cancelled_by_admin', 'guide_rejected', 'refunded', 'partially_refunded', 'no_refund'].includes(b.status));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <div style={{ color: '#6b7280', fontSize: 16 }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '32px 24px 28px', color: '#fff'
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                Welcome, {profile?.name || 'Guide'}
              </h1>
              <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>{profile?.location}</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate('/guide/schedule')} style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer'
              }}>
                My Schedule
              </button>
              <button onClick={() => { localStorage.removeItem('token'); navigate('/guide/login'); }} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: 13, cursor: 'pointer'
              }}>
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 24 }}>
            {[
              { label: 'Pending Review', value: pendingCount, color: '#fbbf24' },
              { label: 'Active Bookings', value: activeCount, color: '#34d399' },
              { label: 'Total Bookings', value: bookings.length, color: '#60a5fa' },
              { label: 'Rating', value: profile?.rating?.toFixed(1) || '0.0', color: '#f59e0b' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Requests */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Booking Requests</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'pending', 'active', 'past'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: filter === f ? '1px solid #f59e0b' : '1px solid #d1d5db',
                background: filter === f ? '#fef3c7' : '#fff',
                color: filter === f ? '#92400e' : '#6b7280'
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && pendingCount > 0 && (
                  <span style={{
                    marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: '50%',
                    padding: '1px 6px', fontSize: 11, fontWeight: 700
                  }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', background: '#fff',
            borderRadius: 16, border: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#9ca3af', fontSize: 15 }}>No booking requests found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredBookings.map(booking => {
              const statusStyle = getStatusStyle(booking.status);
              return (
                <div key={booking._id} style={{
                  background: '#fff', borderRadius: 14, padding: '20px 24px',
                  border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{booking.travelerName}</span>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`
                        }}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 13, color: '#6b7280' }}>
                        <span>📍 {booking.location}</span>
                        <span>📅 {new Date(booking.startDate).toLocaleDateString()} — {new Date(booking.endDate).toLocaleDateString()}</span>
                        <span>🕐 {booking.days} days · {booking.travelers} traveler{booking.travelers > 1 ? 's' : ''}</span>
                      </div>
                      {booking.specialRequests && (
                        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
                          "{booking.specialRequests}"
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 140 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>
                        LKR {booking.totalPrice?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        Deposit: LKR {booking.depositAmount?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions for pending_guide_review */}
                  {booking.status === 'pending_guide_review' && (
                    <div style={{
                      display: 'flex', gap: 10, marginTop: 16, paddingTop: 16,
                      borderTop: '1px solid #f3f4f6'
                    }}>
                      <button onClick={() => handleAccept(booking._id)} disabled={actionLoading === booking._id}
                        style={{
                          padding: '9px 24px', borderRadius: 8, border: 'none',
                          background: '#059669', color: '#fff', fontSize: 13, fontWeight: 600,
                          cursor: actionLoading === booking._id ? 'not-allowed' : 'pointer'
                        }}>
                        {actionLoading === booking._id ? 'Processing...' : 'Accept Request'}
                      </button>
                      <button onClick={() => setRejectModal(booking._id)}
                        style={{
                          padding: '9px 24px', borderRadius: 8, border: '1px solid #fca5a5',
                          background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                        }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 440, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Reject Booking Request</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3} style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                fontSize: 14, resize: 'vertical', outline: 'none'
              }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer'
                }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/guide/GuideDashboardPage.jsx
git commit -m "feat(ui): add guide dashboard with booking requests, stats, accept/reject flow"
```

---

<a id="task-15"></a>
### Task 15: Guide Booking Request Detail View (Frontend)

This is handled inline within the dashboard (Task 14) via expandable cards. No separate page needed — keeps the UX simple and avoids over-engineering.

---

<a id="task-16"></a>
### Task 16: Guide Schedule/Calendar View (Frontend)

**Files:**
- Create: `client/src/pages/guide/GuideSchedulePage.jsx`

**Why:** Guides need to see their booked/free dates at a glance.

**Step 1: Create GuideSchedulePage.jsx**

```jsx
// client/src/pages/guide/GuideSchedulePage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function GuideSchedulePage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const { data } = await api.get('/guide-dashboard/schedule');
        setSchedule(data);
      } catch (err) {
        toast.error('Failed to load schedule');
        if (err.response?.status === 403) navigate('/guide/login');
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const isDateBooked = (date) => {
    return schedule.some(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const getBookingForDate = (date) => {
    return schedule.find(booking => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fb' }}>
        <div style={{ color: '#6b7280' }}>Loading schedule...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => navigate('/guide/dashboard')} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer'
          }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>My Schedule</h1>
          <div style={{ width: 120 }} />
        </div>

        {/* Calendar */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              background: '#fff', cursor: 'pointer', fontSize: 14
            }}>←</button>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db',
              background: '#fff', cursor: 'pointer', fontSize: 14
            }}>→</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9ca3af', padding: '8px 0' }}>
                {day}
              </div>
            ))}
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const booked = isDateBooked(date);
              const booking = booked ? getBookingForDate(date) : null;
              const isToday = date.getTime() === today.getTime();
              const isPast = date < today;

              return (
                <div key={i} title={booking ? `${booking.travelerName} — ${booking.location}` : 'Free'} style={{
                  textAlign: 'center', padding: '10px 4px', borderRadius: 8, fontSize: 14, cursor: 'default',
                  background: booked ? '#fef3c7' : isToday ? '#eff6ff' : 'transparent',
                  border: isToday ? '2px solid #3b82f6' : booked ? '1px solid #fcd34d' : '1px solid transparent',
                  color: isPast ? '#d1d5db' : booked ? '#92400e' : '#374151',
                  fontWeight: isToday ? 700 : booked ? 600 : 400,
                  position: 'relative'
                }}>
                  {i + 1}
                  {booked && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#f59e0b',
                      margin: '2px auto 0'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 24, marginTop: 16, justifyContent: 'center' }}>
          {[
            { color: '#fef3c7', border: '#fcd34d', label: 'Booked' },
            { color: '#eff6ff', border: '#3b82f6', label: 'Today' },
            { color: '#fff', border: '#e5e7eb', label: 'Free' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color, border: `1px solid ${item.border}` }} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Upcoming Bookings List */}
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 14 }}>Upcoming Bookings</h3>
          {schedule.filter(b => new Date(b.startDate) >= today).length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No upcoming bookings</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {schedule.filter(b => new Date(b.startDate) >= today).map(b => (
                <div key={b._id} style={{
                  background: '#fff', borderRadius: 10, padding: '14px 18px',
                  border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{b.travelerName}</span>
                    <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 10 }}>{b.location}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/pages/guide/GuideSchedulePage.jsx
git commit -m "feat(ui): add guide schedule calendar view with booked/free indicators"
```

---

<a id="task-17"></a>
### Task 17: Update GuideDetailsPage — "Request This Guide"

**Files:**
- Modify: `client/src/pages/guides/GuideDetailsPage.jsx`

**Why:** Change "Hire This Guide" button to "Request This Guide" and add deposit info text.

**Step 1: Find and replace the button text**

Find in GuideDetailsPage.jsx around line 108:
```
Hire This Guide
```
Replace with:
```
Request This Guide
```

**Step 2: Add deposit info note below the button**

After the "Request This Guide" button, add:

```jsx
<p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
  Only a 30% advance deposit is required to submit your request. Final confirmation after guide approval.
</p>
```

**Step 3: Commit**

```bash
git add client/src/pages/guides/GuideDetailsPage.jsx
git commit -m "feat(ui): change 'Hire This Guide' to 'Request This Guide' with deposit info"
```

---

<a id="task-18"></a>
### Task 18: Update GuideBookingPage — Deposit Flow UI

**Files:**
- Modify: `client/src/pages/guides/GuideBookingPage.jsx`

**Why:** This is the most important UI change. The booking form must show deposit breakdown, change button text, update payment section text, add cancellation policy, and calculate endDate.

**Step 1: Add endDate and deposit calculation**

In the form state (around line 35), the existing `form` object keeps its fields. We add computed values. Find the `totalPrice` calculation (around line 53) and enhance:

```javascript
const totalPrice = guide ? guide.pricePerDay * Number(form.days) : 0;
const depositPercentage = 30;
const depositAmount = Math.round(totalPrice * depositPercentage / 100);
const remainingAmount = totalPrice - depositAmount;

// Calculate endDate
const startDate = form.travelDate ? new Date(form.travelDate) : null;
const endDate = startDate ? new Date(new Date(startDate).setDate(startDate.getDate() + Number(form.days) - 1)) : null;
```

**Step 2: Update the submit handler**

Replace the existing submit (around line 63) to send `startDate` instead of `travelDate` and include deposit info:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!user) return toast.error('Please log in');
  if (!slipFile) return toast.error('Please upload your deposit payment slip');

  setSubmitting(true);
  try {
    const { data: booking } = await api.post('/guides/bookings/create', {
      guideId: id,
      travelerName: form.travelerName,
      email: form.email,
      phone: form.phone,
      startDate: form.travelDate,
      days: form.days,
      travelers: form.travelers,
      location: form.location,
      specialRequests: form.specialRequests
    });

    // Upload deposit slip
    const slipData = new FormData();
    slipData.append('slip', slipFile);
    slipData.append('source', 'guide');
    slipData.append('referenceId', booking._id);
    slipData.append('amount', depositAmount);
    await api.post('/payments/upload-slip', slipData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    toast.success('Booking request submitted! The guide and our team will review your request.');
    navigate('/my-guides');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to submit booking request');
  } finally {
    setSubmitting(false);
  }
};
```

**Step 3: Update Trip Summary in the sidebar**

Replace the existing summary card content to show deposit breakdown:

```jsx
{/* Trip Summary — inside the sticky sidebar card */}
<div style={{ fontSize: 14, color: '#374151' }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
    <span>Guide</span>
    <span style={{ fontWeight: 600 }}>{guide.name}</span>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
    <span>Price Per Day</span>
    <span>LKR {guide.pricePerDay?.toLocaleString()}</span>
  </div>
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
    <span>Duration</span>
    <span>{form.days} day{form.days > 1 ? 's' : ''}</span>
  </div>
  {startDate && endDate && (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span>Dates</span>
      <span style={{ fontSize: 12 }}>{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}</span>
    </div>
  )}

  <div style={{ borderTop: '1px solid #e5e7eb', margin: '14px 0', paddingTop: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span>Total Trip Amount</span>
      <span style={{ fontWeight: 600 }}>LKR {totalPrice.toLocaleString()}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#d97706' }}>
      <span style={{ fontWeight: 600 }}>Advance Deposit (30%)</span>
      <span style={{ fontWeight: 700, fontSize: 16 }}>LKR {depositAmount.toLocaleString()}</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
      <span>Remaining Balance</span>
      <span>LKR {remainingAmount.toLocaleString()}</span>
    </div>
  </div>
</div>
```

**Step 4: Update payment section text**

Replace:
```
Upload your bank transfer slip to confirm your booking.
```
With:
```
Upload your bank transfer slip for the advance deposit. Your booking request will be reviewed by the guide and our team before final confirmation.
```

Add this note below:
```jsx
<div style={{
  background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10,
  padding: '12px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.6, marginTop: 12
}}>
  <strong>Important:</strong> This payment secures your booking request and will be reviewed before final confirmation. Paying the deposit does not guarantee the selected guide until approval is completed.
</div>
```

**Step 5: Update submit button text**

Replace:
```
Confirm Booking — LKR {totalPrice}
```
With:
```
Submit Booking Request & Pay Deposit — LKR {depositAmount.toLocaleString()}
```

**Step 6: Add cancellation policy section**

Before the submit button, add:

```jsx
<div style={{
  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
  padding: '14px 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginTop: 16
}}>
  <strong style={{ color: '#374151' }}>Cancellation Policy</strong>
  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
    <li>3+ days before trip: Full deposit refund</li>
    <li>1-2 days before trip: 50% deposit refund</li>
    <li>On trip date: No refund</li>
    <li>Admin/guide cancellation: Full deposit refund</li>
  </ul>
</div>
```

**Step 7: Commit**

```bash
git add client/src/pages/guides/GuideBookingPage.jsx
git commit -m "feat(ui): update booking page with deposit breakdown, policy, and request-based flow"
```

---

<a id="task-19"></a>
### Task 19: Update TravelerGuidesPage — Enhanced Status & Remaining Payment

**Files:**
- Modify: `client/src/pages/guides/TravelerGuidesPage.jsx`

**Why:** The user's booking history page must show all new statuses, remaining payment upload, cancellation with refund info, and notification messages.

**Step 1: Update STATUS_STYLES constant**

Replace the existing STATUS_STYLES (line 8-13) with the full status map:

```javascript
const STATUS_STYLES = {
  deposit_submitted: 'bg-yellow-100 text-yellow-800',
  pending_guide_review: 'bg-amber-100 text-amber-800',
  guide_accepted: 'bg-green-100 text-green-800',
  guide_rejected: 'bg-red-100 text-red-800',
  under_admin_review: 'bg-blue-100 text-blue-800',
  admin_confirmed: 'bg-blue-100 text-blue-800',
  remaining_payment_pending: 'bg-orange-100 text-orange-800',
  remaining_payment_submitted: 'bg-yellow-100 text-yellow-800',
  fully_paid: 'bg-green-100 text-green-800',
  completed: 'bg-indigo-100 text-indigo-800',
  cancelled_by_user: 'bg-red-100 text-red-800',
  cancelled_by_admin: 'bg-red-100 text-red-800',
  refund_pending: 'bg-yellow-100 text-yellow-800',
  partially_refunded: 'bg-orange-100 text-orange-800',
  refunded: 'bg-green-100 text-green-800',
  no_refund: 'bg-gray-100 text-gray-800'
};
```

**Step 2: Add remaining payment upload handler**

```javascript
const [remainingSlipFile, setRemainingSlipFile] = useState(null);
const [uploadingRemaining, setUploadingRemaining] = useState(null);

const handleRemainingPayment = async (bookingId) => {
  if (!remainingSlipFile) return toast.error('Please select your payment slip');
  setUploadingRemaining(bookingId);
  try {
    // Upload slip first
    const slipData = new FormData();
    slipData.append('slip', remainingSlipFile);
    slipData.append('source', 'guide-remaining');
    slipData.append('referenceId', bookingId);
    await api.post('/payments/upload-slip', slipData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Update status
    await api.put(`/guides/bookings/${bookingId}/submit-remaining`);
    toast.success('Remaining payment submitted! Awaiting admin verification.');
    setRemainingSlipFile(null);
    loadBookings();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to submit payment');
  } finally {
    setUploadingRemaining(null);
  }
};
```

**Step 3: Add notification messages per status**

Display contextual messages on each booking card:

```javascript
const getStatusMessage = (status) => {
  const messages = {
    deposit_submitted: 'Your booking request has been submitted. The guide and our team will review your request.',
    pending_guide_review: 'Your request is being reviewed by the guide.',
    guide_accepted: 'The guide has accepted your request! Admin is reviewing availability.',
    guide_rejected: 'Unfortunately, the selected guide is unavailable. Our team will review alternative options.',
    under_admin_review: 'Your booking is under admin review.',
    remaining_payment_pending: 'Your guide booking has been approved. Please complete the remaining payment before the trip date.',
    remaining_payment_submitted: 'Remaining payment submitted. Awaiting admin verification.',
    fully_paid: 'Your booking is now fully confirmed!',
    completed: 'Trip completed. We hope you had a great experience!',
    cancelled_by_user: 'You cancelled this booking.',
    cancelled_by_admin: 'This booking was cancelled by admin. Please contact support or submit a new request.',
    refund_pending: 'Your refund is being processed.',
    refunded: 'Your deposit has been fully refunded.',
    partially_refunded: 'A partial refund has been processed.',
    no_refund: 'No refund applicable for this cancellation.'
  };
  return messages[status] || '';
};
```

**Step 4: Show remaining payment section when status is `remaining_payment_pending`**

Inside each booking card, after the status badge, add:

```jsx
{booking.status === 'remaining_payment_pending' && (
  <div style={{ marginTop: 14, padding: 14, background: '#fff7ed', borderRadius: 10, border: '1px solid #fed7aa' }}>
    <p style={{ fontSize: 13, fontWeight: 600, color: '#c2410c', marginBottom: 8 }}>
      Remaining Balance: LKR {booking.remainingAmount?.toLocaleString()}
    </p>
    <input type="file" accept="image/*" onChange={e => setRemainingSlipFile(e.target.files[0])}
      style={{ fontSize: 13, marginBottom: 8 }} />
    <button onClick={() => handleRemainingPayment(booking._id)}
      disabled={uploadingRemaining === booking._id}
      style={{
        padding: '8px 18px', borderRadius: 8, border: 'none', background: '#d97706',
        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'
      }}>
      {uploadingRemaining === booking._id ? 'Uploading...' : 'Submit Remaining Payment'}
    </button>
  </div>
)}
```

**Step 5: Add cancellation with refund policy display**

Update the cancel button to show refund info before confirming:

```javascript
const handleCancel = async (bookingId, startDate) => {
  const daysUntilTrip = Math.ceil((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24));
  let refundMsg = '';
  if (daysUntilTrip >= 3) refundMsg = 'You will receive a full deposit refund.';
  else if (daysUntilTrip >= 1) refundMsg = 'You will receive a 50% deposit refund.';
  else refundMsg = 'No refund will be provided (same-day cancellation).';

  if (!window.confirm(`Cancel this booking?\n\n${refundMsg}`)) return;

  try {
    const { data } = await api.put(`/guides/bookings/${bookingId}/cancel`);
    toast.success(`Booking cancelled. ${data.refundEligibility === 'none' ? 'No refund.' : `Refund: LKR ${data.refundAmount?.toLocaleString()}`}`);
    loadBookings();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Cancel failed');
  }
};
```

**Step 6: Commit**

```bash
git add client/src/pages/guides/TravelerGuidesPage.jsx
git commit -m "feat(ui): enhance traveler bookings with status workflow, remaining payment, cancellation policy"
```

---

<a id="task-20"></a>
### Task 20: Update Admin Booking Management (Frontend)

**Files:**
- Modify: `client/src/pages/admin/AdminGuidesPage.jsx`

**Why:** Admin needs to see the full booking workflow: verify deposits, check conflicts, confirm/reject bookings, verify remaining payments, reassign guides, process refunds.

**Step 1: Add a booking management tab/section**

This is a significant UI addition. Add a tabbed view to AdminGuidesPage — Tab 1: Guide Management (existing), Tab 2: Booking Management (new).

The booking management section should show:
- All guide bookings with new status badges
- Action buttons per status:
  - `deposit_submitted` → "Verify Deposit" button
  - `guide_accepted` → "Confirm Booking" / "Reject" buttons (with conflict check)
  - `remaining_payment_submitted` → "Verify Remaining Payment" button
  - `cancelled_by_user` with refund pending → "Process Refund" button
  - Any status → "Reassign Guide" option
- Date conflict warnings
- Deposit/remaining slip viewer
- Guide schedule quick-view

This is the largest single frontend change. Implement as a separate component section within AdminGuidesPage to keep the file manageable.

**Step 2: Add admin API call handlers**

```javascript
const verifyDeposit = async (id) => {
  await api.put(`/guides/bookings/${id}/verify-deposit`);
  toast.success('Deposit verified. Sent to guide for review.');
  loadBookings();
};

const confirmBooking = async (id) => {
  try {
    await api.put(`/guides/bookings/${id}/admin-confirm`);
    toast.success('Booking confirmed. User notified to pay remaining balance.');
    loadBookings();
  } catch (err) {
    if (err.response?.status === 409) {
      toast.error('Date conflict! This guide is already booked for these dates.');
    } else {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    }
  }
};

const rejectBooking = async (id, reason) => {
  await api.put(`/guides/bookings/${id}/admin-reject`, { reason });
  toast.success('Booking rejected. Deposit refund pending.');
  loadBookings();
};

const verifyRemaining = async (id) => {
  await api.put(`/guides/bookings/${id}/verify-remaining`);
  toast.success('Booking fully confirmed!');
  loadBookings();
};

const processRefund = async (id, refundStatus) => {
  await api.put(`/guides/bookings/${id}/process-refund`, { refundStatus });
  toast.success('Refund processed.');
  loadBookings();
};

const reassignGuide = async (bookingId, newGuideId) => {
  try {
    await api.put(`/guides/bookings/${bookingId}/reassign`, { newGuideId });
    toast.success('Guide reassigned. New guide will review the request.');
    loadBookings();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Reassignment failed');
  }
};
```

**Step 3: Commit**

```bash
git add client/src/pages/admin/AdminGuidesPage.jsx
git commit -m "feat(ui): add admin booking management with verify, confirm, reject, reassign, refund actions"
```

---

<a id="task-21"></a>
### Task 21: Update Navbar — Guide Login Link

**Files:**
- Modify: `client/src/components/Navbar.jsx`

**Why:** Add a "Travel Guide Login" link under/near the user login, so guides can find their portal.

**Step 1: Add guide login link**

In Navbar.jsx, find the login link area (around line 94 where login/register links appear for unauthenticated users). Add below the existing login link:

```jsx
<Link to="/guide/login" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none' }}>
  Travel Guide Portal →
</Link>
```

**Step 2: For authenticated guide users, show dashboard link**

If `user.role === 'guide'`, show a "Guide Dashboard" link instead of the regular profile:

```jsx
{user.role === 'guide' && (
  <Link to="/guide/dashboard" className="nav-link">Guide Dashboard</Link>
)}
```

**Step 3: Commit**

```bash
git add client/src/components/Navbar.jsx
git commit -m "feat(ui): add guide portal link in navbar for guide authentication access"
```

---

<a id="task-22"></a>
### Task 22: Update App.jsx — Guide Routes

**Files:**
- Modify: `client/src/App.jsx`

**Why:** Register all new guide pages in the router.

**Step 1: Import new pages**

```javascript
import GuideLoginPage from './pages/auth/GuideLoginPage';
import GuideRegisterPage from './pages/auth/GuideRegisterPage';
import GuideDashboardPage from './pages/guide/GuideDashboardPage';
import GuideSchedulePage from './pages/guide/GuideSchedulePage';
```

**Step 2: Add routes**

Add inside the Routes block, after existing guide routes:

```jsx
{/* Guide Auth */}
<Route path="/guide/login" element={<GuideLoginPage />} />
<Route path="/guide/register" element={<GuideRegisterPage />} />

{/* Guide Dashboard (protected — requires guide role) */}
<Route path="/guide/dashboard" element={<PrivateRoute><GuideDashboardPage /></PrivateRoute>} />
<Route path="/guide/schedule" element={<PrivateRoute><GuideSchedulePage /></PrivateRoute>} />
```

Note: `PrivateRoute` checks if user is authenticated. The guide dashboard API itself enforces `guideOnly` middleware on the backend, so unauthorized users get 403 even if they reach the page.

**Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat(routes): add guide auth and dashboard routes to App.jsx"
```

---

<a id="task-23"></a>
### Task 23: Update AuthContext — Handle Guide Role

**Files:**
- Modify: `client/src/context/AuthContext.jsx`

**Why:** The AuthContext needs to handle guide login response (which includes `guideId`). Store guideId in context for easy access.

**Step 1: Add guideId to state**

```javascript
const [guideId, setGuideId] = useState(null);
```

**Step 2: Update session restore**

In the useEffect that calls `/auth/me` (lines 11-21), also check if user is a guide and fetch guideId:

```javascript
if (res.data.role === 'guide') {
  try {
    const guideRes = await api.get('/guide-dashboard/profile');
    setGuideId(guideRes.data._id);
  } catch {}
}
```

**Step 3: Include guideId in context value**

```javascript
<AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, guideId }}>
```

**Step 4: Commit**

```bash
git add client/src/context/AuthContext.jsx
git commit -m "feat(auth): handle guide role and guideId in AuthContext"
```

---

<a id="task-24"></a>
### Task 24: Admin Date Conflict UI & Guide Reassignment

**Files:**
- Modify: `client/src/pages/admin/AdminGuidesPage.jsx` (already touched in Task 20)

**Why:** When admin clicks "Confirm Booking" and a 409 conflict is returned, show a conflict detail panel with the clashing bookings and offer to reassign a different guide.

**Step 1: Add conflict state and UI**

```javascript
const [conflictData, setConflictData] = useState(null);
const [reassignGuideId, setReassignGuideId] = useState('');

const handleConfirmWithConflictCheck = async (bookingId) => {
  try {
    await api.put(`/guides/bookings/${bookingId}/admin-confirm`);
    toast.success('Booking confirmed.');
    setConflictData(null);
    loadBookings();
  } catch (err) {
    if (err.response?.status === 409) {
      setConflictData({
        bookingId,
        conflicts: err.response.data.conflicts,
        message: err.response.data.message
      });
    } else {
      toast.error(err.response?.data?.message || 'Failed');
    }
  }
};
```

**Step 2: Render conflict resolution panel**

```jsx
{conflictData && (
  <div style={{
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
    padding: 20, marginBottom: 20
  }}>
    <h4 style={{ color: '#991b1b', marginBottom: 10 }}>Date Conflict Detected</h4>
    <p style={{ fontSize: 13, color: '#7f1d1d', marginBottom: 12 }}>{conflictData.message}</p>
    {conflictData.conflicts.map(c => (
      <div key={c._id} style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
        • {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}
        ({c.travelerName}, {c.location})
      </div>
    ))}
    <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
      <select value={reassignGuideId} onChange={e => setReassignGuideId(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}>
        <option value="">Select another guide...</option>
        {guides.map(g => <option key={g._id} value={g._id}>{g.name} — {g.location}</option>)}
      </select>
      <button onClick={() => reassignGuide(conflictData.bookingId, reassignGuideId)}
        disabled={!reassignGuideId}
        style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: reassignGuideId ? '#d97706' : '#d1d5db',
          color: '#fff', fontSize: 13, cursor: reassignGuideId ? 'pointer' : 'not-allowed'
        }}>Reassign Guide</button>
      <button onClick={() => rejectBooking(conflictData.bookingId, 'Date conflict — guide unavailable')}
        style={{
          padding: '8px 16px', borderRadius: 6, border: '1px solid #fca5a5',
          background: '#fff', color: '#dc2626', fontSize: 13, cursor: 'pointer'
        }}>Reject Booking</button>
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add client/src/pages/admin/AdminGuidesPage.jsx
git commit -m "feat(ui): add date conflict detection and guide reassignment in admin panel"
```

---

## Complete Status Flow Diagram

```
User submits booking + deposit slip
         │
         ▼
  [deposit_submitted]
         │
    Admin verifies deposit slip
         │
         ▼
  [pending_guide_review]
         │
    Guide reviews request
        ╱ ╲
       ▼   ▼
 [guide_accepted]  [guide_rejected] → END
       │
  Admin checks conflicts + confirms
      ╱ ╲
     ▼   ▼
 [remaining_payment_pending]  [cancelled_by_admin] → refund flow
       │
  User uploads remaining slip
       │
       ▼
 [remaining_payment_submitted]
       │
  Admin verifies remaining
       │
       ▼
   [fully_paid]
       │
  Trip happens
       │
       ▼
   [completed] → User can leave review
```

**Cancellation flow (any active status):**
```
User cancels → [cancelled_by_user]
  → 3+ days before: full refund → [refund_pending] → [refunded]
  → 1-2 days before: partial → [refund_pending] → [partially_refunded]
  → same day: no refund → [no_refund]

Admin cancels → [cancelled_by_admin] → full refund → [refunded]
```

---

## API Endpoints Summary (New/Modified)

### New Auth Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/guide/register` | Public | Guide registration |
| POST | `/api/auth/guide/login` | Public | Guide login |

### New Guide Dashboard Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/guide-dashboard/profile` | Guide | Get own profile |
| PUT | `/api/guide-dashboard/profile` | Guide | Update own profile |
| GET | `/api/guide-dashboard/bookings` | Guide | Get assigned bookings |
| PUT | `/api/guide-dashboard/bookings/:id/accept` | Guide | Accept request |
| PUT | `/api/guide-dashboard/bookings/:id/reject` | Guide | Reject request |
| GET | `/api/guide-dashboard/schedule` | Guide | Get booked dates |

### Modified/New Booking Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/guides/bookings/create` | User | Create booking (deposit flow) |
| PUT | `/api/guides/bookings/:id/cancel` | User | Cancel with refund calc |
| PUT | `/api/guides/bookings/:id/submit-remaining` | User | Submit remaining payment |

### New Admin Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/guides/bookings/:id/verify-deposit` | Admin | Verify deposit slip |
| PUT | `/api/guides/bookings/:id/admin-confirm` | Admin | Confirm (checks conflicts) |
| PUT | `/api/guides/bookings/:id/admin-reject` | Admin | Reject booking |
| PUT | `/api/guides/bookings/:id/verify-remaining` | Admin | Verify remaining payment |
| PUT | `/api/guides/bookings/:id/reassign` | Admin | Reassign different guide |
| PUT | `/api/guides/bookings/:id/process-refund` | Admin | Process refund |
| GET | `/api/guides/schedule/:guideId` | Guide/Admin | Get guide schedule |

---

## Frontend Routes Summary (New)

| Route | Component | Auth |
|-------|-----------|------|
| `/guide/login` | GuideLoginPage | Public |
| `/guide/register` | GuideRegisterPage | Public |
| `/guide/dashboard` | GuideDashboardPage | Guide |
| `/guide/schedule` | GuideSchedulePage | Guide |

---

## Files Changed Summary

### Backend (Server)
| File | Action |
|------|--------|
| `server/models/User.js` | Modify — add 'guide' role |
| `server/models/Guide.js` | Modify — add userId, email, phone |
| `server/models/GuideBooking.js` | Modify — full schema rewrite |
| `server/middleware/authMiddleware.js` | Modify — add guideOnly, guideOrAdmin |
| `server/controllers/authController.js` | Modify — add guideRegister, guideLogin |
| `server/controllers/guideController.js` | Modify — deposit flow, admin actions, cancellation |
| `server/controllers/guideDashboardController.js` | Create — guide dashboard API |
| `server/routes/authRoutes.js` | Modify — add guide auth routes |
| `server/routes/guideRoutes.js` | Modify — add admin booking management routes |
| `server/routes/guideDashboardRoutes.js` | Create — guide dashboard routes |
| `server/utils/dateConflict.js` | Create — conflict detection utility |
| `server/server.js` | Modify — mount guide dashboard routes |

### Frontend (Client)
| File | Action |
|------|--------|
| `client/src/pages/auth/GuideLoginPage.jsx` | Create |
| `client/src/pages/auth/GuideRegisterPage.jsx` | Create |
| `client/src/pages/guide/GuideDashboardPage.jsx` | Create |
| `client/src/pages/guide/GuideSchedulePage.jsx` | Create |
| `client/src/pages/guides/GuideDetailsPage.jsx` | Modify — button text + deposit info |
| `client/src/pages/guides/GuideBookingPage.jsx` | Modify — deposit flow UI |
| `client/src/pages/guides/TravelerGuidesPage.jsx` | Modify — statuses, remaining payment, cancellation |
| `client/src/pages/admin/AdminGuidesPage.jsx` | Modify — booking management tab |
| `client/src/components/Navbar.jsx` | Modify — guide portal link |
| `client/src/App.jsx` | Modify — new routes |
| `client/src/context/AuthContext.jsx` | Modify — handle guide role |
