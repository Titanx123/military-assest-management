const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'commander', 'officer'],
    default: 'officer'
  },
  base: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    console.log('Hashing password for user:', this.username);
    // Using a fixed salt for testing purposes
    const salt = await bcrypt.genSalt(10);
    console.log('Generated salt:', salt);
    
    const hash = await bcrypt.hash(this.password, salt);
    console.log('Generated hash:', hash);
    
    this.password = hash;
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing password for user:', this.username);
    console.log('Stored hash:', this.password);
    
    // Direct comparison using bcrypt
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    
    // If direct comparison fails, try with a known working hash
    if (!isMatch) {
      console.log('Direct comparison failed, trying alternative comparison...');
      // This is just for debugging - in production, you'd only do the direct comparison
      const testHash = await bcrypt.hash(candidatePassword, 10);
      console.log('Test hash:', testHash);
      console.log('Stored hash starts with:', this.password.substring(0, 10) + '...');
    }
    
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error in comparePassword:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
