import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@/logger/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { _id: string; email: string; role: string };
    }
  }
}

export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      logger.error('ACCESS_TOKEN_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as {
      _id: string;
      email: string;
      role: string;
    };

    req.user = { _id: decoded._id, email: decoded.email, role: decoded.role };
    next();
  } catch (error) {
    logger.error(`Authentication error: ${(error as Error).message}`);
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// Admin middleware - checks if user has admin role
export const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    logger.error('Admin check failed: No user in request');
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    logger.warn(`Admin access denied for user: ${req.user.email}`);
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};
