import express, { Request, Response } from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get overall leaderboard
router.get('/overall', async (req: Request, res: Response) => {
  try {
    const { limit = 50, sortBy = 'solved' } = req.query;

    // Fetch users with LeetCode and CodeChef stats
    const users = await User.find({})
      .select('fullName displayName email college department currentStreak longestStreak totalProblemsSolved photoURL leetcodeStats codechefStats')
      .limit(Number(limit) * 2); // Fetch more to account for filtering

    // Calculate total solved (LeetCode + CodeChef) for each user
    const usersWithTotalSolved = users.map((user) => {
      const leetcodeSolved = user.leetcodeStats?.solvedProblems || 0;
      const codechefSolved = user.codechefStats?.problemsSolved || 0;
      const totalSolved = leetcodeSolved + codechefSolved;
      
      return {
        user,
        totalSolved,
        leetcodeSolved,
        codechefSolved,
      };
    });

    // Filter out users with 0 total solved and sort
    const filteredUsers = usersWithTotalSolved.filter(u => u.totalSolved > 0);
    
    if (sortBy === 'solved') {
      // Sort by solved, then by streak as tiebreaker
      filteredUsers.sort((a, b) => {
        const solvedDiff = b.totalSolved - a.totalSolved;
        if (solvedDiff !== 0) return solvedDiff;
        return (b.user.currentStreak || 0) - (a.user.currentStreak || 0);
      });
    } else {
      // Sort by streak, then by solved as tiebreaker
      filteredUsers.sort((a, b) => {
        const streakDiff = (b.user.currentStreak || 0) - (a.user.currentStreak || 0);
        if (streakDiff !== 0) return streakDiff;
        return b.totalSolved - a.totalSolved;
      });
    }

    // Limit results
    const limitedUsers = filteredUsers.slice(0, Number(limit));

    const leaderboard = limitedUsers.map((item, index) => ({
      rank: index + 1,
      name: item.user.fullName || item.user.displayName,
      email: item.user.email,
      college: item.user.college || 'N/A',
      department: item.user.department || 'N/A',
      streak: item.user.currentStreak || 0,
      longestStreak: item.user.longestStreak || 0,
      solved: item.totalSolved,
      leetcodeSolved: item.leetcodeSolved,
      codechefSolved: item.codechefSolved,
      avatar: item.user.photoURL,
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
    const { limit = 50, sortBy = 'solved', groupByDepartment = 'true', department, passoutYear } = req.query;

    // Build filter query
    const filter: any = { college: collegeName };
    if (department && department !== 'all') {
      filter.department = department;
    }
    if (passoutYear && passoutYear !== 'all') {
      filter.passoutYear = passoutYear;
    }

    // Fetch users with LeetCode and CodeChef stats
    const users = await User.find(filter)
      .select('fullName displayName email college department passoutYear currentStreak longestStreak totalProblemsSolved photoURL leetcodeStats codechefStats')
      .limit(Number(limit) * 2); // Fetch more to account for filtering

    // Calculate total solved (LeetCode + CodeChef) for each user
    const usersWithTotalSolved = users.map((user) => {
      const leetcodeSolved = user.leetcodeStats?.solvedProblems || 0;
      const codechefSolved = user.codechefStats?.problemsSolved || 0;
      const totalSolved = leetcodeSolved + codechefSolved;
      
      return {
        user,
        totalSolved,
        leetcodeSolved,
        codechefSolved,
      };
    });

    // Filter out users with 0 total solved
    const filteredUsers = usersWithTotalSolved.filter(u => u.totalSolved > 0);

    // Group by department if requested
    if (groupByDepartment === 'true') {
      const groupedByDepartment: { [key: string]: typeof filteredUsers } = {};
      
      // Group users by department
      filteredUsers.forEach((item) => {
        const dept = item.user.department || 'Other';
        if (!groupedByDepartment[dept]) {
          groupedByDepartment[dept] = [];
        }
        groupedByDepartment[dept].push(item);
      });

      // Sort each department's users
      const sortFunction = (a: typeof filteredUsers[0], b: typeof filteredUsers[0]) => {
        if (sortBy === 'solved') {
          const solvedDiff = b.totalSolved - a.totalSolved;
          if (solvedDiff !== 0) return solvedDiff;
          return (b.user.currentStreak || 0) - (a.user.currentStreak || 0);
        } else {
          const streakDiff = (b.user.currentStreak || 0) - (a.user.currentStreak || 0);
          if (streakDiff !== 0) return streakDiff;
          return b.totalSolved - a.totalSolved;
        }
      };

      // Sort each department and assign ranks
      const result: { [key: string]: any[] } = {};
      Object.keys(groupedByDepartment).forEach((dept) => {
        const deptUsers = groupedByDepartment[dept];
        deptUsers.sort(sortFunction);
        
        result[dept] = deptUsers.map((item, index) => ({
          rank: index + 1,
          name: item.user.fullName || item.user.displayName,
          email: item.user.email,
          college: item.user.college || 'N/A',
          department: item.user.department || 'N/A',
          passoutYear: item.user.passoutYear || 'N/A',
          streak: item.user.currentStreak || 0,
          longestStreak: item.user.longestStreak || 0,
          solved: item.totalSolved,
          leetcodeSolved: item.leetcodeSolved,
          codechefSolved: item.codechefSolved,
          avatar: item.user.photoURL,
        }));
      });

      res.json(result);
    } else {
      // Original flat leaderboard (for backward compatibility)
      if (sortBy === 'solved') {
        filteredUsers.sort((a, b) => {
          const solvedDiff = b.totalSolved - a.totalSolved;
          if (solvedDiff !== 0) return solvedDiff;
          return (b.user.currentStreak || 0) - (a.user.currentStreak || 0);
        });
      } else {
        filteredUsers.sort((a, b) => {
          const streakDiff = (b.user.currentStreak || 0) - (a.user.currentStreak || 0);
          if (streakDiff !== 0) return streakDiff;
          return b.totalSolved - a.totalSolved;
        });
      }

      const limitedUsers = filteredUsers.slice(0, Number(limit));
      const leaderboard = limitedUsers.map((item, index) => ({
        rank: index + 1,
        name: item.user.fullName || item.user.displayName,
        email: item.user.email,
        college: item.user.college || 'N/A',
        department: item.user.department || 'N/A',
        passoutYear: item.user.passoutYear || 'N/A',
        streak: item.user.currentStreak || 0,
        longestStreak: item.user.longestStreak || 0,
        solved: item.totalSolved,
        leetcodeSolved: item.leetcodeSolved,
        codechefSolved: item.codechefSolved,
        avatar: item.user.photoURL,
      }));

      res.json(leaderboard);
    }
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

