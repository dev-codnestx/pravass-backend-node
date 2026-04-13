import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { applicationController, applicationValidation } from './index.js';

const router: Router = express.Router();

// Admin routes (protected)
router
  .route('/')
  .get(
    authMiddleware('getApplications'),
    validateMiddleware(applicationValidation.getApplications),
    applicationController.getApplications,
  );

router
  .route('/:applicationId')
  .get(
    authMiddleware('getApplications'),
    validateMiddleware(applicationValidation.getApplication),
    applicationController.getApplication,
  )
  .delete(
    authMiddleware('manageApplications'),
    validateMiddleware(applicationValidation.deleteApplication),
    applicationController.deleteApplication,
  );

router
  .route('/:applicationId/status')
  .patch(
    authMiddleware('manageApplications'),
    validateMiddleware(applicationValidation.updateApplicationStatus),
    applicationController.updateApplicationStatus,
  );

// Public route (no auth required — website form submission)
router
  .route('/public/submit')
  .post(validateMiddleware(applicationValidation.submitApplication), applicationController.submitApplication);

export default router;
