/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';

import Job from '@/modules/careers/job.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { CreateJobBody, IJobDoc, UpdateJobBody } from './job.interfaces.js';

/**
 * Create a job
 * @param {CreateJobBody} jobBody
 * @returns {Promise<IJobDoc>}
 */
export const createJob = async (jobBody: CreateJobBody): Promise<IJobDoc> => {
  if (await Job.isTitleTaken(jobBody.title))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A job with this title already exists',
      undefined,
      true,
      '',
      responseCodes.JobResponseCodes.TITLE_ALREADY_EXISTS,
    );

  return Job.create(jobBody);
};

/**
 * Query for jobs with pagination, search, and filters
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryJobs = (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult> =>
  Promise.resolve(Job.paginate(filter, options as any));

/**
 * Get job by id
 * @param {string} jobId
 * @returns {Promise<IJobDoc | null>}
 */
export const getJobById = async (jobId: string): Promise<IJobDoc | null> => Job.findById(jobId);

/**
 * Update job by id
 * @param {string} jobId
 * @param {UpdateJobBody} updateBody
 * @returns {Promise<IJobDoc | null>}
 */
export const updateJobById = async (jobId: string, updateBody: UpdateJobBody): Promise<IJobDoc | null> => {
  const job = await getJobById(jobId);
  if (!job)
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found', undefined, true, '', responseCodes.JobResponseCodes.NOT_FOUND);

  if (updateBody.title && updateBody.title !== job.title && (await Job.isTitleTaken(updateBody.title, jobId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A job with this title already exists',
      undefined,
      true,
      '',
      responseCodes.JobResponseCodes.TITLE_ALREADY_EXISTS,
    );

  Object.assign(job, updateBody);
  await job.save();
  return job;
};

/**
 * Delete job by id
 * @param {string} jobId
 * @returns {Promise<IJobDoc | null>}
 */
export const deleteJobById = async (jobId: string): Promise<IJobDoc | null> => {
  const job = await getJobById(jobId);
  if (!job)
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found', undefined, true, '', responseCodes.JobResponseCodes.NOT_FOUND);

  await job.deleteOne();
  return job;
};

/**
 * Toggle job status (Active <-> Closed)
 * @param {string} jobId
 * @param {string} updatedBy
 * @returns {Promise<IJobDoc | null>}
 */
export const toggleJobStatus = async (jobId: string, updatedBy: any): Promise<IJobDoc | null> => {
  const job = await getJobById(jobId);
  if (!job)
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found', undefined, true, '', responseCodes.JobResponseCodes.NOT_FOUND);

  job.status = job.status === 'Active' ? 'Closed' : 'Active';
  job.updatedBy = updatedBy;

  await job.save();
  return job;
};

/**
 * Build filter from query params for job listing
 * @param {Record<string, any>} query
 * @returns {Record<string, any>}
 */
export const buildJobFilter = (query: Record<string, any>): Record<string, any> => {
  const filter: Record<string, any> = {};

  if (query.search)
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { department: { $regex: query.search, $options: 'i' } },
      { location: { $regex: query.search, $options: 'i' } },
    ];

  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;

  return filter;
};
