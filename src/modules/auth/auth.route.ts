import authMiddleware from '@/modules/auth/auth.middleware.js';
import validate from '@/shared/utils/middlewares/validate.middleware.js';
import { authValidation } from '@/shared/validations/index.js';
import express, { Router } from 'express';
import { authController } from './index.js';

const router: Router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/send-verification-email', authMiddleware(), authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);

export default router;
