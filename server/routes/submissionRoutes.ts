import express, { Request, Response } from 'express';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import ActivityHeatmap from '../models/ActivityHeatmap.js';

const router = express.Router();

// Helper function to calculate and update streak
async function updateStreak(userId: string, solvedAt: Date) {
  const user = await User.findOne({ firebaseUid: userId });
  if (!user) return;

  const solvedDate = new Date(solvedAt);
  solvedDate.setHours(0, 0, 0, 0);

  const lastSolvedDate = user.lastSolvedDate
    ? new Date(user.lastSolvedDate)
    : null;
  if (lastSolvedDate) {
    lastSolvedDate.setHours(0, 0, 0, 0);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = user.currentStreak || 0;

  if (!lastSolvedDate) {
    // First time solving
    newStreak = 1;
  } else if (solvedDate.getTime() === today.getTime()) {
    // Solving today
    const daysDiff = Math.floor(
      (solvedDate.getTime() - lastSolvedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Already solved today, don't update streak
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      newStreak = user.currentStreak + 1;
    } else {
      // Streak broken, start over
      newStreak = 1;
    }
  }

  // Update longest streak if current is longer
  const longestStreak = Math.max(user.longestStreak || 0, newStreak);

  await User.findOneAndUpdate(
    { firebaseUid: userId },
    {
      currentStreak: newStreak,
      longestStreak,
      totalProblemsSolved: (user.totalProblemsSolved || 0) + 1,
      lastSolvedDate: solvedDate,
    }
  );
}

// Submit solution
router.post('/', async (req: Request, res: Response) => {
  try {
    const { firebaseUid, challengeId, submissionUrl, timeTaken } = req.body;

    if (!firebaseUid || !challengeId) {
      return res.status(400).json({ error: 'firebaseUid and challengeId are required' });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      userId: user._id,
      challengeId: challenge._id,
    });

    if (existingSubmission) {
      return res.status(409).json({ 
        error: 'Challenge already solved',
        submission: existingSubmission,
      });
    }

    // Create submission
    const submission = new Submission({
      userId: user._id,
      firebaseUid,
      challengeId: challenge._id,
      submissionUrl,
      solvedAt: new Date(),
      timeTaken,
    });

    await submission.save();

    // Update user streak and stats
    await updateStreak(firebaseUid, new Date());
    
    // Update activity heatmap
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().split('T')[0];
    
    await ActivityHeatmap.findOneAndUpdate(
      { firebaseUid, dateKey },
      {
        $set: { 
          userId: user._id,
          date: today,
        },
        $inc: { 
          count: 1,
          'sources.app': 1,
        },
      },
      { upsert: true, new: true }
    );

    res.status(201).json(submission);
  } catch (error: any) {
    console.error('Error submitting solution:', error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ error: 'Challenge already solved' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get submission history grouped by date for heat map (must be before /user/:firebaseUid)
router.get('/user/:firebaseUid/heatmap', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    
    // Get all activity data from the dedicated heatmap collection
    const activities = await ActivityHeatmap.find({ firebaseUid })
      .select('dateKey count sources')
      .sort({ date: 1 });
    
    // Convert to the expected format
    const heatmapData = activities.map((activity) => ({
      date: activity.dateKey,
      count: activity.count,
    }));

    console.log(`Heatmap data for user ${firebaseUid}: ${heatmapData.length} days with activity`);
    res.json(heatmapData);
  } catch (error: any) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user submissions
router.get('/user/:firebaseUid', async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const submissions = await Submission.find({ userId: user._id })
      .populate('challengeId', 'title difficulty platform problemUrl date')
      .sort({ solvedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Submission.countDocuments({ userId: user._id });

    res.json({
      submissions,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get submission by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'fullName displayName email college')
      .populate('challengeId', 'title difficulty platform problemUrl');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

