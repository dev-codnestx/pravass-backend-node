import httpStatus from 'http-status';
import admin from 'firebase-admin';
import { NotificationModel } from './notification.model.js';
import { DeviceTokenModel } from './deviceToken.model.js';
import { INotificationDoc, NotificationTarget } from './notification.interfaces.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import logger from '@/shared/config/logger.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';

// Initialize Firebase Admin
// Make sure FIREBASE_SERVICE_ACCOUNT is a base64 encoded JSON string of the service account key
if (process.env.FIREBASE_SERVICE_ACCOUNT && !admin.apps.length)
  try {
    let serviceAccount;
    const rawValue = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

    // Check if it's already JSON
    if (rawValue.startsWith('{')) serviceAccount = JSON.parse(rawValue);
    else serviceAccount = JSON.parse(Buffer.from(rawValue, 'base64').toString('utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.info('Firebase Admin initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize Firebase Admin:', err);
  }

/**
 * Dispatch notification to relevant devices
 */
const dispatchNotification = async (notification: INotificationDoc) => {
  if (!admin.apps.length) {
    await NotificationModel.updateOne({ _id: notification._id }, { $set: { status: 'sent', sentAt: new Date() } });
    return;
  }

  const topic = notification.target === 'external' ? 'website-all' : 'admin-all';
  const clientType = notification.target === 'external' ? 'website' : 'admin';

  let status = 'sent';
  try {
    const tokens = await DeviceTokenModel.find({ clientType, isActive: true }).distinct('token');

    const payload = {
      data: {
        title: notification.title,
        body: notification.message,
        notificationId: notification._id.toString(),
      },
    };

    if (tokens.length > 0) {
      const response = await admin.messaging().sendEachForMulticast({ ...payload, tokens });
      logger.info(`Direct delivery: ${response.successCount} success, ${response.failureCount} failure`);
    } else {
      await admin.messaging().send({ ...payload, topic });
      logger.info(`Sent to topic: ${topic}`);
    }
  } catch (error: unknown) {
    logger.error('Firebase dispatch failed:', error);
    status = 'failed';
  }

  await NotificationModel.updateOne({ _id: notification._id }, { $set: { status, sentAt: new Date() } });
};

/**
 * Process scheduled notifications that have reached their start time
 */
export const processScheduledNotifications = async () => {
  const now = new Date();
  const pendingNotifications = await NotificationModel.find({
    status: 'pending',
    scheduledFor: { $lte: now },
  });

  if (pendingNotifications.length > 0) {
    logger.info(`Cron: Processing ${pendingNotifications.length} scheduled notifications.`);
    await Promise.all(
      pendingNotifications.map(async (notification) => {
        // Mark as processing to avoid duplicate runs
        notification.status = 'processing';
        await notification.save();

        dispatchNotification(notification).catch((err) => {
          logger.error(`Failed to dispatch scheduled notification ${notification._id}:`, err);
        });
      }),
    );
  }
};

/**
 * Cleanup or mark as expired notifications that have passed their expiry date
 */
export const cleanupExpiredNotifications = async () => {
  const now = new Date();
  // We mark as 'cancelled' or just let them stay but filtered out by queries
  // For now, let's keep the existing logic of deleting them if you want to save space
  // or mark them as 'cancelled' so they don't show up in popups.
  const result = await NotificationModel.updateMany(
    {
      status: { $in: ['pending', 'sent'] },
      expiresAt: { $lte: now },
    },
    { $set: { status: 'completed' } },
  );

  if (result.modifiedCount > 0) logger.info(`Cron: Marked ${result.modifiedCount} notifications as completed.`);
};

/**
 * Register a device token
 */
export const registerToken = async (userId: string | undefined, token: string, clientType: 'website' | 'admin') => {
  await DeviceTokenModel.findOneAndUpdate(
    { token },
    {
      userId: userId || undefined,
      clientType,
      lastUsedAt: new Date(),
      isActive: true,
    },
    { upsert: true, new: true },
  );

  logger.info(`Token registered/updated: ${token.substring(0, 10)}... for ${clientType}`);

  if (admin.apps.length)
    try {
      const topic = clientType === 'website' ? 'website-all' : 'admin-all';
      await admin.messaging().subscribeToTopic([token], topic);
    } catch (err) {
      logger.error('Failed to subscribe token to topic', err);
    }

  return true;
};

/**
 * Create a notification and dispatch it
 */
export const sendNotification = async (
  title: string,
  message: string,
  target: NotificationTarget,
  createdBy: string,
  scheduledFor?: Date,
  expiresAt?: Date,
  data: Record<string, unknown> = {},
) => {
  const startTime = scheduledFor || new Date();
  const now = new Date();

  const notification = await NotificationModel.create({
    title,
    message,
    target,
    createdBy,
    scheduledFor: startTime,
    expiresAt,
    data,
    status: startTime > now ? 'pending' : 'processing',
  });

  // Only dispatch now if it's not scheduled for the future
  if (startTime <= now)
    dispatchNotification(notification).catch((err) => {
      logger.error('Failed to dispatch notification:', err);
    });
  else logger.info(`Notification scheduled for ${startTime}`);

  return notification;
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (id: string) => NotificationModel.findById(id);

/**
 * Delete a notification
 */
export const deleteNotification = async (id: string) => {
  const notification = await getNotificationById(id);
  if (!notification) throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');

  await notification.deleteOne();
  return notification;
};

/**
 * Query notifications
 */
export const queryNotifications = async (filter: Record<string, unknown>, options: PaginateOptions) =>
  NotificationModel.paginate(filter, options);
