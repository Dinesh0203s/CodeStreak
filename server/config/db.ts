import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codestreak';

export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB - Database: codestreak');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💡 Make sure MongoDB is running: mongod');
    throw error; // Don't exit, let server start anyway
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

