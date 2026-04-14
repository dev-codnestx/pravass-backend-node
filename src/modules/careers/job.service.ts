import httpStatus from 'http-status';

import ApiError from '@/shared/utils/errors/ApiError.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { IJob, IJobDoc } from './job.interfaces.js';
import JobModel from './job.model.js';

/**
 * Create a job
 * @param {IJob} jobBody
 * @returns {Promise<IJobDoc>}
 */
const createJob = async (jobBody: IJob): Promise<IJobDoc> => {
  if (await JobModel.isTitleTaken(jobBody.title))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A job with this title already exists',
      undefined,
      true,
      '',
      responseCodes.JobResponseCodes.TITLE_ALREADY_EXISTS,
    );

  return JobModel.create(jobBody);
};

/**
 * Query for jobs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryJobs = async (filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult> =>
  JobModel.paginate({ ...filter, isDeleted: false } as Record<string, unknown>, options);

/**
 * Get job by id
 * @param {string} id
 * @returns {Promise<IJobDoc | null>}
 */
const getJobById = async (id: string): Promise<IJobDoc | null> => JobModel.findOne({ _id: id, isDeleted: false });

/**
 * Update job by id
 * @param {string} jobId
 * @param {Partial<IJob>} updateBody
 * @returns {Promise<IJobDoc | null>}
 */
const updateJobById = async (jobId: string, updateBody: Partial<IJob>): Promise<IJobDoc | null> => {
  const job = await getJobById(jobId);
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');

  if (updateBody.title && updateBody.title !== job.title && (await JobModel.isTitleTaken(updateBody.title, jobId)))
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
 * Delete job by id (soft delete — matches banner pattern)
 * @param {string} jobId
 * @returns {Promise<IJobDoc | null>}
 */
const deleteJobById = async (jobId: string): Promise<IJobDoc | null> => {
  const job = await getJobById(jobId);
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  job.isDeleted = true;
  job.status = 'Closed';
  await job.save();
  return job;
};

/**
 * Toggle job status (Active <-> Closed)
 * @param {string} jobId
 * @returns {Promise<IJobDoc | null>}
 */
const toggleJobStatus = async (jobId: string): Promise<IJobDoc | null> => {
  const job = await getJobById(jobId);
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  job.status = job.status === 'Active' ? 'Closed' : 'Active';
  await job.save();
  return job;
};

export const jobService = {
  createJob,
  queryJobs,
  getJobById,
  updateJobById,
  deleteJobById,
  toggleJobStatus,
};
