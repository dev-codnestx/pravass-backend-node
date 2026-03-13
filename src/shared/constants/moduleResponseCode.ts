export const baseResponseCodes = {
  SUCCESS: 0,
  NOT_FOUND: 1,
  ALREADY_EXISTS: 2,
  INVALID_FIELDS: 3,
  ERROR: 4,
  INVALID_CUSTOM_FIELDS: 5,
  IN_USE: 6,
} as const;

export type BaseResponseCodeKey = keyof typeof baseResponseCodes;

export interface EntityDefinition {
  name: string;
  customCodes?: string[];
}

export interface EntityWithKey extends EntityDefinition {
  key: number;
}

const entitiesAndCustomCodes: EntityDefinition[] = [
  {
    name: 'Auth',
    customCodes: ['PLEASE_AUTHENTICATE', 'INVALID_CREDENTIALS', 'ACCOUNT_NOT_ACTIVE'],
  },
  {
    name: 'User',
    customCodes: ['ACCOUNT_SUSPENDED', 'EMAIL_ALREADY_IN_USE', 'NUMBER_ALREADY_IN_USE', 'INVALID_INPUT'],
  },
  {
    name: 'Role',
  },
  {
    name: 'Permission',
  },
  {
    name: 'Location',
  },
  {
    name: 'Country',
  },
  {
    name: 'City',
  },
  {
    name: 'Otp',
  },
  {
    name: 'Token',
  },
  {
    name: 'Session',
  },
];

export const generateEntitiesWithKeys = (entities: EntityDefinition[]): EntityWithKey[] => {
  let lastKey = 1000;

  return entities.map((entity) => {
    const entityWithKey: EntityWithKey = {
      ...entity,
      key: lastKey,
    };
    lastKey += 1000;
    return entityWithKey;
  });
};

export const entities = generateEntitiesWithKeys(entitiesAndCustomCodes);
