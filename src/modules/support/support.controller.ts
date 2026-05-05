import httpStatus from 'http-status';
import { Request, Response } from 'express';
import * as supportService from './support.service.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';

export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.createTicket({
    ...req.body,
    customer: req.user?._id || req.user?.id,
    customerName: req.user?.fullName || req.user?.firstName || 'User',
  });
  return res.success(ticket, httpStatus.CREATED, 'Ticket created successfully');
});

export const getTickets = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['subject', 'status', 'priority', 'ticketId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  // If not admin, only show own tickets
  const userRole = (req.user?.roleId as any)?.code || '';
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'AGENT'].includes(userRole);

  if (!isAdmin) filter.customer = req.user?._id || req.user?.id;

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [{ subject: searchRegex }, { ticketId: searchRegex }, { customerName: searchRegex }];
  }

  filter.isDeleted = false;

  const statsFilter: Record<string, any> = {};
  if (!isAdmin) statsFilter.customer = req.user?._id || req.user?.id;

  const result = await supportService.queryTickets(filter, options);
  const stats = await supportService.getSupportStats(statsFilter);
  return res.success({ ...result, stats }, httpStatus.OK, 'Tickets fetched successfully');
});

export const getTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.getTicketById(req.params.ticketId);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  return res.success(ticket, httpStatus.OK, 'Ticket fetched successfully');
});

export const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.updateTicketById(req.params.ticketId, req.body);
  return res.success(ticket, httpStatus.OK, 'Ticket updated successfully');
});

export const addReply = catchAsync(async (req: Request, res: Response) => {
  const messageData = {
    ...req.body,
    name: req.user.fullName,
    time: new Date(),
  };
  const ticket = await supportService.addReply(req.params.ticketId, messageData);
  return res.success(ticket, httpStatus.OK, 'Reply added successfully');
});

export const addInternalNote = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.addInternalNote(req.params.ticketId, req.body.note);
  return res.success(ticket, httpStatus.OK, 'Internal note added successfully');
});

export const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  await supportService.deleteTicketById(req.params.ticketId);
  return res.success(null, httpStatus.NO_CONTENT, 'Ticket deleted successfully');
});
