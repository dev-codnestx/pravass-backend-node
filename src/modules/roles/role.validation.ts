import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const statusSchema = Joi.string().valid('active', 'inactive', 'Active', 'Inactive');

const permissionSchema = generateJoiValidation(
  {
    module: Joi.string().trim().required(),
    actions: Joi.array().items(Joi.string().trim().required()).min(1).required(),
  },
  { allowUnknown: true },
);

const roleIdParams = generateJoiValidation({
  roleId: Joi.string().required().custom(objectId),
});

export const roleValidation = {
  listRoles: {
    query: generateJoiValidation(
      {
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100),
        search: Joi.string().allow(''),
        name: Joi.string().allow(''),
        status: statusSchema,
      },
      { allowUnknown: true },
    ),
  },

  createRole: {
    body: generateJoiValidation(
      {
        name: Joi.string().trim().min(1).required(),
        code: Joi.string().trim().min(1),
        description: Joi.string().allow('').trim(),
        status: statusSchema,
        isSystem: Joi.boolean(),
        permissions: Joi.array().items(permissionSchema),
      },
      { minFields: 1, allowUnknown: true },
    ),
  },

  getRoleById: {
    params: roleIdParams,
  },

  updateRole: {
    params: roleIdParams,
    body: generateJoiValidation(
      {
        name: Joi.string().trim().min(1),
        code: Joi.string().trim().min(1),
        description: Joi.string().allow('').trim(),
        status: statusSchema,
        isSystem: Joi.boolean(),
        permissions: Joi.array().items(permissionSchema),
      },
      { minFields: 1, allowUnknown: true },
    ),
  },

  updatePermissions: {
    params: roleIdParams,
    body: generateJoiValidation(
      {
        permissions: Joi.array().items(permissionSchema).required(),
      },
      { minFields: 1, allowUnknown: true },
    ),
  },

  deleteRole: {
    params: roleIdParams,
  },
};
