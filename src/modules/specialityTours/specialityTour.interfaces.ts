import { Document, Model, Types } from 'mongoose';

import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export const specialityTourStatuses = ['Active', 'Inactive'] as const;

export type SpecialityTourStatus = (typeof specialityTourStatuses)[number];

export interface ISpecialityTourPackage {
  packageId: Types.ObjectId;
  sortOrder: number;
}

export interface ISpecialityTour {
  title: string;
  slug: string;
  description?: string;
  banner?: string;
  status: SpecialityTourStatus;
  packages: ISpecialityTourPackage[];
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISpecialityTourDoc extends ISpecialityTour, Document {}

export interface ISpecialityTourModel extends Model<ISpecialityTourDoc> {
  isSlugTaken(slug: string, excludeId?: string): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<ISpecialityTourDoc>>;
}
