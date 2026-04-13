import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { jobService } from './index.js';

export const createJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.createJob({
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });
  res.status(httpStatus.CREATED).success({ job }, responseCodes.JobResponseCodes.SUCCESS, 'Job created successfully');
});

export const getJobs = catchAsync(async (req: Request, res: Response) => {
  const filter = jobService.buildJobFilter(req.query);
  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await jobService.queryJobs(filter, options);
  res.success(result, responseCodes.JobResponseCodes.SUCCESS, 'Jobs fetched successfully');
});

export const getJob = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['jobId'] === 'string') {
    const job = await jobService.getJobById(req.params['jobId']);
    if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');

    res.success({ job }, responseCodes.JobResponseCodes.SUCCESS, 'Job fetched successfully');
  }
});

export const updateJob = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['jobId'] === 'string') {
    const job = await jobService.updateJobById(req.params['jobId'], {
      ...req.body,
      updatedBy: req.user.id,
    });
    res.success({ job }, responseCodes.JobResponseCodes.SUCCESS, 'Job updated successfully');
  }
});

export const deleteJob = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['jobId'] === 'string') {
    await jobService.deleteJobById(req.params['jobId']);
    res.success(null, responseCodes.JobResponseCodes.SUCCESS, 'Job deleted successfully');
  }
});

export const toggleStatus = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['jobId'] === 'string') {
    const job = await jobService.toggleJobStatus(req.params['jobId'], req.user.id);
    res.success({ job }, responseCodes.JobResponseCodes.SUCCESS, 'Job status toggled successfully');
  }
});
