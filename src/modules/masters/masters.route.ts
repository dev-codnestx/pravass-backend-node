import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { MASTER_MODULES } from '@/modules/masters/common/master.constants.js';
import { createMasterController } from '@/modules/masters/controllers/createMasterController.js';
import { masterModels } from '@/modules/masters/models/master.models.js';
import { mastersValidation } from '@/modules/masters/masters.validation.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { validateVehicleUsage } from '@/modules/masters/middlewares/validateVehicleUsage.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import { TourModel } from '@/modules/tours/tour.model.js';

const router: Router = express.Router();

MASTER_MODULES.forEach((moduleKey) => {
  const controller = createMasterController(masterModels[moduleKey], moduleKey);
  const modulePath = `/${moduleKey}`;

  router
    .route(modulePath)
    .get(authMiddleware({ allowGuestFor: ['website'] }), validateMiddleware(mastersValidation.listMasters), controller.list)
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

  router.get(`${modulePath}/slug/:slug`, authMiddleware({ allowGuestFor: ['website'] }), controller.getBySlug);

  router
    .route(`${modulePath}/:id`)
    .get(
      authMiddleware({ allowGuestFor: ['website'] }),
      validateMiddleware(mastersValidation.getMasterById),
      controller.getById,
    )
    .put(
      authMiddleware(),
      (req, res, next) => {
        if (moduleKey === 'vehicles') return validateVehicleUsage(req, res, next);

        next();
      },
      validateMiddleware(mastersValidation.updateMaster),
      setAuditFields({ mode: AuditMode.UPDATE }),
      controller.update,
    )
    .delete(authMiddleware(), validateMiddleware(mastersValidation.deleteMaster), controller.remove);

  if (moduleKey === 'vehicles')
    router.get(
      `${modulePath}/:id/usage`,
      authMiddleware(),
      catchAsync(async (req, res) => {
        const isUsed = await TourModel.exists({
          'departures.vehicleId': req.params.id,
          isDeleted: false,
        });
        res.success({ isUsed: !!isUsed });
      }),
    );
});

export default router;
