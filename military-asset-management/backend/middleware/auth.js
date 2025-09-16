const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.verifyToken = async (req, res, next) => {
  try {
    // Debug log headers
    // console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Get token from header - check both x-auth-token and Authorization header
    let token = req.header('x-auth-token');
    
    // If token not found in x-auth-token, check Authorization header
    if (!token && req.header('Authorization')) {
      const authHeader = req.header('Authorization');
      token = authHeader.replace('Bearer ', '').trim();
    }
    
    console.log('Extracted token:', token);
    
    // Check if no token
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Token is not valid', error: err.message });
    }
    
    // Check if token has user data
    if (!decoded.user || !decoded.user.id) {
      console.error('Token missing user data');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Get user from the token payload
    const user = await User.findById(decoded.user.id).select('-password');
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.error('User not found for token');
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    next();
  };
};

// Alias verifyToken as auth for backward compatibility
exports.auth = exports.verifyToken;
