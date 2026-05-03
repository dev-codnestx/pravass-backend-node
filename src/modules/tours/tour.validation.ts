/* eslint-disable camelcase */

import Joi from 'joi';

import { TOUR_CATEGORY } from '@/shared/constants/enum.constant.js';
import { objectId } from '@/shared/validations/custom.validation.js';

import {
  departureFlightTypes,
  departureTransportModes,
  departureTypes,
  seatStatuses,
  tourDifficulties,
  tourMediaTypes,
  tourStatuses,
} from './tour.interfaces.js';

const joiningLeavingPoint = Joi.object({
  name: Joi.string().trim().required(),
  time: Joi.string().allow('', null),
});

const departureCityItem = Joi.object({
  city: Joi.string().trim().required(),
  joiningPoints: Joi.array().items(joiningLeavingPoint).optional(),
  leavingPoints: Joi.array().items(joiningLeavingPoint).optional(),
});

const flightOption = Joi.object({
  id: Joi.string().allow('', null),
  airlineName: Joi.string().allow('', null),
  flightNumber: Joi.string().allow('', null),
  from: Joi.string().allow('', null),
  to: Joi.string().allow('', null),
  departureTime: Joi.string().allow('', null),
  arrivalTime: Joi.string().allow('', null),
  duration: Joi.string().allow('', null),
  type: Joi.string()
    .valid(...departureFlightTypes)
    .allow('', null),
  seats: Joi.number().min(0).allow(null),
  totalSeats: Joi.number().min(0).allow(null),
});

const seatState = Joi.object({
  seat_no: Joi.string().trim().required(),
  status: Joi.string()
    .valid(...seatStatuses)
    .default('available'),
  row: Joi.number().allow(null),
  column: Joi.number().allow(null),
  level: Joi.string().allow('', null),
  type: Joi.string().allow('', null),
});

const departure = Joi.object({
  id: Joi.string().allow('', null),
  cityId: Joi.string().allow('', null),
  cityIds: Joi.array().items(Joi.string()).optional(),
  startDate: Joi.date().allow('', null),
  endDate: Joi.date().allow('', null),
  transportMode: Joi.string()
    .valid(...departureTransportModes)
    .allow('', null),
  transportTypeId: Joi.string().allow('', null),
  transportId: Joi.string().allow('', null),
  transport_id: Joi.string().allow('', null),
  vehicleId: Joi.string().allow('', null),
  seats: Joi.number().min(0).allow(null),
  price: Joi.number().min(0).allow(null),
  joiningLeavingAllowed: Joi.boolean().allow(null),
  departureCities: Joi.array().items(departureCityItem).optional(),
  joiningPoints: Joi.array().items(Joi.string()).optional(),
  leavingPoints: Joi.array().items(Joi.string()).optional(),
  totalSeatsAvailable: Joi.number().min(0).allow(null),
  airlineName: Joi.string().allow('', null),
  flightNumber: Joi.string().allow('', null),
  flightOptions: Joi.array().items(flightOption).optional(),
  trainName: Joi.string().allow('', null),
  trainNumber: Joi.string().allow('', null),
  seatStates: Joi.array().items(seatState).optional(),
});

const pricingPolicy = Joi.object({
  childWithBed: Joi.number().min(0).allow(null),
  childWithoutBed: Joi.number().min(0).allow(null),
  extraPerson: Joi.number().min(0).allow(null),
});

const basePricing = Joi.object({
  adult: Joi.number().min(0).allow(null),
  child: Joi.number().min(0).allow(null),
  infant: Joi.number().min(0).allow(null),
  taxPercent: Joi.number().min(0).allow(null),
  taxAmount: Joi.number().min(0).allow(null),
});

const seasonalPricing = Joi.object({
  id: Joi.string().allow('', null),
  startDate: Joi.date().allow('', null),
  endDate: Joi.date().allow('', null),
  adjustmentType: Joi.string().valid('PERCENT').allow('', null),
  value: Joi.number().allow(null),
});

