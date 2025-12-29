import { logger } from './logger';
import { getRequestId } from '@/middlewares/request.middleware';

export const logError = (err: any, req?: any) => {
  logger.error({
    type: 'error',
    requestId: getRequestId(),
    message: err.message,
    route: req?.originalUrl,
    method: req?.method,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
