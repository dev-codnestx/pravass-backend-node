import mongoose from 'mongoose';

import config from '@/shared/config/config.js';

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

  const fallbackURI = 'mongodb://127.0.0.1:27017/test_db';

  try {
    console.info(`🔌 Attempting primary MongoDB connection: ${mongoURI}`);
    await mongoose.connect(mongoURI);
    console.info('✅ Successfully connected to primary MongoDB!');
  } catch (error: unknown) {
    if (error instanceof Error) console.warn('❌ Primary MongoDB connection failed:', error.message);
    else console.warn('❌ Unknown error during primary MongoDB connection.');

    try {
      console.info(`🔁 Attempting fallback MongoDB connection: ${fallbackURI}`);
      await mongoose.connect(fallbackURI);
      console.info('✅ Successfully connected to fallback MongoDB!');
    } catch (fallbackError: unknown) {
      if (fallbackError instanceof Error) console.warn('❌ Fallback MongoDB connection failed:', fallbackError.message);
      else console.warn('❌ Unknown error during fallback MongoDB connection.');

      process.exit(1);
    }
  }
};

export default connectToDatabase;
