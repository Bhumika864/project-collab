const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Import the middleware

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route
// The `protect` middleware will run before the `getUserProfile` controller
router.get('/profile', protect, getUserProfile);

module.exports = router;