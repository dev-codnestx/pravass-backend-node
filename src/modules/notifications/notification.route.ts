import express, { Router } from 'express';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import * as notificationController from './notification.controller.js';
import * as notificationValidation from './notification.validation.js';
import authMiddleware from '@/modules/auth/auth.middleware.js';

const router: Router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(notificationValidation.sendNotification),
    notificationController.sendNotification,
  )
  .get(
    authMiddleware({ allowGuestFor: ['website'] }),
    validateMiddleware(notificationValidation.getNotifications),
    notificationController.getNotifications,
  );

router
  .route('/tokens')
  .post(
    authMiddleware({ allowGuestFor: ['website'] }),
    validateMiddleware(notificationValidation.registerToken),
    notificationController.registerToken,
  );

router
  .route('/:notificationId')
  .get(authMiddleware(), validateMiddleware(notificationValidation.getNotification), notificationController.getNotification)
  .delete(
    authMiddleware(),
    validateMiddleware(notificationValidation.deleteNotification),
    notificationController.deleteNotification,
  );

export default router;
