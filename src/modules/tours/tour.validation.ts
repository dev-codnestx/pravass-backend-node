import Joi from 'joi';

import { batchStatuses, tourDifficulties, tourStatuses } from './tour.interfaces.js';
import { TOUR_CATEGORY } from '@/shared/constants/enum.constant.js';

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

const faq = Joi.object({
  question: Joi.string().allow('', null),
  answer: Joi.string().allow('', null),
});

const itineraryDay = Joi.object({
  day: Joi.number().integer().min(1).allow(null),
  title: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  hotel: Joi.string().allow('', null),
});

const tourBody = {
  name: Joi.string().trim().required(),
  code: Joi.string().trim().allow('', null),
  destination: Joi.string().trim().allow('', null),
  destinationIds: Joi.array().items(Joi.string().trim().required()),
  continentId: Joi.string().trim().allow('', null),
  duration: Joi.string().trim().required(),
  durationDays: Joi.number().integer().min(1).allow(null),
  durationNights: Joi.number().integer().min(0).allow(null),
  price: Joi.number().min(0).default(0),
  bookings: Joi.number().integer().min(0).default(0),
  status: Joi.string()
    .valid(...tourStatuses)
    .default('Draft'),
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
  validSharingTypes: Joi.array().items(Joi.string()),
  faqs: Joi.array().items(faq),
  itinerary: Joi.array().items(itineraryDay),
  startDate: Joi.date().allow('', null),
  endDate: Joi.date().allow('', null),
  priceWithTransport: Joi.number().min(0).allow(null),
  priceWithoutTransport: Joi.number().min(0).allow(null),
  transportType: Joi.string().allow('', null),
  inclusions: Joi.string().allow('', null),
  exclusions: Joi.string().allow('', null),
  gallery: Joi.array().items(Joi.string()),
  vehicleId: Joi.string().allow('', null),
  videoType: Joi.string().valid('url', 'file').allow('', null),
  videoFile: Joi.string().allow('', null),
  videoUrl: Joi.string().allow('', null),
  seoTitle: Joi.string().allow('', null),
  seoDescription: Joi.string().allow('', null),
  tourCategory: Joi.string()
    .valid(...Object.values(TOUR_CATEGORY))
    .allow('', null),
  paymentPlan: Joi.string().allow('', null),
  refundPolicy: Joi.string().allow('', null),
  terms: Joi.string().allow('', null),
};

const createTour = {
  body: Joi.object().keys(tourBody),
};

const getTours = {
  query: Joi.object().keys({
    name: Joi.string(),
    destination: Joi.string(),
    status: Joi.string().valid(...tourStatuses),
    tourType: Joi.string(),
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
    tourId: Joi.string().required(),
  }),
};

const updateTour = {
  params: Joi.object().keys({
    tourId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys(tourBody)
    .fork(['name', 'destinationIds', 'duration', 'tourType'], (schema) => schema.optional())
    .min(1),
};

const deleteTour = {
  params: Joi.object().keys({
    tourId: Joi.string().required(),
  }),
};

export const tourValidation = {
  createTour,
  getTours,
  getTour,
  updateTour,
  deleteTour,
};
