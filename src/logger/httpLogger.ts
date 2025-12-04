import pinoHttp from 'pino-http';
import { logger } from './logger';
import { getRequestId } from '../middlewares/request.middleware';

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

  customSuccessMessage(req, res) {
    return `SUCCESS ${req.method} ${req.url} → ${res.statusCode}`;
  },

  customErrorMessage(req, res, err) {
    return `ERROR ${req.method} ${req.url}: ${err.message}`;
  },
});
