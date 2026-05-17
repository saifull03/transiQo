const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const Rider = require("./models/Rider");

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for RideX real-time requirements
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
const authRoutes = require("./routes/authRoutes");
const rideRoutes = require("./routes/rideRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/reviews", reviewRoutes);

// Basic route to check if server is running
app.get("/", (req, res) => {
  res.send("RideX Backend Server is Running");
});

// Real-time ride updates and broadcasting
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a specific room based on User/Rider ID
  socket.on("join", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // User requests a ride
  socket.on("rideRequest", (rideDetails) => {
    console.log("New ride request received, broadcasting to riders...");
    // Broadcast to a general 'riders' room (we can assume all online riders join this room)
    io.to("riders").emit("newRideRequest", rideDetails);
  });

  // Rider accepts a ride
  socket.on("rideAccepted", async (data) => {
    const { rideId, userId, riderId, riderInfo } = data;

    let resolvedRiderInfo = riderInfo || {};
    try {
      const rider = await Rider.findById(riderId).select(
        "name phone rating vehicle",
      );
      if (rider) {
        resolvedRiderInfo = {
          name: rider.name,
          phone: rider.phone || "N/A",
          rating: rider.rating ?? 5.0,
          vehicle: rider.vehicle,
        };
      }
    } catch (err) {
      console.error("Failed to load rider info for rideAccepted event", err);
    }

    // Notify the specific user who requested the ride
    io.to(userId).emit("rideAccepted", {
      rideId,
      riderId,
      riderInfo: resolvedRiderInfo,
      message: "A driver is on the way!",
    });

    // Notify all other riders to remove the request from their screens
    io.to("riders").emit("removeRideRequest", { rideId });
  });

  // Rider starts the ride
  socket.on("rideStarted", (data) => {
    const { rideId, userId, startedAt } = data;
    io.to(userId).emit("rideStarted", {
      rideId,
      startedAt,
      message: "Ride has started!",
    });
  });

  // Rider completes the ride
  socket.on("rideCompleted", (data) => {
    const { rideId, userId, fare } = data;
    io.to(userId).emit("rideCompleted", {
      rideId,
      fare,
      message: "Ride completed! Waiting for payment.",
    });
  });

  // Rider confirms payment
  socket.on("paymentConfirmed", (data) => {
    const { rideId, userId } = data;
    io.to(userId).emit("paymentConfirmed", {
      rideId,
      message: "Payment successful!",
    });
  });

  // Broadcast rider's live location to the specific trip room
  socket.on("updateLocation", (data) => {
    const { rideId, location } = data;
    io.to(rideId).emit("riderLocationUpdated", location);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`RideX Server running on port ${PORT}`));
