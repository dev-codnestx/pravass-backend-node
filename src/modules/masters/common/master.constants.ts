export const MASTER_MODULES = [
  'locations',
  'destinations',
  'departure-cities',
  'hotels',
  'room-types',
  'aviation',
  'tags',
  'inclusions-exclusions',
  'payment-plans',
  'refund-policies',
  'lead-sources',
  'lead-stages',
  'transport-types',
  'transports',
  'vehicles',
  'sharing-types',
  'tour-types',
  'activities',
] as const;

export type MasterModuleKey = (typeof MASTER_MODULES)[number];

export const MASTER_STATUSES = ['active', 'inactive'] as const;

export type MasterStatus = (typeof MASTER_STATUSES)[number];

export const toMasterLabel = (moduleKey: MasterModuleKey): string =>
  moduleKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
