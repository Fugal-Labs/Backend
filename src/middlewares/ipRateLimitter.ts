import { redis } from '@/lib/redis';
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/utils/api-response';

const WINDOW = 60;
const MAX_REQUESTS = 15;

export async function ipRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const key = `rl:ip:${ip}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, WINDOW);
  }

  if (count > MAX_REQUESTS) {
    return res
      .status(429)
      .json(new ApiResponse(429, {}, 'Too many requests. Please try again later.'));
  }

  next();
}
