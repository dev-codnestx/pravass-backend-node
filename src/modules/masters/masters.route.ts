import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { MASTER_MODULES } from '@/modules/masters/common/master.constants.js';
import { createMasterController } from '@/modules/masters/controllers/createMasterController.js';
import { masterModels } from '@/modules/masters/models/master.models.js';
import { mastersValidation } from '@/modules/masters/masters.validation.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

const router: Router = express.Router();

MASTER_MODULES.forEach((moduleKey) => {
  const controller = createMasterController(masterModels[moduleKey], moduleKey);
  const modulePath = `/${moduleKey}`;

  router
    .route(modulePath)
    .get(authMiddleware(), validateMiddleware(mastersValidation.listMasters), controller.list)
    .post(
      authMiddleware(),
      validateMiddleware(mastersValidation.createMaster),
      setAuditFields({ mode: AuditMode.CREATE }),
      controller.create,
    );

  if (moduleKey === 'lead-stages')
    router.put(
      `${modulePath}/reorder`,
      authMiddleware(),
      validateMiddleware(mastersValidation.reorderLeadStages),
      setAuditFields({ mode: AuditMode.UPDATE }),
      controller.reorder,
    );

  router
    .route(`${modulePath}/:id`)
    .get(authMiddleware(), validateMiddleware(mastersValidation.getMasterById), controller.getById)
    .put(
      authMiddleware(),
      validateMiddleware(mastersValidation.updateMaster),
      setAuditFields({ mode: AuditMode.UPDATE }),
      controller.update,
    )
    .delete(authMiddleware(), validateMiddleware(mastersValidation.deleteMaster), controller.remove);
});

export default router;
