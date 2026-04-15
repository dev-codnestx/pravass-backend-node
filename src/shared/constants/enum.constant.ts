export const locationType = ['country', 'state', 'city', 'area'] as const;

// Blog enums
export const blogCategories = ['Travel Tips', 'Guides', 'Honeymoon', 'Adventure'] as const;
export const blogStatuses = ['Draft', 'Published'] as const;

// FAQ enums
export const faqCategories = ['Booking', 'Travel', 'Insurance', 'Payment'] as const;
export const faqStatuses = ['Active', 'Inactive'] as const;

// Career / Job enums
export const jobDepartments = ['Operations', 'Marketing', 'Sales', 'Engineering', 'HR', 'Finance'] as const;
export const jobStatuses = ['Active', 'Closed'] as const;
export const employmentTypes = ['Full time', 'Part time', 'Internship', 'WFH', 'Contract'] as const;

// Application enums
export const applicationStatuses = ['Under Review', 'Shortlisted', 'Interview', 'Rejected'] as const;
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
