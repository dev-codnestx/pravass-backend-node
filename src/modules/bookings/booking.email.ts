import { sendTemplatedEmail } from '@/shared/email/email.service.js';

import { IBookingDoc } from './booking.interfaces.js';

export const sendBookingConfirmationEmail = async (booking: IBookingDoc, adminEmails: string[]) => {
  const replacements = {
    contactName: booking.contactName,
    bookingRef: booking.bookingRef,
    tourName: 'Tour Name', // Can fetch tour name or pass it in
    departureDate: booking.departureDate.toISOString().split('T')[0],
    totalTravelers: booking.totalTravelers,
    totalAmount: booking.totalAmount,
    currency: booking.payment?.currency || 'INR',
  };

  // To Customer
  await sendTemplatedEmail({
    to: booking.contactEmail,
    subject: `Booking Confirmed: ${booking.bookingRef}`,
    templateName: 'booking-confirmation',
    replacements,
  });

  // To Admin
  if (adminEmails.length > 0)
    await Promise.all(
      adminEmails.filter(Boolean).map((email) =>
        sendTemplatedEmail({
          to: email,
          subject: `New Booking Confirmed: ${booking.bookingRef}`,
          templateName: 'booking-confirmation',
          replacements,
        }),
      ),
    );
};

export const sendBookingCancelledEmail = async (booking: IBookingDoc, adminEmails: string[]) => {
  const replacements = {
    contactName: booking.contactName,
    bookingRef: booking.bookingRef,
    cancelReason: booking.cancelReason || 'Requested by customer',
  };

  // To Customer
  await sendTemplatedEmail({
    to: booking.contactEmail,
    subject: `Booking Cancelled: ${booking.bookingRef}`,
    templateName: 'booking-cancelled',
    replacements,
  });

  // To Admin
  if (adminEmails.length > 0)
    await Promise.all(
      adminEmails.filter(Boolean).map((email) =>
        sendTemplatedEmail({
          to: email,
          subject: `Booking Cancelled Alert: ${booking.bookingRef}`,
          templateName: 'booking-cancelled',
          replacements,
        }),
      ),
    );
};

export const sendBookingPaymentFailedEmail = async (booking: IBookingDoc) => {
  const replacements = {
    contactName: booking.contactName,
    bookingRef: booking.bookingRef,
  };

  await sendTemplatedEmail({
    to: booking.contactEmail,
    subject: `Payment Failed for Booking: ${booking.bookingRef}`,
    templateName: 'booking-payment-failed',
    replacements,
  });
};
