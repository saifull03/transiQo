const express = require("express");
const {
  registerUser,
  registerRider,
  login,
  getProfile,
  updateRiderStatus,
  updateProfilePicture,
  updateProfile,
  getRiderById,
} = require("../controllers/authController");
const { protect, rider } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register/user", registerUser);
router.post("/register/rider", registerRider);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.get("/rider/:id", protect, getRiderById);
router.put("/rider/status", protect, rider, updateRiderStatus);
router.put("/profile/picture", protect, updateProfilePicture);
router.put("/profile/update", protect, updateProfile);

module.exports = router;
