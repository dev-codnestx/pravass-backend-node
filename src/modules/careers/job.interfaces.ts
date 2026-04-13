import { Model, Types } from 'mongoose';

import { jobDepartments, jobStatuses } from '@/shared/constants/enum.constant.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import type { IJob as IJobDoc } from './job.model.js';

export type { IJobDoc };

export type JobDepartment = (typeof jobDepartments)[number];
export type JobStatus = (typeof jobStatuses)[number];

export interface IJob {
  title: string;
  department: JobDepartment;
  location: string;
  description?: string;
  requirements?: string;
  status: JobStatus;
  totalApplications: number;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobModel extends Model<IJobDoc> {
  isTitleTaken(title: string, excludeJobId?: string): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IJobDoc>>;
}

export interface CreateJobBody {
  title: string;
  department: JobDepartment;
  location: string;
  description?: string;
  requirements?: string;
  status?: JobStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface UpdateJobBody {
  title?: string;
  department?: JobDepartment;
  location?: string;
  description?: string;
  requirements?: string;
  status?: JobStatus;
  updatedBy?: Types.ObjectId;
}
