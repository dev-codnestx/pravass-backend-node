import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import responseCode from '@/shared/utils/responseCode/responseCode.js';

import { applicationService } from './application.service.js';

const createApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await applicationService.createApplication(req.body);
  return res
    .status(httpStatus.CREATED)
    .success(application, responseCode.ApplicationResponseCodes?.SUCCESS || 200, 'Application submitted successfully');
});

const getApplications = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'email', 'appliedJob', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.search)
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];

  const result = await applicationService.queryApplications(filter, options);
  return res.success(result, responseCode.ApplicationResponseCodes?.SUCCESS || 200, 'Applications fetched successfully');
});

const getApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await applicationService.getApplicationById(req.params.applicationId);
  if (!application) return res.status(httpStatus.NOT_FOUND).error('Application not found');
  return res.success(application, responseCode.ApplicationResponseCodes?.SUCCESS || 200, 'Application fetched successfully');
});

const updateApplication = catchAsync(async (req: Request, res: Response) => {
  const application = await applicationService.updateApplicationById(req.params.applicationId, req.body);
  return res.success(application, responseCode.ApplicationResponseCodes?.SUCCESS || 200, 'Application updated successfully');
});

const deleteApplication = catchAsync(async (req: Request, res: Response) => {
  await applicationService.deleteApplicationById(req.params.applicationId);
  return res.success(null, responseCode.ApplicationResponseCodes?.SUCCESS || 200, 'Application deleted successfully');
});

export const applicationController = {
  createApplication,
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
};
