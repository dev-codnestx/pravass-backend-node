import Joi from 'joi';

import { jobDepartments, jobStatuses } from '@/shared/constants/enum.constant.js';
import { objectId } from '@/shared/validations/custom.validation.js';

export const createJob = {
  body: Joi.object().keys({
    title: Joi.string().required().trim().min(3).max(200),
    department: Joi.string()
      .required()
      .valid(...jobDepartments),
    location: Joi.string().required().trim().min(2).max(200),
    description: Joi.string().allow('').optional(),
    requirements: Joi.string().allow('').optional(),
    status: Joi.string()
      .valid(...jobStatuses)
      .default('Active'),
  }),
};

export const getJobs = {
  query: Joi.object().keys({
    search: Joi.string().allow('').optional(),
    department: Joi.string()
      .valid(...jobDepartments)
      .optional(),
    status: Joi.string()
      .valid(...jobStatuses)
      .optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

export const getJob = {
  params: Joi.object().keys({
    jobId: Joi.string().custom(objectId),
  }),
};

export const updateJob = {
  params: Joi.object().keys({
    jobId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim().min(3).max(200).optional(),
      department: Joi.string()
        .valid(...jobDepartments)
        .optional(),
      location: Joi.string().trim().min(2).max(200).optional(),
      description: Joi.string().allow('').optional(),
      requirements: Joi.string().allow('').optional(),
      status: Joi.string()
        .valid(...jobStatuses)
        .optional(),
    })
    .min(1),
};

export const deleteJob = {
  params: Joi.object().keys({
    jobId: Joi.string().custom(objectId),
  }),
};

export const toggleStatus = {
  params: Joi.object().keys({
    jobId: Joi.string().custom(objectId),
  }),
};
