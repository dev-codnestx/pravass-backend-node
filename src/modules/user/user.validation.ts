import Joi from 'joi';

import { objectId, password } from '@/shared/validations/custom.validation.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const statusSchema = Joi.string().valid('active', 'inactive', 'locked', 'Active', 'Inactive', 'Locked');

const createUserBody = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  roleId: Joi.string().required().custom(objectId),
  status: statusSchema.required(),
  avatarUrl: Joi.string().allow(''),
};

export const createUser = {
  body: generateJoiValidation(createUserBody),
};

export const getUsers = {
  query: generateJoiValidation(
    {
      name: Joi.string(),
      search: Joi.string().allow(''),
      role: Joi.string(),
      roleId: Joi.string().custom(objectId),
      sortBy: Joi.string(),
      projectBy: Joi.string(),
      populate: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    },
    { allowUnknown: true },
  ),
};

export const getUser = {
  params: generateJoiValidation({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateUser = {
  params: generateJoiValidation({
    userId: Joi.required().custom(objectId),
  }),
  body: generateJoiValidation(
    {
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      phone: Joi.string(),
      roleId: Joi.string().custom(objectId),
      status: statusSchema,
      avatarUrl: Joi.string().allow(''),
    },
    { minFields: 1 },
  ),
};

export const deleteUser = {
  params: generateJoiValidation({
    userId: Joi.string().custom(objectId),
  }),
};
