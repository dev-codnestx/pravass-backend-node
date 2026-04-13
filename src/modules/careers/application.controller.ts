import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { applicationService } from './index.js';

export const getApplications = catchAsync(async (req: Request, res: Response) => {
  const filter = applicationService.buildApplicationFilter(req.query);
  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await applicationService.queryApplications(filter, options);
  res.success(result, responseCodes.ApplicationResponseCodes.SUCCESS, 'Applications fetched successfully');
});

export const getApplication = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['applicationId'] === 'string') {
    const application = await applicationService.getApplicationById(req.params['applicationId']);
    if (!application) throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');

    res.success({ application }, responseCodes.ApplicationResponseCodes.SUCCESS, 'Application fetched successfully');
  }
});

export const updateApplicationStatus = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['applicationId'] === 'string') {
    const application = await applicationService.updateApplicationStatus(req.params['applicationId'], req.body);
    res.success({ application }, responseCodes.ApplicationResponseCodes.SUCCESS, 'Application status updated successfully');
  }
});

export const deleteApplication = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['applicationId'] === 'string') {
    await applicationService.deleteApplicationById(req.params['applicationId']);
    res.success(null, responseCodes.ApplicationResponseCodes.SUCCESS, 'Application deleted successfully');
  }
});

/**
 * Public: submit a new application from the website (no auth required)
 */
export const submitApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await applicationService.createApplication(req.body);
  res
    .status(httpStatus.CREATED)
    .success({ application }, responseCodes.ApplicationResponseCodes.SUCCESS, 'Application submitted successfully');
});
