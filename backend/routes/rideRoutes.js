const express = require("express");
const {
  requestRide,
  getRideHistory,
  updateRideStatus,
  confirmPayment,
  getReceipt,
} = require("../controllers/rideController");
const { protect, rider } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/request", protect, requestRide);
router.get("/:id/receipt", protect, getReceipt);
router.get("/history", protect, getRideHistory);
router.put("/:id/status", protect, updateRideStatus); // Usually riders update status
router.put("/:id/payment", protect, confirmPayment); // Confirm payment received

module.exports = router;
