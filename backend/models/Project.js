const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId, // This stores a user's unique ID
      ref: 'User', // This tells Mongoose the ID refers to a document in the 'User' collection
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId, // An array of user IDs
        ref: 'User',
      },
    ],
    memberRoles: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
      },
    ],
    inviteLink: {
      tokenHash: String,
      role: { type: String, enum: ['editor', 'viewer'] },
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);