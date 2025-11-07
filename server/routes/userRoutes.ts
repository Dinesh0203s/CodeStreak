import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User.js';
import ActivityHeatmap from '../models/ActivityHeatmap.js';
import ExternalSubmission from '../models/ExternalSubmission.js';
import Submission from '../models/Submission.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create or update user
router.post('/create-or-update', async (req: Request, res: Response) => {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;

    if (!firebaseUid || !email || !displayName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if this email should be superAdmin
    const superAdminEmails = ['dond2674@gmail.com'];
    const shouldBeSuperAdmin = superAdminEmails.includes(email.toLowerCase());

    // If user exists, preserve their role unless they're being set as superAdmin
    const existingUser = await User.findOne({ firebaseUid });
    let role = existingUser?.role || 'user';
    
    // Set superAdmin role if email matches
    if (shouldBeSuperAdmin) {
      role = 'superAdmin';
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        firebaseUid,
        email,
        displayName,
        photoURL,
        role, // Set or preserve role
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json(user);
  } catch (error: any) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (onboarding data)
router.put('/:firebaseUid', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    const { fullName, college, department, passoutYear, leetcodeHandle, codechefHandle } = req.body;

    // Get existing user to check current onboarding status
    const existingUser = await User.findOne({ firebaseUid });
    
    // Mark as onboarded if required fields are provided
    // Once onboarded, always keep it as true (don't reset)
    const isOnboarded = existingUser?.isOnboarded === true || !!(fullName && college);

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        fullName,
        college,
        department,
        passoutYear,
        leetcodeHandle,
        codechefHandle,
        isOnboarded, // Set onboarding status (preserve if already true)
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by Firebase UID
router.get('/:firebaseUid', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for admin) with filtering and pagination
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { college, role, department, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    if (college) {
      filter.college = { $regex: college as string, $options: 'i' };
    }
    if (role) {
      filter.role = role;
    }
    if (department) {
      filter.department = { $regex: department as string, $options: 'i' };
    }
    if (search) {
      filter.$or = [
        { displayName: { $regex: search as string, $options: 'i' } },
        { fullName: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only) - only superAdmin can assign admin/superAdmin roles
router.patch('/:firebaseUid/role', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    const { role, college } = req.body;

    if (!role || !['user', 'admin', 'superAdmin', 'deptAdmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be user, admin, superAdmin, or deptAdmin' });
    }

    // If assigning admin role, college is required
    if (role === 'admin' && !college) {
      return res.status(400).json({ error: 'College is required when assigning admin role' });
    }

    // If assigning deptAdmin role, both college and department are required
    if (role === 'deptAdmin') {
      const { department } = req.body;
      if (!college || !department) {
        return res.status(400).json({ error: 'College and department are required when assigning department admin role' });
      }
    }

    const updateData: any = { role };
    
    // If assigning admin role, set the college
    if (role === 'admin' && college) {
      updateData.college = college;
    }

    // If assigning deptAdmin role, set both college and department
    if (role === 'deptAdmin' && college && req.body.department) {
      updateData.college = college;
      updateData.department = req.body.department;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ban/Unban user (admin only)
router.patch('/:firebaseUid/ban', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    const { isBanned } = req.body;

    if (typeof isBanned !== 'boolean') {
      return res.status(400).json({ error: 'isBanned must be a boolean' });
    }

    // For now, we'll use a custom field. In production, you might want to add this to the schema
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { isBanned },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user ban status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin update user (admin only - can update any field)
router.put('/:firebaseUid/admin', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    const { fullName, college, department, passoutYear, leetcodeHandle, codechefHandle, role } = req.body;

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (college !== undefined) updateData.college = college;
    if (department !== undefined) updateData.department = department;
    if (passoutYear !== undefined) updateData.passoutYear = passoutYear;
    if (leetcodeHandle !== undefined) updateData.leetcodeHandle = leetcodeHandle;
    if (codechefHandle !== undefined) updateData.codechefHandle = codechefHandle;
    if (role !== undefined) {
      if (!['user', 'admin', 'superAdmin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updateData.role = role;
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh scraped stats for a user
router.post('/:firebaseUid/refresh-stats', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const PORT = process.env.PORT || 3000;
    const API_BASE_URL = `http://localhost:${PORT}/api`;
    const updateData: any = {};

    // Scrape LeetCode if handle exists
    if (user.leetcodeHandle) {
      try {
        // Get profile stats
        const leetcodeResponse = await axios.get(`${API_BASE_URL}/scrape/leetcode/${user.leetcodeHandle}`, {
          timeout: 15000,
        });
        
        // Get submission dates and detailed submissions
        let submissionDates: Array<{ date: string; count: number }> = [];
        let detailedSubmissions: any[] = [];
        try {
          const submissionsResponse = await axios.get(`${API_BASE_URL}/scrape/leetcode/${user.leetcodeHandle}/submissions?limit=20000`, {
            timeout: 30000,
          });
          if (submissionsResponse.data && submissionsResponse.data.success) {
            submissionDates = submissionsResponse.data.submissionDates || [];
            detailedSubmissions = submissionsResponse.data.detailedSubmissions || [];
            console.log(`Scraped ${submissionDates.length} unique days of LeetCode submission activity (${submissionsResponse.data.totalSubmissions} total submissions)`);
            
            // Store detailed submissions in database
            if (detailedSubmissions.length > 0) {
              const bulkOps = detailedSubmissions.map((submission: any) => ({
                updateOne: {
                  filter: {
                    firebaseUid,
                    platform: 'leetcode',
                    submissionId: submission.submissionId,
                  },
                  update: {
                    $set: {
                      userId: user._id,
                      firebaseUid,
                      platform: 'leetcode',
                      problemTitle: submission.problemTitle,
                      problemSlug: submission.problemSlug,
                      problemUrl: submission.problemUrl,
                      submissionId: submission.submissionId,
                      timestamp: submission.timestamp,
                      language: submission.language,
                      status: submission.status,
                    },
                  },
                  upsert: true,
                },
              }));
              
              await ExternalSubmission.bulkWrite(bulkOps);
              console.log(`Stored ${detailedSubmissions.length} LeetCode submissions in database`);
            }
          }
        } catch (subError: any) {
          console.error('Error scraping LeetCode submissions:', subError.message);
          // Continue even if submission dates fail
        }
        
        if (leetcodeResponse.data && leetcodeResponse.data.success !== false) {
          updateData.leetcodeStats = {
            ...leetcodeResponse.data,
            submissionDates,
            lastScrapedAt: new Date(),
          };
          
          // Update activity heatmap with LeetCode data
          if (submissionDates.length > 0) {
            const bulkOps = submissionDates.map((item) => {
              const date = new Date(item.date);
              date.setHours(0, 0, 0, 0);
              return {
                updateOne: {
                  filter: { firebaseUid, dateKey: item.date },
                  update: {
                    $set: { 
                      userId: user._id,
                      date,
                      'sources.leetcode': item.count,
                    },
                    $inc: { count: 0 }, // Will be recalculated
                  },
                  upsert: true,
                },
              };
            });
            
            await ActivityHeatmap.bulkWrite(bulkOps);
            
            // Recalculate totals
            await ActivityHeatmap.updateMany(
              { firebaseUid },
              [{
                $set: {
                  count: { $add: ['$sources.app', '$sources.leetcode', '$sources.codechef'] }
                }
              }]
            );
          }
        }
      } catch (error: any) {
        console.error('Error scraping LeetCode:', error.message);
        // Don't fail the whole request if one scraping fails
      }
    }

    // Scrape CodeChef if handle exists
    if (user.codechefHandle) {
      try {
        // Get profile stats
        const codechefResponse = await axios.get(`${API_BASE_URL}/scrape/codechef/${user.codechefHandle}`, {
          timeout: 15000,
        });
        
        // Get submission dates (if available) - scrape ALL available dates
        let submissionDates: Array<{ date: string; count: number }> = [];
        try {
          const submissionsResponse = await axios.get(`${API_BASE_URL}/scrape/codechef/${user.codechefHandle}/submissions`, {
            timeout: 15000,
          });
          if (submissionsResponse.data && submissionsResponse.data.success) {
            submissionDates = submissionsResponse.data.submissionDates || [];
            console.log(`Scraped ${submissionDates.length} unique days of CodeChef submission activity`);
          }
        } catch (subError: any) {
          console.error('Error scraping CodeChef submissions:', subError.message);
          // Continue even if submission dates fail
        }
        
        if (codechefResponse.data && codechefResponse.data.success !== false) {
          updateData.codechefStats = {
            ...codechefResponse.data,
            submissionDates,
            lastScrapedAt: new Date(),
          };
          
          // Update activity heatmap with CodeChef data
          if (submissionDates.length > 0) {
            const bulkOps = submissionDates.map((item) => {
              const date = new Date(item.date);
              date.setHours(0, 0, 0, 0);
              return {
                updateOne: {
                  filter: { firebaseUid, dateKey: item.date },
                  update: {
                    $set: { 
                      userId: user._id,
                      date,
                      'sources.codechef': item.count,
                    },
                    $inc: { count: 0 }, // Will be recalculated
                  },
                  upsert: true,
                },
              };
            });
            
            await ActivityHeatmap.bulkWrite(bulkOps);
            
            // Recalculate totals
            await ActivityHeatmap.updateMany(
              { firebaseUid },
              [{
                $set: {
                  count: { $add: ['$sources.app', '$sources.leetcode', '$sources.codechef'] }
                }
              }]
            );
          }
        }
      } catch (error: any) {
        console.error('Error scraping CodeChef:', error.message);
        // Don't fail the whole request if one scraping fails
      }
    }

    // Calculate longest streak from ActivityHeatmap
    const calculateLongestStreak = async (firebaseUid: string): Promise<number> => {
      const activities = await ActivityHeatmap.find({ firebaseUid })
        .select('date dateKey')
        .sort({ date: 1 });
      
      if (activities.length === 0) return 0;
      
      let longestStreak = 0;
      let currentStreak = 0;
      let lastDate: Date | null = null;
      
      for (const activity of activities) {
        const currentDate = new Date(activity.date);
        currentDate.setHours(0, 0, 0, 0);
        
        if (!lastDate) {
          currentStreak = 1;
          lastDate = currentDate;
        } else {
          const daysDiff = Math.floor(
            (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysDiff === 1) {
            // Consecutive day
            currentStreak++;
          } else if (daysDiff > 1) {
            // Streak broken, start over
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
          }
          // If daysDiff === 0, same day, don't increment streak
          
          lastDate = currentDate;
        }
      }
      
      // Check final streak
      longestStreak = Math.max(longestStreak, currentStreak);
      
      return longestStreak;
    };

    // Calculate total problems solved from all sources
    const calculateTotalProblemsSolved = async (firebaseUid: string, user: any): Promise<number> => {
      let total = 0;

      // 1. Count app submissions (from Submission collection)
      const appSubmissionsCount = await Submission.countDocuments({ firebaseUid });
      total += appSubmissionsCount;

      // 2. Add LeetCode solved problems (from leetcodeStats)
      if (user.leetcodeStats?.solvedProblems) {
        total += user.leetcodeStats.solvedProblems;
      }

      // 3. Add CodeChef solved problems (from codechefStats)
      if (user.codechefStats?.problemsSolved) {
        total += user.codechefStats.problemsSolved;
      }

      return total;
    };

    // Recalculate longest streak
    const longestStreak = await calculateLongestStreak(firebaseUid);
    updateData.longestStreak = longestStreak;

    // Recalculate total problems solved (will be updated after user is updated with new stats)
    const updatedUserWithStats = await User.findOne({ firebaseUid });
    if (updatedUserWithStats) {
      const totalProblemsSolved = await calculateTotalProblemsSolved(firebaseUid, {
        ...updatedUserWithStats.toObject(),
        ...updateData,
      });
      updateData.totalProblemsSolved = totalProblemsSolved;
    }

    // Update user with scraped data
    if (Object.keys(updateData).length > 0) {
      const updatedUser = await User.findOneAndUpdate(
        { firebaseUid },
        { $set: updateData },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Stats refreshed successfully',
        user: updatedUser,
        longestStreak,
        totalProblemsSolved: updatedUser.totalProblemsSolved,
      });
    } else {
      return res.json({
        success: false,
        message: 'No handles configured for scraping',
        user: user,
      });
    }
  } catch (error: any) {
    console.error('Error refreshing stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

