import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { permissionController } from './index.js';
import { roleValidation } from '@/modules/roles/role.validation.js';

const router: Router = express.Router();

router.route('/').get(authMiddleware(), permissionController.list);

router.route('/catalog').get(authMiddleware(), permissionController.catalog);

router
  .route('/:roleId')
  .get(authMiddleware(), permissionController.getByRole)
  .patch(authMiddleware(), validateMiddleware(roleValidation.updatePermissions), permissionController.updateByRole);

router
  .route('/:roleId/permissions')
  .patch(authMiddleware(), validateMiddleware(roleValidation.updatePermissions), permissionController.updateByRole);

export default router;
