/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';

import Application from '@/modules/careers/application.model.js';
import Job from '@/modules/careers/job.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { CreateApplicationBody, IApplicationDoc, UpdateApplicationStatusBody } from './application.interfaces.js';

/**
 * Create an application (public — from website)
 * Also increments totalApplications on the related Job.
 * @param {CreateApplicationBody} body
 * @returns {Promise<IApplicationDoc>}
 */
export const createApplication = async (body: CreateApplicationBody): Promise<IApplicationDoc> => {
  // Validate that the job exists and is active
  const job = await Job.findById(body.appliedJob);
  if (!job)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'The selected job does not exist',
      undefined,
      true,
      '',
      responseCodes.ApplicationResponseCodes.NOT_FOUND,
    );

  if (job.status !== 'Active')
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This job is no longer accepting applications',
      undefined,
      true,
      '',
      responseCodes.ApplicationResponseCodes.ERROR,
    );

  const application = await Application.create(body);

  // Increment totalApplications counter on the Job
  await Job.findByIdAndUpdate(body.appliedJob, { $inc: { totalApplications: 1 } });

  return application;
};

/**
 * Query for applications with pagination
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryApplications = (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult> =>
  Promise.resolve(Application.paginate(filter, { ...options, populate: 'appliedJob:title,department,location' } as any));

/**
 * Get application by id
 * @param {string} applicationId
 * @returns {Promise<IApplicationDoc | null>}
 */
export const getApplicationById = async (applicationId: string): Promise<IApplicationDoc | null> =>
  Application.findById(applicationId).populate('appliedJob', 'title department location');

/**
 * Update application status
 * @param {string} applicationId
 * @param {UpdateApplicationStatusBody} updateBody
 * @returns {Promise<IApplicationDoc | null>}
 */
export const updateApplicationStatus = async (
  applicationId: string,
  updateBody: UpdateApplicationStatusBody,
): Promise<IApplicationDoc | null> => {
  const application = await Application.findById(applicationId);
  if (!application)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Application not found',
      undefined,
      true,
      '',
      responseCodes.ApplicationResponseCodes.NOT_FOUND,
    );

  application.status = updateBody.status;
  await application.save();
  return application;
};

/**
 * Delete application by id
 * @param {string} applicationId
 * @returns {Promise<IApplicationDoc | null>}
 */
export const deleteApplicationById = async (applicationId: string): Promise<IApplicationDoc | null> => {
  const application = await Application.findById(applicationId);
  if (!application)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Application not found',
      undefined,
      true,
      '',
      responseCodes.ApplicationResponseCodes.NOT_FOUND,
    );

  // Decrement totalApplications counter on the Job
  await Job.findByIdAndUpdate(application.appliedJob, { $inc: { totalApplications: -1 } });

  await application.deleteOne();
  return application;
};

/**
 * Build filter from query params for application listing
 * @param {Record<string, any>} query
 * @returns {Record<string, any>}
 */
export const buildApplicationFilter = (query: Record<string, any>): Record<string, any> => {
  const filter: Record<string, any> = {};

  if (query.search)
    filter.$or = [{ name: { $regex: query.search, $options: 'i' } }, { email: { $regex: query.search, $options: 'i' } }];

  if (query.appliedJob) filter.appliedJob = query.appliedJob;
  if (query.status) filter.status = query.status;

  return filter;
};
