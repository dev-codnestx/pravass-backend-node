import express, { Router } from 'express';

import { generateS3PresignedUrl } from '@/shared/core/s3/s3.controller.js';
import authMiddleware from '@/modules/auth/auth.middleware.js';
const router: Router = express.Router();

// gernerate s3 presigned url
router.route('/').post(authMiddleware(), generateS3PresignedUrl);

export default router;
