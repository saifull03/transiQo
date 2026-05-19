const User = require("../models/User");
const Rider = require("../models/Rider");
const Ride = require("../models/Ride");
const Review = require("../models/Review");

// @desc    Get dashboard statistics for admin panel
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalRiders = await Rider.countDocuments();
    const totalRides = await Ride.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Aggregate ride status and fare counts with conditional status grouping
    const ridesByStatus = await Ride.aggregate([
      {
        $project: {
          status: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$status", "completed"] },
                  { $ne: ["$paymentStatus", "completed"] }
                ]
              },
              then: "started",
              else: "$status"
            }
          },
          fare: 1
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFare: { $sum: "$fare" },
        },
      },
    ]);

    const statusBreakdown = {
      requested: 0,
      accepted: 0,
      arrived: 0,
      started: 0,
      completed: 0,
      cancelled: 0,
    };

    let totalEarnings = 0;
    ridesByStatus.forEach((item) => {
      if (statusBreakdown[item._id] !== undefined) {
        statusBreakdown[item._id] = item.count;
      }
      if (item._id === "completed" || item._id === "started") {
        totalEarnings += item.totalFare;
      }
    });

    // Average rating of riders
    const ridersList = await Rider.find({}, "rating");
    const avgRating = ridersList.length
      ? (
          ridersList.reduce((sum, r) => sum + (r.rating || 5), 0) /
          ridersList.length
        ).toFixed(1)
      : "5.0";

    // 1. Revenue & Rides trend over the last 7 days (including today)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const revenueAndRidesLast7Days = await Ride.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["completed", "started"]] },
                "$fare",
                0,
              ],
            },
          },
          ridesCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const match = revenueAndRidesLast7Days.find((item) => item._id === dateStr);
      revenueTrend.push({
        date: dateStr,
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: match ? match.revenue : 0,
        rides: match ? match.ridesCount : 0,
      });
    }

    // 2. Top Performing Drivers (Riders) by completed ride earnings
    const topRidersRaw = await Ride.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$rider",
          ridesCount: { $sum: 1 },
          earnings: { $sum: "$fare" },
        },
      },
      { $sort: { earnings: -1 } },
      { $limit: 5 },
    ]);

    const topRiders = [];
    for (const item of topRidersRaw) {
      if (item._id) {
        const riderInfo = await Rider.findById(item._id).select(
          "name email phone rating profilePicture vehicle"
        );
        if (riderInfo) {
          topRiders.push({
            _id: item._id,
            name: riderInfo.name,
            email: riderInfo.email,
            phone: riderInfo.phone,
            rating: riderInfo.rating || 5.0,
            profilePicture: riderInfo.profilePicture,
            vehicle: riderInfo.vehicle,
            earnings: item.earnings,
            ridesCount: item.ridesCount,
          });
        }
      }
    }

    // 3. Payment Method breakdown
    const paymentBreakdownRaw = await Ride.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$fare" },
        },
      },
    ]);

    const paymentBreakdown = {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
    };
    paymentBreakdownRaw.forEach((item) => {
      const method = item._id === "card" ? "card" : "cash";
      paymentBreakdown[method] = {
        count: item.count,
        amount: item.totalAmount,
      };
    });

    res.json({
      totalUsers,
      totalRiders,
      totalRides,
      totalReviews,
      totalEarnings,
      statusBreakdown,
      avgRating: parseFloat(avgRating),
      revenueTrend,
      topRiders,
      paymentBreakdown,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all passengers and admins
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Do not allow deleting self
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all riders (drivers)
// @route   GET /api/admin/riders
// @access  Private (Admin only)
const getRiders = async (req, res) => {
  try {
    const riders = await Rider.find({}).select("-password").sort({ createdAt: -1 });
    res.json(riders);
  } catch (error) {
    console.error("Error fetching riders:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a rider (driver)
// @route   DELETE /api/admin/riders/:id
// @access  Private (Admin only)
const deleteRider = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    await Rider.findByIdAndDelete(req.params.id);
    res.json({ message: "Rider deleted successfully" });
  } catch (error) {
    console.error("Error deleting rider:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all rides
// @route   GET /api/admin/rides
// @access  Private (Admin only)
const getRides = async (req, res) => {
  try {
    const rides = await Ride.find({})
      .populate("user", "name email phone")
      .populate("rider", "name vehicle phone")
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a ride
// @route   DELETE /api/admin/rides/:id
// @access  Private (Admin only)
const deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    await Ride.findByIdAndDelete(req.params.id);
    res.json({ message: "Ride deleted successfully" });
  } catch (error) {
    console.error("Error deleting ride:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private (Admin only)
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("user", "name email phone role profilePicture isBlocked")
      .populate("rider", "name email phone vehicle profilePicture isBlocked rating earnings")
      .populate("ride", "pickupLocation dropoffLocation status fare")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a review
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin only)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update user profile and status
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, phone, role, isBlocked } = req.body;

    // Do not allow demoting or blocking self
    if (String(user._id) === String(req.user._id)) {
      if (isBlocked === true || role === "user") {
        return res.status(400).json({ message: "You cannot block or demote your own admin account" });
      }
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (isBlocked !== undefined) user.isBlocked = isBlocked;

    await user.save();
    
    const updated = await User.findById(user._id).select("-password");
    res.json(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update rider profile and status
// @route   PUT /api/admin/riders/:id
// @access  Private (Admin only)
const updateRider = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    const { name, email, phone, vehicle, isBlocked } = req.body;

    if (name !== undefined) rider.name = name;
    if (email !== undefined) rider.email = email;
    if (phone !== undefined) rider.phone = phone;
    if (vehicle !== undefined) rider.vehicle = vehicle;
    if (isBlocked !== undefined) rider.isBlocked = isBlocked;

    await rider.save();

    const updated = await Rider.findById(rider._id).select("-password");
    res.json(updated);
  } catch (error) {
    console.error("Error updating rider:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
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
};
