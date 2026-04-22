import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';

import { specialityTourStatuses } from './specialityTour.interfaces.js';

const packageItem = Joi.object({
  id: Joi.string().allow('', null).optional(),
  packageId: Joi.string().trim().required().custom(objectId),
  sortOrder: Joi.number().integer().min(1).required(),
});

const specialityTourBody = {
  title: Joi.string().trim().required(),
  slug: Joi.string().trim().required(),
  description: Joi.string().allow('', null),
  banner: Joi.string().uri().allow('', null),
  status: Joi.string()
    .valid(...specialityTourStatuses)
    .default('Active'),
  packages: Joi.array().items(packageItem).default([]),
};

const createSpecialityTour = {
  body: Joi.object().keys(specialityTourBody),
};

const getSpecialityTours = {
  query: Joi.object().keys({
    search: Joi.string().allow('').optional(),
    status: Joi.string()
      .valid(...specialityTourStatuses)
      .optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
    populate: Joi.string().optional(),
    fields: Joi.string().optional(),
    includeTimeStamps: Joi.boolean().optional(),
  }),
};

const getSpecialityTour = {
  params: Joi.object().keys({
    specialityTourId: Joi.string().required().custom(objectId),
  }),
};

const updateSpecialityTour = {
  params: Joi.object().keys({
    specialityTourId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys(specialityTourBody).min(1),
};

const deleteSpecialityTour = {
  params: Joi.object().keys({
    specialityTourId: Joi.string().required().custom(objectId),
  }),
};

const duplicateSpecialityTour = {
  params: Joi.object().keys({
    specialityTourId: Joi.string().required().custom(objectId),
  }),
};

export const specialityTourValidation = {
  createSpecialityTour,
  getSpecialityTours,
  getSpecialityTour,
  updateSpecialityTour,
  deleteSpecialityTour,
  duplicateSpecialityTour,
};
