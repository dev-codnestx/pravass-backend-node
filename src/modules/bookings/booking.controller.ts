import { Request, Response } from 'express';

import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
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

  // Security: Ensure users only see their own bookings unless they are an admin
  // For the website 'my' endpoint, we typically strictly enforce the token's user.
  const customer = await customerService.findCustomerBySourceUserId(targetUserId);
  const filter = {
    $or: [{ sourceUserId: targetUserId }],
    isDeleted: false,
  };

  if (customer) (filter.$or as any).push({ customerId: customer._id });

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  options.populate = 'tourId;tourId.tourType';
  options.sortBy = options.sortBy || 'createdAt:desc';

  const result = await bookingService.queryBookings(filter, options);
  sendSuccessResponse(res, result, responseCodes['BookingResponseCodes']!.SUCCESS, 'My bookings fetched successfully');
});

export const getBooking = catchAsync(async (req: Request, res: Response) => {
  const booking = await bookingService.getBookingById(req.params['bookingId'] || '');
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
