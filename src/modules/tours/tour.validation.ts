/* eslint-disable camelcase */

import Joi from 'joi';

import { TOUR_CATEGORY } from '@/shared/constants/enum.constant.js';
import { objectId } from '@/shared/validations/custom.validation.js';

import { batchStatuses, tourDifficulties, tourMediaTypes, tourStatuses } from './tour.interfaces.js';

const batch = Joi.object({
  id: Joi.string().allow('', null),
  date: Joi.date().allow('', null),
  status: Joi.string().valid(...batchStatuses),
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
}).custom((value, helpers) => {
  if (!value.url && !value.file) return helpers.message({ custom: '"media.url" is required' });

  return value;
});

const policies = Joi.object({
  payment: Joi.array().items(Joi.string().trim().min(1)).optional(),
  cancellation: Joi.array().items(Joi.string().trim().min(1)).optional(),
  termsAndConditions: Joi.array().items(Joi.string().trim().min(1)).optional(),
  paymentPolicy: Joi.string().allow('', null),
  cancellationPolicy: Joi.string().allow('', null),
  terms: Joi.string().allow('', null),
});

const settings = Joi.object({
  internalNotes: Joi.string().allow('', null),
});

const tourBody = {
  name: Joi.string().trim().required(),
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
  tourType: Joi.string().trim().required(),
  difficulty: Joi.string()
    .valid(...tourDifficulties)
    .default('Easy'),
  description: Joi.string().allow('', null),
  manager: Joi.string().allow('', null),
  managerMobile: Joi.string().allow('', null),
  departureCities: Joi.array().items(Joi.string()),
  batches: Joi.array().items(batch),
  pricingPolicy,
  basePricing,
  seasonalPricing: Joi.array().items(seasonalPricing),
  sharingType: Joi.string().allow('', null),
  validSharingTypes: Joi.array().items(Joi.string()),
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
  paymentPlan: Joi.string().allow('', null),
  refundPolicy: Joi.string().allow('', null),
  paymentPolicy: Joi.string().allow('', null),
  cancellationPolicy: Joi.string().allow('', null),
  terms: Joi.string().allow('', null),
  termsAndConditions: Joi.string().allow('', null),
  policies,
  settings,
};

const createTour = {
  body: Joi.object().keys(tourBody),
};

const getTours = {
  query: Joi.object().keys({
    name: Joi.string(),
    destination: Joi.string(),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid(...tourStatuses),
    tourType: Joi.string(),
    tourCategory: Joi.string(),
    code: Joi.string(),
    difficulty: Joi.string().valid(...tourDifficulties),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
    populate: Joi.string(),
    fields: Joi.string(),
    includeTimeStamps: Joi.boolean(),
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

export const tourValidation = {
  createTour,
  getTours,
  getTour,
  updateTour,
  deleteTour,
};
