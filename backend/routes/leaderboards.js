const express = require('express');
const User = require('../models/MockUser'); // Use mock user for development

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get global leaderboard
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, sortBy = 'streak' } = req.query;
    
    const sortField = sortBy === 'xp' ? 'xp' : 'streak';
    
    const users = await User.find({ isOnboarded: true })
      .select('displayName email streak totalProblems xp level college photoURL')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({ leaderboard: users });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get college leaderboard
router.get('/college', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, sortBy = 'streak' } = req.query;
    
    if (!req.user.college) {
      return res.status(400).json({ message: 'User college not set' });
    }

    const sortField = sortBy === 'xp' ? 'xp' : 'streak';
    
    const users = await User.find({ 
      college: req.user.college,
      isOnboarded: true 
    })
      .select('displayName email streak totalProblems xp level department photoURL')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({ 
      leaderboard: users,
      college: req.user.college
    });
  } catch (error) {
    console.error('Get college leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department leaderboard
router.get('/department', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, sortBy = 'streak' } = req.query;
    
    if (!req.user.department) {
      return res.status(400).json({ message: 'User department not set' });
    }

    const sortField = sortBy === 'xp' ? 'xp' : 'streak';
    
    const users = await User.find({ 
      department: req.user.department,
      isOnboarded: true 
    })
      .select('displayName email streak totalProblems xp level college photoURL')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));

    res.json({ 
      leaderboard: users,
      department: req.user.department
    });
  } catch (error) {
    console.error('Get department leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's rank
router.get('/rank', authenticateToken, async (req, res) => {
  try {
    const { type = 'global' } = req.query;
    
    let filter = { isOnboarded: true };
    
    if (type === 'college' && req.user.college) {
      filter.college = req.user.college;
    } else if (type === 'department' && req.user.department) {
      filter.department = req.user.department;
    }

    const users = await User.find(filter)
      .select('_id streak xp')
      .sort({ streak: -1, xp: -1 });

    const userRank = users.findIndex(user => 
      user._id.toString() === req.user._id.toString()
    );

    res.json({ 
      rank: userRank + 1,
      totalUsers: users.length,
      type
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
