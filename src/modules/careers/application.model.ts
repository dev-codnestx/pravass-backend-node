import { Schema, model } from 'mongoose';

import { applicationStatuses } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { IApplicationDoc, IApplicationModel } from './application.interfaces.js';

const applicationSchema = new Schema<IApplicationDoc, IApplicationModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, default: '' },
    experience: { type: String, trim: true, default: '' },
    appliedJob: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    coverLetter: { type: String, default: '' },
    resume: { type: String, default: '' },
    status: {
      type: String,
      enum: applicationStatuses,
      default: 'Under Review',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

applicationSchema.plugin(toJSON);
applicationSchema.plugin(paginate);

export const ApplicationModel = model<IApplicationDoc, IApplicationModel>('Application', applicationSchema);
export default ApplicationModel;
