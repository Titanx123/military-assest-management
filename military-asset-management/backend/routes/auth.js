const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const { verifyToken, auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// @route   POST api/auth/register
// @desc    Register a user (Public) or create user (Admin only)
// @access  Public/Private
router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('name', 'Name is required').not().isEmpty(),
  check('base', 'Base is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, name, base, role = 'officer' } = req.body;
  const isAdminRequest = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');

  try {
    // Check if user exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // If this is an admin request, verify the token
    if (isAdminRequest) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const adminUser = await User.findById(decoded.user.id);
        if (!adminUser || adminUser.role !== 'admin') {
          return res.status(403).json({ msg: 'Not authorized to create users' });
        }
      } catch (err) {
        console.error('Token verification error:', err);
        return res.status(401).json({ msg: 'Invalid token' });
      }
    } else if (role !== 'officer') {
      // Only allow creating officers through public registration
      return res.status(403).json({ msg: 'Not authorized to create this role' });
    }

    // Create new user
    user = new User({
      username,
      password,
      name,
      base,
      role: isAdminRequest ? role : 'officer' // Only allow role specification for admin requests
    });

    await user.save();

    // If this is an admin request, don't log them in as the new user
    if (isAdminRequest) {
      // Return success without logging in
      user.password = undefined;
      return res.json({ 
        msg: 'User created successfully',
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          base: user.base
        }
      });
    }

    // For normal registration, log the user in
    const userPayload = {
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        base: user.base,
        username: user.username
      }
    };

    // Generate JWT token
    jwt.sign(
      userPayload,
      JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) {
          console.error('JWT Error:', err);
          return res.status(500).json({ message: 'Error generating token' });
        }
        
        // Return both token and user data
        res.json({ 
          token, 
          user: userPayload.user
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  check('username', 'Please include a valid username').exists(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  console.log(req.body)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    console.log('Login attempt for username:', username);
    
    // Check if user exists
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('User found:', {
      id: user._id,
      username: user.username,
      role: user.role,
      base: user.base,
      passwordHash: user.password ? '***' : 'MISSING'
    });
    
    // Direct bcrypt comparison
    console.log('Direct bcrypt comparison for user:', user.username);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Bcrypt compare result:', isMatch);
    
    if (!isMatch) {
      console.log('Password verification failed for user:', user.username);
      console.log('Provided password:', password);
      console.log('Stored hash:', user.password);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    // Create user payload for JWT
    const userPayload = {
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        base: user.base,
        username: user.username
      }
    };
    console.log(userPayload);
    // Generate JWT token
    jwt.sign(
      userPayload,
      JWT_SECRET,
      { expiresIn: '5d' },
      (err, token) => {
        if (err) {
          console.error('JWT Error:', err);
          return res.status(500).json({ message: 'Error generating token' });
        }
        
        // Return both token and user data
        res.json({ 
          token, 
          user: userPayload.user
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
// @route   GET api/auth/user
// @desc    Get current user data
// @access  Private
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userData = {
      id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      role: req.user.role,
      base: req.user.base,
      createdAt: req.user.createdAt
    };
    
    res.json(userData);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @route   GET api/auth/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/users', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view users' });
    }

    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/auth/users/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.delete('/users/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete users' 
      });
    }

    // Prevent deleting self
    if (req.user.id === req.params.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
