import crypto from 'crypto';

import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';

import config from '@/shared/config/config.js';
import ApiError from '@/shared/utils/errors/ApiError.js';

import { BookingModel } from './booking.model.js';
import { sendBookingCancelledEmail, sendBookingConfirmationEmail, sendBookingPaymentFailedEmail } from './booking.email.js';
import { IBookingPriceBreakdown, IBookingDoc } from './booking.interfaces.js';
import { TourModel } from '../tours/tour.model.js';
import { customerService } from '../customers/customer.service.js';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/shared/constants/enum.constant.js';

const razorpay = new Razorpay({
  /* eslint-disable camelcase */
  key_id: config.razorpay.keyId || '',
  key_secret: config.razorpay.keySecret || '',
  /* eslint-enable camelcase */
});

export const computePriceBreakdown = (
  tour: any,
  params: {
    adults: number;
    children: number;
    childrenWithoutBed: number;
    infants: number;
    extraPersons: number;
    withTransport: boolean;
    departureId?: string;
    discountCode?: string;
  },
): IBookingPriceBreakdown => {
  const { adults, children, childrenWithoutBed, infants, extraPersons, withTransport, departureId } = params;

  let adultPrice = tour.basePricing?.adult || tour.price || 0;
  let childPrice = tour.basePricing?.child || 0;
  let infantPrice = tour.basePricing?.infant || 0;
  let extraPersonPrice = tour.pricingPolicy?.extraPerson || 0;
  let childWithoutBedPrice = tour.pricingPolicy?.childWithoutBed || 0;
  let childWithBedPrice = tour.pricingPolicy?.childWithBed || childPrice;

  let transportPrice = 0;
  if (withTransport)
    if (tour.priceWithTransport && tour.priceWithoutTransport)
      transportPrice = tour.priceWithTransport - tour.priceWithoutTransport;

  if (departureId) {
    const departure = tour.departures?.find((d: any) => d._id?.toString() === departureId || d.id === departureId);
    if (departure && departure.price) adultPrice = departure.price;
  }

  const adultTotal = adultPrice * adults;
  const childTotal = childWithBedPrice * children;
  const childWithoutBedTotal = childWithoutBedPrice * childrenWithoutBed;
  const infantTotal = infantPrice * infants;
  const extraPersonTotal = extraPersonPrice * extraPersons;

  let basePrice = adultTotal + childTotal + childWithoutBedTotal + infantTotal + extraPersonTotal;

  // Add seasonal pricing adjustment if active
  if (tour.seasonalPricing && tour.seasonalPricing.length > 0) {
    const now = new Date();
    const activeSeason = tour.seasonalPricing.find(
      (season: any) => new Date(season.startDate) <= now && new Date(season.endDate) >= now,
    );
    if (activeSeason)
      if (activeSeason.adjustmentType === 'PERCENT') basePrice = basePrice + basePrice * ((activeSeason.value || 0) / 100);
      else basePrice = basePrice + (activeSeason.value || 0);
  }

  const discountAmount = 0; // Implement discount logic here
  const taxPercent = tour.basePricing?.taxPercent || 0;
  let taxAmount = tour.basePricing?.taxAmount || 0;
  if (taxPercent > 0) taxAmount = ((basePrice + transportPrice - discountAmount) * taxPercent) / 100;

  const totalAmount = basePrice + transportPrice - discountAmount + taxAmount;

  return {
    basePrice,
    adultsCount: adults,
    childrenCount: children,
    childrenWithoutBedCount: childrenWithoutBed,
    infantsCount: infants,
    adultTotal,
    childTotal,
    childWithoutBedTotal,
    infantTotal,
    extraPersonCount: extraPersons,
    extraPersonTotal,
    transportPrice,
    discountAmount,
    discountCode: params.discountCode,
    taxAmount,
    taxPercent,
    totalAmount,
  };
};

