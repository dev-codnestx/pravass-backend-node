import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { userValidation } from '@/shared/validations/index.js';

import { userController } from './index.js';

const router: Router = express.Router();

router
  .route('/')
  .post(authMiddleware('manageUsers'), validateMiddleware(userValidation.createUser), userController.createUser)
  .get(authMiddleware('getUsers'), validateMiddleware(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(authMiddleware('getUsers'), validateMiddleware(userValidation.getUser), userController.getUser)
  .patch(authMiddleware('manageUsers'), validateMiddleware(userValidation.updateUser), userController.updateUser)
  .delete(authMiddleware('manageUsers'), validateMiddleware(userValidation.deleteUser), userController.deleteUser);

router
  .route('/:userId/resend-credentials')
  .post(
    authMiddleware('manageUsers'),
    validateMiddleware(userValidation.resendCredentials),
    userController.resendCredentials,
  );

export default router;
