const Review = require("../models/Review");
const Ride = require("../models/Ride");
const Rider = require("../models/Rider");

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  const { rideId, rating, comment, reviewBy } = req.body;

  if (!rideId || !rating || !reviewBy) {
    return res
      .status(400)
      .json({ message: "Please provide all required review details" });
  }

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const reviewData = {
      ride: rideId,
      rating,
      comment,
      reviewBy,
    };

    if (reviewBy === "user") {
      reviewData.user = req.user._id;
      reviewData.rider = ride.rider;
    } else {
      reviewData.rider = req.user._id;
      reviewData.user = ride.user;
    }

    const review = await Review.create(reviewData);
    if (reviewBy === "user") {
      const riderRatings = await Review.find({
        rider: reviewData.rider,
        reviewBy: "user",
      });
      const averageRating = riderRatings.length
        ? riderRatings.reduce((acc, item) => acc + item.rating, 0) /
          riderRatings.length
        : 5;

      await Rider.findByIdAndUpdate(
        reviewData.rider,
        { rating: Number(averageRating.toFixed(1)) },
        { new: true },
      );
    }
    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get reviews for the current authenticated user or rider
// @route   GET /api/reviews/my
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const query =
      req.user.role === "rider"
        ? { rider: req.user._id, reviewBy: "user" }
        : { user: req.user._id, reviewBy: "user" };

    const reviews = await Review.find(query)
      .populate("ride", "pickupLocation dropoffLocation fare createdAt")
      .populate("user", "name email")
      .populate("rider", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createReview, getMyReviews };