const faq = Joi.object({
  question: Joi.string().allow('', null),
  answer: Joi.string().allow('', null),
});

const itineraryDay = Joi.object({
  day: Joi.number().integer().min(1).allow(null),
  dayNumber: Joi.number().integer().min(1).allow(null),
  title: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  hotelId: Joi.string().trim().custom(objectId).allow('', null),
  hotel: Joi.string().allow('', null),
  roomTypeId: Joi.string().trim().custom(objectId).allow('', null),
  roomType: Joi.string().allow('', null),
  activityIds: Joi.array().items(Joi.string().trim().custom(objectId)),
  activities: Joi.array().items(Joi.string().trim()),
  transfers: Joi.array().items(
    Joi.alternatives().try(
      Joi.string().trim(),
      Joi.object({
        fromDestinationId: Joi.string().trim().custom(objectId).allow('', null),
        toDestinationId: Joi.string().trim().custom(objectId).allow('', null),
        transportTypeId: Joi.string().trim().custom(objectId).allow('', null),
        transportMode: Joi.string().allow('', null),
      }),
    ),
  ),
});

const media = Joi.object({
  url: Joi.string().uri().allow('', null),
  file: Joi.string().uri().allow('', null),
  type: Joi.string()
    .valid(...tourMediaTypes)
    .default('image'),
  alt_text: Joi.string().allow('', null),
  title: Joi.string().allow('', null),
  text: Joi.string().allow('', null),
  isCover: Joi.boolean().optional(),
  cover: Joi.boolean().optional(),
  is_cover: Joi.boolean().optional(),
}).custom((value, helpers) => {
  if (!value.url && !value.file) return helpers.message({ custom: '"media.url" is required' });

  const resolvedCover =
    typeof value.isCover === 'boolean'
      ? value.isCover
      : typeof value.cover === 'boolean'
        ? value.cover
        : typeof value.is_cover === 'boolean'
          ? value.is_cover
          : undefined;
  if (typeof resolvedCover === 'boolean') value.isCover = resolvedCover;
  delete value.cover;
  delete value.is_cover;

  return value;
});

const policies = Joi.object({
  payment: Joi.array().items(Joi.string().trim().min(1)).optional(),
  cancellation: Joi.array().items(Joi.string().trim().min(1)).optional(),
  termsAndConditions: Joi.array().items(Joi.string().trim().min(1)).optional(),
  refundPolicyId: Joi.string().allow('', null),
  refundPolicy: Joi.string().allow('', null),
  paymentPolicy: Joi.string().allow('', null),
  cancellationPolicy: Joi.string().allow('', null),
  terms: Joi.string().allow('', null),
});

const settings = Joi.object({
  internalNotes: Joi.string().allow('', null),
});

