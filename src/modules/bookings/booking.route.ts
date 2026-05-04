import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';

import * as bookingController from './booking.controller.js';
import * as bookingValidation from './booking.validation.js';

const router: Router = express.Router();

router.post(
  '/initiate',
  validateMiddleware(bookingValidation.initiateBooking),
  setAuditFields({ mode: AuditMode.CREATE }),
  bookingController.initiateBooking,
);

router.post('/verify-payment', validateMiddleware(bookingValidation.verifyPayment), bookingController.verifyPayment);

router.get('/my', authMiddleware(), validateMiddleware(bookingValidation.getBookings), bookingController.getMyBookings);

router.get('/ref/:bookingRef', validateMiddleware(bookingValidation.getBookingByRef), bookingController.getBookingByRef);

router.get(
  '/tour/:tourId',
  authMiddleware('bookings:read'),
  validateMiddleware(bookingValidation.getTourBookings),
  bookingController.getTourBookings,
);

router
  .route('/')
  .get(authMiddleware('bookings:read'), validateMiddleware(bookingValidation.getBookings), bookingController.getBookings);

router
  .route('/:bookingId')
  .get(authMiddleware('bookings:read'), validateMiddleware(bookingValidation.getBooking), bookingController.getBooking)
  .patch(
    authMiddleware('bookings:update'),
    validateMiddleware(bookingValidation.updateBooking),
    setAuditFields({ mode: AuditMode.UPDATE }),
    bookingController.updateBooking,
  )
  .delete(
    authMiddleware('bookings:delete'),
    validateMiddleware(bookingValidation.getBooking),
    bookingController.deleteBooking,
  );

router.post(
  '/:bookingId/cancel',
  authMiddleware('bookings:update'), // Could be own booking or admin, currently just authenticated
  validateMiddleware(bookingValidation.cancelBooking),
  setAuditFields({ mode: AuditMode.UPDATE }),
  bookingController.cancelBooking,
);

export default router;
