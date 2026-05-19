const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Rider = require('../models/Rider');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user or rider
      if (decoded.role === 'rider') {
        req.user = await Rider.findById(decoded.id).select('-password');
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (req.user.isBlocked) {
        return res.status(403).json({ message: 'Account is blocked. Please contact support.' });
      }
      
      req.user.role = decoded.role; // Attach role to req.user

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const rider = (req, res, next) => {
  if (req.user && req.user.role === 'rider') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a rider' });
  }
};

module.exports = { protect, admin, rider };
