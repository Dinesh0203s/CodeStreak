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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user.getProfile() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      displayName,
      college,
      department,
      codingHandles,
      reminderTime,
      monthlyTarget
    } = req.body;

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (college) updateData.college = college;
    if (department) updateData.department = department;
    if (codingHandles) updateData.codingHandles = codingHandles;
    if (reminderTime) updateData.reminderTime = reminderTime;
    if (monthlyTarget) updateData.monthlyTarget = monthlyTarget;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete onboarding
router.put('/onboard', authenticateToken, async (req, res) => {
  try {
    const {
      college,
      department,
      codingHandles,
      reminderTime,
      monthlyTarget
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        college,
        department,
        codingHandles: codingHandles || {},
        reminderTime: reminderTime || '09:00',
        monthlyTarget: monthlyTarget || 30,
        isOnboarded: true
      },
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'Onboarding completed successfully',
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update streak
router.put('/streak', authenticateToken, async (req, res) => {
  try {
    const { streak, totalProblems } = req.body;

    const updateData = {};
    if (streak !== undefined) updateData.streak = streak;
    if (totalProblems !== undefined) updateData.totalProblems = totalProblems;
    
    // Update longest streak if current streak is higher
    if (streak > req.user.longestStreak) {
      updateData.longestStreak = streak;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    );

    res.json({ 
      message: 'Streak updated successfully',
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add friend
router.post('/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    
    if (req.user._id.toString() === friendId) {
      return res.status(400).json({ message: 'Cannot add yourself as a friend' });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    // Check if already friends
    if (req.user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { friends: friendId } },
      { new: true }
    );

    res.json({ 
      message: 'Friend added successfully',
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friends
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'displayName email streak totalProblems xp level photoURL')
      .select('friends');

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
