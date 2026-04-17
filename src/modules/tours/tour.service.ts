import httpStatus from 'http-status';

import ApiError from '@/shared/utils/errors/ApiError.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import { ITour, ITourDoc } from './tour.interfaces.js';
import TourModel from './tour.model.js';

const createTour = async (tourBody: ITour): Promise<ITourDoc> => TourModel.create(tourBody);

const queryTours = async (filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult> =>
  TourModel.paginate({ ...filter, isDeleted: false }, options);

const getTourById = async (id: string): Promise<ITourDoc | null> => TourModel.findOne({ _id: id, isDeleted: false });

const updateTourById = async (tourId: string, updateBody: Partial<ITour>): Promise<ITourDoc | null> => {
  const tour = await getTourById(tourId);
  if (!tour) throw new ApiError(httpStatus.NOT_FOUND, 'Tour not found');
  Object.assign(tour, updateBody);
  await tour.save();
  return tour;
};

const deleteTourById = async (tourId: string): Promise<ITourDoc | null> => {
  const tour = await getTourById(tourId);
  if (!tour) throw new ApiError(httpStatus.NOT_FOUND, 'Tour not found');
  tour.isDeleted = true;
  tour.status = 'archived';
  await tour.save();
  return tour;
};

export const tourService = {
  createTour,
  queryTours,
  getTourById,
  updateTourById,
  deleteTourById,
};
