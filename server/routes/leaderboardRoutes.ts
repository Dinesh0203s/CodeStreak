import express, { Request, Response } from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get overall leaderboard
router.get('/overall', async (req: Request, res: Response) => {
  try {
    const { limit = 50, sortBy = 'currentStreak' } = req.query;

    const sortField = sortBy === 'solved' ? 'totalProblemsSolved' : 'currentStreak';

    const users = await User.find({
      totalProblemsSolved: { $gt: 0 }, // Only users who have solved problems
    })
      .select('fullName displayName email college department currentStreak longestStreak totalProblemsSolved photoURL')
      .sort({ [sortField]: -1 })
      .limit(Number(limit));

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.fullName || user.displayName,
      email: user.email,
      college: user.college || 'N/A',
      department: user.department || 'N/A',
      streak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      solved: user.totalProblemsSolved || 0,
      avatar: user.photoURL,
    }));

    res.json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching overall leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get college leaderboard
router.get('/college/:collegeName', async (req: Request, res: Response) => {
  try {
    const { collegeName } = req.params;
    const { limit = 50, sortBy = 'currentStreak' } = req.query;

    const sortField = sortBy === 'solved' ? 'totalProblemsSolved' : 'currentStreak';

    const users = await User.find({
      college: collegeName,
      totalProblemsSolved: { $gt: 0 },
    })
      .select('fullName displayName email college department currentStreak longestStreak totalProblemsSolved photoURL')
      .sort({ [sortField]: -1 })
      .limit(Number(limit));

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.fullName || user.displayName,
      email: user.email,
      college: user.college || 'N/A',
      department: user.department || 'N/A',
      streak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      solved: user.totalProblemsSolved || 0,
      avatar: user.photoURL,
    }));

    res.json(leaderboard);
  } catch (error: any) {
    console.error('Error fetching college leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/user/:firebaseUid', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate monthly solved count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Return user data including scraped stats
    const stats = {
      name: user.fullName || user.displayName,
      email: user.email,
      college: user.college || 'N/A',
      department: user.department || 'N/A',
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      totalSolved: user.totalProblemsSolved || 0,
      monthlyGoal: user.monthlyGoal || 20,
      lastSolvedDate: user.lastSolvedDate,
      photoURL: user.photoURL,
      leetcodeStats: user.leetcodeStats,
      codechefStats: user.codechefStats,
      leetcodeHandle: user.leetcodeHandle,
      codechefHandle: user.codechefHandle,
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

