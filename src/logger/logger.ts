import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Ensure logs folder exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino({
  level: 'info',
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets: [
      {
        // Pretty terminal output
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
        level: 'info',
      },
      {
        // Write clean JSON logs to logs/app.log
        target: 'pino/file',
        options: {
          destination: path.join(logDir, 'app.log'),
          mkdir: true,
        },
        level: 'info',
      },
    ],
  },
});
