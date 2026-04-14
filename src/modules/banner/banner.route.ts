import express from 'express';
import { bannerController } from './banner.controller.js';
import { bannerValidation } from './banner.validation.js';
import authMiddleware from '../auth/auth.middleware.js';
import { validateMiddleware } from '@/shared/utils/middlewares/index.js';
import { setAuditFields } from '@/shared/middleware/setAuditFields.js';
import { AuditMode } from '@/shared/constants/enum.constant.js';

const router = express.Router();

router
  .route('/')
  .post(
    authMiddleware(),
    validateMiddleware(bannerValidation.createBanner),
    setAuditFields({ mode: AuditMode.CREATE }),
    bannerController.createBanner,
  )
  .get(validateMiddleware(bannerValidation.getBanners), bannerController.getBanners);

router
  .route('/:bannerId')
  .get(validateMiddleware(bannerValidation.getBanner), bannerController.getBanner)
  .patch(
    authMiddleware(),
    validateMiddleware(bannerValidation.updateBanner),
    setAuditFields({ mode: AuditMode.UPDATE }),
    bannerController.updateBanner,
  )
  .delete(authMiddleware(), validateMiddleware(bannerValidation.deleteBanner), bannerController.deleteBanner);

export default router;
