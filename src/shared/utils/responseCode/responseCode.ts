import { baseResponseCodes, entities, EntityWithKey } from '@/shared/constants/moduleResponseCode.js';

type BaseResponseCodeMap = {
  SUCCESS: number;
  NOT_FOUND: number;
  ALREADY_EXISTS: number;
  INVALID_FIELDS: number;
  ERROR: number;
  INVALID_CUSTOM_FIELDS: number;
  IN_USE: number;
};

type EntityResponseCode = BaseResponseCodeMap & {
  KEY: number;
} & Record<string, number>;

type ResponseCodesMap = Record<string, EntityResponseCode>;

const createResponseCodes = (entityDefinitions: EntityWithKey[]): ResponseCodesMap => {
  const responseCodes: ResponseCodesMap = {};

  entityDefinitions.forEach(({ name, key, customCodes = [] }) => {
    let currentKey = key + Object.keys(baseResponseCodes).length;

    const entityResponseCodes: EntityResponseCode = {
      KEY: key,
      SUCCESS: key + baseResponseCodes.SUCCESS,
      NOT_FOUND: key + baseResponseCodes.NOT_FOUND,
      ALREADY_EXISTS: key + baseResponseCodes.ALREADY_EXISTS,
      INVALID_FIELDS: key + baseResponseCodes.INVALID_FIELDS,
      ERROR: key + baseResponseCodes.ERROR,
      INVALID_CUSTOM_FIELDS: key + baseResponseCodes.INVALID_CUSTOM_FIELDS,
      IN_USE: key + baseResponseCodes.IN_USE,
    };

    customCodes.forEach((customCode) => {
      entityResponseCodes[customCode] = currentKey;
      currentKey += 1;
    });

    responseCodes[`${name}ResponseCodes`] = entityResponseCodes;
  });

  return responseCodes;
};

const responseCodes = createResponseCodes(entities);

export default responseCodes;
