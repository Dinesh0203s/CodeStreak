import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectToMongoDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import collegeRoutes from './routes/collegeRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import scrapingRoutes from './routes/scrapingRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (don't block server startup if MongoDB fails)
connectToMongoDB().catch((error) => {
  console.error('⚠️  MongoDB connection failed. Server will start but database operations will fail.');
  console.error('Make sure MongoDB is running: mongod');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/scrape', scrapingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    database: dbStatus === 1 ? 'connected' : 'disconnected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

