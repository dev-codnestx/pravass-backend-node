import 'tsconfig-paths/register.js'; // 👈 this must be first

import { Server } from 'http';

import app from '@/app.js';
import config from '@/shared/config/config.js';
import connectToDatabase from '@/shared/config/dbConfig.js';

let server: Server;

connectToDatabase()
  .then(() => {
    console.info('Connected to MongoDB');
    server = app.listen(config.port, () => {
      console.info(`Listening to port ${config.port}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

const exitHandler = () => {
  if (server)
    server.close(() => {
      console.info('Server closed');
      process.exit(1);
    });
  else process.exit(1);
};

const unexpectedErrorHandler = (err: Error) => {
  console.warn(err.message);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.info('SIGTERM received');
  if (server) server.close();
});
