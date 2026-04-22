import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const statusSchema = Joi.alternatives().try(Joi.string().valid('active', 'inactive', 'Active', 'Inactive'), Joi.boolean());

const idParams = generateJoiValidation({
  id: Joi.string().required().custom(objectId),
});

export const mastersValidation = {
  listMasters: {
    query: generateJoiValidation(
      {
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().allow(''),
        populate: Joi.string().allow(''),
        status: statusSchema,
      },
      { allowUnknown: true },
    ),
  },

  createMaster: {
    body: generateJoiValidation(
      {
        name: Joi.string().trim().required(),
        status: statusSchema,
        createdBy: Joi.string().custom(objectId),
        updatedBy: Joi.string().custom(objectId),
      },
      { allowUnknown: true },
    ),
  },

  getMasterById: {
    params: idParams,
  },

  updateMaster: {
    params: idParams,
    body: generateJoiValidation(
      {
        name: Joi.string().trim(),
        status: statusSchema,
        updatedBy: Joi.string().custom(objectId),
      },
      { minFields: 1, allowUnknown: true },
    ),
  },

  deleteMaster: {
    params: idParams,
  },

  reorderLeadStages: {
    body: generateJoiValidation({
      items: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().required().custom(objectId),
            position: Joi.number().integer().min(1).required(),
          }),
        )
        .min(1)
        .required(),
    }),
  },
};
