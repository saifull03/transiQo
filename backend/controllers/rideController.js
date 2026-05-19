const Ride = require("../models/Ride");
const Rider = require("../models/Rider");

// @desc    Request a new ride
// @route   POST /api/rides/request
// @access  Private (User only)
const requestRide = async (req, res) => {
  const { pickupLocation, dropoffLocation, distance, duration, fare } =
    req.body;

  if (!pickupLocation || !dropoffLocation || !distance || !fare) {
    return res.status(400).json({ message: "Please provide all ride details" });
  }

  try {
    const baseFare = 200;
    const distanceCharge = distance * 21;
    const timeCharge = (duration || 0) * 3;
    const calculatedTotal = baseFare + distanceCharge + timeCharge;
    const surgeCharge = fare > calculatedTotal ? fare - calculatedTotal : 0;

    const ride = await Ride.create({
      user: req.user._id,
      pickupLocation,
      dropoffLocation,
      distance,
      duration,
      fare,
      fareBreakdown: {
        baseFare,
        distanceCharge,
        timeCharge,
        surgeCharge,
      },
      status: "requested",
    });

    // Here we will emit socket event to broadcast the ride to nearby riders later

    res.status(201).json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get user/rider ride history
// @route   GET /api/rides/history
// @access  Private
const getRideHistory = async (req, res) => {
  try {
    let rides;
    if (req.user.role === "rider") {
      rides = await Ride.find({ rider: req.user._id })
        .populate("user", "name phone")
        .sort({ createdAt: -1 });
    } else {
      rides = await Ride.find({ user: req.user._id })
        .populate("rider", "name vehicle")
        .sort({ createdAt: -1 });
    }
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update ride status (accept, start, complete)
// @route   PUT /api/rides/:id/status
// @access  Private (Rider only for most)
const updateRideStatus = async (req, res) => {
  const { status } = req.body;
  const ride = await Ride.findById(req.params.id);

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  try {
    // If a rider is accepting the ride, bind the rider ID to the ride
    if (status === "accepted") {
      if (ride.status !== "requested") {
        return res.status(400).json({ message: "Ride is no longer available" });
      }
      ride.rider = req.user._id;
    }

    if (status === "cancelled") {
      if (ride.status !== "requested" && ride.status !== "accepted") {
        return res.status(400).json({ message: "Ride cannot be cancelled at this stage" });
      }
      const io = req.app.get("socketio");
      if (io) {
        io.to("riders").emit("removeRideRequest", { rideId: String(ride._id) });
        if (ride.rider) {
          io.to(String(ride.rider)).emit("rideCancelled", {
            rideId: String(ride._id),
            message: "The passenger has cancelled this ride request.",
          });
        }
      }
    }

    if (status === "started") {
      ride.startedAt = Date.now();
    }

    ride.status = status;
    const updatedRide = await ride.save();

    res.json(updatedRide);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Confirm payment received
// @route   PUT /api/rides/:id/payment
// @access  Private (Rider only)
const confirmPayment = async (req, res) => {
  const ride = await Ride.findById(req.params.id);

  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  try {
    const { transactionId, fareBreakdown } = req.body || {};
    ride.paymentStatus = "completed";
    if (transactionId) ride.transactionId = transactionId;
    if (fareBreakdown) ride.fareBreakdown = fareBreakdown;
    if (!ride.receiptGeneratedAt) ride.receiptGeneratedAt = Date.now();

    const updatedRide = await ride.save();

    // Add fare to rider earnings
    if (ride.rider) {
      await Rider.findByIdAndUpdate(ride.rider, {
        $inc: { earnings: ride.fare },
      });
    }

    res.json(updatedRide);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get receipt data for a ride
// @route   GET /api/rides/:id/receipt
// @access  Private (user/rider/admin role-based)
const getReceipt = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("user", "name email phone profilePicture")
      .populate("rider", "name email phone vehicle profilePicture rating");

    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Authorization: users can access their rides, riders can access assigned rides, admins can access all
    const requester = req.user;
    if (
      requester.role === "user" &&
      String(ride.user._id || ride.user) !== String(requester._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (
      requester.role === "rider" &&
      ride.rider &&
      String(ride.rider._id || ride.rider) !== String(requester._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Build receipt payload
    let fareBreakdown = ride.fareBreakdown;
    if (!fareBreakdown || !fareBreakdown.baseFare) {
      const baseFare = 200;
      const distanceCharge = (ride.distance || 0) * 21;
      const timeCharge = (ride.duration || 0) * 3;
      const calculatedTotal = baseFare + distanceCharge + timeCharge;
      const surgeCharge = ride.fare > calculatedTotal ? ride.fare - calculatedTotal : 0;
      fareBreakdown = {
        baseFare,
        distanceCharge,
        timeCharge,
        surgeCharge,
      };
    }

    const receipt = {
      rideId: ride._id,
      transactionId: ride.transactionId || null,
      receiptGeneratedAt: ride.receiptGeneratedAt || null,
      createdAt: ride.createdAt,
      startedAt: ride.startedAt || null,
      updatedAt: ride.updatedAt || null,
      pickup: ride.pickupLocation,
      dropoff: ride.dropoffLocation,
      distance: ride.distance,
      duration: ride.duration,
      rider: ride.rider || null,
      user: ride.user || null,
      paymentMethod: ride.paymentMethod || "cash",
      paymentStatus: ride.paymentStatus || "pending",
      fare: ride.fare,
      fareBreakdown,
      status: ride.status,
    };

    res.json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  requestRide,
  getRideHistory,
  updateRideStatus,
  confirmPayment,
  getReceipt,
};
