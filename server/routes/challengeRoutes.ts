import express, { Request, Response } from 'express';
import Challenge from '../models/Challenge.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

const router = express.Router();

// Get today's challenge
router.get('/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const challenge = await Challenge.findOne({
      date: { $gte: today, $lt: tomorrow },
      isActive: true,
    }).sort({ createdAt: -1 });

    if (!challenge) {
      return res.status(404).json({ error: 'No challenge available for today' });
    }

    res.json(challenge);
  } catch (error: any) {
    console.error('Error fetching today\'s challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all challenges
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, difficulty, platform } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (difficulty) filter.difficulty = difficulty;
    if (platform) filter.platform = platform;

    const challenges = await Challenge.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Challenge.countDocuments(filter);

    res.json({
      challenges,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get challenge by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error: any) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create challenge (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, difficulty, problemUrl, platform, problemId, tags, date } = req.body;

    if (!title || !description || !difficulty || !problemUrl || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const challengeDate = date ? new Date(date) : new Date();
    challengeDate.setHours(0, 0, 0, 0);

    const challenge = new Challenge({
      title,
      description,
      difficulty,
      problemUrl,
      platform,
      problemId,
      tags: tags || [],
      date: challengeDate,
      isActive: true,
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error: any) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user has solved a challenge
router.get('/:id/check-solution', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.query;
    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    const user = await User.findOne({ firebaseUid: firebaseUid as string });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const submission = await Submission.findOne({
      userId: user._id,
      challengeId: req.params.id,
    });

    res.json({ solved: !!submission, submission: submission || null });
  } catch (error: any) {
    console.error('Error checking solution:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

