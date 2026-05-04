import { model, Schema, type Document, type Model } from 'mongoose';

import {
  applyMasterBasePlugin,
  type MasterStatus,
  type MasterBasePluginOptions,
} from '@/modules/masters/common/masterBase.plugin.js';

import { type MasterModuleKey } from '@/modules/masters/common/master.constants.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';
import { TOUR_CATEGORY } from '@/shared/constants/enum.constant.js';

export interface IMasterDoc extends Document {
  name: string;
  status: MasterStatus;
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  slug?: string;
  [key: string]: unknown;
}

const createMasterSchema = (extraFields: Record<string, unknown> = {}, options: MasterBasePluginOptions = {}) => {
  const schema = new Schema<IMasterDoc>(extraFields, {
    strict: true,
  });

  applyMasterBasePlugin(schema, options);
  schema.plugin(toJSON);
  schema.plugin(paginate);

  return schema;
};

const locationSchema = createMasterSchema({
  type: { type: String, trim: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true },
  image: { type: String, trim: true },
  displayOrder: { type: Number, min: 0 },
  continentId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
  countryId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
  regionId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
  stateId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
});

const destinationSchema = createMasterSchema(
  {
    description: { type: String, trim: true },
    image: [{ type: String, trim: true }],
    category: { type: String, trim: true, enum: TOUR_CATEGORY, default: TOUR_CATEGORY.DOMESTIC },
    activityIds: [{ type: Schema.Types.ObjectId, ref: 'MasterActivity' }],
    countryId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
    stateId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
    cityId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
  },
  { addSlug: true },
);

const departureCitySchema = createMasterSchema({
  countryId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
  stateId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
  cityId: { type: Schema.Types.ObjectId, ref: 'MasterLocation' },
  country: { type: String, trim: true },
  state: { type: String, trim: true },
  city: { type: String, trim: true },
  image: { type: String, trim: true },
  description: { type: String, trim: true },
  category: { type: String, trim: true, enum: TOUR_CATEGORY, default: TOUR_CATEGORY.DOMESTIC },
});

const hotelSchema = createMasterSchema({
  destinationId: { type: Schema.Types.ObjectId, ref: 'MasterDestination' },
  address: { type: String, trim: true },
  description: { type: String, trim: true },
  image: [{ type: String, trim: true }],
});

const roomTypeSchema = createMasterSchema({
  description: { type: String, trim: true },
});

const aviationSchema = createMasterSchema({
  type: { type: String, enum: ['domestic', 'international'] },
});

const tagSchema = createMasterSchema({
  description: { type: String, trim: true },
});

const inclusionExclusionSchema = createMasterSchema({
  type: { type: String, enum: ['inclusion', 'exclusion'] },
  category: { type: String, trim: true },
  image: { type: String, trim: true },
});

const paymentPlanSchema = createMasterSchema({
  type: { type: String, enum: ['fixed', 'percentage'] },
  installments: { type: Number, min: 1 },
  description: { type: String, trim: true },
});

const refundPolicySchema = createMasterSchema({
  description: { type: String, trim: true },
  daysBefore: { type: String, trim: true },
  refundPercent: { type: String, trim: true },
  noShow: { type: String, trim: true },
  notes: { type: String, trim: true },
});

const leadSourceSchema = createMasterSchema({
  description: { type: String, trim: true },
});

const leadStageSchema = createMasterSchema({
  color: { type: String, trim: true },
  position: { type: Number, min: 1 },
});

const transportTypeSchema = createMasterSchema({
  capacity: { type: Number, min: 0 },
  description: { type: String, trim: true },
});

const transportSchema = createMasterSchema({
  typeId: { type: Schema.Types.ObjectId, ref: 'MasterTransportType' },
  capacity: { type: Number, min: 0 },
  description: { type: String, trim: true },
  details: { type: Schema.Types.Mixed, default: {} },
  // Legacy fields retained for existing records while the UI migrates to typeId/capacity.
  type: { type: String, trim: true },
  totalSeats: { type: Number, min: 0 },
});

const vehicleSchema = createMasterSchema({
  transportTypeId: { type: Schema.Types.ObjectId, ref: 'MasterTransportType' },
  type: { type: String, trim: true }, // Legacy, keeping for compatibility
  category: { type: String, trim: true, enum: ['Full Seater', 'Full Sleeper', 'Mix'] },
  acType: { type: String, trim: true, enum: ['AC', 'Non-AC'] },
  totalSeats: { type: Number, min: 0 },
  layoutType: { type: String, trim: true },
  seatLayout: { type: Schema.Types.Mixed, default: {} },
  description: { type: String, trim: true },
});

const sharingTypeSchema = createMasterSchema({
  code: { type: String, trim: true },
  maxPersons: { type: Number, min: 1 },
  description: { type: String, trim: true },
});

const tourTypeSchema = createMasterSchema(
  {
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, trim: true },
  },
  { addSlug: true },
);

const activitySchema = createMasterSchema({
  description: { type: String, trim: true },
  image: { type: String, trim: true },
});

export const masterModels: Record<MasterModuleKey, Model<IMasterDoc>> = {
  locations: model<IMasterDoc>('MasterLocation', locationSchema),
  destinations: model<IMasterDoc>('MasterDestination', destinationSchema),
  'departure-cities': model<IMasterDoc>('MasterDepartureCity', departureCitySchema),
  hotels: model<IMasterDoc>('MasterHotel', hotelSchema),
  'room-types': model<IMasterDoc>('MasterRoomType', roomTypeSchema),
  aviation: model<IMasterDoc>('MasterAviation', aviationSchema),
  tags: model<IMasterDoc>('MasterTag', tagSchema),
  'inclusions-exclusions': model<IMasterDoc>('MasterInclusionExclusion', inclusionExclusionSchema),
  'payment-plans': model<IMasterDoc>('MasterPaymentPlan', paymentPlanSchema),
  'refund-policies': model<IMasterDoc>('MasterRefundPolicy', refundPolicySchema),
  'lead-sources': model<IMasterDoc>('MasterLeadSource', leadSourceSchema),
  'lead-stages': model<IMasterDoc>('MasterLeadStage', leadStageSchema),
  'transport-types': model<IMasterDoc>('MasterTransportType', transportTypeSchema),
  transports: model<IMasterDoc>('MasterTransport', transportSchema),
  vehicles: model<IMasterDoc>('MasterVehicle', vehicleSchema),
  'sharing-types': model<IMasterDoc>('MasterSharingType', sharingTypeSchema),
  'tour-types': model<IMasterDoc>('MasterTourType', tourTypeSchema),
  activities: model<IMasterDoc>('MasterActivity', activitySchema),
  'blog-categories': model<IMasterDoc>('MasterBlogCategory', createMasterSchema()),
};
