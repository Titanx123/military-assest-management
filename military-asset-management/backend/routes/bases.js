const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Asset = require('../models/Asset');
const User = require('../models/User');

// @route   GET api/bases
// @desc    Get all bases (for admin) or user's base (for non-admin)
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    let bases = [];
    
    // If user is admin, get all unique bases from users
    if (req.user.role === 'admin') {
      const users = await User.find().select('base');
      const baseSet = new Set(users.map(user => user.base).filter(Boolean));
      bases = Array.from(baseSet).map(base => ({
        _id: base,
        name: base
      }));
    } else {
      // For non-admin, return only their base
      if (req.user.base) {
        bases = [{
          _id: req.user.base,
          name: req.user.base
        }];
      }
    }
    
    res.json(bases);
  } catch (err) {
    console.error('Error fetching bases:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
