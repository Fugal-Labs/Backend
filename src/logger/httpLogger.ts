import pinoHttp from 'pino-http';
import { logger } from './logger';
import { getRequestId } from '@/middlewares/request.middleware';

export const httpLogger = pinoHttp({
  logger,

  genReqId: () => getRequestId(),

  serializers: {
    req(req) {
      return {
        id: getRequestId(),
        method: req.method,
        url: req.url,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  customLogLevel(_req, res, _err) {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },

  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} → ${res.statusCode} (${err?.message})`;
  },
});