export const initiateBooking = async (body: any, sourceUserId?: string) => {
  const tour = await TourModel.findById(body.tourId);
  if (!tour) throw new ApiError(httpStatus.NOT_FOUND, 'Tour not found');

  let customerId = body.customerId;

  // Convert user to customer if booking from website (sourceUserId present)
  if (sourceUserId) {
    const { customer } = await customerService.createOrGetCustomer({
      sourceUserId,
      fullName: body.contactName,
      email: body.contactEmail,
      phoneNumber: body.contactPhone,
      dialCode: body.contactDialCode,
    });
    customerId = customer._id;
  }

  let departure;
  if (body.departureId) {
    departure = tour.departures?.find((d: any) => d._id?.toString() === body.departureId || d.id === body.departureId);
    if (!departure) throw new ApiError(httpStatus.NOT_FOUND, 'Departure not found');

    const totalTravelers = body.travelers.length;
    if (departure.totalSeatsAvailable !== undefined && departure.totalSeatsAvailable < totalTravelers)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Not enough seats available for this departure',
        true,
        undefined,
        'SEATS_UNAVAILABLE',
      );

    // Validate specific seats if provided
    if (body.selectedSeats && body.selectedSeats.length > 0 && departure.seatStates)
      body.selectedSeats.forEach((seatNo: string) => {
        const seat = (departure.seatStates as any[]).find((s) => s.seat_no === seatNo);
        if (seat && (seat.status === 'booked' || seat.status === 'blocked'))
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Seat ${seatNo} is no longer available`,
            true,
            undefined,
            'SEAT_UNAVAILABLE',
          );
      });
  }

  let adults = 0;
  let children = 0;
  let childrenWithoutBed = 0;
  let infants = 0;
  let extraPersons = 0; // You might need logic to calculate this from travelers

  body.travelers.forEach((traveler: any) => {
    if (traveler.type === 'adult') adults += 1;
    else if (traveler.type === 'child')
      children += 1; // Simplify child with bed assumption
    else if (traveler.type === 'infant') infants += 1;
  });

  const priceBreakdown = computePriceBreakdown(tour, {
    adults,
    children,
    childrenWithoutBed,
    infants,
    extraPersons,
    withTransport: body.withTransport,
    departureId: body.departureId,
    discountCode: body.discountCode,
  });

  const totalAmount = priceBreakdown.totalAmount;
  const amountInPaise = Math.round(totalAmount * 100);

  const booking = new BookingModel({
    ...body,
    customerId,
    sourceUserId,
    totalTravelers: body.travelers.length,
    priceBreakdown,
    totalAmount,
    status: BOOKING_STATUS.PENDING,
    payment: {
      method: 'razorpay',
      status: PAYMENT_STATUS.PENDING,
      amount: totalAmount,
      amountDue: totalAmount,
      currency: 'INR',
    },
  });

  // Pre-validate to generate bookingRef
  await booking.validate();

  let razorpayOrder;
  if (amountInPaise > 0) {
    try {
      if (Number.isNaN(amountInPaise)) throw new Error('Calculated total amount is not a valid number');

      if (amountInPaise < 100) throw new Error('Amount must be at least ₹1.00 for online payment');

      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: booking.bookingRef,
      });
      booking.payment.razorpayOrderId = razorpayOrder.id;
    } catch (error: any) {
      // Extract detailed message from Razorpay SDK error structure
      const razorpayErrorMessage =
        error.error?.description || error.description || error.message || 'Unknown Razorpay Error';

      const razorpayErrorCode = error.error?.code || 'RAZORPAY_ERROR';

      console.error('Razorpay Error Details:', {
        code: razorpayErrorCode,
        message: razorpayErrorMessage,
        amount: amountInPaise,
        receipt: booking.bookingRef,
      });

      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Razorpay Order Failed (${razorpayErrorCode}): ${razorpayErrorMessage}`,
      );
    }
  } else {
    booking.payment.status = PAYMENT_STATUS.PAID;
    booking.payment.amountDue = 0;
    booking.status = BOOKING_STATUS.CONFIRMED;
  }

  await booking.save();

  return {
    booking,
    razorpayOrderId: razorpayOrder?.id,
    amount: amountInPaise,
  };
};

