import { Schema, Types, model } from 'mongoose';

import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { batchStatuses, ITourDoc, ITourModel, tourDifficulties, tourStatuses } from './tour.interfaces.js';
import { TOUR_CATEGORY } from '@/shared/constants/enum.constant.js';

const tourBatchSchema = new Schema(
  {
    id: { type: String, trim: true },
    date: { type: Date },
    status: { type: String, enum: batchStatuses, default: 'Active' },
  },
  { _id: false },
);

const pricingPolicySchema = new Schema(
  {
    childWithBed: { type: Number, min: 0 },
    childWithoutBed: { type: Number, min: 0 },
    extraPerson: { type: Number, min: 0 },
  },
  { _id: false },
);

const faqSchema = new Schema(
  {
    question: { type: String, trim: true },
    answer: { type: String, trim: true },
  },
  { _id: false },
);

const itineraryDaySchema = new Schema(
  {
    day: { type: Number, min: 1 },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    hotel: { type: String, trim: true },
  },
  { _id: false },
);

const tourSchema = new Schema<ITourDoc, ITourModel>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, index: true },
    destinationIds: { type: [Types.ObjectId], ref: 'Destination', required: true },
    continentId: { type: Types.ObjectId, ref: 'Continent', trim: true },
    duration: { type: String, required: true, trim: true },
    durationDays: { type: Number, min: 1 },
    durationNights: { type: Number, min: 0 },
    price: { type: Number, min: 0, default: 0 },
    bookings: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: tourStatuses,
      default: 'Draft',
      index: true,
    },
    tourType: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: tourDifficulties,
      default: 'Easy',
    },
    description: { type: String, trim: true },
    manager: { type: String, trim: true },
    managerMobile: { type: String, trim: true },
    departureCities: [{ type: String, trim: true }],
    batches: [tourBatchSchema],
    pricingPolicy: pricingPolicySchema,
    validSharingTypes: [{ type: String, trim: true }],
    faqs: [faqSchema],
    itinerary: [itineraryDaySchema],
    startDate: { type: Date },
    endDate: { type: Date },
    priceWithTransport: { type: Number, min: 0 },
    priceWithoutTransport: { type: Number, min: 0 },
    transportType: { type: String, trim: true },
    inclusions: { type: String, trim: true },
    exclusions: { type: String, trim: true },
    inclusionIds: { type: [Types.ObjectId], ref: 'MasterInclusionExclusion', trim: true },
    exclusionIds: { type: [Types.ObjectId], ref: 'MasterInclusionExclusion', trim: true },
    gallery: [{ type: String, trim: true }],
    vehicleId: { type: String, trim: true },
    videoType: { type: String, enum: ['url', 'file'] },
    videoFile: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    tourCategory: { type: String, trim: true, enum: TOUR_CATEGORY, default: TOUR_CATEGORY.DOMESTIC },
  },
  {
    timestamps: true,
  },
);

tourSchema.pre('validate', function normalizeTour() {
  if (!this.duration && this.durationDays) this.duration = `${this.durationDays} Days`;
  if (!this.price && this.priceWithTransport) this.price = this.priceWithTransport;
  if (!this.code && this.name) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.code = `TR-${this.name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 12)
      .toUpperCase()}-${suffix}`;
  }
});

tourSchema.plugin(toJSON);
tourSchema.plugin(paginate);

export const TourModel = model<ITourDoc, ITourModel>('Tour', tourSchema);
export default TourModel;
