const express = require('express');
const router = express.Router();
const { getMatrix, getDirections } = require('../controllers/routeController');

router.post('/matrix', getMatrix);
router.post('/directions', getDirections);

module.exports = router;
