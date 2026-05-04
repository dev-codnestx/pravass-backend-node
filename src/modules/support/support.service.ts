import httpStatus from 'http-status';
import { SupportModel } from './support.model.js';
import { ISupportDoc } from './support.interfaces.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { MessageFrom, TicketStatus } from './support.constants.js';
import { sendSupportReplyEmail, sendTicketCreationEmail } from '@/shared/email/support.email.js';
import UserModel from '../user/user.model.js';

/**
 * Create a ticket
 * @param {Partial<ISupport>} ticketBody
 * @returns {Promise<ISupportDoc>}
 */
export const createTicket = async (ticketBody: Partial<ISupportDoc>): Promise<ISupportDoc> => {
  // Generate Ticket ID (e.g., TKT-1001)
  const lastTicket = await SupportModel.findOne({ ticketId: { $regex: /^TKT-/ } }).sort({ createdAt: -1 });
  let nextId = 1001;
  if (lastTicket && lastTicket.ticketId) {
    const lastId = parseInt(lastTicket.ticketId.split('-')[1]);
    if (!isNaN(lastId)) nextId = lastId + 1;
  }
  ticketBody.ticketId = `TKT-${nextId}`;

  // message is already handled in ticketBody as a string
  const ticket = await SupportModel.create(ticketBody);

  // Send creation email to customer
  const customer = await UserModel.findById(ticket.customer);
  if (customer && customer.email)
    await sendTicketCreationEmail(customer.email, customer.fullName, {
      ticketId: ticket.ticketId,
      subject: ticket.subject,
    });

  return ticket;
};

/**
 * Query for tickets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
export const queryTickets = async (filter: Record<string, unknown>, options: Record<string, unknown>) =>
  SupportModel.paginate(filter, options);

/**
 * Get ticket by id
 * @param {string} id
 * @returns {Promise<ISupportDoc>}
 */
export const getTicketById = async (id: string): Promise<ISupportDoc | null> =>
  SupportModel.findById(id).populate('customer', 'name email');

/**
 * Update ticket by id
 * @param {string} ticketId
 * @param {Object} updateBody
 * @returns {Promise<ISupportDoc>}
 */
export const updateTicketById = async (ticketId: string, updateBody: Partial<ISupportDoc>): Promise<ISupportDoc | null> => {
  const ticket = await getTicketById(ticketId);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  Object.assign(ticket, updateBody);
  await ticket.save();
  return ticket;
};

/**
 * Add reply to ticket
 * @param {string} ticketId
 * @param {IMessage} messageData
 * @returns {Promise<ISupportDoc>}
 */
export const addReply = async (
  ticketId: string,
  messageData: { from: MessageFrom; message: string; name: string; time: Date },
): Promise<ISupportDoc | null> => {
  const ticket = await SupportModel.findById(ticketId).populate('customer', 'name email');
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  // Ensure only agent can reply and only once
  if (messageData.from !== MessageFrom.AGENT) throw new ApiError(httpStatus.BAD_REQUEST, 'Only agent can reply to tickets');

  if (ticket.reply) throw new ApiError(httpStatus.BAD_REQUEST, 'Ticket already has a reply');

  ticket.reply = messageData;
  ticket.status = TicketStatus.RESOLVED;

  // If agent replies, send email to customer
  const customer = await UserModel.findById(ticket.customer);
  if (customer && customer.email)
    await sendSupportReplyEmail(
      customer.email,
      customer.fullName,
      { ticketId: ticket.ticketId, subject: ticket.subject },
      messageData.message,
    );

  await ticket.save();
  return ticket;
};

/**
 * Add internal note to ticket
 * @param {string} ticketId
 * @param {string} note
 * @returns {Promise<ISupportDoc>}
 */
export const addInternalNote = async (ticketId: string, note: string): Promise<ISupportDoc | null> => {
  const ticket = await SupportModel.findById(ticketId);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  ticket.internalNotes.push(note);
  await ticket.save();
  return ticket;
};

/**
 * Delete ticket by id
 * @param {string} ticketId
 * @returns {Promise<ISupportDoc>}
 */
export const deleteTicketById = async (ticketId: string): Promise<ISupportDoc | null> => {
  const ticket = await SupportModel.findById(ticketId);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  ticket.isDeleted = true;
  await ticket.save();
  return ticket;
};
/**
 * Get support statistics
 * @returns {Promise<Object>}
 */
export const getSupportStats = async (filter: Record<string, any> = {}) => {
  const stats = await SupportModel.aggregate([
    { $match: { isDeleted: false, ...filter } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.OPEN] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.IN_PROGRESS] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.RESOLVED] }, 1, 0] } },
      },
    },
  ]);

  if (stats.length === 0) return { total: 0, open: 0, inProgress: 0, resolved: 0 };
  const { _id, ...rest } = stats[0];
  return rest;
};
