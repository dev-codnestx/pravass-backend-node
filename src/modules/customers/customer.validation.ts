import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const statusSchema = Joi.string().valid('active', 'inactive', 'locked', 'Active', 'Inactive', 'Locked');

const createCustomer = {
  body: generateJoiValidation({
    fullName: Joi.string().trim().required(),
    sourceUserId: Joi.string().trim().custom(objectId).allow('', null),
    email: Joi.string().trim().email().allow('', null),
    phoneNumber: Joi.string().trim().allow('', null),
    dialCode: Joi.number().integer().default(91),
    address: Joi.string().trim().allow('', null),
    status: statusSchema.default('active'),
    birthdate: Joi.string().trim().allow('', null),
  }),
};

const getCustomers = {
  query: generateJoiValidation(
    {
      search: Joi.string().allow(''),
      status: statusSchema,
      sortBy: Joi.string(),
      projectBy: Joi.string(),
      populate: Joi.string(),
      limit: Joi.number().integer(),
      page: Joi.number().integer(),
    },
    { allowUnknown: true },
  ),
};

const getCustomer = {
  params: generateJoiValidation({
    customerId: Joi.string().custom(objectId),
  }),
};

const updateCustomer = {
  params: generateJoiValidation({
    customerId: Joi.required().custom(objectId),
  }),
  body: generateJoiValidation(
    {
      fullName: Joi.string().trim(),
      sourceUserId: Joi.string().trim().custom(objectId).allow('', null),
      email: Joi.string().trim().email().allow('', null),
      phoneNumber: Joi.string().trim().allow('', null),
      birthdate: Joi.string().trim().allow('', null),
      address: Joi.string().trim().allow('', null),
      dialCode: Joi.number().integer(),
      status: statusSchema,
      profileImage: Joi.string().trim().allow('', null),
    },
    { minFields: 1 },
  ),
};

const updateCustomerStatus = {
  params: generateJoiValidation({
    customerId: Joi.required().custom(objectId),
  }),
  body: generateJoiValidation({
    status: statusSchema.required(),
  }),
};

const deleteCustomer = {
  params: generateJoiValidation({
    customerId: Joi.string().custom(objectId),
  }),
};

export const customerValidation = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  updateCustomerStatus,
  deleteCustomer,
};
