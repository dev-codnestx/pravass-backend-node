export const baseResponseCodes = {
  SUCCESS: 0,
  NOT_FOUND: 1,
  ALREADY_EXISTS: 2,
  INVALID_FIELDS: 3,
  ERROR: 4,
};

export const entities = [
  {
    name: 'Country',
    key: 1000,
    customCodes: ['COUNTRY_DISABLED', 'COUNTRY_IN_USE'],
  },
  {
    name: 'City',
    key: 2000,
    customCodes: ['CITY_IS_CAPITAL'],
  },
];
