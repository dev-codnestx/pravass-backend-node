import { Schema, model } from 'mongoose';

import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { BOOKING_STATUS } from '@/shared/constants/enum.constant.js';
import {
  bookingStatuses,
  IBookingDoc,
  IBookingModel,
  paymentMethods,
  paymentStatuses,
  travelerTypes,
} from './booking.interfaces.js';

const travelerSchema = new Schema(
  {
    type: { type: String, enum: travelerTypes, required: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    passportNumber: { type: String, trim: true },
    passportExpiry: { type: Date },
    aadhaarNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    method: { type: String, enum: paymentMethods, required: true },
    status: { type: String, enum: paymentStatuses, required: true },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountDue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const priceBreakdownSchema = new Schema(
  {
    basePrice: { type: Number, required: true, min: 0 },
    adultsCount: { type: Number, required: true, min: 0 },
    childrenCount: { type: Number, required: true, min: 0 },
    childrenWithoutBedCount: { type: Number, required: true, min: 0 },
    infantsCount: { type: Number, required: true, min: 0 },
    adultTotal: { type: Number, required: true, min: 0 },
    childTotal: { type: Number, required: true, min: 0 },
    childWithoutBedTotal: { type: Number, required: true, min: 0 },
    infantTotal: { type: Number, required: true, min: 0 },
    extraPersonCount: { type: Number, required: true, min: 0 },
    extraPersonTotal: { type: Number, required: true, min: 0 },
    transportPrice: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    discountCode: { type: String, trim: true },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    taxPercent: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBookingDoc, IBookingModel>(
  {
    bookingRef: { type: String, unique: true, index: true },
    tourId: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    sourceUserId: { type: Schema.Types.ObjectId, ref: 'User' },

    departureId: { type: String, trim: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date },
    departureCityId: { type: Schema.Types.ObjectId, ref: 'MasterDepartureCity' },
    departurePoint: { type: String, trim: true },
    leavingPoint: { type: String, trim: true },

    transportMode: { type: String, trim: true },
    sharingType: { type: String, trim: true },
    selectedSeats: [{ type: String, trim: true }],

    contactName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    contactDialCode: { type: Number },

    travelers: [travelerSchema],
    totalTravelers: { type: Number, required: true, min: 1 },

    priceBreakdown: { type: priceBreakdownSchema, required: true },
    totalAmount: { type: Number, required: true, min: 0 },

    payment: { type: paymentSchema, required: true },
    status: { type: String, enum: bookingStatuses, default: BOOKING_STATUS.PENDING, index: true },

    withTransport: { type: Boolean, default: false },
    specialRequests: { type: String, trim: true },
    internalNotes: { type: String, trim: true },

    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelReason: { type: String, trim: true },

    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ tourId: 1, status: 1, isDeleted: 1 });
bookingSchema.index({ customerId: 1, isDeleted: 1 });
bookingSchema.index({ sourceUserId: 1, isDeleted: 1 });
bookingSchema.index({ contactEmail: 1, isDeleted: 1 });
bookingSchema.index({ contactPhone: 1, isDeleted: 1 });
bookingSchema.index({ 'payment.razorpayOrderId': 1 });
bookingSchema.index({ departureDate: 1, status: 1 });

bookingSchema.pre('validate', function generateBookingRef() {
  if (!this.bookingRef) {
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.bookingRef = `BK-${randomSuffix}-${Date.now().toString().slice(-4)}`;
  }
});

bookingSchema.plugin(toJSON);
bookingSchema.plugin(paginate);

export const BookingModel = model<IBookingDoc, IBookingModel>('Booking', bookingSchema);
export default BookingModel;
