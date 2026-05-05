import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { sendSuccessResponse } from '@/shared/utils/response.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';
import * as transactionService from './transaction.service.js';
import { customerService } from '../customers/customer.service.js';
import { BookingModel } from '../bookings/booking.model.js';

export const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const queryUserId = req.query['userId'] as string;
  const targetUserId = queryUserId || req.user?._id;
  if (!targetUserId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');

  const targetObjectId = typeof targetUserId === 'string' ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;

  // Find all bookings for this user to find related transactions
  // This is because older transactions might be tied to customer accounts
  const customer = await customerService.findCustomerBySourceUserId(targetObjectId);
  const bookingFilter: any = {
    $or: [{ sourceUserId: targetObjectId }],
    isDeleted: false,
  };
  if (customer) bookingFilter.$or.push({ customerId: customer._id });

  const userBookings = await BookingModel.find(bookingFilter).select('_id');
  const bookingIds = userBookings.map((b) => b._id);

  const filter = {
    $or: [{ userId: targetObjectId }, { bookingId: { $in: bookingIds } }],
  };

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.populate = 'bookingId;bookingId.tourId';
  options.sortBy = options.sortBy || 'createdAt:desc';

  const result = await transactionService.queryTransactions(filter, options);
  sendSuccessResponse(
    res,
    result,
    responseCodes['GenericResponseCodes']?.SUCCESS || 200,
    'Transactions fetched successfully',
  );
});

export const getTransaction = catchAsync(async (req: Request, res: Response) => {
  const transaction = await transactionService.getTransactionById(req.params['transactionId'] || '');
  sendSuccessResponse(
    res,
    transaction,
    responseCodes['GenericResponseCodes']?.SUCCESS || 200,
    'Transaction fetched successfully',
  );
});
