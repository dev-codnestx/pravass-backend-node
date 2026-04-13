import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { jobController, jobValidation } from './index.js';

const router: Router = express.Router();

router
  .route('/')
  .post(authMiddleware('manageJobs'), validateMiddleware(jobValidation.createJob), jobController.createJob)
  .get(authMiddleware('getJobs'), validateMiddleware(jobValidation.getJobs), jobController.getJobs);

router
  .route('/:jobId')
  .get(authMiddleware('getJobs'), validateMiddleware(jobValidation.getJob), jobController.getJob)
  .patch(authMiddleware('manageJobs'), validateMiddleware(jobValidation.updateJob), jobController.updateJob)
  .delete(authMiddleware('manageJobs'), validateMiddleware(jobValidation.deleteJob), jobController.deleteJob);

router
  .route('/:jobId/toggle-status')
  .patch(authMiddleware('manageJobs'), validateMiddleware(jobValidation.toggleStatus), jobController.toggleStatus);

export default router;
