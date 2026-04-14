import Joi from 'joi';

import { jobDepartments, jobStatuses } from '@/shared/constants/enum.constant.js';

const createJob = {
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

const getJobs = {
  query: Joi.object().keys({
    title: Joi.string(),
    department: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
  }),
};

const getJob = {
  params: Joi.object().keys({
    jobId: Joi.string().required(),
  }),
};

const updateJob = {
  params: Joi.object().keys({
    jobId: Joi.string().required(),
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

const deleteJob = {
  params: Joi.object().keys({
    jobId: Joi.string().required(),
  }),
};

const toggleStatus = {
  params: Joi.object().keys({
    jobId: Joi.string().required(),
  }),
};

export const jobValidation = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  toggleStatus,
};
