import Joi from 'joi';

const createTestimonial = {
  body: Joi.object().keys({
    customerName: Joi.string().required(),
    customerPhoto: Joi.string().allow('', null),
    tour: Joi.string().required(),
    rating: Joi.number().required().min(1).max(5),
    testimonial: Joi.string().required(),
    isFeatured: Joi.boolean(),
    status: Joi.string().valid('Active', 'Inactive'),
    createdBy: Joi.string(),
    updatedBy: Joi.string(),
  }),
};

const getTestimonials = {
  query: Joi.object().keys({
    customerName: Joi.string(),
    tour: Joi.string(),
    status: Joi.string(),
    isFeatured: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
  }),
};

const getTestimonial = {
  params: Joi.object().keys({
    testimonialId: Joi.string().required(),
  }),
};

const updateTestimonial = {
  params: Joi.object().keys({
    testimonialId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      customerName: Joi.string(),
      customerPhoto: Joi.string().allow('', null),
      tour: Joi.string(),
      rating: Joi.number().min(1).max(5),
      testimonial: Joi.string(),
      isFeatured: Joi.boolean(),
      status: Joi.string().valid('Active', 'Inactive'),
      updatedBy: Joi.string(),
    })
    .min(1),
};

const deleteTestimonial = {
  params: Joi.object().keys({
    testimonialId: Joi.string().required(),
  }),
};

export const testimonialValidation = {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
