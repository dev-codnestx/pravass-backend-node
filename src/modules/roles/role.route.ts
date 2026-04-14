import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { roleController } from './index.js';
import { roleValidation } from './role.validation.js';

const router: Router = express.Router();

router
  .route('/')
  .get(authMiddleware(), validateMiddleware(roleValidation.listRoles), roleController.list)
  .post(authMiddleware(), validateMiddleware(roleValidation.createRole), roleController.create);

router
  .route('/:roleId')
  .get(authMiddleware(), validateMiddleware(roleValidation.getRoleById), roleController.getById)
  .patch(authMiddleware(), validateMiddleware(roleValidation.updateRole), roleController.update)
  .delete(authMiddleware(), validateMiddleware(roleValidation.deleteRole), roleController.remove);

router
  .route('/:roleId/permissions')
  .patch(authMiddleware(), validateMiddleware(roleValidation.updatePermissions), roleController.updatePermissions);

export default router;
