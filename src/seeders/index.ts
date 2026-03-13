import mongoose from 'mongoose';
import { seedRoles } from './role.seeder.js';
import { seedSuperAdmin, seedDemoUsers } from './user.seeder.js';
import connectToDatabase from '@/shared/config/dbConfig.js';

/**
 * Main seeder function
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.info('🚀 Starting database seeding...');

    await connectToDatabase();
    console.info('📦 Connected to database');

    // Clear existing data (optional - uncomment if you want clean seed)
    // await clearDatabase();

    // Seed roles first (users depend on roles)
    await seedRoles();

    // Seed users
    await seedSuperAdmin();
    await seedDemoUsers();

    console.info('✅ Database seeding completed successfully!');
  } catch (error) {
    console.warn('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.info('📪 Disconnected from database');
  }
};

seedDatabase().catch((err) => {
  console.warn('Seeding process encountered an error:', err);
  process.exit(1);
});
