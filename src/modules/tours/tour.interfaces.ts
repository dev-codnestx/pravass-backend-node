import { Document, Model, Types } from 'mongoose';

import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export const tourStatuses = ['active', 'draft', 'archived'] as const;
export const tourDifficulties = ['Easy', 'Moderate', 'Challenging'] as const;
export const batchStatuses = ['Active', 'Inactive'] as const;

export type TourStatus = (typeof tourStatuses)[number];
export type TourDifficulty = (typeof tourDifficulties)[number];
export type BatchStatus = (typeof batchStatuses)[number];

export interface ITourBatch {
  id?: string;
  date?: Date;
  status?: BatchStatus;
}

export interface IPricingPolicy {
  childWithBed?: number;
  childWithoutBed?: number;
  extraPerson?: number;
}

export interface ITourFaq {
  question: string;
  answer: string;
}

export interface IItineraryDay {
  day?: number;
  title?: string;
  description?: string;
  hotel?: string;
}

export interface ITour {
  name: string;
  code?: string;
  destinationIds: Types.ObjectId[];
  continentId?: Types.ObjectId;
  duration: string;
  durationDays?: number;
  durationNights?: number;
  price: number;
  bookings: number;
  status: TourStatus;
  tourType: string;
  difficulty: TourDifficulty;
  description?: string;
  manager?: string;
  managerMobile?: string;
  departureCities?: string[];
  batches?: ITourBatch[];
  pricingPolicy?: IPricingPolicy;
  validSharingTypes?: string[];
  faqs?: ITourFaq[];
  itinerary?: IItineraryDay[];
  startDate?: Date;
  endDate?: Date;
  priceWithTransport?: number;
  priceWithoutTransport?: number;
  transportType?: string;
  inclusions?: string;
  exclusions?: string;
  gallery?: string[];
  vehicleId?: string;
  videoType?: 'url' | 'file';
  videoFile?: string;
  videoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  isDeleted?: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  inclusionIds?: Types.ObjectId[];
  exclusionIds?: Types.ObjectId[];
  tourCategory?: string;
  paymentPlan?: string;
  refundPolicy?: string;
  terms?: string;
}

export interface ITourDoc extends ITour, Document {}

export interface ITourModel extends Model<ITourDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<ITourDoc>>;
}
