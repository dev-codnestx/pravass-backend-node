import { Document, Model, Types } from 'mongoose';

import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import { LeadActivityType, LeadFollowUpPriority, LeadFollowUpTaskType, LeadStatus } from './lead.constants.js';

export interface ILeadActivity {
  type: LeadActivityType;
  content: string;
  timestamp: Date;
  userName: string;
}

export interface ILeadFollowUp {
  title: string;
  taskType: LeadFollowUpTaskType;
  dueDate: Date;
  dueTime?: string;
  completed: boolean;
  priority: LeadFollowUpPriority;
}

export interface ILead {
  name: string;
  email?: string;
  phone: string;
  sourceId: Types.ObjectId;
  tourId?: Types.ObjectId;
  destinationId?: Types.ObjectId;
  leadStageId: Types.ObjectId;
  status: LeadStatus;
  budget?: number;
  travelDates?: string;
  assignedToId?: Types.ObjectId;
  notes: string[];
  activities: ILeadActivity[];
  followUps: ILeadFollowUp[];
  stageOrder: number;
  isDeleted?: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILeadDoc extends ILead, Document {}

export interface ILeadModel extends Model<ILeadDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<ILeadDoc>>;
}
