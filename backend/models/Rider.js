const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    vehicle: {
      make: String,
      model: String,
      year: String,
      licensePlate: String,
    },
    profilePicture: {
      type: String,
      default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
    },
    role: {
      type: String,
      default: 'rider',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    earnings: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
  },
  {
    timestamps: true,
  }
);

riderSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

riderSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Rider = mongoose.model('Rider', riderSchema);
module.exports = Rider;
