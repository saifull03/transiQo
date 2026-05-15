const User = require('../models/User');
const Rider = require('../models/Rider');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register/user
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Register a new rider
// @route   POST /api/auth/register/rider
// @access  Public
const registerRider = async (req, res) => {
  const { name, email, password, phone, vehicle } = req.body;

  const riderExists = await Rider.findOne({ email });

  if (riderExists) {
    return res.status(400).json({ message: 'Rider already exists' });
  }

  const rider = await Rider.create({
    name,
    email,
    password,
    phone,
    vehicle,
  });

  if (rider) {
    res.status(201).json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      role: 'rider',
      token: generateToken(rider._id, 'rider'),
    });
  } else {
    res.status(400).json({ message: 'Invalid rider data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password, type } = req.body; // type can be 'user' or 'rider'

  if (type === 'rider') {
    const rider = await Rider.findOne({ email });

    if (rider && (await rider.matchPassword(password))) {
      res.json({
        _id: rider._id,
        name: rider.name,
        email: rider.email,
        role: 'rider',
        token: generateToken(rider._id, 'rider'),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } else {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  const user = req.user;

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update rider online status
// @route   PUT /api/auth/rider/status
// @access  Private (Rider only)
const updateRiderStatus = async (req, res) => {
  const { isOnline } = req.body;

  try {
    const rider = await Rider.findById(req.user._id);

    if (rider) {
      rider.isOnline = isOnline;
      await rider.save();
      res.json({ message: 'Status updated', isOnline: rider.isOnline });
    } else {
      res.status(404).json({ message: 'Rider not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { registerUser, registerRider, login, getProfile, updateRiderStatus };
