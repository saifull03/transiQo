const User = require("../models/User");
const Rider = require("../models/Rider");
const generateToken = require("../utils/generateToken");

const DEFAULT_AVATAR = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20fill%3D%22%233b82f6%22%2F%3E%3Cpath%20d%3D%22M50%2055c-11%200-30%206-30%2018v7h60v-7c0-12-19-18-30-18zm0-10c8.28%200%2015-6.72%2015-15S58.28%2015%2050%2015%2035%2021.72%2035%2030s6.72%2015%2015%2015z%22%20fill%3D%22%23ffffff%22%2F%3E%3C%2Fsvg%3E';

// @desc    Register a new user
// @route   POST /api/auth/register/user
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
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
      phone: user.phone,
      role: user.role,
      profilePicture: user.profilePicture || DEFAULT_AVATAR,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @desc    Register a new rider
// @route   POST /api/auth/register/rider
// @access  Public
const registerRider = async (req, res) => {
  const { name, email, password, phone, vehicle } = req.body;

  const riderExists = await Rider.findOne({ email });

  if (riderExists) {
    return res.status(400).json({ message: "Rider already exists" });
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
      phone: rider.phone,
      vehicle: rider.vehicle,
      role: "rider",
      profilePicture: rider.profilePicture || DEFAULT_AVATAR,
      token: generateToken(rider._id, "rider"),
    });
  } else {
    res.status(400).json({ message: "Invalid rider data" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password, type } = req.body; // type can be 'user' or 'rider'

  if (type === "rider") {
    const rider = await Rider.findOne({ email });

    if (rider && rider.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Please contact support." });
    }

    if (rider && (await rider.matchPassword(password))) {
      res.json({
        _id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        vehicle: rider.vehicle,
        role: "rider",
        profilePicture: rider.profilePicture || DEFAULT_AVATAR,
        isOnline: rider.isOnline,
        rating: rider.rating,
        earnings: rider.earnings,
        isBlocked: rider.isBlocked,
        token: generateToken(rider._id, "rider"),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } else {
    const user = await User.findOne({ email });

    if (user && user.isBlocked) {
      return res.status(403).json({ message: "Your account is blocked. Please contact support." });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture || DEFAULT_AVATAR,
        isBlocked: user.isBlocked,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  const user = req.user;

  if (user) {
    const userData = user.toObject ? user.toObject() : user;
    userData.profilePicture = userData.profilePicture || DEFAULT_AVATAR;
    res.json(userData);
  } else {
    res.status(404).json({ message: "User not found" });
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
      res.json({ message: "Status updated", isOnline: rider.isOnline });
    } else {
      res.status(404).json({ message: "Rider not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update profile picture (base64)
// @route   PUT /api/auth/profile/picture
// @access  Private
const updateProfilePicture = async (req, res) => {
  const { profilePicture } = req.body;

  if (!profilePicture) {
    return res.status(400).json({ message: "No image data provided" });
  }

  // Validate it's a base64 image (basic check)
  if (!profilePicture.startsWith("data:image/")) {
    return res
      .status(400)
      .json({ message: "Invalid image format. Must be base64 data URI." });
  }

  try {
    const Model = req.user.role === "rider" ? Rider : User;
    const updated = await Model.findByIdAndUpdate(
      req.user._id,
      { profilePicture },
      { new: true },
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      profilePicture: updated.profilePicture,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update profile info (name, phone)
// @route   PUT /api/auth/profile/update
// @access  Private
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;

  try {
    const Model = req.user.role === "rider" ? Rider : User;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const updated = await Model.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      profilePicture: updated.profilePicture || DEFAULT_AVATAR,
      ...(updated.role === "rider" && {
        vehicle: updated.vehicle,
        rating: updated.rating,
        earnings: updated.earnings,
      }),
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get public rider profile by ID
// @route   GET /api/auth/rider/:id
// @access  Private
const getRiderById = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id).select(
      "name phone rating vehicle profilePicture",
    );

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    const riderData = rider.toObject ? rider.toObject() : rider;
    riderData.profilePicture = riderData.profilePicture || DEFAULT_AVATAR;
    res.json(riderData);
  } catch (error) {
    console.error("Error fetching rider profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  registerUser,
  registerRider,
  login,
  getProfile,
  updateRiderStatus,
  updateProfilePicture,
  updateProfile,
  getRiderById,
};