/**
 * Synchronizes booking state with Tour departure capacity and seat availability.
 * This handles incrementing/decrementing total bookings, available seats,
 * and specific seat status mapping (passenger names/booking links).
 */
export const syncBookingWithTour = async (booking: IBookingDoc, previousStatus?: string) => {
  const tour = await TourModel.findById(booking.tourId);
  if (!tour) return;

  if (booking.departureId && tour.departures) {
    const departure = tour.departures.find(
      (d: any) => d._id?.toString() === booking.departureId || d.id === booking.departureId,
    );

    if (departure) {
      // If status changed to confirmed
      if (booking.status === BOOKING_STATUS.CONFIRMED && previousStatus !== BOOKING_STATUS.CONFIRMED) {
        // Increment booking count for the whole tour
        tour.bookings = (tour.bookings || 0) + 1;

        // Decrease available seats for this departure
        if (departure.totalSeatsAvailable !== undefined)
          departure.totalSeatsAvailable = Math.max(0, departure.totalSeatsAvailable - booking.totalTravelers);

        // Mark specific seats as booked and link to this booking
        if (booking.selectedSeats && booking.selectedSeats.length > 0 && departure.seatStates) {
          booking.selectedSeats.forEach((seatNo: string, index: number) => {
            const seat = (departure.seatStates as any[]).find((s) => s.seat_no === seatNo);
            if (seat) {
              seat.status = 'booked';
              seat.bookingId = booking._id;
              // Assign individual traveler name if available, otherwise fallback to contact name
              seat.passengerName = booking.travelers?.[index]?.fullName || booking.contactName;
            }
          });
        } else if (departure.seatStates && (departure.seatStates as any[]).length > 0) {
          // If no specific seats selected (e.g. non-bus transport), mark first N available seats as booked
          let travelersToAssign = booking.totalTravelers;
          for (const seat of departure.seatStates as any[]) {
            if (travelersToAssign <= 0) break;
            if (seat.status === 'available') {
              seat.status = 'booked';
              seat.bookingId = booking._id;
              seat.passengerName = booking.contactName;
              travelersToAssign--;
            }
          }
        }
      }
      // If status changed FROM confirmed TO cancelled/failed
      else if (
        (booking.status === BOOKING_STATUS.CANCELLED || booking.status === BOOKING_STATUS.FAILED) &&
        previousStatus === BOOKING_STATUS.CONFIRMED
      ) {
        // Decrement booking count for the whole tour
        tour.bookings = Math.max(0, (tour.bookings || 0) - 1);

        // Increase available seats for this departure
        if (departure.totalSeatsAvailable !== undefined) departure.totalSeatsAvailable += booking.totalTravelers;

        // Release seats linked to this booking
        if (departure.seatStates && (departure.seatStates as any[]).length > 0)
          (departure.seatStates as any[]).forEach((seat) => {
            // Check by bookingId or if it's one of the selected seats (fallback for robustness)
            const isMatch =
              seat.bookingId?.toString() === booking._id.toString() ||
              (booking.selectedSeats && booking.selectedSeats.includes(seat.seat_no));

            if (isMatch) {
              seat.status = 'available';
              seat.bookingId = undefined;
              seat.passengerName = undefined;
            }
          });
      }

      // Force Mongoose to recognize changes in the nested departures array
      tour.markModified('departures');
      await tour.save();
    }
  }
};

