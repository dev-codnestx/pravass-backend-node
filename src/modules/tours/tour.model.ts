/* eslint-disable camelcase */

import { Schema, Types, model } from 'mongoose';

import { TOUR_CATEGORY } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import {
  departureFlightTypes,
  departureTransportModes,
  departureTypes,
  ITourDoc,
  ITourModel,
  seatStatuses,
  tourDifficulties,
  tourMediaTypes,
  tourStatuses,
} from './tour.interfaces.js';

const joiningLeavingPointSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    time: { type: String, trim: true },
  },
  { _id: false },
);

const departureCitySchema = new Schema(
  {
    city: { type: String, trim: true, required: true },
    joiningPoints: [joiningLeavingPointSchema],
    leavingPoints: [joiningLeavingPointSchema],
  },
  { _id: false },
);

const flightOptionSchema = new Schema(
  {
    id: { type: String, trim: true },
    airlineName: { type: String, trim: true },
    flightNumber: { type: String, trim: true },
    from: { type: String, trim: true },
    to: { type: String, trim: true },
    departureTime: { type: String, trim: true },
    arrivalTime: { type: String, trim: true },
    duration: { type: String, trim: true },
    type: { type: String, enum: departureFlightTypes },
    seats: { type: Number, min: 0 },
    totalSeats: { type: Number, min: 0 },
  },
  { _id: false },
);

const seatStateSchema = new Schema(
  {
    seat_no: { type: String, trim: true, required: true },
    status: { type: String, enum: seatStatuses, default: 'available' },
    row: { type: Number },
    column: { type: Number },
  },
  { _id: false },
);

const departureSchema = new Schema(
  {
    id: { type: String, trim: true },
    cityId: { type: Types.ObjectId, ref: 'MasterDepartureCity' },
    cityIds: [{ type: String, trim: true }],
    startDate: { type: Date },
    endDate: { type: Date },
    transportMode: { type: String, enum: departureTransportModes },
    transportTypeId: { type: Types.ObjectId, ref: 'MasterTransportType' },
    transportId: { type: String, trim: true },
    vehicleId: { type: String, trim: true },
    seats: { type: Number, min: 0 },
    price: { type: Number, min: 0 },
    joiningLeavingAllowed: { type: Boolean },
    departureCities: [departureCitySchema],
    joiningPoints: [{ type: String, trim: true }],
    leavingPoints: [{ type: String, trim: true }],
    totalSeatsAvailable: { type: Number, min: 0 },
    airlineName: { type: String, trim: true },
    flightNumber: { type: String, trim: true },
    flightOptions: [flightOptionSchema],
    trainName: { type: String, trim: true },
    trainNumber: { type: String, trim: true },
    seatStates: [seatStateSchema],
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

const basePricingSchema = new Schema(
  {
    adult: { type: Number, min: 0 },
    child: { type: Number, min: 0 },
    infant: { type: Number, min: 0 },
  },
  { _id: false },
);

const seasonalPricingSchema = new Schema(
  {
    startDate: { type: Date },
    endDate: { type: Date },
    adjustmentType: { type: String, enum: ['PERCENT'], default: 'PERCENT' },
    value: { type: Number },
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
    dayNumber: { type: Number, min: 1 },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    hotelId: { type: Types.ObjectId, ref: 'MasterHotel' },
    hotel: { type: String, trim: true },
    roomTypeId: { type: Types.ObjectId, ref: 'MasterRoomType' },
    roomType: { type: String, trim: true },
    activityIds: [{ type: Types.ObjectId, ref: 'MasterActivity' }],
    transfers: [
      new Schema(
        {
          fromDestinationId: { type: Types.ObjectId, ref: 'MasterDestination' },
          toDestinationId: { type: Types.ObjectId, ref: 'MasterDestination' },
          transportTypeId: { type: Types.ObjectId, ref: 'MasterTransportType' },
          transportMode: { type: String, trim: true },
        },
        { _id: false },
      ),
    ],
  },
  { _id: false },
);

const tourMediaSchema = new Schema(
  {
    url: { type: String, trim: true, required: true },
    type: { type: String, enum: tourMediaTypes, default: 'image' },
    isCover: { type: Boolean, default: false },
    alt_text: { type: String, trim: true },
    title: { type: String, trim: true },
    text: { type: String, trim: true },
    // Backward compatibility for old records/payloads.
    file: { type: String, trim: true },
  },
  { _id: false },
);

const tourPoliciesSchema = new Schema(
  {
    payment: [{ type: String, trim: true }],
    cancellation: [{ type: String, trim: true }],
    termsAndConditions: [{ type: String, trim: true }],
  },
  { _id: false },
);

const tourSettingsSchema = new Schema(
  {
    internalNotes: { type: String, trim: true },
  },
  { _id: false },
);

const tourSchema = new Schema<ITourDoc, ITourModel>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    code: { type: String, trim: true, uppercase: true, index: true },
    destinationIds: { type: [Types.ObjectId], ref: 'MasterDestination', default: [] },
    continentId: { type: Types.ObjectId, ref: 'Continent', trim: true },
    duration: { type: String, required: true, trim: true },
    durationDays: { type: Number, min: 1 },
    durationNights: { type: Number, min: 0 },
    price: { type: Number, min: 0, default: 0 },
    bookings: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: tourStatuses,
      default: 'draft',
      index: true,
    },
    tourType: { type: Types.ObjectId, ref: 'MasterTourType', index: true },
    difficulty: {
      type: String,
      enum: tourDifficulties,
      default: 'Easy',
    },
    description: { type: String, trim: true },
    manager: { type: String, trim: true },
    managerMobile: { type: String, trim: true },
    departureCities: [{ type: Types.ObjectId, ref: 'MasterDepartureCity' }],
    departureType: { type: String, enum: departureTypes },
    departures: [departureSchema],
    pricingPolicy: pricingPolicySchema,
    basePricing: basePricingSchema,
    seasonalPricing: [seasonalPricingSchema],
    sharingType: { type: String, trim: true },
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
    activityIds: [{ type: String, trim: true }],
    gallery: [{ type: String, trim: true }],
    media: [tourMediaSchema],
    vehicleId: { type: String, trim: true },
    videoType: { type: String, enum: ['url', 'file'] },
    videoFile: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    tourCategory: { type: String, trim: true, enum: TOUR_CATEGORY, default: TOUR_CATEGORY.DOMESTIC },
    paymentPlan: { type: String, trim: true },
    refundPolicy: { type: String, trim: true },
    paymentPolicy: { type: String, trim: true },
    cancellationPolicy: { type: String, trim: true },
    terms: { type: String, trim: true },
    policies: tourPoliciesSchema,
    settings: tourSettingsSchema,
    highlights: { type: [String], trim: true },
  },
  {
    timestamps: true,
  },
);

const toPolicyArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean);

  if (typeof value === 'string')
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  return [];
};

const uniqueTrimmedStrings = (values: unknown[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = String(value ?? '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
};

const uniqueObjectIds = <T>(values: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];

  values.forEach((value) => {
    const key = String(value).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });

  return result;
};

const toSeasonKey = (startDate: unknown, endDate: unknown): string | null => {
  const start = startDate instanceof Date ? startDate : new Date(String(startDate ?? ''));
  const end = endDate instanceof Date ? endDate : new Date(String(endDate ?? ''));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return `${start.toISOString()}::${end.toISOString()}`;
};

tourSchema.pre('validate', function normalizeTour() {
  const draft = this as ITourDoc & {
    policies?: {
      payment?: unknown;
      cancellation?: unknown;
      termsAndConditions?: unknown;
      paymentPolicy?: unknown;
      cancellationPolicy?: unknown;
      terms?: unknown;
    };
  };

  if (typeof draft.status === 'string') {
    const lowered = draft.status.toLowerCase();
    if (tourStatuses.includes(lowered as (typeof tourStatuses)[number]))
      draft.status = lowered as (typeof tourStatuses)[number];
  }

  if (!draft.duration && draft.durationDays) draft.duration = `${draft.durationDays} Days`;
  if (!draft.price && draft.priceWithTransport) draft.price = draft.priceWithTransport;
  if ((!draft.price || draft.price <= 0) && typeof draft.basePricing?.adult === 'number')
    draft.price = draft.basePricing.adult;

  if (Array.isArray(draft.destinationIds)) draft.destinationIds = uniqueObjectIds(draft.destinationIds);

  if (Array.isArray(draft.departureCities)) draft.departureCities = uniqueObjectIds(draft.departureCities);

  if (Array.isArray(draft.inclusionIds)) draft.inclusionIds = uniqueObjectIds(draft.inclusionIds);

  if (Array.isArray(draft.exclusionIds)) draft.exclusionIds = uniqueObjectIds(draft.exclusionIds);

  if (Array.isArray(draft.activityIds)) draft.activityIds = uniqueTrimmedStrings(draft.activityIds);

  if (Array.isArray(draft.validSharingTypes)) draft.validSharingTypes = uniqueTrimmedStrings(draft.validSharingTypes);

  if (Array.isArray(draft.seasonalPricing))
    draft.seasonalPricing = draft.seasonalPricing.filter((season, index, arr) => {
      if (!season?.startDate || !season?.endDate) return true;
      const current = toSeasonKey(season.startDate, season.endDate);
      if (!current) return true;
      return (
        arr.findIndex((entry) => {
          if (!entry?.startDate || !entry?.endDate) return false;
          return toSeasonKey(entry.startDate, entry.endDate) === current;
        }) === index
      );
    });

  if (!draft.code && draft.name) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    draft.code = `TR-${draft.name
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 12)
      .toUpperCase()}-${suffix}`;
  }

  if (!draft.slug && draft.name)
    draft.slug = draft.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const existingPolicies = draft.policies ?? {};
  const payment = [
    ...toPolicyArray(existingPolicies.payment),
    ...toPolicyArray(existingPolicies.paymentPolicy),
    ...toPolicyArray(draft.paymentPolicy),
  ];
  const cancellation = [
    ...toPolicyArray(existingPolicies.cancellation),
    ...toPolicyArray(existingPolicies.cancellationPolicy),
    ...toPolicyArray(draft.cancellationPolicy),
  ];
  const termsAndConditions = [
    ...toPolicyArray(existingPolicies.termsAndConditions),
    ...toPolicyArray(existingPolicies.terms),
    ...toPolicyArray(draft.terms),
  ];

  draft.policies = {
    payment: [...new Set(payment)],
    cancellation: [...new Set(cancellation)],
    termsAndConditions: [...new Set(termsAndConditions)],
  };

  if (!draft.paymentPolicy && draft.policies.payment.length > 0) draft.paymentPolicy = draft.policies.payment.join('\n');
  if (!draft.cancellationPolicy && draft.policies.cancellation.length > 0)
    draft.cancellationPolicy = draft.policies.cancellation.join('\n');
  if (!draft.terms && draft.policies.termsAndConditions.length > 0)
    draft.terms = draft.policies.termsAndConditions.join('\n');

  if (Array.isArray(draft.media) && draft.media.length > 0)
    draft.media = draft.media
      .map((item: ITourDoc['media'][number] & { file?: string; cover?: boolean; is_cover?: boolean }) => {
        const legacyFile = typeof item.file === 'string' ? item.file.trim() : '';
        const currentUrl = typeof item.url === 'string' ? item.url.trim() : '';
        const url = currentUrl || legacyFile;
        if (!url) return null;
        const isCover =
          typeof item.isCover === 'boolean'
            ? item.isCover
            : typeof item.cover === 'boolean'
              ? item.cover
              : typeof item.is_cover === 'boolean'
                ? item.is_cover
                : false;

        return {
          ...item,
          url,
          isCover,
          text: item.text || item.title,
          title: item.title || item.text,
        };
      })
      .filter(Boolean)
      .filter((item, index, arr) => {
        const key = `${item.type}::${item.url}`;
        return arr.findIndex((entry) => `${entry.type}::${entry.url}` === key) === index;
      }) as ITourDoc['media'];

  if (Array.isArray(draft.media) && draft.media.length > 0) {
    const imageMedia = draft.media.filter((item) => item.type === 'image');
    if (imageMedia.length > 0) {
      const explicitCover = imageMedia.find((item) => item.isCover === true);
      const coverUrl = explicitCover?.url ?? imageMedia[0]?.url;
      draft.media = draft.media.map((item) => ({
        ...item,
        isCover: item.type === 'image' ? item.url === coverUrl : false,
      })) as ITourDoc['media'];
    }
  }

  if ((!draft.gallery || draft.gallery.length === 0) && Array.isArray(draft.media))
    draft.gallery = draft.media.filter((item) => item.type === 'image').map((item) => item.url);
  else if (Array.isArray(draft.gallery)) draft.gallery = uniqueTrimmedStrings(draft.gallery);

  if (!draft.videoUrl && Array.isArray(draft.media)) {
    const video = draft.media.find((item) => item.type === 'video');
    if (video) draft.videoUrl = video.url;
  }

  if ((!draft.media || draft.media.length === 0) && ((draft.gallery && draft.gallery.length > 0) || draft.videoUrl)) {
    const nextMedia = [
      ...(draft.gallery ?? []).map((url, index) => ({ url, type: 'image' as const, isCover: index === 0 })),
      ...(draft.videoUrl ? [{ url: draft.videoUrl, type: 'video' as const }] : []),
    ];
    draft.media = nextMedia;
  }

  if (Array.isArray(draft.itinerary) && draft.itinerary.length > 0)
    draft.itinerary.forEach((day) => {
      if (Array.isArray(day.activityIds)) day.activityIds = uniqueObjectIds(day.activityIds);
    });
});

tourSchema.index(
  { code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      code: { $exists: true, $ne: '' },
    },
  },
);
tourSchema.index({ status: 1, tourType: 1, isDeleted: 1 });
tourSchema.index({ name: 'text', description: 'text' });

tourSchema.plugin(toJSON);
tourSchema.plugin(paginate);

export const TourModel = model<ITourDoc, ITourModel>('Tour', tourSchema);
export default TourModel;
