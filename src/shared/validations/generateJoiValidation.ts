import Joi, { AnySchema } from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';

type MongoosePath = {
  instance: string;
  options?: {
    ref?: string;
  };
  isRequired?: boolean | (() => boolean);
  enumValues?: any[];
};

type MongooseSchemaLike = {
  paths: {
    [key: string]: MongoosePath;
  };
};

const mongooseToJoiTypeMap: Record<string, AnySchema> = {
  String: Joi.string(),
  Number: Joi.number(),
  Boolean: Joi.boolean(),
  Date: Joi.date(),
  ObjectId: Joi.string().custom(objectId),
  Array: Joi.array().items(Joi.string()), // default to string if unknown
};

/**
 * Generate Joi validation schema from Mongoose schema
 * @param mongooseSchema - The Mongoose schema object
 * @param isUpdate - Whether this is for an update operation
 * @returns Joi.ObjectSchema
 */
export const generateJoiValidation = (mongooseSchema: MongooseSchemaLike, isUpdate = false): Joi.ObjectSchema => {
  const joiSchema: Record<string, AnySchema> = {};

  Object.entries(mongooseSchema.paths).forEach(([key, path]) => {
    let joiType = mongooseToJoiTypeMap[path.instance] || Joi.any();

    const isRequired = typeof path.isRequired === 'function' ? path.isRequired() : path.isRequired;

    joiType = isUpdate ? joiType.optional() : isRequired ? joiType.required() : joiType.optional();

    if (path.options?.ref) {
      joiType = joiType.custom(objectId).optional(); // Assume optional in update
    }

    if (path.instance === 'Array' && path.options?.ref) {
      joiType = Joi.array().items(Joi.string().custom(objectId)).optional();
    }

    if (path.enumValues?.length) {
      joiType = joiType.valid(...path.enumValues);
    }

    joiSchema[key] = joiType;
  });

  // Add custom optional fields (if needed globally)
  joiSchema.longitude = Joi.number().optional();
  joiSchema.latitude = Joi.number().optional();

  return Joi.object(joiSchema);
};
