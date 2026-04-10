import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';

const statusSchema = Joi.alternatives().try(Joi.string().valid('active', 'inactive', 'Active', 'Inactive'), Joi.boolean());

const idParams = Joi.object().keys({
  id: Joi.string().required().custom(objectId),
});

export const mastersValidation = {
  listMasters: {
    query: Joi.object()
      .keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().allow(''),
        status: statusSchema,
      })
      .unknown(true),
  },

  createMaster: {
    body: Joi.object()
      .keys({
        name: Joi.string().trim().required(),
        status: statusSchema,
        createdBy: Joi.string().custom(objectId),
        updatedBy: Joi.string().custom(objectId),
      })
      .unknown(true),
  },

  getMasterById: {
    params: idParams,
  },

  updateMaster: {
    params: idParams,
    body: Joi.object()
      .keys({
        name: Joi.string().trim(),
        status: statusSchema,
        updatedBy: Joi.string().custom(objectId),
      })
      .min(1)
      .unknown(true),
  },

  deleteMaster: {
    params: idParams,
  },
};
