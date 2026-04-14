import express from 'express';
import * as supportController from './support.controller.js';
import { supportValidation } from './support.validation.js';
import authMiddleware from '../auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(supportValidation.createTicket),
    setAuditFields({ mode: AuditMode.CREATE }),
    supportController.createTicket,
  )
  .get(authMiddleware(), validateMiddleware(supportValidation.getTickets), supportController.getTickets);

router
  .route('/:ticketId')
  .get(authMiddleware(), validateMiddleware(supportValidation.getTicket), supportController.getTicket)
  .patch(
    authMiddleware(),
    validateMiddleware(supportValidation.updateTicket),
    setAuditFields({ mode: AuditMode.UPDATE }),
    supportController.updateTicket,
  )
  .delete(authMiddleware(), validateMiddleware(supportValidation.deleteTicket), supportController.deleteTicket);

router
  .route('/:ticketId/reply')
  .post(authMiddleware(), validateMiddleware(supportValidation.addReply), supportController.addReply);

router
  .route('/:ticketId/notes')
  .post(authMiddleware(), validateMiddleware(supportValidation.addInternalNote), supportController.addInternalNote);

export default router;
