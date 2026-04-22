import express from 'express';
import { dealController } from './deal.controller.js';
import { dealValidation } from './deal.validation.js';
import authMiddleware from '../auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(dealValidation.createDeal),
    setAuditFields({ mode: AuditMode.CREATE }),
    dealController.createDeal,
  )
  .get(validateMiddleware(dealValidation.getDeals), dealController.getDeals);

router
  .route('/:dealId')
  .get(validateMiddleware(dealValidation.getDeal), dealController.getDeal)
  .patch(
    authMiddleware(),
    validateMiddleware(dealValidation.updateDeal),
    setAuditFields({ mode: AuditMode.UPDATE }),
    dealController.updateDeal,
  )
  .delete(authMiddleware(), validateMiddleware(dealValidation.deleteDeal), dealController.deleteDeal);

export default router;
