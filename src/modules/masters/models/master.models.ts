import { model, Schema, type Document, type Model } from 'mongoose';

import { applyMasterBasePlugin, type MasterStatus } from '@/modules/masters/common/masterBase.plugin.js';
import { type MasterModuleKey } from '@/modules/masters/common/master.constants.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

export interface IMasterDoc extends Document {
  name: string;
  status: MasterStatus;
  createdBy: Schema.Types.ObjectId;
  updatedBy: Schema.Types.ObjectId;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

const createMasterSchema = (extraFields: Record<string, unknown> = {}) => {
  const schema = new Schema<IMasterDoc>(extraFields, {
    strict: true,
  });

  applyMasterBasePlugin(schema);
  schema.plugin(toJSON);
  schema.plugin(paginate);

  return schema;
};

const locationSchema = createMasterSchema({
  type: { type: String, trim: true },
  code: { type: String, trim: true },
});

const destinationSchema = createMasterSchema({
  description: { type: String, trim: true },
});

const departureCitySchema = createMasterSchema({
  country: { type: String, trim: true },
  state: { type: String, trim: true },
});

const hotelSchema = createMasterSchema({
  destinationId: { type: Schema.Types.ObjectId, ref: 'MasterDestination' },
  address: { type: String, trim: true },
  description: { type: String, trim: true },
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
});

const paymentPlanSchema = createMasterSchema({
  type: { type: String, enum: ['fixed', 'percentage'] },
  installments: { type: Number, min: 1 },
  description: { type: String, trim: true },
});

const refundPolicySchema = createMasterSchema({
  daysBefore: { type: String, trim: true },
  refundPercent: { type: String, trim: true },
  noShow: { type: String, trim: true },
  notes: { type: String, trim: true },
});

const leadSourceSchema = createMasterSchema({
  description: { type: String, trim: true },
});

const transportTypeSchema = createMasterSchema({
  capacity: { type: Number, min: 0 },
  description: { type: String, trim: true },
});

const transportSchema = createMasterSchema({
  type: { type: String, enum: ['bus', 'flight', 'train', 'car'] },
  totalSeats: { type: Number, min: 0 },
});

const vehicleSchema = createMasterSchema({
  transportTypeId: { type: Schema.Types.ObjectId, ref: 'MasterTransportType' },
  type: { type: String, trim: true },
  totalSeats: { type: Number, min: 0 },
  layoutType: { type: String, trim: true },
  description: { type: String, trim: true },
});

const sharingTypeSchema = createMasterSchema({
  code: { type: String, trim: true },
  maxPersons: { type: Number, min: 1 },
  description: { type: String, trim: true },
});

const tourTypeSchema = createMasterSchema({
  slug: { type: String, trim: true, lowercase: true },
  description: { type: String, trim: true },
});

const activitySchema = createMasterSchema({
  destinationId: { type: Schema.Types.ObjectId, ref: 'MasterDestination' },
  description: { type: String, trim: true },
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
  'transport-types': model<IMasterDoc>('MasterTransportType', transportTypeSchema),
  transports: model<IMasterDoc>('MasterTransport', transportSchema),
  vehicles: model<IMasterDoc>('MasterVehicle', vehicleSchema),
  'sharing-types': model<IMasterDoc>('MasterSharingType', sharingTypeSchema),
  'tour-types': model<IMasterDoc>('MasterTourType', tourTypeSchema),
  activities: model<IMasterDoc>('MasterActivity', activitySchema),
};
