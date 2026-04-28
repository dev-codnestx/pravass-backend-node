import { Document, Model, Types } from 'mongoose';

import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

export const tourStatuses = ['active', 'draft', 'archived'] as const;
export const tourDifficulties = ['Easy', 'Moderate', 'Challenging'] as const;
export const tourMediaTypes = ['image', 'video', 'document'] as const;
export const departureTypes = ['FIXED', 'FLEXIBLE'] as const;
export const departureTransportModes = ['BUS', 'FLIGHT', 'TRAIN'] as const;
export const seatStatuses = ['available', 'booked', 'blocked'] as const;
export const departureFlightTypes = ['DIRECT', '1 STOP', '2 STOP'] as const;

export type TourStatus = (typeof tourStatuses)[number];
export type TourDifficulty = (typeof tourDifficulties)[number];
export type TourMediaType = (typeof tourMediaTypes)[number];
export type DepartureType = (typeof departureTypes)[number];
export type DepartureTransportMode = (typeof departureTransportModes)[number];
export type SeatStatus = (typeof seatStatuses)[number];
export type DepartureFlightType = (typeof departureFlightTypes)[number];

export interface IDepartureJoiningLeavingPoint {
  name: string;
  time?: string;
}

export interface IDepartureCity {
  city: string;
  joiningPoints?: IDepartureJoiningLeavingPoint[];
  leavingPoints?: IDepartureJoiningLeavingPoint[];
}

export interface IFlightOption {
  id?: string;
  airlineName?: string;
  flightNumber?: string;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  type?: DepartureFlightType;
  seats?: number;
  totalSeats?: number;
}

export interface ISeatState {
  seat_no: string;
  status: SeatStatus;
  row?: number;
  column?: number;
}

export interface IDeparture {
  id?: string;
  cityId?: string;
  cityIds?: string[];
  startDate?: Date;
  endDate?: Date;
  transportMode?: DepartureTransportMode;
  transportTypeId?: Types.ObjectId;
  transportId?: string;
  vehicleId?: string;
  seats?: number;
  price?: number;
  joiningLeavingAllowed?: boolean;
  departureCities?: IDepartureCity[];
  joiningPoints?: string[];
  leavingPoints?: string[];
  totalSeatsAvailable?: number;
  airlineName?: string;
  flightNumber?: string;
  flightOptions?: IFlightOption[];
  trainName?: string;
  trainNumber?: string;
  seatStates?: ISeatState[];
}

export interface IPricingPolicy {
  childWithBed?: number;
  childWithoutBed?: number;
  extraPerson?: number;
}

export interface IBasePricing {
  adult?: number;
  child?: number;
  infant?: number;
}

export interface ISeasonalPricing {
  startDate?: Date;
  endDate?: Date;
  adjustmentType?: 'PERCENT';
  value?: number;
}

export interface ITourFaq {
  question: string;
  answer: string;
}

export interface IItineraryDay {
  day?: number;
  dayNumber?: number;
  title?: string;
  description?: string;
  hotelId?: Types.ObjectId;
  hotel?: string;
  roomTypeId?: Types.ObjectId;
  roomType?: string;
  activityIds?: Types.ObjectId[];
  transfers?: Array<{
    fromDestinationId?: Types.ObjectId;
    toDestinationId?: Types.ObjectId;
    transportTypeId?: Types.ObjectId;
    transportMode?: string;
  }>;
}

export interface ITourMedia {
  url: string;
  type: TourMediaType;
  isCover?: boolean;
  alt_text?: string;
  title?: string;
  text?: string;
}

export interface ITourPolicies {
  payment?: string[];
  cancellation?: string[];
  termsAndConditions?: string[];
  refundPolicyId?: string;
}

export interface ITourSettings {
  internalNotes?: string;
}

export interface ITour {
  name: string;
  slug?: string;
  code?: string;
  destinationIds?: Types.ObjectId[];
  continentId?: Types.ObjectId;
  duration: string;
  durationDays?: number;
  durationNights?: number;
  price: number;
  bookings: number;
  status: TourStatus;
  tourType?: Types.ObjectId;
  difficulty: TourDifficulty;
  description?: string;
  manager?: string;
  managerMobile?: string;
  departureCities?: Types.ObjectId[];
  departureType?: DepartureType;
  departures?: IDeparture[];
  pricingPolicy?: IPricingPolicy;
  basePricing?: IBasePricing;
  seasonalPricing?: ISeasonalPricing[];
  sharingType?: string;
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
  media?: ITourMedia[];
  vehicleId?: string;
  videoType?: 'url' | 'file';
  videoFile?: string;
  videoUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  ratings?: number;
  reviews?: number;
  isDeleted?: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  inclusionIds?: Types.ObjectId[];
  exclusionIds?: Types.ObjectId[];
  activityIds?: string[];
  tourCategory?: string;
  paymentPlan?: string;
  refundPolicy?: string;
  paymentPolicy?: string;
  cancellationPolicy?: string;
  terms?: string;
  policies?: ITourPolicies;
  settings?: ITourSettings;
  highlights?: string[];
}

export interface ITourDoc extends ITour, Document {}

export interface ITourModel extends Model<ITourDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult<ITourDoc>>;
}
