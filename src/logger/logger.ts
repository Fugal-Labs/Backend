import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Ensure logs folder exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Get log level from environment variable with fallback
const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();

// Validate log level
const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
const level = validLevels.includes(logLevel) ? logLevel : 'info';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Configure different transports based on environment
const targets: pino.TransportTargetOptions[] = [];

// Console/Terminal output (pretty in dev, JSON in production)
if (!isProduction) {
  targets.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname,env',
      singleLine: false,
      errorLikeObjectKeys: ['err', 'error'],
    },
    level,
  });
} else {
  // In production, log to stdout as JSON for easier parsing by log aggregators
  targets.push({
    target: 'pino/file',
    options: {
      destination: 1, // stdout
    },
    level,
  });
}

// File logging - separate files for different log levels
targets.push(
  {
    // All logs
    target: 'pino/file',
    options: {
      destination: path.join(logDir, 'app.log'),
      mkdir: true,
    },
    level,
  },
  {
    // Error logs only
    target: 'pino/file',
    options: {
      destination: path.join(logDir, 'error.log'),
      mkdir: true,
    },
    level: 'error',
  }
);

export const logger = pino({
  level,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'accessToken',
      'refreshToken',
    ],
    censor: '***REDACTED***',
  },
  transport: {
    targets,
  },
});

// Log the current configuration on startup
logger.info(
  {
    logLevel: level,
    environment: process.env.NODE_ENV || 'development',
    logDirectory: logDir,
  },
  'Logger initialized'
);
