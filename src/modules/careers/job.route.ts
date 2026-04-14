import express from 'express';

import authMiddleware from '../auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';

import { jobController } from './job.controller.js';
import { jobValidation } from './job.validation.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(jobValidation.createJob),
    setAuditFields({ mode: AuditMode.CREATE }),
    jobController.createJob,
  )
  .get(validateMiddleware(jobValidation.getJobs), jobController.getJobs);

router
  .route('/:jobId')
  .get(validateMiddleware(jobValidation.getJob), jobController.getJob)
  .patch(
    authMiddleware(),
    validateMiddleware(jobValidation.updateJob),
    setAuditFields({ mode: AuditMode.UPDATE }),
    jobController.updateJob,
  )
  .delete(authMiddleware(), validateMiddleware(jobValidation.deleteJob), jobController.deleteJob);

router
  .route('/:jobId/toggle-status')
  .patch(
    authMiddleware(),
    validateMiddleware(jobValidation.toggleStatus),
    setAuditFields({ mode: AuditMode.UPDATE }),
    jobController.toggleStatus,
  );

export default router;
