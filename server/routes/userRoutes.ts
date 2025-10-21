import express, { Request, Response } from 'express';
import axios from 'axios';
import User from '../models/User.js';
import ActivityHeatmap from '../models/ActivityHeatmap.js';

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

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        fullName,
        college,
        department,
        passoutYear,
        leetcodeHandle,
        codechefHandle,
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

// Get all users (for admin)
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
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
        
        // Get submission dates
        let submissionDates: Array<{ date: string; count: number }> = [];
        try {
          const submissionsResponse = await axios.get(`${API_BASE_URL}/scrape/leetcode/${user.leetcodeHandle}/submissions?limit=1000`, {
            timeout: 20000,
          });
          if (submissionsResponse.data && submissionsResponse.data.success) {
            submissionDates = submissionsResponse.data.submissionDates || [];
            console.log(`Scraped ${submissionDates.length} days of LeetCode submission activity`);
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
        
        // Get submission dates (if available)
        let submissionDates: Array<{ date: string; count: number }> = [];
        try {
          const submissionsResponse = await axios.get(`${API_BASE_URL}/scrape/codechef/${user.codechefHandle}/submissions`, {
            timeout: 15000,
          });
          if (submissionsResponse.data && submissionsResponse.data.success) {
            submissionDates = submissionsResponse.data.submissionDates || [];
            console.log(`Scraped ${submissionDates.length} days of CodeChef submission activity`);
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

