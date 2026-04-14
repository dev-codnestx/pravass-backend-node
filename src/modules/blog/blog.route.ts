import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { blogValidation } from '@/shared/validations/index.js';

import { blogController } from './index.js';

const router: Router = express.Router();

router
  .route('/')
  .post(authMiddleware('manageBlogs'), validateMiddleware(blogValidation.createBlog), blogController.createBlog)
  .get(authMiddleware('getBlogs'), validateMiddleware(blogValidation.getBlogs), blogController.getBlogs);

router
  .route('/:blogId')
  .get(authMiddleware('getBlogs'), validateMiddleware(blogValidation.getBlog), blogController.getBlog)
  .patch(authMiddleware('manageBlogs'), validateMiddleware(blogValidation.updateBlog), blogController.updateBlog)
  .delete(authMiddleware('manageBlogs'), validateMiddleware(blogValidation.deleteBlog), blogController.deleteBlog);

router
  .route('/:blogId/toggle-status')
  .patch(authMiddleware('manageBlogs'), validateMiddleware(blogValidation.toggleStatus), blogController.toggleStatus);

export default router;
