import Joi from 'joi';
import { SupportModel } from './support.model.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';
import { MessageFrom, TicketPriority, TicketStatus } from './support.constants.js';
import { objectId } from '@/shared/validations/custom.validation.js';

const createTicket = {
  body: Joi.object().keys({
    subject: Joi.string().required(),
    category: Joi.string().required(),
    message: Joi.string().required(),
    priority: Joi.string().valid(...Object.values(TicketPriority)),
    attachments: Joi.array().items(Joi.string()),
  }),
};

const getTickets = {
  query: Joi.object().keys({
    subject: Joi.string(),
    ticketId: Joi.string(),
    status: Joi.string(),
    priority: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
    includeTimeStamps: Joi.any(),
  }),
};

const getTicket = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
};

const updateTicket = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: generateJoiValidation(SupportModel.schema as any, true).keys({
    priority: Joi.string().valid(...Object.values(TicketPriority)),
    status: Joi.string().valid(...Object.values(TicketStatus)),
    category: Joi.string(),
    subject: Joi.string(),
  }),
};

const addReply = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    from: Joi.string()
      .required()
      .valid(...Object.values(MessageFrom)),
    message: Joi.string().required(),
  }),
};

const addInternalNote = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    note: Joi.string().required(),
  }),
};

const deleteTicket = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
};

export const supportValidation = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  addReply,
  addInternalNote,
  deleteTicket,
};
