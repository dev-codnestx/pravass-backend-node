import mongoose, { Document, Model } from 'mongoose';

import ApiError from '@/shared/utils/errors/ApiError.js';
import { defaultStatus } from '@/shared/utils/responseCode/httpStatusAlias.js';

interface PopulateOption {
  path: string;
  select?: string;
  populate?: { path: string }[];
}

/**
 * Parse populate string into mongoose populate options.
 * Format: "field-subfield1,subfield2:select1,select2;otherField"
 */
const parsePopulateString = (populateString?: string): PopulateOption[] => {
  const populateArray: PopulateOption[] = [];

  if (populateString) {
    const fields = populateString.split(';');

    fields.forEach((field) => {
      const [pathWithSelects, selectFields] = field.split(':');
      const [path, subPaths] = pathWithSelects.split('-');

      if (path) {
        const populateObj: PopulateOption = { path };

        if (subPaths)
          populateObj.populate = subPaths.split(',').map((subPath) => {
            const [path, select] = subPath.split('.');
            return select ? { path, select } : { path };
          });

        if (selectFields) populateObj.select = selectFields.split(',').join(' ');

        populateArray.push(populateObj);
      }
    });
  }

  return populateArray;
};

export const getEntityByIdWithQueryString = async <T extends Document>(params: {
  model: Model<T>;
  entityId: string | mongoose.Types.ObjectId;
  fields?: string;
  populate?: string;
  responseCode?: number;
  idField?: string;
}): Promise<T> => {
  const { model, entityId, fields, populate, responseCode, idField = '_id' } = params;
  const populateFields = parsePopulateString(populate);

  let query = idField === '_id' ? model.findById(entityId) : model.findOne({ [idField]: entityId });

  if (fields) query = query.select(fields);

  if (populateFields.length > 0)
    populateFields.forEach((field) => {
      query = query.populate(field);
    });

  const entity = await query;

  if (!entity) throw new ApiError(defaultStatus.OK, `${model.modelName} not found`, {}, true, '', responseCode);

  return entity;
};
