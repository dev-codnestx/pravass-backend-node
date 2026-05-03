import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import * as notificationService from './notification.service.js';

export const registerToken = catchAsync(async (req: Request, res: Response) => {
  const { token, clientType } = req.body;
  const userId = req.user?.id;
  await notificationService.registerToken(userId, token, clientType);
  res.status(httpStatus.CREATED).send({ message: 'Token registered successfully' });
});

export const sendNotification = catchAsync(async (req: Request, res: Response) => {
  const { title, message, target, scheduledFor, expiresAt, data } = req.body;
  const userId = req.user.id;
  const notification = await notificationService.sendNotification(
    title,
    message,
    target,
    userId,
    scheduledFor,
    expiresAt,
    data,
  );
  res.status(httpStatus.CREATED).send(notification);
});

export const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['target', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await notificationService.queryNotifications(filter, options);
  res.send(result);
});

export const getNotification = catchAsync(async (req: Request, res: Response) => {
  const notification = await notificationService.getNotificationById(req.params['notificationId']);
  if (!notification) {
    res.status(httpStatus.NOT_FOUND).send({ message: 'Notification not found' });
    return;
  }
  res.send(notification);
});

export const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  await notificationService.deleteNotification(req.params['notificationId']);
  res.status(httpStatus.NO_CONTENT).send();
});
