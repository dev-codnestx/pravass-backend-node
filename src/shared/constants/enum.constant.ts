export const locationType = ['country', 'state', 'city', 'area'] as const;

// Blog enums
export const blogCategories = ['Travel Tips', 'Guides', 'Honeymoon', 'Adventure'] as const;
export const blogStatuses = ['Draft', 'Published'] as const;

// FAQ enums
export const faqCategories = [
  'customholidaybuilder',
  'transportservice',
  'travelassistance',
  'staydetails',
  'additionalservice',
  'corporatetours',
] as const;
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
  LIVE = 'live',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
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

export enum TOUR_CATEGORY {
  DOMESTIC = 'domestic',
  INTERNATIONAL = 'international',
}

export enum BOOKING_STATUS {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  PARTIALLY_PAID = 'partially_paid',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

export enum SEAT_STATUS {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
  AISLE = 'aisle',
  HIDDEN = 'hidden',
  FEMALE_BOOKED = 'femaleBooked',
}

export enum PAYMENT_STATUS {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial',
}
