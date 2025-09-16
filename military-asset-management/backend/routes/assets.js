const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const { verifyToken, checkRole } = require('../middleware/auth');

// @route   GET api/assets
// @desc    Get all assets for the user's base
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    // For admin, show all assets. For others, show only their base's assets
    const filter = req.user.role === 'admin' ? {} : { base: req.user.base };
    const assets = await Asset.find(filter);
    res.json(assets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/assets/:id
// @desc    Get asset by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid asset ID' });
    }

    const asset = await Asset.findById(req.params.id);
    
    // Check if asset exists
    if (!asset) {
      return res.status(404).json({ msg: 'Asset not found' });
    }
    
    // Check if user has access to this asset
    if (req.user.role !== 'admin' && asset.base !== req.user.base) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    res.json(asset);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/assets
// @desc    Add a new asset
// @access  Private (Admin/Commander)
router.post(
  '/',
  [
    verifyToken,
    checkRole(['admin', 'commander']),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('type', 'Type is required').isIn(['vehicle', 'weapon', 'ammunition', 'equipment']),
      check('quantity', 'Quantity is required and must be a positive number').isInt({ min: 1 }),
      check('base', 'Base is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Create new asset
      const newAsset = new Asset({
        name: req.body.name,
        type: req.body.type,
        quantity: req.body.quantity,
        base: req.body.base,
        serialNumber: req.body.serialNumber,
        status: req.body.status || 'available',
        notes: req.body.notes
      });

      const asset = await newAsset.save();
      res.status(201).json(asset);
    } catch (err) {
      console.error(err.message);
      if (err.code === 11000) {
        return res.status(400).json({ msg: 'Serial number already exists' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/assets/:id
// @desc    Update an asset
// @access  Private (Admin/Commander)
router.put(
  '/:id',
  [
    verifyToken,
    checkRole(['admin', 'commander']),
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('type', 'Invalid type').optional().isIn(['vehicle', 'weapon', 'ammunition', 'equipment']),
      check('quantity', 'Quantity must be a positive number').optional().isInt({ min: 0 }),
      check('status', 'Invalid status').optional().isIn(['available', 'assigned', 'maintenance', 'decommissioned'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid asset ID' });
      }

      let asset = await Asset.findById(req.params.id);
      if (!asset) {
        return res.status(404).json({ msg: 'Asset not found' });
      }

      // Check if user has access to this asset
      if (req.user.role !== 'admin' && asset.base !== req.user.base) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      // Update fields
      const { name, type, quantity, status, notes } = req.body;
      if (name) asset.name = name;
      if (type) asset.type = type;
      if (quantity !== undefined) asset.quantity = quantity;
      if (status) asset.status = status;
      if (notes !== undefined) asset.notes = notes;

      asset = await asset.save();
      res.json(asset);
    } catch (err) {
      console.error(err.message);
      if (err.code === 11000) {
        return res.status(400).json({ msg: 'Serial number already exists' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/assets/:id
// @desc    Delete an asset
// @access  Private (Admin)
router.delete('/:id', [verifyToken, checkRole(['admin'])], async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid asset ID' });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ msg: 'Asset not found' });
    }

    await asset.remove();
    res.json({ msg: 'Asset removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
