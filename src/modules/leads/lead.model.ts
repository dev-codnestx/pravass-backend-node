import { Schema, model } from 'mongoose';

import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import {
  LEAD_ACTIVITY_TYPES,
  LEAD_FOLLOW_UP_PRIORITIES,
  LEAD_FOLLOW_UP_TASK_TYPES,
  LEAD_STATUSES,
} from './lead.constants.js';
import { ILeadDoc, ILeadModel } from './lead.interfaces.js';

const activitySchema = new Schema(
  {
    type: {
      type: String,
      enum: LEAD_ACTIVITY_TYPES,
      required: true,
    },
    content: { type: String, trim: true, required: true },
    timestamp: { type: Date, default: Date.now },
    userName: { type: String, trim: true, default: 'System' },
  },
  {
    timestamps: false,
  },
);

const followUpSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    taskType: { type: String, enum: LEAD_FOLLOW_UP_TASK_TYPES, default: 'Follow-up' },
    dueDate: { type: Date, required: true },
    dueTime: { type: String, trim: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: LEAD_FOLLOW_UP_PRIORITIES, default: 'Medium' },
  },
  {
    timestamps: false,
  },
);

const leadSchema = new Schema<ILeadDoc, ILeadModel>(
  {
    name: { type: String, trim: true, required: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, required: true },
    sourceId: { type: Schema.Types.ObjectId, ref: 'MasterLeadSource', required: true, index: true },
    tourId: { type: Schema.Types.ObjectId, ref: 'Tour' },
    destinationId: { type: Schema.Types.ObjectId, ref: 'MasterDestination' },
    leadStageId: { type: Schema.Types.ObjectId, ref: 'MasterLeadStage', required: true, index: true },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'active',
      index: true,
    },
    budget: { type: Number, min: 0 },
    travelDates: { type: String, trim: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: [{ type: String, trim: true }],
    activities: [activitySchema],
    followUps: [followUpSchema],
    stageOrder: { type: Number, min: 1, default: 1, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

leadSchema.index({ leadStageId: 1, stageOrder: 1, isDeleted: 1 });
leadSchema.index({ status: 1, isDeleted: 1 });

leadSchema.plugin(toJSON);
leadSchema.plugin(paginate);

export const LeadModel = model<ILeadDoc, ILeadModel>('Lead', leadSchema);
export default LeadModel;