const tourBody = {
  name: Joi.string().trim().required(),
  slug: Joi.string().trim().lowercase().allow('', null),
  code: Joi.string().trim().allow('', null),
  destination: Joi.string().trim().allow('', null),
  destinationIds: Joi.array().items(Joi.string().trim().custom(objectId)).default([]),
  continentId: Joi.string().trim().custom(objectId).allow('', null),
  duration: Joi.string().trim().required(),
  durationDays: Joi.number().integer().min(1).allow(null),
  durationNights: Joi.number().integer().min(0).allow(null),
  price: Joi.number().min(0).default(0),
  bookings: Joi.number().integer().min(0).default(0),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid(...tourStatuses)
    .default('draft'),
  tourType: Joi.string().trim().allow('', null),
  difficulty: Joi.string()
    .valid(...tourDifficulties)
    .default('Easy'),
  description: Joi.string().allow('', null),
  manager: Joi.string().allow('', null),
  managerMobile: Joi.string().allow('', null),
  departureCities: Joi.array().items(Joi.string()),
  departureType: Joi.string()
    .valid(...departureTypes)
    .allow('', null),
  departures: Joi.array().items(departure),
  basePricing,
  seasonalPricing: Joi.array().items(seasonalPricing),
  sharingType: Joi.string().trim().custom(objectId).allow('', null),
  pricingPolicy,
  faqs: Joi.array().items(faq),
  itinerary: Joi.array().items(itineraryDay),
  startDate: Joi.date().allow('', null),
  endDate: Joi.date().min(Joi.ref('startDate')).allow('', null),
  priceWithTransport: Joi.number().min(0).allow(null),
  priceWithoutTransport: Joi.number().min(0).allow(null),
  transportType: Joi.string().allow('', null),
  inclusions: Joi.string().allow('', null),
  exclusions: Joi.string().allow('', null),
  inclusionIds: Joi.array().items(Joi.string().trim().custom(objectId)),
  exclusionIds: Joi.array().items(Joi.string().trim().custom(objectId)),
  activityIds: Joi.array().items(Joi.string().trim()),
  gallery: Joi.array().items(Joi.string().uri()),
  media: Joi.array().items(media),
  vehicleId: Joi.string().allow('', null),
  videoType: Joi.string().valid('url', 'file').allow('', null),
  videoFile: Joi.string().allow('', null),
  videoUrl: Joi.string().uri().allow('', null),
  seoTitle: Joi.string().allow('', null),
  seoDescription: Joi.string().allow('', null),
  tourCategory: Joi.string()
    .valid(...Object.values(TOUR_CATEGORY))
    .allow('', null),
  paymentPlan: Joi.string().trim().allow('', null),
  refundPolicy: Joi.string().allow('', null),
  paymentPolicy: Joi.string().allow('', null),
  cancellationPolicy: Joi.string().allow('', null),
  terms: Joi.string().allow('', null),
  termsAndConditions: Joi.string().allow('', null),
  highlights: Joi.array().items(Joi.string()),
  policies,
  settings,
  batches: Joi.array().items(
    Joi.object({
      id: Joi.string().allow('', null),
      date: Joi.date().required(),
      status: Joi.string().allow('', null),
    }),
  ),
};

const createTour = {
  body: Joi.object().keys(tourBody),
};

const getTours = {
  query: Joi.object().keys({
    name: Joi.string(),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid(...tourStatuses),
    tourType: Joi.string().trim(),
    tourCategory: Joi.string().trim(),
    tourScope: Joi.string().trim(),
    code: Joi.string().trim(),
    difficulty: Joi.string().valid(...tourDifficulties),
    sortBy: Joi.string().trim(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string().trim(),
    departureCity: Joi.string().trim(),
    budget: Joi.string().trim(),
    rating: Joi.number().allow(null),
    duration: Joi.string().trim(),
    destination: Joi.string().trim(),
    destinationIds: Joi.alternatives().try(Joi.array().items(Joi.string().trim().custom(objectId)), Joi.string().trim()),
    populate: Joi.string().trim(),
    fields: Joi.string().trim(),
    includeTimeStamps: Joi.boolean(),
  }),
};

const searchFlights = {
  query: Joi.object().keys({
    airline: Joi.string().trim().required(),
  }),
};

const getTour = {
  params: Joi.object().keys({
    tourId: Joi.string().required().custom(objectId),
  }),
};

const updateTour = {
  params: Joi.object().keys({
    tourId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys(tourBody)
    .fork(['name', 'duration', 'tourType'], (schema) => schema.optional())
    .min(1),
};

const deleteTour = {
  params: Joi.object().keys({
    tourId: Joi.string().required().custom(objectId),
  }),
};

const duplicateTour = {
  params: Joi.object().keys({
    tourId: Joi.string().required().custom(objectId),
  }),
};

export const tourValidation = {
  createTour,
  getTours,
  searchFlights,
  getTour,
  updateTour,
  deleteTour,
  duplicateTour,
};
