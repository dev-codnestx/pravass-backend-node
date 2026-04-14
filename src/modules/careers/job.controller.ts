import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import responseCode from '@/shared/utils/responseCode/responseCode.js';

import { jobService } from './job.service.js';

const createJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.createJob(req.body);
  return res
    .status(httpStatus.CREATED)
    .success(job, responseCode.JobResponseCodes?.SUCCESS || 200, 'Job created successfully');
});

const getJobs = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['title', 'department', 'status', 'isDeleted']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const result = await jobService.queryJobs(filter, options);
  return res.success(result, responseCode.JobResponseCodes?.SUCCESS || 200, 'Jobs fetched successfully');
});

const getJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.getJobById(req.params.jobId);
  if (!job) return res.status(httpStatus.NOT_FOUND).error('Job not found');
  return res.success(job, responseCode.JobResponseCodes?.SUCCESS || 200, 'Job fetched successfully');
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.updateJobById(req.params.jobId, req.body);
  return res.success(job, responseCode.JobResponseCodes?.SUCCESS || 200, 'Job updated successfully');
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
  await jobService.deleteJobById(req.params.jobId);
  return res.success(null, responseCode.JobResponseCodes?.SUCCESS || 200, 'Job deleted successfully');
});

const toggleStatus = catchAsync(async (req: Request, res: Response) => {
  const job = await jobService.toggleJobStatus(req.params.jobId);
  return res.success(job, responseCode.JobResponseCodes?.SUCCESS || 200, 'Job status toggled successfully');
});

export const jobController = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  toggleStatus,
};
