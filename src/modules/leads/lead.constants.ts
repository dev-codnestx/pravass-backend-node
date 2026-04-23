export const LEAD_STATUSES = ['draft', 'active', 'inactive', 'archived', 'converted'] as const;
export const LEAD_ACTIVITY_TYPES = ['Call', 'Email', 'Note', 'StatusChange'] as const;
export const LEAD_FOLLOW_UP_PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const LEAD_FOLLOW_UP_TASK_TYPES = ['Follow-up', 'Call', 'Email', 'WhatsApp', 'Meeting', 'Other'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number];
export type LeadFollowUpPriority = (typeof LEAD_FOLLOW_UP_PRIORITIES)[number];
export type LeadFollowUpTaskType = (typeof LEAD_FOLLOW_UP_TASK_TYPES)[number];
