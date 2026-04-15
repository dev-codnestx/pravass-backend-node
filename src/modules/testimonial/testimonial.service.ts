import httpStatus from 'http-status';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { ITestimonial, ITestimonialDoc } from './testimonial.interfaces.js';
import Testimonial from './testimonial.model.js';
import { IOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

/**
 * Create a testimonial
 * @param {ITestimonial} testimonialBody
 * @returns {Promise<ITestimonialDoc>}
 */
const createTestimonial = async (testimonialBody: ITestimonial): Promise<ITestimonialDoc> =>
  Testimonial.create(testimonialBody);

/**
 * Query for testimonials
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryTestimonials = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const testimonials = await Testimonial.paginate({ ...filter, isDeleted: false }, options);
  return testimonials;
};

/**
 * Get testimonial by id
 * @param {string} id
 * @returns {Promise<ITestimonialDoc | null>}
 */
const getTestimonialById = async (id: string): Promise<ITestimonialDoc | null> =>
  Testimonial.findOne({ _id: id, isDeleted: false });

/**
 * Update testimonial by id
 * @param {string} testimonialId
 * @param {Partial<ITestimonial>} updateBody
 * @returns {Promise<ITestimonialDoc>}
 */
const updateTestimonialById = async (testimonialId: string, updateBody: Partial<ITestimonial>): Promise<ITestimonialDoc> => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');

  Object.assign(testimonial, updateBody);
  await testimonial.save();
  return testimonial;
};

/**
 * Delete testimonial by id (Soft Delete)
 * @param {string} testimonialId
 * @returns {Promise<ITestimonialDoc>}
 */
const deleteTestimonialById = async (testimonialId: string): Promise<ITestimonialDoc> => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');

  testimonial.isDeleted = true;
  testimonial.status = 'Inactive';
  await testimonial.save();
  return testimonial;
};

export const testimonialService = {
  createTestimonial,
  queryTestimonials,
  getTestimonialById,
  updateTestimonialById,
  deleteTestimonialById,
};
