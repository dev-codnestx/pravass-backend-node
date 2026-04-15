import express, { Router } from 'express';

import authMiddleware from '@/modules/auth/auth.middleware.js';
import validate from '@/shared/utils/middlewares/validate.middleware.js';
import { authValidation } from './auth.validation.js';

import { authController } from './index.js';

const router: Router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/panel/login', validate(authValidation.login), authController.login);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshToken), authController.refreshTokens);
router.post('/refresh', validate(authValidation.refreshToken), authController.refreshTokens);
router.post('/forgot-password', validate(authValidation.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);
router.post('/send-verification-email', authMiddleware(), authController.sendVerificationEmail);
router.post('/verify-email', validate(authValidation.verifyEmail), authController.verifyEmail);
router.get('/me', authMiddleware(), authController.getMe);
router.post('/user/generate-otp', validate(authValidation.generateOtp), authController.generateOtp);
router.post('/user/resend-otp', validate(authValidation.resendOtp), authController.resendOtp);
router.post('/user/verify-otp', validate(authValidation.verifyOtp), authController.verifyOtp);
router.post('/user/create-account', validate(authValidation.createAccount), authController.createAccount);

export default router;
