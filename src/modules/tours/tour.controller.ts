import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';

import { tourService } from './tour.service.js';
import { processTourQuery } from './tour.helper.js';

const createTour = catchAsync(async (req: Request, res: Response) => {
  const tour = await tourService.createTour(req.body);
  return res.success(tour, 200, 'Tour created successfully');
});

const getTours = catchAsync(async (req: Request, res: Response) => {
  const { filter, options } = await processTourQuery(req.query, req.headers);
  const result = await tourService.queryTours(filter, options);
  return res.success(result, 200, 'Tours fetched successfully');
});

const getTour = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ['populate', 'fields']);
  const tour = await tourService.getTourById(req.params.tourId, options);
  if (!tour) return res.status(httpStatus.NOT_FOUND).error('Tour not found');
  return res.success(tour, 200, 'Tour fetched successfully');
});

const updateTour = catchAsync(async (req: Request, res: Response) => {
  const tour = await tourService.updateTourById(req.params.tourId, req.body);
  return res.success(tour, 200, 'Tour updated successfully');
});

const deleteTour = catchAsync(async (req: Request, res: Response) => {
  await tourService.deleteTourById(req.params.tourId);
  return res.success(null, 200, 'Tour deleted successfully');
});

const duplicateTour = catchAsync(async (req: Request, res: Response) => {
  const tour = await tourService.duplicateTourById(req.params.tourId);
  return res.success(tour, 200, 'Tour duplicated successfully');
});

export const tourController = {
  createTour,
  getTours,
  getTour,
  updateTour,
  deleteTour,
  duplicateTour,
};
