import { Document, Model, Types } from 'mongoose';

import { employmentTypes, jobDepartments, jobStatuses } from '@/shared/constants/enum.constant.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export type JobDepartment = (typeof jobDepartments)[number];
export type JobStatus = (typeof jobStatuses)[number];
export type EmploymentType = (typeof employmentTypes)[number];

export interface IJob {
  title: string;
  department: JobDepartment;
  location: string;
  description?: string;
  requirements?: string;
  experience: string;
  employmentType: EmploymentType;
  openings: number;
  status: JobStatus;
  isDeleted: boolean;
  totalApplications: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobDoc extends IJob, Document {}

export interface IJobModel extends Model<IJobDoc> {
  isTitleTaken(title: string, excludeJobId?: string): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<IJobDoc>>;
}
