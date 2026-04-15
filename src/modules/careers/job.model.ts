import { Schema, model } from 'mongoose';

import { employmentTypes, jobDepartments, jobStatuses } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { IJobDoc, IJobModel } from './job.interfaces.js';

const jobSchema = new Schema<IJobDoc, IJobModel>(
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
    experience: { type: String, required: true, trim: true, default: 'Not specified' },
    employmentType: {
      type: String,
      enum: employmentTypes,
      required: true,
      default: 'Full time',
      index: true,
    },
    openings: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: jobStatuses,
      default: 'Active',
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
    totalApplications: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

jobSchema.plugin(toJSON);
jobSchema.plugin(paginate);

// Static: check if title is already taken
jobSchema.statics.isTitleTaken = async function (title: string, excludeJobId?: string) {
  const job = await this.findOne({ title, _id: { $ne: excludeJobId }, isDeleted: false });
  return !!job;
};

export const JobModel = model<IJobDoc, IJobModel>('Job', jobSchema);
export default JobModel;
