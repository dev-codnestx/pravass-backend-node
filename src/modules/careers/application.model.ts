import { Schema, model, Document, Types } from 'mongoose';

import { applicationStatuses } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { IApplicationModel } from './application.interfaces.js';

export interface IApplication extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  experience?: string;
  appliedJob: Types.ObjectId;
  coverLetter?: string;
  resume?: string;
  status: 'Under Review' | 'Shortlisted' | 'Interview' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
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
  },
  {
    timestamps: true,
  },
);

applicationSchema.plugin(toJSON);
applicationSchema.plugin(paginate);

export const ApplicationModel = model<IApplication, IApplicationModel>('Application', applicationSchema);
export default ApplicationModel;
