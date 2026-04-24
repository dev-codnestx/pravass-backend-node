import Joi from 'joi';

import { applicationStatuses } from '@/shared/constants/enum.constant.js';

const getApplications = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string(),
    appliedJob: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
  }),
};

const getApplication = {
  params: Joi.object().keys({
    applicationId: Joi.string().required(),
  }),
};

const updateApplication = {
  params: Joi.object().keys({
    applicationId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .required()
      .valid(...applicationStatuses),
  }),
};

const deleteApplication = {
  params: Joi.object().keys({
    applicationId: Joi.string().required(),
  }),
};

const submitApplication = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().min(2).max(100),
    email: Joi.string().required().email().trim(),
    phone: Joi.string().allow('').optional().trim(),
    experience: Joi.string().allow('').optional().trim(),
    appliedJob: Joi.string().required(),
    coverLetter: Joi.string().allow('').optional(),
    resume: Joi.string().allow('').optional(),
  }),
};

export const applicationValidation = {
  getApplications,
  getApplication,
  updateApplication,
  deleteApplication,
  submitApplication,
};
