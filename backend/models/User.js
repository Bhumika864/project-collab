const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures no two users can register with the same email
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    // This option automatically adds `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);