import Joi from 'joi';

import { applicationStatuses } from '@/shared/constants/enum.constant.js';
import { objectId } from '@/shared/validations/custom.validation.js';

export const getApplications = {
  query: Joi.object().keys({
    search: Joi.string().allow('').optional(),
    appliedJob: Joi.string().custom(objectId).optional(),
    status: Joi.string()
      .valid(...applicationStatuses)
      .optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

export const getApplication = {
  params: Joi.object().keys({
    applicationId: Joi.string().custom(objectId),
  }),
};

export const updateApplicationStatus = {
  params: Joi.object().keys({
    applicationId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(...applicationStatuses),
  }),
};

export const deleteApplication = {
  params: Joi.object().keys({
    applicationId: Joi.string().custom(objectId),
  }),
};

/**
 * Public: submit application from website
 */
export const submitApplication = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().min(2).max(100),
    email: Joi.string().required().email().trim(),
    phone: Joi.string().allow('').optional().trim(),
    experience: Joi.string().allow('').optional().trim(),
    appliedJob: Joi.string().required().custom(objectId),
    coverLetter: Joi.string().allow('').optional(),
    resume: Joi.string().uri().allow('').optional(),
  }),
};
