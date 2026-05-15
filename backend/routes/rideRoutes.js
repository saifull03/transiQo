const express = require('express');
const { requestRide, getRideHistory, updateRideStatus } = require('../controllers/rideController');
const { protect, rider } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/request', protect, requestRide);
router.get('/history', protect, getRideHistory);
router.put('/:id/status', protect, updateRideStatus); // Usually riders update status

module.exports = router;
