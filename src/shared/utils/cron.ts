import cron from 'node-cron';
import logger from '@/shared/config/logger.js';
import { processScheduledNotifications, cleanupExpiredNotifications } from '@/modules/notifications/notification.service.js';

/**
 * Initialize all cron jobs for the application
 */
export const initializeCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // 1. Process Scheduled Notifications (every minute)
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledNotifications();
    } catch (error) {
      logger.error('Cron: Failed to process scheduled notifications', error);
    }
  });

  // 2. Cleanup Expired Notifications (every hour)
  cron.schedule('0 * * * *', async () => {
    try {
      await cleanupExpiredNotifications();
    } catch (error) {
      logger.error('Cron: Failed to cleanup expired notifications', error);
    }
  });

  // You can add more jobs here:
  // cron.schedule('0 0 * * *', async () => { ... });
};
