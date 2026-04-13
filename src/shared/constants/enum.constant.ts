export const locationType = ['country', 'state', 'city', 'area'] as const;

export enum CommonStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export const AuditMode = {
  CREATE: 'create',
  UPDATE: 'update',
} as const;

export type AuditModeType = (typeof AuditMode)[keyof typeof AuditMode];

export enum ACTIONS_TYPE {
  CREATE = 'create',
  VIEW = 'view',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  ACCOUNTS = 'accounts',
  DISPATCH = 'dispatch',
}

export type ActionsType = (typeof ACTIONS_TYPE)[keyof typeof ACTIONS_TYPE];
