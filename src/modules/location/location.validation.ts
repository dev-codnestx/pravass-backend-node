import Joi, { ObjectSchema } from 'joi';

import Country from '@/modules/location/country/country.model.js';
import { locationType } from '@/shared/constants/enum.constant.js';
import { capitalize } from '@/shared/utils/commonHelper.js';
import { objectId } from '@/shared/validations/custom.validation.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

type ValidationShape = {
  body?: ObjectSchema;
  params?: ObjectSchema;
  query?: ObjectSchema;
};

const params = Joi.object({
  type: Joi.string()
    .required()
    .valid(...locationType),
  id: Joi.string().custom(objectId).optional(),
});

const query = Joi.object({
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string(),
    populate: Joi.string(),
  }),
});

const locationSchemas = {
  country: Country,
};

export const validate: Record<string, ValidationShape> = {};

Object.entries(locationSchemas).forEach(([key, model]) => {
  const capitalKey = capitalize(key);
  const schema = model.schema;

  validate[`create${capitalKey}`] = {
    body: generateJoiValidation(schema),
  };

  validate[`update${capitalKey}`] = {
    params: params,
    body: generateJoiValidation(schema, true),
  };

  validate[`get${capitalKey}`] = {
    params: params,
    query: query,
  };

  validate[`delete${capitalKey}`] = {
    params: params,
  };
});
