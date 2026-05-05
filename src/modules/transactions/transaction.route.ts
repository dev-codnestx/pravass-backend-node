import express from 'express';
import authMiddleware from '@/modules/auth/auth.middleware.js';
import * as transactionController from './transaction.controller.js';

const router = express.Router();

router.get('/my', authMiddleware(), transactionController.getMyTransactions);
router.get('/:transactionId', authMiddleware(), transactionController.getTransaction);

export default router;
