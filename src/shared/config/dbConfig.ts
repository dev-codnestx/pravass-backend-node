import mongoose from 'mongoose';

import config from '@/shared/config/config.js';
import logger from '@/shared/config/logger.js';

interface MongooseConfig {
  protocol: string;
  username: string;
  password: string;
  host: string;
  name: string;
}

const connectToDatabase = async (): Promise<void> => {
  const mongooseConfig: MongooseConfig = config.mongoose;

  const { protocol, username, password, host, name } = mongooseConfig;

  const mongoURI = `${protocol}://${username}:${encodeURIComponent(password)}@${host}/${name}?authSource=admin`;
  const safeMongoURI = `${protocol}://${username}:***@${host}/${name}?authSource=admin`;

  const fallbackURI = 'mongodb://127.0.0.1:27017/test_db';

  try {
    logger.info(`Attempting primary MongoDB connection: ${safeMongoURI}`);
    await mongoose.connect(mongoURI);
    logger.info('Successfully connected to primary MongoDB');
  } catch (error: unknown) {
    if (error instanceof Error) logger.error('Primary MongoDB connection failed: %s', error.message);
    else logger.error('Unknown error during primary MongoDB connection');

    try {
      logger.info(`Attempting fallback MongoDB connection: ${fallbackURI}`);
      await mongoose.connect(fallbackURI);
      logger.info('Successfully connected to fallback MongoDB');
    } catch (fallbackError: unknown) {
      if (fallbackError instanceof Error) logger.error('Fallback MongoDB connection failed: %s', fallbackError.message);
      else logger.error('Unknown error during fallback MongoDB connection');

      process.exit(1);
    }
  }
};

export default connectToDatabase;
