import { sendEmail } from './email.service.js';
import { baseEmailLayout } from './email.layout.js';

/**
 * Send a reply notification to the customer
 * @param to - Customer email
 * @param customerName - Customer full name
 * @param ticketDetails - Details about the ticket
 * @param message - The reply message from the agent
 */
export const sendSupportReplyEmail = async (
  to: string,
  customerName: string,
  ticketDetails: { ticketId: string; subject: string },
  message: string,
): Promise<void> => {
  const subject = `Update on your support ticket #${ticketDetails.ticketId}: ${ticketDetails.subject}`;

  const content = `
    <span class="ticket-id">Ticket #${ticketDetails.ticketId}</span>
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>You have a new message from our support team regarding your ticket: <strong>"${ticketDetails.subject}"</strong>.</p>
    
    <div class="message-box">
      "${message}"
    </div>
    
    <p>If you have any further questions, feel free to reply to this email or visit our support dashboard.</p>
    <p>Best regards,<br><strong>The Pravass Support Team</strong></p>
  `;

  const html = baseEmailLayout('Support Ticket Update', content);
  const text = `Hi ${customerName},\n\nYou have a new message from our support team regarding your ticket "${ticketDetails.subject}".\n\nMessage:\n"${message}"\n\nBest regards,\nConcierge Support Team`;

  await sendEmail(to, subject, text, html);
};

/**
 * Send a notification when a new ticket is created
 * @param to - Customer email
 * @param customerName - Customer name
 * @param ticketDetails - Ticket ID and Subject
 */
export const sendTicketCreationEmail = async (
  to: string,
  customerName: string,
  ticketDetails: { ticketId: string; subject: string },
): Promise<void> => {
  const subject = `Support Ticket Created: #${ticketDetails.ticketId}`;

  const content = `
    <span class="ticket-id">Confirmed: #${ticketDetails.ticketId}</span>
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Your support ticket has been successfully created. Our team is reviewing your request and will get back to you shortly.</p>
    
    <div class="message-box" style="font-style: normal;">
      <strong>Subject:</strong> ${ticketDetails.subject}
    </div>
    
    <p>We typically respond within 24 hours. Thank you for your patience.</p>
    <p>Best regards,<br><strong>The Pravass Support Team</strong></p>
  `;

  const html = baseEmailLayout('Ticket Received', content);
  const text = `Hi ${customerName},\n\nYour support ticket #${ticketDetails.ticketId} has been created. Subject: ${ticketDetails.subject}\n\nRegards,\nConcierge Support Team`;

  await sendEmail(to, subject, text, html);
};
