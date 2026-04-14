import { Model, Types } from 'mongoose';

import { blogCategories, blogStatuses } from '@/shared/constants/enum.constant.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import type { IBlog as IBlogDoc } from './blog.model.js';

export type { IBlogDoc };

export type BlogCategory = (typeof blogCategories)[number];
export type BlogStatus = (typeof blogStatuses)[number];

export interface IBlog {
  featuredImage?: string;
  title: string;
  category: BlogCategory;
  author?: string;
  content?: string;
  status: BlogStatus;
  publishedDate?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlogModel extends Model<IBlogDoc> {
  isTitleTaken(title: string, excludeBlogId?: string): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IBlogDoc>>;
}

export interface CreateBlogBody {
  featuredImage?: string;
  title: string;
  category: BlogCategory;
  author?: string;
  content?: string;
  status?: BlogStatus;
  publishedDate?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface UpdateBlogBody {
  featuredImage?: string;
  title?: string;
  category?: BlogCategory;
  author?: string;
  content?: string;
  status?: BlogStatus;
  publishedDate?: Date;
  updatedBy?: Types.ObjectId;
}
