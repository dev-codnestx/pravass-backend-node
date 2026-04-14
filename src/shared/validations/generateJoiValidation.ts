import Joi, { AnySchema } from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';

type MongoosePath = {
  instance: string;
  options?: {
    ref?: string;
  };
  isRequired?: boolean | (() => boolean);
  enumValues?: unknown[];
};

type MongooseSchemaLike = {
  paths: {
    [key: string]: MongoosePath;
  };
};

type JoiSchemaLike = Record<string, AnySchema>;

type GenerateJoiValidationOptions = {
  isUpdate?: boolean;
  allowUnknown?: boolean;
  minFields?: number;
};

const mongooseToJoiTypeMap: Record<string, AnySchema> = {
  String: Joi.string(),
  Number: Joi.number(),
  Boolean: Joi.boolean(),
  Date: Joi.date(),
  ObjectId: Joi.string().custom(objectId),
  Array: Joi.array().items(Joi.string()), // default to string if unknown
};

const isMongooseSchemaLike = (schema: JoiSchemaLike | MongooseSchemaLike): schema is MongooseSchemaLike =>
  'paths' in schema && typeof schema.paths === 'object' && schema.paths !== null;

const resolveOptions = (
  optionsOrIsUpdate?: GenerateJoiValidationOptions | boolean,
): Required<GenerateJoiValidationOptions> => {
  if (typeof optionsOrIsUpdate === 'boolean')
    return {
      isUpdate: optionsOrIsUpdate,
      allowUnknown: false,
      minFields: 0,
    };

  return {
    isUpdate: optionsOrIsUpdate?.isUpdate ?? false,
    allowUnknown: optionsOrIsUpdate?.allowUnknown ?? false,
    minFields: optionsOrIsUpdate?.minFields ?? 0,
  };
};

const buildJoiSchemaFromMongoosePaths = (
  mongooseSchema: MongooseSchemaLike,
  isUpdate: boolean,
): Record<string, AnySchema> => {
  const joiSchema: Record<string, AnySchema> = {};

  Object.entries(mongooseSchema.paths).forEach(([key, path]) => {
    if (key === '__v') return;

    let joiType = mongooseToJoiTypeMap[path.instance] || Joi.any();

    const isRequired = typeof path.isRequired === 'function' ? path.isRequired() : path.isRequired;

    if (path.options?.ref) joiType = Joi.string().custom(objectId);

    if (path.instance === 'Array' && path.options?.ref) joiType = Joi.array().items(Joi.string().custom(objectId));

    if (path.enumValues?.length) joiType = joiType.valid(...(path.enumValues as string[]));

    joiType = isUpdate ? joiType.optional() : isRequired ? joiType.required() : joiType.optional();

    joiSchema[key] = joiType;
  });

  return joiSchema;
};

export const generateJoiValidation = (
  schema: JoiSchemaLike | MongooseSchemaLike,
  optionsOrIsUpdate?: GenerateJoiValidationOptions | boolean,
): Joi.ObjectSchema => {
  const { isUpdate, allowUnknown, minFields } = resolveOptions(optionsOrIsUpdate);

  const joiSchema = isMongooseSchemaLike(schema) ? buildJoiSchemaFromMongoosePaths(schema, isUpdate) : schema;

  let objectSchema = Joi.object().keys(joiSchema);

  if (minFields > 0) objectSchema = objectSchema.min(minFields);

  if (allowUnknown) objectSchema = objectSchema.unknown(true);

  return objectSchema;
};