export const verifyPayment = async (body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

  const booking = (await BookingModel.findOne({ 'payment.razorpayOrderId': razorpayOrderId })) as unknown as IBookingDoc;
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  if (booking.status === BOOKING_STATUS.CONFIRMED) return booking; // Already verified

  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret || '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    booking.payment.status = PAYMENT_STATUS.FAILED;
    booking.status = BOOKING_STATUS.FAILED;
    await booking.save();

    await sendBookingPaymentFailedEmail(booking).catch(console.error);

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Payment verification failed',
      true,
      undefined,
      'PAYMENT_VERIFICATION_FAILED',
    );
  }

  try {
    const previousStatus = booking.status;
    booking.status = BOOKING_STATUS.CONFIRMED;
    booking.payment.status = PAYMENT_STATUS.PAID;
    booking.payment.razorpayPaymentId = razorpayPaymentId;
    booking.payment.razorpaySignature = razorpaySignature;
    booking.payment.paidAt = new Date();
    booking.payment.amountDue = 0;

    await booking.save();

    // Sync with tour (updates seats and capacity)
    await syncBookingWithTour(booking, previousStatus);

    // Send confirmation email
    await sendBookingConfirmationEmail(booking, []).catch(console.error);

    return booking;
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    throw error;
  }
};

export const queryBookings = async (filter: Record<string, any>, options: Record<string, any>) => {
  const bookings = await BookingModel.paginate(filter, options);
  return bookings;
};

export const getBookingById = async (id: string) => {
  const booking = (await BookingModel.findById(id).populate([
    { path: 'tourId', populate: { path: 'tourType' } },
    { path: 'customerId' },
    { path: 'sourceUserId' },
    { path: 'departureCityId' },
  ])) as unknown as IBookingDoc;
  if (!booking || booking.isDeleted) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  return booking;
};

export const getBookingByRef = async (ref: string) => {
  const booking = (await BookingModel.findOne({ bookingRef: ref }).populate([
    { path: 'tourId', populate: { path: 'tourType' } },
    { path: 'customerId' },
    { path: 'sourceUserId' },
    { path: 'departureCityId' },
  ])) as unknown as IBookingDoc;
  if (!booking || booking.isDeleted) throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');

  return booking;
};

export const updateBooking = async (id: string, updateBody: Record<string, any>) => {
  const booking = await getBookingById(id);
  const previousStatus = booking.status;

  if (updateBody.paymentStatus) {
    booking.payment.status = updateBody.paymentStatus;
    delete updateBody.paymentStatus;
  }

  Object.assign(booking, updateBody);
  await booking.save();

  // If status changed, sync with tour
  if (booking.status !== previousStatus) {
    await syncBookingWithTour(booking, previousStatus);

    // If newly confirmed, send email
    if (booking.status === BOOKING_STATUS.CONFIRMED && previousStatus !== BOOKING_STATUS.CONFIRMED)
      await sendBookingConfirmationEmail(booking, []).catch(console.error);
  }

  return booking;
};

export const cancelBooking = async (id: string, reason: string, userId?: string) => {
  const booking = await getBookingById(id);
  const previousStatus = booking.status;

  if (booking.status === BOOKING_STATUS.CANCELLED)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking is already cancelled');

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancelledAt = new Date();
  booking.cancelReason = reason;
  if (userId) booking.cancelledBy = new mongoose.Types.ObjectId(userId);

  await booking.save();

  // Sync with tour (releases seats if it was confirmed)
  await syncBookingWithTour(booking, previousStatus);

  await sendBookingCancelledEmail(booking, []).catch(console.error);

  return booking;
};

export const deleteBooking = async (id: string) => {
  const booking = await getBookingById(id);
  const previousStatus = booking.status;

  booking.isDeleted = true;
  await booking.save();

  // If it was confirmed, release seats
  if (previousStatus === BOOKING_STATUS.CONFIRMED) {
    // Treat as cancellation for seat release purposes
    const tempBooking = booking.toObject() as any;
    tempBooking.status = BOOKING_STATUS.CANCELLED;
    await syncBookingWithTour(tempBooking as IBookingDoc, BOOKING_STATUS.CONFIRMED);
  }

  return booking;
};
