import { Schema, model, Document, Types } from 'mongoose';

import { jobDepartments, jobStatuses } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { IJobModel } from './job.interfaces.js';

export interface IJob extends Document {
  _id: Types.ObjectId;
  title: string;
  department: string;
  location: string;
  description?: string;
  requirements?: string;
  status: 'Active' | 'Closed';
  totalApplications: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true, index: true },
    department: {
      type: String,
      enum: jobDepartments,
      required: true,
      index: true,
    },
    location: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    requirements: { type: String, default: '' },
    status: {
      type: String,
      enum: jobStatuses,
      default: 'Active',
      index: true,
    },
    totalApplications: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.plugin(toJSON);
jobSchema.plugin(paginate);

// Static: check if title is already taken
jobSchema.statics.isTitleTaken = async function (title: string, excludeJobId?: string) {
  const job = await this.findOne({ title, _id: { $ne: excludeJobId } });
  return !!job;
};

export const JobModel = model<IJob, IJobModel>('Job', jobSchema);
export default JobModel;
