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

// Get daily challenge (mock data for now)
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    // Mock daily challenge - in production, this would come from a database
    const today = new Date().toDateString();
    const challenges = [
      {
        id: '1',
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'Easy',
        points: 10,
        category: 'Array',
        date: today,
        solvedBy: []
      },
      {
        id: '2',
        title: 'Valid Parentheses',
        description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
        difficulty: 'Easy',
        points: 10,
        category: 'Stack',
        date: today,
        solvedBy: []
      },
      {
        id: '3',
        title: 'Merge Two Sorted Lists',
        description: 'Merge two sorted linked lists and return it as a sorted list.',
        difficulty: 'Easy',
        points: 15,
        category: 'Linked List',
        date: today,
        solvedBy: []
      }
    ];

    // Return a random challenge for the day
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    res.json({ challenge: randomChallenge });
  } catch (error) {
    console.error('Get daily challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit challenge solution
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { challengeId, solution } = req.body;

    if (!challengeId || !solution) {
      return res.status(400).json({ message: 'Challenge ID and solution required' });
    }

    // Mock solution validation - in production, this would be more sophisticated
    const isValid = solution.length > 10; // Simple validation

    if (isValid) {
      // Award points and update user stats
      const pointsEarned = 10; // Base points for solving
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: { 
            xp: pointsEarned,
            totalProblems: 1
          },
          $set: { lastActiveDate: new Date() }
        },
        { new: true }
      );

      res.json({ 
        message: 'Solution submitted successfully!',
        pointsEarned,
        user: user.getProfile()
      });
    } else {
      res.status(400).json({ message: 'Invalid solution' });
    }
  } catch (error) {
    console.error('Submit challenge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get challenge history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // Mock challenge history - in production, this would come from a database
    const history = [
      {
        id: '1',
        title: 'Two Sum',
        difficulty: 'Easy',
        points: 10,
        solvedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'solved'
      },
      {
        id: '2',
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        points: 10,
        solvedAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'solved'
      }
    ];

    res.json({ history });
  } catch (error) {
    console.error('Get challenge history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
