import { logger } from './logger.js';
import { getRequestId } from '../middlewares/request.middleware.js';

export const logError = (err: any, req?: any) => {
  logger.error({
    type: 'error',
    requestId: getRequestId(),
    message: err.message,
    route: req?.originalUrl,
    method: req?.method,
    stack: err.stack,
  });
};
