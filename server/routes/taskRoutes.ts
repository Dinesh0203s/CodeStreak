import express, { Request, Response } from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for the current user
router.get('/user/:firebaseUid', async (req: Request, res: Response) => {
  try {
    const { firebaseUid } = req.params;
    
    const tasks = await Task.find({ assignedTo: firebaseUid })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error: any) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks (admin only) - with optional filters
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { assignedTo, isCompleted, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    if (isCompleted !== undefined) {
      filter.isCompleted = isCompleted === 'true';
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new task (admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, links, link, assignedTo, callerFirebaseUid } = req.body;
    const assignedBy = req.user?.firebaseUid || callerFirebaseUid;

    // Support both old format (single link) and new format (multiple links)
    let taskLinks: string[] = [];
    if (links && Array.isArray(links)) {
      taskLinks = links.filter((l: string) => l && l.trim());
    } else if (link) {
      // Backward compatibility: if single link is provided, convert to array
      taskLinks = [link.trim()];
    }

    if (!title || taskLinks.length === 0 || !assignedTo) {
      return res.status(400).json({ error: 'Missing required fields: title, links (at least one), assignedTo' });
    }

    if (!assignedBy) {
      return res.status(400).json({ error: 'Missing required field: assignedBy (callerFirebaseUid)' });
    }

    // Verify that assignedTo user exists
    const user = await User.findOne({ firebaseUid: assignedTo });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const task = new Task({
      title,
      description,
      links: taskLinks,
      assignedTo,
      assignedBy,
      isCompleted: false,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task completion status
router.patch('/:taskId/complete', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { firebaseUid, isCompleted } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ error: 'firebaseUid is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify that the user owns this task
    if (task.assignedTo !== firebaseUid) {
      return res.status(403).json({ error: 'You can only update your own tasks' });
    }

    task.isCompleted = isCompleted === true || isCompleted === 'true';
    if (task.isCompleted) {
      task.completedAt = new Date();
    } else {
      task.completedAt = undefined;
    }

    await task.save();
    res.json(task);
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task (admin only)
router.put('/:taskId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, description, links, link, assignedTo } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    
    // Handle links update - support both old and new format
    if (links !== undefined) {
      if (Array.isArray(links)) {
        const filteredLinks = links.filter((l: string) => l && l.trim());
        if (filteredLinks.length === 0) {
          return res.status(400).json({ error: 'At least one link is required' });
        }
        task.links = filteredLinks;
      }
    } else if (link !== undefined) {
      // Backward compatibility: if single link is provided, convert to array
      task.links = [link.trim()];
    }
    
    if (assignedTo !== undefined) {
      // Verify that assignedTo user exists
      const user = await User.findOne({ firebaseUid: assignedTo });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      task.assignedTo = assignedTo;
    }

    await task.save();
    res.json(task);
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete task (admin only)
router.delete('/:taskId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    // callerFirebaseUid is already checked by requireAdmin middleware

    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

