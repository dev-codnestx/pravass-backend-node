import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';

import { specialityTourService } from './specialityTour.service.js';

const createSpecialityTour = catchAsync(async (req: Request, res: Response) => {
  const specialityTour = await specialityTourService.createSpecialityTour({
    ...req.body,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  return res.status(httpStatus.CREATED).success(specialityTour, 200, 'Speciality tour created successfully');
});

const getSpecialityTours = catchAsync(async (req: Request, res: Response) => {
  const filter = specialityTourService.buildSpecialityTourFilter(req.query);
  const options: PaginateOptions = pick(req.query, [
    'sortBy',
    'limit',
    'page',
    'projectBy',
    'populate',
    'fields',
    'includeTimeStamps',
  ]);

  const result = await specialityTourService.querySpecialityTours(filter, options);

  return res.success(result, 200, 'Speciality tours fetched successfully');
});

const getSpecialityTour = catchAsync(async (req: Request, res: Response) => {
  const specialityTour = await specialityTourService.getSpecialityTourById(req.params.specialityTourId);

  if (!specialityTour) throw new ApiError(httpStatus.NOT_FOUND, 'Speciality tour not found');

  return res.success(specialityTour, 200, 'Speciality tour fetched successfully');
});

const updateSpecialityTour = catchAsync(async (req: Request, res: Response) => {
  const specialityTour = await specialityTourService.updateSpecialityTourById(req.params.specialityTourId, {
    ...req.body,
    updatedBy: req.user?.id,
  });

  return res.success(specialityTour, 200, 'Speciality tour updated successfully');
});

const deleteSpecialityTour = catchAsync(async (req: Request, res: Response) => {
  await specialityTourService.deleteSpecialityTourById(req.params.specialityTourId);

  return res.success(null, 200, 'Speciality tour deleted successfully');
});

const duplicateSpecialityTour = catchAsync(async (req: Request, res: Response) => {
  const specialityTour = await specialityTourService.duplicateSpecialityTourById(req.params.specialityTourId, req.user?.id);

  return res.success(specialityTour, 200, 'Speciality tour duplicated successfully');
});

const getSpecialityTourBySlug = catchAsync(async (req: Request, res: Response) => {
  const specialityTour = await specialityTourService.getSpecialityTourBySlug(req.params.slug);

  if (!specialityTour) throw new ApiError(httpStatus.NOT_FOUND, 'Speciality tour not found');

  return res.success(specialityTour, 200, 'Speciality tour fetched successfully');
});

export const specialityTourController = {
  createSpecialityTour,
  getSpecialityTours,
  getSpecialityTour,
  updateSpecialityTour,
  deleteSpecialityTour,
  duplicateSpecialityTour,
  getSpecialityTourBySlug,
};
