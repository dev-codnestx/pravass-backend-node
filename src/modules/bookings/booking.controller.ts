import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';

import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { sendSuccessResponse } from '@/shared/utils/response.js';

import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import * as bookingService from './booking.service.js';
import { customerService } from '@/modules/customers/customer.service.js';

export const initiateBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.initiateBooking(req.body, req.user?._id);
  sendSuccessResponse(res, result, responseCodes['BookingResponseCodes']!.SUCCESS, 'Booking initiated successfully');
});

export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.verifyPayment(req.body);
  sendSuccessResponse(res, booking, responseCodes['BookingResponseCodes']!.SUCCESS, 'Payment verified successfully');
});

export const getBookings = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['status', 'tourId', 'customerId', 'departureId', 'search', 'startDate', 'endDate']);

  if (filter.startDate || filter.endDate) {
    filter.createdAt = {};
    if (filter.startDate) filter.createdAt.$gte = new Date(filter.startDate as string);
    if (filter.endDate) {
      const end = new Date(filter.endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
    delete filter.startDate;
    delete filter.endDate;
  }

  if (filter.search) {
    filter.$or = [
      { bookingRef: { $regex: filter.search, $options: 'i' } },
      { contactName: { $regex: filter.search, $options: 'i' } },
      { contactEmail: { $regex: filter.search, $options: 'i' } },
      { contactPhone: { $regex: filter.search, $options: 'i' } },
    ];
    delete filter.search;
  }

  filter.isDeleted = false;

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  options.populate = options.populate || 'tourId;tourId.tourType;customerId;departureCityId';

  const result = await bookingService.queryBookings(filter, options);
  sendSuccessResponse(res, result, responseCodes['BookingResponseCodes']!.SUCCESS, 'Bookings fetched successfully');
});

export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const queryUserId = req.query['userId'] as string;
  const targetUserId = queryUserId || req.user?._id;
  if (!targetUserId) throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');

  const targetObjectId = typeof targetUserId === 'string' ? new mongoose.Types.ObjectId(targetUserId) : targetUserId;

  // Find the customer associated with this user
  const customer = await customerService.findCustomerBySourceUserId(targetObjectId);

  const filter: any = {
    $or: [{ sourceUserId: targetObjectId }],
    isDeleted: false,
  };

  if (customer) filter.$or.push({ customerId: customer._id });

  // Fallback: If no customer link found or to be extra safe, search by authenticated user's email
  if (req.user?.email && targetObjectId.toString() === req.user._id.toString())
    filter.$or.push({ contactEmail: req.user.email.toLowerCase() });

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.populate =
    'tourId;tourId.tourType;tourId.itinerary.hotelId;tourId.itinerary.activities;customerId;departureCityId';
  options.sortBy = options.sortBy || 'createdAt:desc';

  const result = await bookingService.queryBookings(filter, options);
  console.log('Fetching bookings for:', { targetUserId, targetEmail: req.user?.email, customerId: customer?._id });
  console.log('Filter used:', JSON.stringify(filter, null, 2));
  console.log('Results found:', result.results.length);
  sendSuccessResponse(res, result, responseCodes['BookingResponseCodes']!.SUCCESS, 'My bookings fetched successfully');
});

export const getBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params['bookingId'] || '';
  const booking = await bookingService.getBookingById(bookingId);

  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  // Ownership check: Allow if admin or if the user is linked to the booking
  const user = req.user as any;
  const userRole = user?.role?.code || user?.roleId?.code;
  const isAdmin = userRole === 'SUPER_ADMIN';

  const isOwner =
    booking.sourceUserId?.toString() === user?._id?.toString() ||
    booking.contactEmail?.toLowerCase() === user?.email?.toLowerCase();

  if (!isAdmin && !isOwner) {
    // Further check via customer link
    const customer = await customerService.findCustomerBySourceUserId(user?._id);
    const isCustomerOwner = customer && booking.customerId?.toString() === customer._id.toString();

    if (!isCustomerOwner) throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to view this booking');
  }

  sendSuccessResponse(res, booking, responseCodes['BookingResponseCodes']!.SUCCESS, 'Booking fetched successfully');
});

export const getBookingByRef = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingByRef(req.params['bookingRef'] || '');
  sendSuccessResponse(res, booking, responseCodes['BookingResponseCodes']!.SUCCESS, 'Booking fetched successfully');
});

export const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.updateBooking(req.params['bookingId'] || '', req.body);
  sendSuccessResponse(res, booking, responseCodes['BookingResponseCodes']!.SUCCESS, 'Booking updated successfully');
});

export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.cancelBooking(req.params['bookingId'] || '', req.body.reason, req.user?._id);
  sendSuccessResponse(res, booking, responseCodes['BookingResponseCodes']!.SUCCESS, 'Booking cancelled successfully');
});

export const deleteBooking = catchAsync(async (req: Request, res: Response) => {
  await bookingService.deleteBooking(req.params['bookingId'] || '');
  sendSuccessResponse(res, null, responseCodes['BookingResponseCodes']!.SUCCESS, 'Booking deleted successfully');
});

export const getTourBookings = catchAsync(async (req: Request, res: Response) => {
  const filter = {
    tourId: req.params['tourId'],
    isDeleted: false,
  };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.populate = 'tourId;tourId.tourType;customerId;sourceUserId;departureCityId';

  const result = await bookingService.queryBookings(filter, options);
  sendSuccessResponse(res, result, responseCodes['BookingResponseCodes']!.SUCCESS, 'Tour bookings fetched successfully');
});
