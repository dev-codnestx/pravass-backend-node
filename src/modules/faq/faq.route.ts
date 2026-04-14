import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { faqValidation } from '@/shared/validations/index.js';

import { faqController } from './index.js';

const router: Router = express.Router();

router
  .route('/')
  .post(authMiddleware('manageFaqs'), validateMiddleware(faqValidation.createFaq), faqController.createFaq)
  .get(authMiddleware('getFaqs'), validateMiddleware(faqValidation.getFaqs), faqController.getFaqs);

router
  .route('/:faqId')
  .get(authMiddleware('getFaqs'), validateMiddleware(faqValidation.getFaq), faqController.getFaq)
  .patch(authMiddleware('manageFaqs'), validateMiddleware(faqValidation.updateFaq), faqController.updateFaq)
  .delete(authMiddleware('manageFaqs'), validateMiddleware(faqValidation.deleteFaq), faqController.deleteFaq);

router
  .route('/:faqId/toggle-status')
  .patch(authMiddleware('manageFaqs'), validateMiddleware(faqValidation.toggleStatus), faqController.toggleStatus);

export default router;
