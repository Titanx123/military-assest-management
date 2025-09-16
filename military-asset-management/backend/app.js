require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', verifyToken, assetRoutes);
app.use('/api/bases', verifyToken, require('./routes/bases'));

// Simple route for testing
app.get('/', (req, res) => {
  res.send('Military Asset Management API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
