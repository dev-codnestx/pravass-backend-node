import { Model, Types } from 'mongoose';

import { applicationStatuses } from '@/shared/constants/enum.constant.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import type { IApplication as IApplicationDoc } from './application.model.js';

export type { IApplicationDoc };

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
  createdAt: Date;
  updatedAt: Date;
}

export interface IApplicationModel extends Model<IApplicationDoc> {
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IApplicationDoc>>;
}

export interface CreateApplicationBody {
  name: string;
  email: string;
  phone?: string;
  experience?: string;
  appliedJob: Types.ObjectId | string;
  coverLetter?: string;
  resume?: string;
  status?: ApplicationStatus;
}

export interface UpdateApplicationStatusBody {
  status: ApplicationStatus;
}
