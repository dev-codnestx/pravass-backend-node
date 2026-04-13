import { Document, Model, Types } from 'mongoose';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import { BANNER_PLACEMENTS } from './banner.constants.js';
import { CommonStatus } from '@/shared/constants/enum.constant.js';

export interface IBanner {
  title: string;
  subtitle?: string;
  placement: BANNER_PLACEMENTS;
  start?: Date;
  end?: Date;
  priority: number;
  status: CommonStatus;
  isDeleted: boolean;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBannerDoc extends IBanner, Document {}

export interface IBannerModel extends Model<IBannerDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<IBannerDoc>>;
}
