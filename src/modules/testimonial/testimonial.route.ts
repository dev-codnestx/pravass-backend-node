import express, { Router } from 'express';
import { authMiddleware, validateMiddleware, setAuditFields } from '@/shared/utils/middlewares/index.js';
import { testimonialValidation } from './testimonial.validation.js';
import { testimonialController } from './testimonial.controller.js';

const router: Router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    setAuditFields,
    validateMiddleware(testimonialValidation.createTestimonial),
    testimonialController.createTestimonial,
  )
  .get(validateMiddleware(testimonialValidation.getTestimonials), testimonialController.getTestimonials);

router
  .route('/:testimonialId')
  .get(validateMiddleware(testimonialValidation.getTestimonial), testimonialController.getTestimonial)
  .patch(
    authMiddleware(),
    setAuditFields,
    validateMiddleware(testimonialValidation.updateTestimonial),
    testimonialController.updateTestimonial,
  )
  .delete(
    authMiddleware(),
    validateMiddleware(testimonialValidation.deleteTestimonial),
    testimonialController.deleteTestimonial,
  );

export default router;
