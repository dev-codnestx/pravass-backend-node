import { baseResponseCodes, entities } from '@/shared/constants/moduleResponseCode.js';

interface EntityDefinition {
  name: string;
  key: number;
  customCodes?: string[];
}

interface EntityResponseCode {
  KEY: number;
  SUCCESS: number;
  [customCode: string]: number | undefined;
}

type ResponseCodesMap = {
  [entityResponseName: string]: EntityResponseCode;
};

const createResponseCodes = (entities: EntityDefinition[]): ResponseCodesMap => {
  const responseCodes: ResponseCodesMap = {};

  entities.forEach((entity) => {
    const { name, key, customCodes = [] } = entity;

    let currentKey = key;
    const entityResponseCodes: EntityResponseCode = {
      KEY: currentKey,
      SUCCESS: currentKey + baseResponseCodes.SUCCESS,
      [`${name.toUpperCase()}_NOT_FOUND`]: currentKey + baseResponseCodes.NOT_FOUND,
      [`${name.toUpperCase()}_ALREADY_EXISTS`]: currentKey + baseResponseCodes.ALREADY_EXISTS,
      [`${name.toUpperCase()}_INVALID_FIELDS`]: currentKey + baseResponseCodes.INVALID_FIELDS,
      [`${name.toUpperCase()}_ERROR`]: currentKey + baseResponseCodes.ERROR,
    };

    // Increment the key for the next custom code
    currentKey += Object.keys(baseResponseCodes).length;

    customCodes.forEach((customKey) => {
      entityResponseCodes[customKey] = currentKey;
      currentKey++;
    });

    responseCodes[`${name}ResponseCodes`] = entityResponseCodes;
  });

  return responseCodes;
};

const responseCodes = createResponseCodes(entities);

export default responseCodes;
