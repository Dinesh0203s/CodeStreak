import express, { Request, Response } from 'express';
import College from '../models/College.js';

const router = express.Router();

// Get all colleges
router.get('/', async (req: Request, res: Response) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    res.json(colleges);
  } catch (error: any) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get college by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json(college);
  } catch (error: any) {
    console.error('Error fetching college:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new college
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, location, departments } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'College name is required' });
    }

    // Check if college already exists
    const existingCollege = await College.findOne({ name: name.trim() });
    if (existingCollege) {
      return res.status(400).json({ error: 'College with this name already exists' });
    }

    const college = new College({
      name: name.trim(),
      location: location?.trim(),
      departments: departments || [],
      isBanned: false,
    });

    await college.save();
    res.status(201).json(college);
  } catch (error: any) {
    console.error('Error creating college:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update college
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, location, departments } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (location !== undefined) updateData.location = location?.trim();
    if (departments !== undefined) updateData.departments = departments;

    const college = await College.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json(college);
  } catch (error: any) {
    console.error('Error updating college:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ban/Unban college
router.patch('/:id/ban', async (req: Request, res: Response) => {
  try {
    const { isBanned } = req.body;

    const college = await College.findByIdAndUpdate(
      req.params.id,
      { isBanned: isBanned !== undefined ? isBanned : true },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json(college);
  } catch (error: any) {
    console.error('Error banning/unbanning college:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete college
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);

    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ message: 'College deleted successfully', college });
  } catch (error: any) {
    console.error('Error deleting college:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

