import { Document, Model, Types } from 'mongoose';

import { applicationStatuses } from '@/shared/constants/enum.constant.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface IApplication {
  name: string;
  email: string;
  phone?: string;
  experience?: string;
  appliedJob: Types.ObjectId;
  coverLetter?: string;
  resume?: string;
  status: ApplicationStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IApplicationDoc extends IApplication, Document {}

export interface IApplicationModel extends Model<IApplicationDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<IApplicationDoc>>;
}
