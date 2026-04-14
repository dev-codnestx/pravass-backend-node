import fs from 'fs';
import path from 'path';

import morgan, { StreamOptions } from 'morgan';
import winston from 'winston';

import config from '@/shared/config/config.js';

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleLogFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    if (stack) return `${timestamp} ${level}: ${stack}${metaString}`;
    return `${timestamp} ${level}: ${message}${metaString}`;
  }),
);

const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || (config.env === 'development' ? 'debug' : 'info'),
  format: fileLogFormat,
  transports: [
    new winston.transports.Console({ format: consoleLogFormat }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
  ],
});

const morganStream: StreamOptions = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

export const httpSuccessLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (_req, res) => res.statusCode >= 400,
});

export const httpErrorLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: (_req, res) => res.statusCode < 400,
});

export default logger;
