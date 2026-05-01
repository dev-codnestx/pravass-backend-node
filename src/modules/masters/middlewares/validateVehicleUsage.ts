import type { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { TourModel } from '@/modules/tours/tour.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import catchAsync from '@/shared/utils/catchAsync.js';

/**
 * Middleware to check if a vehicle is currently assigned to any tour departures.
 * If assigned, prevents modification of seat-related fields.
 */
export const validateVehicleUsage = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const { id } = req.params;
  const payload = req.body as Record<string, unknown>;

  // Only check if seat-related fields are being modified
  const isModifyingLayout =
    payload.seatLayout !== undefined || payload.totalSeats !== undefined || payload.layoutType !== undefined;

  if (!isModifyingLayout) return next();

  // Check if vehicle is used in any active/upcoming tour departures
  const isUsed = await TourModel.exists({
    'departures.vehicleId': id,
    isDeleted: false,
  });

  if (isUsed)
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'This vehicle is currently assigned to one or more active tours. You cannot modify its seat layout or capacity until it is removed from those tours.',
    );

  next();
});
