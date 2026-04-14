import httpStatus from 'http-status';

import ApiError from '@/shared/utils/errors/ApiError.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import { IApplication, IApplicationDoc } from './application.interfaces.js';
import ApplicationModel from './application.model.js';
import JobModel from './job.model.js';

/**
 * Create an application (public — from website)
 * Also increments totalApplications on the related Job.
 * @param {IApplication} applicationBody
 * @returns {Promise<IApplicationDoc>}
 */
const createApplication = async (applicationBody: IApplication): Promise<IApplicationDoc> => {
  // Validate that the job exists and is active
  const job = await JobModel.findOne({ _id: applicationBody.appliedJob, isDeleted: false });
  if (!job) throw new ApiError(httpStatus.BAD_REQUEST, 'The selected job does not exist');

  if (job.status !== 'Active') throw new ApiError(httpStatus.BAD_REQUEST, 'This job is no longer accepting applications');

  const application = await ApplicationModel.create(applicationBody);

  // Increment totalApplications counter on the Job
  await JobModel.findByIdAndUpdate(applicationBody.appliedJob, { $inc: { totalApplications: 1 } });

  return application;
};

/**
 * Query for applications
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryApplications = async (filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult> =>
  ApplicationModel.paginate(filter, { ...options, populate: 'appliedJob:title,department,location' });

/**
 * Get application by id
 * @param {string} id
 * @returns {Promise<IApplicationDoc | null>}
 */
const getApplicationById = async (id: string): Promise<IApplicationDoc | null> =>
  ApplicationModel.findById(id).populate('appliedJob', 'title department location');

/**
 * Update application status
 * @param {string} applicationId
 * @param {Partial<IApplication>} updateBody
 * @returns {Promise<IApplicationDoc | null>}
 */
const updateApplicationById = async (
  applicationId: string,
  updateBody: Partial<IApplication>,
): Promise<IApplicationDoc | null> => {
  const application = await ApplicationModel.findById(applicationId);
  if (!application) throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');
  Object.assign(application, updateBody);
  await application.save();
  return application;
};

/**
 * Delete application by id
 * @param {string} applicationId
 * @returns {Promise<IApplicationDoc | null>}
 */
const deleteApplicationById = async (applicationId: string): Promise<IApplicationDoc | null> => {
  const application = await ApplicationModel.findById(applicationId);
  if (!application) throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');

  // Decrement totalApplications counter on the Job
  await JobModel.findByIdAndUpdate(application.appliedJob, { $inc: { totalApplications: -1 } });

  await application.deleteOne();
  return application;
};

export const applicationService = {
  createApplication,
  queryApplications,
  getApplicationById,
  updateApplicationById,
  deleteApplicationById,
};
