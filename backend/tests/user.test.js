const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const seedDemoUsers = require('../utils/seedDemoUsers');
const corsOptions = require('../utils/corsOptions');

// We need to set up a minimal express app to test the routes
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Authentication API', () => {
  it('should allow the configured frontend and local Vite development origins', (done) => {
    corsOptions.origin('http://localhost:5174', (error, allowed) => {
      expect(error).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it('should reject unconfigured non-local frontend origins', (done) => {
    corsOptions.origin('https://untrusted.example', (error) => {
      expect(error).toBeInstanceOf(Error);
      done();
    });
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.name).toBe('Test User');
  });

  it('should normalize email addresses when registering and logging in', async () => {
    const registration = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: '  TEST@EXAMPLE.COM ',
        password: 'password123',
      });

    expect(registration.statusCode).toBe(201);
    expect(registration.body.email).toBe('test@example.com');

    const login = await request(app)
      .post('/api/users/login')
      .send({ email: 'TEST@example.com', password: 'password123' });

    expect(login.statusCode).toBe(200);
    expect(login.body).toHaveProperty('token');
  });

  it('should reject incomplete registration and login requests', async () => {
    const registration = await request(app)
      .post('/api/users/register')
      .send({ name: 'Test User', email: 'test@example.com' });
    const login = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com' });

    expect(registration.statusCode).toBe(400);
    expect(login.statusCode).toBe(400);
  });

  it('should make the documented demo accounts available', async () => {
    await seedDemoUsers();

    const firstDemoLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'user1@demo.com', password: 'password123' });
    const secondDemoLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'user2@demo.com', password: 'password123' });

    expect(firstDemoLogin.statusCode).toBe(200);
    expect(secondDemoLogin.statusCode).toBe(200);

    await expect(seedDemoUsers()).resolves.toBeUndefined();
  });

  it('should not register a user with an existing email', async () => {
    // First, register a user
    await request(app)
      .post('/api/users/register')
      .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

    // Then, try to register with the same email
    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'Another User', email: 'test@example.com', password: 'password456' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('User already exists');
  });

  it('should log in an existing user successfully', async () => {
    // First, register a user
     await request(app)
      .post('/api/users/register')
      .send({ name: 'Test User', email: 'login@example.com', password: 'password123' });

    // Then, log in with those credentials
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});