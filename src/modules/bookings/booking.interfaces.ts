import { Types, Document, Model } from 'mongoose';

import { BOOKING_STATUS, PAYMENT_STATUS } from '@/shared/constants/enum.constant.js';

export const bookingStatuses = Object.values(BOOKING_STATUS) as string[];

export const paymentMethods = ['razorpay', 'bank_transfer', 'cash', 'upi'] as const;
export const paymentStatuses = Object.values(PAYMENT_STATUS) as string[];
export const travelerTypes = ['adult', 'child', 'infant'] as const;

export interface ITraveler {
  type: 'adult' | 'child' | 'infant';
  fullName: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  passportNumber?: string;
  passportExpiry?: Date;
  aadhaarNumber?: string;
  panNumber?: string;
}

export interface IBookingPayment {
  method: (typeof paymentMethods)[number];
  status: PAYMENT_STATUS;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // amount paid (in paise for Razorpay)
  amountDue: number; // remaining amount due
  currency: string; // INR default
  paidAt?: Date;
  notes?: string;
}

export interface IBookingPriceBreakdown {
  basePrice: number;
  adultsCount: number;
  childrenCount: number; // with bed
  childrenWithoutBedCount: number;
  infantsCount: number;
  adultTotal: number;
  childTotal: number;
  childWithoutBedTotal: number;
  infantTotal: number;
  extraPersonCount: number;
  extraPersonTotal: number;
  transportPrice: number; // if transport selected
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  taxPercent: number;
  totalAmount: number; // final payable
}

export interface IBooking {
  bookingRef: string; // Auto-generated e.g. BK-RAJPUR-X8K2
  tourId: Types.ObjectId;
  customerId?: Types.ObjectId;
  sourceUserId?: Types.ObjectId;

  // Departure / Trip info
  departureId?: string; // from tour.departures[n]._id
  departureDate: Date;
  returnDate?: Date;
  departureCityId?: Types.ObjectId;
  departurePoint?: string; // joining point name
  leavingPoint?: string;

  // Transport
  transportMode?: string;
  sharingType?: string;
  selectedSeats?: string[];

  // Primary contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactDialCode?: number;

  // Travelers
  travelers: ITraveler[];
  totalTravelers: number;

  // Pricing
  priceBreakdown: IBookingPriceBreakdown;
  totalAmount: number; // denormalized for fast queries

  // Payment
  payment: IBookingPayment;
  status: BOOKING_STATUS;

  // Flags
  withTransport: boolean;
  specialRequests?: string;
  internalNotes?: string;

  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancelReason?: string;

  // Audit
  isDeleted: boolean;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBookingDoc extends IBooking, Document {
  _id: Types.ObjectId;
}

export interface IBookingModel extends Model<IBookingDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<any>;
}
