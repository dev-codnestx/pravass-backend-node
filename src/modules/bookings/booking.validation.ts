import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';

import { bookingStatuses, paymentStatuses, travelerTypes } from './booking.interfaces.js';

export const initiateBooking = {
  body: Joi.object().keys({
    tourId: Joi.string().custom(objectId).required(),
    departureId: Joi.string().allow('', null).optional(),
    departureDate: Joi.date().required(),
    returnDate: Joi.date().allow(null).optional(),
    departureCityId: Joi.string().custom(objectId).allow(null, '').optional(),
    departurePoint: Joi.string().allow('', null).optional(),
    leavingPoint: Joi.string().allow('', null).optional(),
    transportMode: Joi.string().allow('', null).optional(),
    selectedSeats: Joi.array().items(Joi.string()).optional(),
    sharingType: Joi.string().allow('', null).optional(),
    contactName: Joi.string().required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().required(),
    contactDialCode: Joi.number().optional(),
    travelers: Joi.array()
      .items(
        Joi.object().keys({
          type: Joi.string()
            .valid(...travelerTypes)
            .required(),
          fullName: Joi.string().required(),
          dateOfBirth: Joi.date().required(),
          age: Joi.number().min(0).required(),
          gender: Joi.string().valid('male', 'female', 'other').required(),
          passportNumber: Joi.string().allow('', null).optional(),
          passportExpiry: Joi.date().allow(null).optional(),
          aadhaarNumber: Joi.string().allow('', null).optional(),
          panNumber: Joi.string().allow('', null).optional(),
        }),
      )
      .min(1)
      .required(),
    withTransport: Joi.boolean().default(false),
    discountCode: Joi.string().allow('', null).optional(),
    specialRequests: Joi.string().allow('', null).optional(),
  }),
};

export const verifyPayment = {
  body: Joi.object().keys({
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required(),
  }),
};

export const getBookings = {
  query: Joi.object().keys({
    status: Joi.string().valid(...bookingStatuses),
    tourId: Joi.string().custom(objectId),
    customerId: Joi.string().custom(objectId),
    search: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
};

export const getBookingByRef = {
  params: Joi.object().keys({
    bookingRef: Joi.string().required(),
  }),
};

export const updateBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid(...bookingStatuses),
      internalNotes: Joi.string().allow('', null),
      paymentStatus: Joi.string().valid(...paymentStatuses),
    })
    .min(1),
};

export const cancelBooking = {
  params: Joi.object().keys({
    bookingId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string().required(),
  }),
};

export const getTourBookings = {
  params: Joi.object().keys({
    tourId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
