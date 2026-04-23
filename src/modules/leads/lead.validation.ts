import Joi from 'joi';

import { objectId } from '@/shared/validations/custom.validation.js';

import {
  LEAD_ACTIVITY_TYPES,
  LEAD_FOLLOW_UP_PRIORITIES,
  LEAD_FOLLOW_UP_TASK_TYPES,
  LEAD_STATUSES,
} from './lead.constants.js';

const createLead = {
  body: Joi.object().keys({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().allow('', null),
    phone: Joi.string().trim().required(),
    sourceId: Joi.string().trim().custom(objectId).required(),
    tourId: Joi.string().trim().custom(objectId).allow('', null),
    destinationId: Joi.string().trim().custom(objectId).allow('', null),
    leadStageId: Joi.string().trim().custom(objectId).required(),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid(...LEAD_STATUSES),
    budget: Joi.number().min(0).allow(null),
    travelDates: Joi.string().trim().allow('', null),
    assignedToId: Joi.string().trim().custom(objectId).allow('', null),
    stageOrder: Joi.number().integer().min(1).allow(null),
  }),
};

const getLeads = {
  query: Joi.object().keys({
    name: Joi.string(),
    status: Joi.string()
      .trim()
      .lowercase()
      .valid(...LEAD_STATUSES),
    category: Joi.string(),
    sourceId: Joi.string().custom(objectId),
    leadStageId: Joi.string().custom(objectId),
    assignedToId: Joi.string().custom(objectId),
    tourId: Joi.string().custom(objectId),
    destinationId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
    populate: Joi.string(),
    fields: Joi.string(),
    includeTimeStamps: Joi.boolean(),
  }),
};

const getLead = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
};

const updateLead = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      email: Joi.string().trim().email().allow('', null),
      phone: Joi.string().trim(),
      sourceId: Joi.string().trim().custom(objectId).allow('', null),
      tourId: Joi.string().trim().custom(objectId).allow('', null),
      destinationId: Joi.string().trim().custom(objectId).allow('', null),
      category: Joi.string().trim(),
      leadStageId: Joi.string().trim().custom(objectId).allow('', null),
      status: Joi.string()
        .trim()
        .lowercase()
        .valid(...LEAD_STATUSES),
      budget: Joi.number().min(0).allow(null),
      travelDates: Joi.string().trim().allow('', null),
      assignedToId: Joi.string().trim().custom(objectId).allow('', null),
      stageOrder: Joi.number().integer().min(1).allow(null),
      notes: Joi.array().items(Joi.string().trim()),
    })
    .min(1),
};

const deleteLead = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
};

const updateStatus = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      category: Joi.string().trim(),
      leadStageId: Joi.string().trim().custom(objectId),
    })
    .or('category', 'leadStageId'),
};

const reorderLeads = {
  body: Joi.object()
    .keys({
      category: Joi.string().trim(),
      leadStageId: Joi.string().trim().custom(objectId),
      orderedIds: Joi.array().items(Joi.string().trim().custom(objectId)).required(),
    })
    .or('category', 'leadStageId'),
};

const addNote = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    note: Joi.string().trim().required(),
  }),
};

const addFollowUp = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().required(),
    taskType: Joi.string()
      .valid(...LEAD_FOLLOW_UP_TASK_TYPES)
      .default('Follow-up'),
    dueDate: Joi.date().required(),
    dueTime: Joi.string().trim().allow('', null),
    priority: Joi.string()
      .valid(...LEAD_FOLLOW_UP_PRIORITIES)
      .default('Medium'),
  }),
};

const completeFollowUp = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
    followUpId: Joi.string().required().custom(objectId),
  }),
};

const logActivity = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    type: Joi.string()
      .required()
      .valid(...LEAD_ACTIVITY_TYPES),
    content: Joi.string().trim().required(),
    userName: Joi.string().trim().allow('', null),
  }),
};

const convertLead = {
  params: Joi.object().keys({
    leadId: Joi.string().required().custom(objectId),
  }),
};

export const leadValidation = {
  createLead,
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  updateStatus,
  reorderLeads,
  addNote,
  addFollowUp,
  completeFollowUp,
  logActivity,
  convertLead,
};
