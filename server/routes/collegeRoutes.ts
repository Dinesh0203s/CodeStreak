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

// Department management endpoints (for admins)
// Get departments for a college (by college name)
router.get('/:collegeName/departments', async (req: Request, res: Response) => {
  try {
    const { collegeName } = req.params;
    const college = await College.findOne({ name: collegeName });
    
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ departments: college.departments || [] });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add department to college (by college name - for admins)
router.post('/:collegeName/departments', async (req: Request, res: Response) => {
  try {
    const { collegeName } = req.params;
    const { department } = req.body;

    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const college = await College.findOne({ name: collegeName });
    
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Check if department already exists
    const deptName = department.trim();
    if (college.departments && college.departments.includes(deptName)) {
      return res.status(400).json({ error: 'Department already exists' });
    }

    // Add department
    if (!college.departments) {
      college.departments = [];
    }
    college.departments.push(deptName);
    await college.save();

    res.json({ message: 'Department added successfully', college });
  } catch (error: any) {
    console.error('Error adding department:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update department in college (by college name - for admins)
router.put('/:collegeName/departments/:oldName', async (req: Request, res: Response) => {
  try {
    const { collegeName, oldName } = req.params;
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({ error: 'New department name is required' });
    }

    const college = await College.findOne({ name: collegeName });
    
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    if (!college.departments || !college.departments.includes(oldName)) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Check if new name already exists (and is different from old name)
    const newDeptName = newName.trim();
    if (newDeptName !== oldName && college.departments.includes(newDeptName)) {
      return res.status(400).json({ error: 'Department with this name already exists' });
    }

    // Update department name
    const index = college.departments.indexOf(oldName);
    college.departments[index] = newDeptName;
    await college.save();

    res.json({ message: 'Department updated successfully', college });
  } catch (error: any) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete department from college (by college name - for admins)
router.delete('/:collegeName/departments/:departmentName', async (req: Request, res: Response) => {
  try {
    const { collegeName, departmentName } = req.params;

    const college = await College.findOne({ name: collegeName });
    
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    if (!college.departments || !college.departments.includes(departmentName)) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Remove department
    college.departments = college.departments.filter(dept => dept !== departmentName);
    await college.save();

    res.json({ message: 'Department deleted successfully', college });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

