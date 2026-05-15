const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for RideX real-time requirements
const io = new Server(server, { 
    cors: { origin: '*', methods: ['GET', 'POST'] } 
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);


// Basic route to check if server is running
app.get('/', (req, res) => {
    res.send('RideX Backend Server is Running');
});

// Real-time ride updates and broadcasting
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room based on User/Rider ID
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // User requests a ride
    socket.on('rideRequest', (rideDetails) => {
        console.log('New ride request received, broadcasting to riders...');
        // Broadcast to a general 'riders' room (we can assume all online riders join this room)
        io.to('riders').emit('newRideRequest', rideDetails);
    });

    // Rider accepts a ride
    socket.on('rideAccepted', (data) => {
        const { rideId, userId, riderId } = data;
        // Notify the specific user who requested the ride
        io.to(userId).emit('rideAccepted', { rideId, riderId, message: 'A driver is on the way!' });
    });

    // Broadcast rider's live location to the specific trip room
    socket.on('updateLocation', (data) => {
        const { rideId, location } = data;
        io.to(rideId).emit('riderLocationUpdated', location);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`RideX Server running on port ${PORT}`));
