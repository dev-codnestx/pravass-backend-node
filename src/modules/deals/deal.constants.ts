export const DEAL_TYPES = ['Percentage', 'Fixed'] as const;
export const DEAL_STATUSES = ['Active', 'Scheduled', 'Expired'] as const;

export type DealType = (typeof DEAL_TYPES)[number];
export type DealStatus = (typeof DEAL_STATUSES)[number];
