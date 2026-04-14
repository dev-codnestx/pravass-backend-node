import 'tsconfig-paths/register.js'; // 👈 this must be first

import { Server } from 'http';

import app from '@/app.js';
import config from '@/shared/config/config.js';
import connectToDatabase from '@/shared/config/dbConfig.js';
import logger from '@/shared/config/logger.js';

let server: Server;

connectToDatabase().then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server)
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  else process.exit(1);
};

const unexpectedErrorHandler = (err: Error) => {
  logger.error(err.message);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) server.close();
});
