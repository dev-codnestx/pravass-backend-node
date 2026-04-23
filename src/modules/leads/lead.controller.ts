import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Types } from 'mongoose';

import { masterModels } from '@/modules/masters/models/master.models.js';
import TourModel from '@/modules/tours/tour.model.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { leadService } from './lead.service.js';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.createLead(req.body, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.status(httpStatus.CREATED).success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Lead created successfully');
});

const getLeads = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'status', 'sourceId', 'assignedToId', 'tourId', 'destinationId', 'leadStageId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.category && !req.query.leadStageId) {
    const category = String(req.query.category).trim();
    const stage = await masterModels['lead-stages']
      .findOne({ name: { $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, deletedAt: null })
      .select('_id')
      .lean();
    if (stage?._id) filter.leadStageId = stage._id;
  }

  if (req.query.search) {
    const searchText = String(req.query.search).trim();
    const searchRegex = { $regex: escapeRegex(searchText), $options: 'i' };
    const matchingTours = await TourModel.find({
      name: searchRegex,
      isDeleted: false,
    })
      .select('_id')
      .lean();

    const tourIds = matchingTours.map((tour) => tour._id).filter((id): id is Types.ObjectId => id instanceof Types.ObjectId);

    const baseOr: Record<string, unknown>[] = [{ name: searchRegex }, { email: searchRegex }];
    if (tourIds.length) baseOr.push({ tourId: { $in: tourIds } });
    filter.$or = baseOr;
  }

  const result = await leadService.queryLeads(filter, options);
  return res.success(result, responseCodes.LeadResponseCodes.SUCCESS, 'Leads fetched successfully');
});

const getLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.getLeadById(req.params.leadId, {
    fields: typeof req.query.fields === 'string' ? req.query.fields : undefined,
    populate: typeof req.query.populate === 'string' ? req.query.populate : undefined,
  });
  if (!lead) return res.status(httpStatus.NOT_FOUND).error('Lead not found');
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Lead fetched successfully');
});

const updateLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.updateLeadById(req.params.leadId, req.body, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Lead updated successfully');
});

const deleteLead = catchAsync(async (req: Request, res: Response) => {
  await leadService.deleteLeadById(req.params.leadId);
  return res.success(null, responseCodes.LeadResponseCodes.SUCCESS, 'Lead deleted successfully');
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.updateLeadStatus(
    req.params.leadId,
    {
      category: req.body.category,
      leadStageId: req.body.leadStageId,
    },
    {
      userId: req.user?.id,
      userName: req.user?.fullName,
    },
  );
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Lead status updated successfully');
});

const reorderLeads = catchAsync(async (req: Request, res: Response) => {
  const leads = await leadService.reorderLeadsByCategory(req.body.category, req.body.orderedIds, req.body.leadStageId);
  return res.success(leads, responseCodes.LeadResponseCodes.SUCCESS, 'Leads reordered successfully');
});

const addNote = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.addNote(req.params.leadId, req.body.note, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Note added successfully');
});

const addFollowUp = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.addFollowUp(req.params.leadId, req.body, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Follow-up reminder set');
});

const completeFollowUp = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.completeFollowUp(req.params.leadId, req.params.followUpId, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Follow-up marked as completed');
});

const logActivity = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.logActivity(req.params.leadId, req.body, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Activity logged');
});

const convertLead = catchAsync(async (req: Request, res: Response) => {
  const lead = await leadService.convertLeadToCustomer(req.params.leadId, {
    userId: req.user?.id,
    userName: req.user?.fullName,
  });
  return res.success(lead, responseCodes.LeadResponseCodes.SUCCESS, 'Lead converted successfully');
});

export const leadController = {
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
