import express from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { specialityTourController } from './specialityTour.controller.js';
import { specialityTourValidation } from './specialityTour.validation.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(specialityTourValidation.createSpecialityTour),
    specialityTourController.createSpecialityTour,
  )
  .get(validateMiddleware(specialityTourValidation.getSpecialityTours), specialityTourController.getSpecialityTours);

router.post(
  '/:specialityTourId/duplicate',
  authMiddleware(),
  validateMiddleware(specialityTourValidation.duplicateSpecialityTour),
  specialityTourController.duplicateSpecialityTour,
);

router
  .route('/:specialityTourId')
  .get(validateMiddleware(specialityTourValidation.getSpecialityTour), specialityTourController.getSpecialityTour)
  .patch(
    authMiddleware(),
    validateMiddleware(specialityTourValidation.updateSpecialityTour),
    specialityTourController.updateSpecialityTour,
  )
  .delete(
    authMiddleware(),
    validateMiddleware(specialityTourValidation.deleteSpecialityTour),
    specialityTourController.deleteSpecialityTour,
  );

export default router;
