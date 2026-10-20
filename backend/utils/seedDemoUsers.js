const bcrypt = require('bcryptjs');
const User = require('../models/User');

const demoUsers = [
  { name: 'Demo User 1', email: 'user1@demo.com', password: 'password123' },
  { name: 'Demo User 2', email: 'user2@demo.com', password: 'password123' },
];

const seedDemoUsers = async () => {
  for (const demoUser of demoUsers) {
    const existingUser = await User.findOne({ email: demoUser.email });
    if (existingUser) {
      continue;
    }

    const password = await bcrypt.hash(demoUser.password, 10);
    await User.create({ ...demoUser, password });
  }
};

module.exports = seedDemoUsers;
