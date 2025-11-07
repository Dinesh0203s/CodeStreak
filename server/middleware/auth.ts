import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        firebaseUid: string;
        role: string;
      };
    }
  }
}

// Middleware to verify user role
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get firebaseUid from request (could be in body, params, query, or headers)
      // For admin operations, we expect the caller's firebaseUid to verify their permissions
      const firebaseUid = req.body.callerFirebaseUid || req.body.firebaseUid || req.query.callerFirebaseUid || req.headers['x-firebase-uid'] as string;
      
      if (!firebaseUid) {
        return res.status(401).json({ error: 'Authentication required. firebaseUid is missing. Please include callerFirebaseUid in request body or x-firebase-uid header.' });
      }

      // Find user in database
      const user = await User.findOne({ firebaseUid });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user's role is in allowed roles
      const userRole = user.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Access denied. Insufficient privileges.',
          required: allowedRoles,
          current: userRole
        });
      }

      // Attach user to request for use in route handlers
      req.user = {
        firebaseUid: user.firebaseUid,
        role: userRole,
      };

      next();
    } catch (error: any) {
      console.error('Error in requireRole middleware:', error);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  };
};

// Convenience middleware functions
export const requireAdmin = requireRole(['admin', 'superAdmin']);
export const requireSuperAdmin = requireRole(['superAdmin']);
export const requireDeptAdmin = requireRole(['deptAdmin', 'admin', 'superAdmin']);

