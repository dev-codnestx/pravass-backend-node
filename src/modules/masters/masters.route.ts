import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { MASTER_MODULES } from '@/modules/masters/common/master.constants.js';
import { createMasterController } from '@/modules/masters/controllers/createMasterController.js';
import { injectMasterAuditFields } from '@/modules/masters/middlewares/masterAudit.middleware.js';
import { masterModels } from '@/modules/masters/models/master.models.js';
import { mastersValidation } from '@/modules/masters/masters.validation.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

const router: Router = express.Router();

MASTER_MODULES.forEach((moduleKey) => {
  const controller = createMasterController(masterModels[moduleKey], moduleKey);
  const modulePath = `/${moduleKey}`;

  router
    .route(modulePath)
    .get(authMiddleware(), validateMiddleware(mastersValidation.listMasters), controller.list)
    .post(authMiddleware(), injectMasterAuditFields, validateMiddleware(mastersValidation.createMaster), controller.create);

  router
    .route(`${modulePath}/:id`)
    .get(authMiddleware(), validateMiddleware(mastersValidation.getMasterById), controller.getById)
    .put(authMiddleware(), injectMasterAuditFields, validateMiddleware(mastersValidation.updateMaster), controller.update)
    .delete(authMiddleware(), validateMiddleware(mastersValidation.deleteMaster), controller.remove);
});

export default router;
