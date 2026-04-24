import express from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { leadController } from './lead.controller.js';
import { leadValidation } from './lead.validation.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(leadValidation.createLead),
    setAuditFields({ mode: AuditMode.CREATE }),
    leadController.createLead,
  )
  .get(authMiddleware(), validateMiddleware(leadValidation.getLeads), leadController.getLeads);

router
  .route('/reorder')
  .put(
    authMiddleware(),
    validateMiddleware(leadValidation.reorderLeads),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.reorderLeads,
  );

router
  .route('/:leadId')
  .get(authMiddleware(), validateMiddleware(leadValidation.getLead), leadController.getLead)
  .patch(
    authMiddleware(),
    validateMiddleware(leadValidation.updateLead),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.updateLead,
  )
  .delete(authMiddleware(), validateMiddleware(leadValidation.deleteLead), leadController.deleteLead);

router
  .route('/:leadId/status')
  .patch(
    authMiddleware(),
    validateMiddleware(leadValidation.updateStatus),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.updateStatus,
  );

router
  .route('/:leadId/notes')
  .post(
    authMiddleware(),
    validateMiddleware(leadValidation.addNote),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.addNote,
  );

router
  .route('/:leadId/follow-ups')
  .post(
    authMiddleware(),
    validateMiddleware(leadValidation.addFollowUp),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.addFollowUp,
  );

router
  .route('/:leadId/follow-ups/:followUpId/complete')
  .patch(
    authMiddleware(),
    validateMiddleware(leadValidation.completeFollowUp),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.completeFollowUp,
  );

router
  .route('/:leadId/activities')
  .post(
    authMiddleware(),
    validateMiddleware(leadValidation.logActivity),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.logActivity,
  );

router
  .route('/:leadId/convert')
  .post(
    authMiddleware(),
    validateMiddleware(leadValidation.convertLead),
    setAuditFields({ mode: AuditMode.UPDATE }),
    leadController.convertLead,
  );

export default router;
