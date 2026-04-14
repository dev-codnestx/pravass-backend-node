import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import responseCode from '@/shared/utils/responseCode/responseCode.js';
import { testimonialService } from './testimonial.service.js';

const createTestimonial = catchAsync(async (req: Request, res: Response) => {
  const testimonial = await testimonialService.createTestimonial(req.body);
  return res
    .status(httpStatus.CREATED)
    .success(testimonial, responseCode.TestimonialResponseCodes?.SUCCESS || 200, 'Testimonial created successfully');
});

const getTestimonials = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['customerName', 'tour', 'status', 'isFeatured', 'isDeleted']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.search) filter.customerName = { $regex: req.query.search, $options: 'i' };

  const result = await testimonialService.queryTestimonials(filter, options);
  return res.success(result, responseCode.TestimonialResponseCodes?.SUCCESS || 200, 'Testimonials fetched successfully');
});

const getTestimonial = catchAsync(async (req: Request, res: Response) => {
  const testimonial = await testimonialService.getTestimonialById(req.params.testimonialId);
  if (!testimonial) return res.status(httpStatus.NOT_FOUND).error('Testimonial not found');

  return res.success(testimonial, responseCode.TestimonialResponseCodes?.SUCCESS || 200, 'Testimonial fetched successfully');
});

const updateTestimonial = catchAsync(async (req: Request, res: Response) => {
  const testimonial = await testimonialService.updateTestimonialById(req.params.testimonialId, req.body);
  return res.success(testimonial, responseCode.TestimonialResponseCodes?.SUCCESS || 200, 'Testimonial updated successfully');
});

const deleteTestimonial = catchAsync(async (req: Request, res: Response) => {
  await testimonialService.deleteTestimonialById(req.params.testimonialId);
  return res.success(null, responseCode.TestimonialResponseCodes?.SUCCESS || 200, 'Testimonial deleted successfully');
});

export const testimonialController = {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
