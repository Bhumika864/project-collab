require('dotenv').config({ path: './.env' });
process.env.JWT_SECRET ||= 'test-only-jwt-secret';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongo;

// Run before all tests
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

// Run before each test
beforeEach(async () => {
  // Clear all data before each test
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// Run after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});