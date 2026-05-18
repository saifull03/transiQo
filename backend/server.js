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
        "name phone rating vehicle profilePicture",
      );
      if (rider) {
        resolvedRiderInfo = {
          name: rider.name,
          phone: rider.phone || "N/A",
          rating: rider.rating ?? 5.0,
          vehicle: rider.vehicle,
          profilePicture: rider.profilePicture || 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%233b82f6%22%2F%3E%3Cpath%20d%3D%22M50%2055c-11%200-30%206-30%2018v7h60v-7c0-12-19-18-30-18zm0-10c8.28%200%2015-6.72%2015-15S58.28%2015%2050%2015%2035%2021.72%2035%2030s6.72%2015%2015%2015z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E',
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

server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? `Pipe ${PORT}` : `Port ${PORT}`;

  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges.`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(
        `${bind} is already in use. Stop the process using it or set a different PORT in .env.`,
      );
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.listen(PORT, () => console.log(`RideX Server running on port ${PORT}`));
