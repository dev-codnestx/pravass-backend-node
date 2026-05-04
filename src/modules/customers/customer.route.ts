import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';

import { customerController } from './customer.controller.js';
import { customerValidation } from './customer.validation.js';

const router: Router = express.Router();

router
  .route('/')
  .post(
    authMiddleware('customers:create'),
    validateMiddleware(customerValidation.createCustomer),
    setAuditFields({ mode: AuditMode.CREATE }),
    customerController.createCustomer,
  )
  .get(
    authMiddleware('customers:read'),
    validateMiddleware(customerValidation.getCustomers),
    customerController.getCustomers,
  );

router.get('/wishlist', authMiddleware(), customerController.getWishlist);
router.post('/wishlist/toggle', authMiddleware(), customerController.toggleWishlist);

router
  .route('/:customerId')
  .get(authMiddleware('customers:read'), validateMiddleware(customerValidation.getCustomer), customerController.getCustomer)
  .patch(
    authMiddleware('customers:update'),
    validateMiddleware(customerValidation.updateCustomer),
    setAuditFields({ mode: AuditMode.UPDATE }),
    customerController.updateCustomer,
  )
  .delete(
    authMiddleware('customers:delete'),
    validateMiddleware(customerValidation.deleteCustomer),
    customerController.deleteCustomer,
  );

router
  .route('/:customerId/status')
  .patch(
    authMiddleware('customers:update'),
    validateMiddleware(customerValidation.updateCustomerStatus),
    setAuditFields({ mode: AuditMode.UPDATE }),
    customerController.updateCustomerStatus,
  );

export default router;
