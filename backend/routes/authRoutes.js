const express = require('express');
const { registerUser, registerRider, login, getProfile, updateRiderStatus } = require('../controllers/authController');
const { protect, rider } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register/user', registerUser);
router.post('/register/rider', registerRider);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/rider/status', protect, rider, updateRiderStatus);

module.exports = router;
