import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/api-errors';
import { logger } from '../logger/logger'; // from logger/index.ts
import { getRequestId } from './request.middleware';

export const errorHandler = (err: any, req: Request, res: Response) => {
  let error = err;

  /**
   * STEP 1 — Normalize ANY error into ApiError
   * This ensures all errors have:
   *   - statusCode
   *   - message
   *   - errors[]
   *   - stack
   */
  if (!(error instanceof ApiError)) {
    const isMongooseError = error instanceof mongoose.Error;

    const statusCode = error.statusCode || (isMongooseError ? 400 : 500);

    const message = error.message || 'Something went wrong';

    error = new ApiError(statusCode, message, error?.errors || [], error.stack);
  }

  /**
   * STEP 2 — Extract requestId from AsyncLocalStorage
   * Ensures traceability across logs.
   */
  const requestId = getRequestId();

  logger.error({
    type: 'API_ERROR',
    requestId,
    statusCode: error.statusCode,
    message: error.message,
    method: req.method,
    route: req.originalUrl,

    params: req.params,
    query: req.query,
    body: Object.keys(req.body || {}).length ? req.body : undefined,

    stack: error.stack,
  });
  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    requestId,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.message } : {}),
  });
};
