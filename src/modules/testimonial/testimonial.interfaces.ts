import { Document, Model } from 'mongoose';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export interface ITestimonial {
  customerName: string;
  customerPhoto?: string;
  tour: string;
  rating: number;
  testimonial: string;
  isFeatured: boolean;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface ITestimonialDoc extends ITestimonial, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface ITestimonialModel extends Model<ITestimonialDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult<ITestimonialDoc>>;
}
