import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { masterModels } from '@/modules/masters/models/master.models.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';

import { tourService } from './tour.service.js';
import { Types } from 'mongoose';

const createTour = catchAsync(async (req: Request, res: Response) => {
  const tour = await tourService.createTour(req.body);
  return res.success(tour, 200, 'Tour created successfully');
});

const getTours = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, [
    'name',
    'destination',
    'status',
    'tourType',
    'tourCategory',
    'difficulty',
    'code',
    'tourScope',
    'departureCity',
    'budget',
    'rating',
    'duration',
  ]);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    const matchedDestinations = await masterModels.destinations
      .find({ name: searchRegex, deletedAt: null })
      .select('_id')
      .lean();
    const destinationIds = matchedDestinations.map((item) => item._id);
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { description: searchRegex },
      ...(destinationIds.length > 0 ? [{ destinationIds: { $in: destinationIds } }] : []),
    ];
  }
  // Sort mapping
  if (req.query.sort) {
    if (req.query.sort === 'price-asc') options.sortBy = 'price:asc';
    else if (req.query.sort === 'price-desc') options.sortBy = 'price:desc';
    else if (req.query.sort === 'popularity') options.sortBy = 'bookings:desc';
  } else if (req.query.sortBy) {
    options.sortBy = req.query.sortBy as string;
  }

  if (req.query.tourScope) filter.tourCategory = req.query.tourScope;
  else if (req.query.tourCategory) filter.tourCategory = req.query.tourCategory;

  // 1. Destination
  if (req.query.destination) {
    const destValues = (req.query.destination as string).split(',');
    const validIds = destValues.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) filter.destinationIds = { $in: validIds };
  }

  // 2. Departure City
  if (req.query.departureCity) {
    const deptValues = (req.query.departureCity as string).split(',');
    const validIds = deptValues.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) filter.departureCities = { $in: validIds };
  }

  // 3. Tour Type
  if (req.query.tourType) {
    const typeValues = (req.query.tourType as string).split(',');
    const validIds = typeValues.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) filter.tourType = { $in: validIds };
  }

  // 4. Budget
  if (req.query.budget) {
    const [min, max] = (req.query.budget as string).split('-').map(Number);
    filter.price = { $gte: min };
    if (max) filter.price.$lte = max;
  }

  // 5. Rating
  if (req.query.rating) {
    const minRating = Number(req.query.rating);
    filter.ratings = { $gte: minRating };
  }

  // 6. Duration
  if (req.query.duration) {
    const ranges = (req.query.duration as string).split(',');
    const durationRegexPatterns = ranges
      .map((range) => {
        if (range === '1-3') return '([1-3])N';
        if (range === '4-6') return '([4-6])N';
        if (range === '7-10') return '([7-9]|10)N';
        if (range === '10+') return '(1[1-9]|[2-9][0-9])N';
        return '';
      })
      .filter(Boolean);

    if (durationRegexPatterns.length > 0) filter.duration = { $regex: durationRegexPatterns.join('|') };
  }
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
