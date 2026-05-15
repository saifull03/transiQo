const Ride = require('../models/Ride');
const Rider = require('../models/Rider');

// @desc    Request a new ride
// @route   POST /api/rides/request
// @access  Private (User only)
const requestRide = async (req, res) => {
  const { pickupLocation, dropoffLocation, distance, duration, fare } = req.body;

  if (!pickupLocation || !dropoffLocation || !distance || !fare) {
    return res.status(400).json({ message: 'Please provide all ride details' });
  }

  try {
    const ride = await Ride.create({
      user: req.user._id,
      pickupLocation,
      dropoffLocation,
      distance,
      duration,
      fare,
      status: 'requested',
    });

    // Here we will emit socket event to broadcast the ride to nearby riders later

    res.status(201).json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user/rider ride history
// @route   GET /api/rides/history
// @access  Private
const getRideHistory = async (req, res) => {
  try {
    let rides;
    if (req.user.role === 'rider') {
      rides = await Ride.find({ rider: req.user._id }).populate('user', 'name phone').sort({ createdAt: -1 });
    } else {
      rides = await Ride.find({ user: req.user._id }).populate('rider', 'name vehicle').sort({ createdAt: -1 });
    }
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update ride status (accept, start, complete)
// @route   PUT /api/rides/:id/status
// @access  Private (Rider only for most)
const updateRideStatus = async (req, res) => {
  const { status } = req.body;
  const ride = await Ride.findById(req.params.id);

  if (!ride) {
    return res.status(404).json({ message: 'Ride not found' });
  }

  try {
    // If a rider is accepting the ride, bind the rider ID to the ride
    if (status === 'accepted') {
      if (ride.status !== 'requested') {
        return res.status(400).json({ message: 'Ride is no longer available' });
      }
      ride.rider = req.user._id;
    }

    if (status === 'started') {
      ride.startedAt = Date.now();
    }

    ride.status = status;
    const updatedRide = await ride.save();

    res.json(updatedRide);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Confirm payment received
// @route   PUT /api/rides/:id/payment
// @access  Private (Rider only)
const confirmPayment = async (req, res) => {
  const ride = await Ride.findById(req.params.id);

  if (!ride) {
    return res.status(404).json({ message: 'Ride not found' });
  }

  try {
    ride.paymentStatus = 'completed';
    const updatedRide = await ride.save();
    res.json(updatedRide);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { requestRide, getRideHistory, updateRideStatus, confirmPayment };
