const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    pickupLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
    },
    dropoffLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
    },
    distance: {
      type: Number, // in kilometers
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "arrived",
        "started",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },
    startedAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card"],
      default: "cash",
    },
    transactionId: {
      type: String,
    },
    receiptGeneratedAt: {
      type: Date,
    },
    fareBreakdown: {
      baseFare: { type: Number, default: 0 },
      distanceCharge: { type: Number, default: 0 },
      timeCharge: { type: Number, default: 0 },
      surgeCharge: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

const Ride = mongoose.model("Ride", rideSchema);
module.exports = Ride;
