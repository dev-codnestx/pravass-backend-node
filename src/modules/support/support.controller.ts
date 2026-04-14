import httpStatus from 'http-status';
import { Request, Response } from 'express';
import * as supportService from './support.service.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';

export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.createTicket({
    ...req.body,
    customer: req.user._id,
    customerName: req.user.fullName,
  });
  res.status(httpStatus.CREATED).send(ticket);
});

export const getTickets = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['subject', 'status', 'priority', 'ticketId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    filter.$or = [{ subject: searchRegex }, { ticketId: searchRegex }, { customerName: searchRegex }];
  }

  filter.isDeleted = false;

  const result = await supportService.queryTickets(filter, options);
  const stats = await supportService.getSupportStats();
  res.send({ ...result, stats });
});

export const getTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.getTicketById(req.params.ticketId);
  if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');

  res.send(ticket);
});

export const updateTicket = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.updateTicketById(req.params.ticketId, req.body);
  res.send(ticket);
});

export const addReply = catchAsync(async (req: Request, res: Response) => {
  const messageData = {
    ...req.body,
    name: req.user.fullName,
    time: new Date(),
  };
  const ticket = await supportService.addReply(req.params.ticketId, messageData);
  res.send(ticket);
});

export const addInternalNote = catchAsync(async (req: Request, res: Response) => {
  const ticket = await supportService.addInternalNote(req.params.ticketId, req.body.note);
  res.send(ticket);
});

export const deleteTicket = catchAsync(async (req: Request, res: Response) => {
  await supportService.deleteTicketById(req.params.ticketId);
  res.status(httpStatus.NO_CONTENT).send();
});
