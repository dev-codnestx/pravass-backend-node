import { Model, Types } from 'mongoose';

import { faqCategories, faqStatuses } from '@/shared/constants/enum.constant.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import type { IFaq as IFaqDoc } from './faq.model.js';

export type { IFaqDoc };

export type FaqCategory = (typeof faqCategories)[number];
export type FaqStatus = (typeof faqStatuses)[number];

export interface IFaq {
  question: string;
  answer?: string;
  category: FaqCategory;
  status: FaqStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFaqModel extends Model<IFaqDoc> {
  isQuestionTaken(question: string, excludeFaqId?: string): Promise<boolean>;
  paginate(filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<IFaqDoc>>;
}

export interface CreateFaqBody {
  question: string;
  answer?: string;
  category: FaqCategory;
  status?: FaqStatus;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

export interface UpdateFaqBody {
  question?: string;
  answer?: string;
  category?: FaqCategory;
  status?: FaqStatus;
  updatedBy?: Types.ObjectId;
}
