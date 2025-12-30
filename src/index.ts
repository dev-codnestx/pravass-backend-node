import 'tsconfig-paths/register.js'; // 👈 this must be first

import { Server } from 'http';

import app from '@/app.js';
import connectToDatabase from './shared/config/dbConfig.js';
import config from '@/shared/config/config.js';

let server: Server;

connectToDatabase().then(() => {
  console.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    console.info(`Listening to port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server)
    server.close(() => {
      console.info('Server closed');
      process.exit(1);
    });
  else process.exit(1);
};

const unexpectedErrorHandler = (error: string) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.info('SIGTERM received');
  if (server) server.close();
});
