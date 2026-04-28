import express from 'express';

import authMiddleware from '../auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';

import { applicationController } from './application.controller.js';
import { applicationValidation } from './application.validation.js';

const router = express.Router();

router
  .route('/')
  .get(authMiddleware(), validateMiddleware(applicationValidation.getApplications), applicationController.getApplications);

router
  .route('/:applicationId')
  .get(authMiddleware(), validateMiddleware(applicationValidation.getApplication), applicationController.getApplication)
  .patch(
    authMiddleware(),
    validateMiddleware(applicationValidation.updateApplication),
    setAuditFields({ mode: AuditMode.UPDATE }),
    applicationController.updateApplication,
  )
  .delete(
    authMiddleware(),
    validateMiddleware(applicationValidation.deleteApplication),
    applicationController.deleteApplication,
  );

// Protected routes (auth required)
router
  .route('/submit')
  .post(
    authMiddleware(),
    validateMiddleware(applicationValidation.submitApplication),
    applicationController.createApplication,
  );

export default router;
