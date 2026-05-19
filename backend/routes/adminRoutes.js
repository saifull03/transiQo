const express = require("express");
const {
  getAdminStats,
  getUsers,
  deleteUser,
  getRiders,
  deleteRider,
  getRides,
  deleteRide,
  getReviews,
  deleteReview,
  updateUser,
  updateRider,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Secure all admin routes with authentication and checking role is 'admin'
router.use(protect, admin);

router.get("/stats", getAdminStats);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/riders", getRiders);
router.put("/riders/:id", updateRider);
router.delete("/riders/:id", deleteRider);
router.get("/rides", getRides);
router.delete("/rides/:id", deleteRide);
router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
