import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../logger/logger.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      _id: string;
      email: string;
    };

    req.user = { id: decoded._id, email: decoded.email };
    next();
  } catch (error) {
    logger.error(`Authentication error: ${(error as Error).message}`);
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};
