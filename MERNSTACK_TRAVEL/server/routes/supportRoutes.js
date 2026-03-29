const express = require('express');
const router = express.Router();
const { createSupportRequest, getMySupportRequests } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createSupportRequest);
router.get('/my', getMySupportRequests);

module.exports = router;
