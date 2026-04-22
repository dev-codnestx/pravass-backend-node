import Joi from 'joi';

import { objectId, password } from '@/shared/validations/custom.validation.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const statusSchema = Joi.string().valid('active', 'inactive', 'locked', 'Active', 'Inactive', 'Locked');

const createUserBody = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  fullName: Joi.string().required(),
  phoneNumber: Joi.number().required(),
  dialCode: Joi.number().integer().default(91),
  roleId: Joi.string().required().custom(objectId),
  status: statusSchema.required(),
  profileImage: Joi.string().allow(''),
};

export const createUser = {
  body: generateJoiValidation(createUserBody),
};

export const getUsers = {
  query: generateJoiValidation(
    {
      name: Joi.string(),
      search: Joi.string().allow(''),
      status: statusSchema,
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
      fullName: Joi.string(),
      phoneNumber: Joi.string(),
      birthdate: Joi.string().allow(''),
      address: Joi.string().allow(''),
      dialCode: Joi.number().integer(),
      roleId: Joi.string().custom(objectId),
      status: statusSchema,
      profileImage: Joi.string().allow(''),
    },
    { minFields: 1 },
  ),
};

export const deleteUser = {
  params: generateJoiValidation({
    userId: Joi.string().custom(objectId),
  }),
};

export const resendCredentials = {
  params: generateJoiValidation({
    userId: Joi.string().custom(objectId),
  }),
};
