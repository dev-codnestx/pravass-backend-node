import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { userValidation } from '@/shared/validations/index.js';

import { userController } from './index.js';

const router: Router = express.Router();

router
  .route('/')
  .post(
    authMiddleware('employee-management:create'),
    validateMiddleware(userValidation.createUser),
    userController.createUser,
  )
  .get(authMiddleware('employee-management:read'), validateMiddleware(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(authMiddleware('employee-management:read'), validateMiddleware(userValidation.getUser), userController.getUser)
  .patch(
    authMiddleware('employee-management:update'),
    validateMiddleware(userValidation.updateUser),
    userController.updateUser,
  )
  .delete(
    authMiddleware('employee-management:delete'),
    validateMiddleware(userValidation.deleteUser),
    userController.deleteUser,
  );

router
  .route('/:userId/resend-credentials')
  .post(
    authMiddleware('employee-management:update'),
    validateMiddleware(userValidation.resendCredentials),
    userController.resendCredentials,
  );

export default router;
