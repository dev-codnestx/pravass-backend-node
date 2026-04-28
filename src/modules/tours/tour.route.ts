import express from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { tourController } from './tour.controller.js';
import { tourValidation } from './tour.validation.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(tourValidation.createTour),
    setAuditFields({ mode: AuditMode.CREATE }),
    tourController.createTour,
  )
  .get(validateMiddleware(tourValidation.getTours), tourController.getTours);

router.get('/flights/search', validateMiddleware(tourValidation.searchFlights), tourController.searchFlights);

router
  .route('/:tourId')
  .get(validateMiddleware(tourValidation.getTour), tourController.getTour)
  .patch(
    authMiddleware(),
    validateMiddleware(tourValidation.updateTour),
    setAuditFields({ mode: AuditMode.UPDATE }),
    tourController.updateTour,
  )
  .delete(authMiddleware(), validateMiddleware(tourValidation.deleteTour), tourController.deleteTour);

router.post(
  '/:tourId/duplicate',
  authMiddleware(),
  validateMiddleware(tourValidation.duplicateTour),
  setAuditFields({ mode: AuditMode.CREATE }),
  tourController.duplicateTour,
);

export default router;
