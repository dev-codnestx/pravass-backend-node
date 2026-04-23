import httpStatus from 'http-status';
import { Types } from 'mongoose';

import { masterModels } from '@/modules/masters/models/master.models.js';
import TourModel from '@/modules/tours/tour.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import { getObjectId } from '@/shared/utils/commonHelper.js';
import { getEntityByIdWithQueryString } from '@/shared/utils/modelPopulateFields.js';

import { LeadStatus } from './lead.constants.js';
import { ILead, ILeadDoc } from './lead.interfaces.js';
import LeadModel from './lead.model.js';

const DEFAULT_LEAD_POPULATE = 'tourId:name;destinationId:name;sourceId:name;assignedToId:fullName;leadStageId:name';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCategory = (value: unknown): string => {
  const next = String(value ?? '').trim();
  return next || 'New';
};

const toObjectIdOrNull = (value: unknown): Types.ObjectId | null => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = getObjectId(String(value));
  return parsed instanceof Types.ObjectId ? parsed : null;
};

const resolveMasterIdByName = async (
  model: (typeof masterModels)['lead-stages'],
  name: unknown,
): Promise<Types.ObjectId | null> => {
  const normalized = String(name ?? '').trim();
  if (!normalized) return null;

  const entity = await model
    .findOne({ name: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' }, deletedAt: null })
    .select('_id')
    .lean();

  return entity && entity._id instanceof Types.ObjectId ? entity._id : null;
};

const resolveLeadStageData = async (payload: {
  leadStageId?: unknown;
  category?: unknown;
}): Promise<{ leadStageId?: Types.ObjectId; category: string }> => {
  const requestedCategory = String(payload.category ?? '').trim();
  const requestedLeadStageId = payload.leadStageId;

  if (requestedLeadStageId !== undefined && requestedLeadStageId !== null && requestedLeadStageId !== '') {
    const parsed = getObjectId(String(requestedLeadStageId));
    if (!(parsed instanceof Types.ObjectId)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid leadStageId');

    const stage = await masterModels['lead-stages'].findOne({ _id: parsed, deletedAt: null }).select('name').lean();

    if (!stage) throw new ApiError(httpStatus.BAD_REQUEST, 'Lead stage not found');

    return {
      leadStageId: parsed,
      category: normalizeCategory(stage.name),
    };
  }

  const category = normalizeCategory(requestedCategory);
  if (!category)
    return {
      category: 'New',
    };

  const matchedStage = await masterModels['lead-stages']
    .findOne({
      name: { $regex: `^${escapeRegex(category)}$`, $options: 'i' },
      deletedAt: null,
    })
    .select('_id')
    .lean();

  return {
    leadStageId: matchedStage && matchedStage._id instanceof Types.ObjectId ? matchedStage._id : undefined,
    category,
  };
};

const resolveStatusFromCategory = (category: string): LeadStatus => {
  const normalized = category.trim().toLowerCase();
  if (!normalized) return 'active';
  if (normalized === 'new') return 'active';
  if (normalized === 'lost') return 'inactive';
  if (normalized === 'converted') return 'converted';
  return 'active';
};

const normalizeLeadPayload = async (payload: Partial<ILead>, isCreate: boolean): Promise<Partial<ILead>> => {
  const next = { ...payload } as Partial<ILead> & Record<string, unknown>;

  const hasStageInput =
    (next.leadStageId !== undefined && next.leadStageId !== null && String(next.leadStageId).trim() !== '') ||
    (typeof next.category === 'string' && String(next.category).trim() !== '');
  const stageData =
    isCreate || hasStageInput
      ? await resolveLeadStageData({
          leadStageId: next.leadStageId,
          category: next.category,
        })
      : null;
  if (stageData?.leadStageId) next.leadStageId = stageData.leadStageId;

  const sourceId = toObjectIdOrNull(next.sourceId);
  if (!sourceId && typeof next.source === 'string') {
    const sourceByName = await resolveMasterIdByName(masterModels['lead-sources'], next.source);
    if (sourceByName) next.sourceId = sourceByName;
  } else if (sourceId) {
    next.sourceId = sourceId;
  }

  const tourId = toObjectIdOrNull(next.tourId);
  if (!tourId && typeof next.tour === 'string') {
    const normalizedTourName = String(next.tour).trim();
    if (normalizedTourName) {
      const tour = await TourModel.findOne({
        name: { $regex: `^${escapeRegex(normalizedTourName)}$`, $options: 'i' },
        isDeleted: false,
      })
        .select('_id')
        .lean();
      if (tour && tour._id instanceof Types.ObjectId) next.tourId = tour._id;
    }
  } else if (tourId) {
    next.tourId = tourId;
  }

  const destinationId = toObjectIdOrNull(next.destinationId);
  if (!destinationId && typeof next.destinationInterest === 'string') {
    const byName = await resolveMasterIdByName(masterModels.destinations, next.destinationInterest);
    if (byName) next.destinationId = byName;
  } else if (destinationId) {
    next.destinationId = destinationId;
  }

  const assignedToId = toObjectIdOrNull(next.assignedToId);
  if (assignedToId) next.assignedToId = assignedToId;
  else if (next.assignedToId !== undefined) delete next.assignedToId;

  if (next.status !== undefined) next.status = String(next.status).trim().toLowerCase() as LeadStatus;
  if (!next.status)
    if (isCreate) next.status = 'active';
    else if (stageData) next.status = resolveStatusFromCategory(stageData.category);

  if (Array.isArray(next.notes)) next.notes = next.notes.map((note) => String(note ?? '').trim()).filter(Boolean);
  if (!Array.isArray(next.notes) && isCreate) next.notes = [];

  if (!Array.isArray(next.activities) && isCreate) next.activities = [];
  if (!Array.isArray(next.followUps) && isCreate) next.followUps = [];

  if ((next.stageOrder === undefined || next.stageOrder === null) && stageData?.leadStageId) {
    const [latest] = await LeadModel.find({
      leadStageId: stageData.leadStageId,
      isDeleted: false,
    })
      .sort({ stageOrder: -1 })
      .select('stageOrder')
      .limit(1)
      .lean();
    const current = Number(latest?.stageOrder ?? 0);
    next.stageOrder = Math.max(1, current + 1);
  }

  // Never store duplicated string snapshots when refs exist.
  delete next.category;
  delete next.source;
  delete next.tour;
  delete next.destinationInterest;

  return next;
};

const createLead = async (leadBody: ILead): Promise<ILeadDoc> => {
  const payload = await normalizeLeadPayload(leadBody, true);
  const activities = Array.isArray(payload.activities) ? payload.activities : [];
  if (activities.length === 0)
    payload.activities = [
      {
        type: 'Note',
        content: 'Lead created',
        timestamp: new Date(),
        userName: 'System',
      },
    ];

  return LeadModel.create(payload);
};

const queryLeads = async (
  filter: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<QueryResult<ILeadDoc>> =>
  LeadModel.paginate(
    { ...filter, isDeleted: false },
    {
      ...options,
      sortBy: options.sortBy || 'createdAt:desc',
      populate: options.populate || 'tourId:name;destinationId:name;sourceId:name;assignedToId:fullName;leadStageId:name',
    },
  );

const getLeadById = async (id: string, options?: { fields?: string; populate?: string }): Promise<ILeadDoc | null> => {
  try {
    const lead = await getEntityByIdWithQueryString<ILeadDoc>({
      model: LeadModel,
      entityId: id,
      fields: options?.fields,
      populate: options?.populate || DEFAULT_LEAD_POPULATE,
    });

    if (lead.isDeleted) return null;
    return lead;
  } catch (error) {
    if (error instanceof ApiError && /not found/i.test(error.message)) return null;
    throw error;
  }
};

const updateLeadById = async (leadId: string, updateBody: Partial<ILead>): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  const payload = await normalizeLeadPayload(updateBody, false);
  const fieldLabels: Record<string, string> = {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    sourceId: 'Source',
    tourId: 'Tour',
    destinationId: 'Destination',
    leadStageId: 'Lead Stage',
    assignedToId: 'Assigned To',
    budget: 'Budget',
    travelDates: 'Travel Dates',
  };
  const changedFields = Object.entries(fieldLabels)
    .filter(([field]) => field in payload)
    .filter(([field]) => {
      const previousValue = (lead as unknown as Record<string, unknown>)[field];
      const nextValue = (payload as Record<string, unknown>)[field];
      if (previousValue instanceof Types.ObjectId || nextValue instanceof Types.ObjectId)
        return String(previousValue ?? '') !== String(nextValue ?? '');

      if (typeof previousValue === 'number' || typeof nextValue === 'number')
        return Number(previousValue ?? 0) !== Number(nextValue ?? 0);

      return String(previousValue ?? '').trim() !== String(nextValue ?? '').trim();
    })
    .map(([, label]) => label);

  Object.assign(lead, payload);
  if (changedFields.length)
    lead.activities.unshift({
      type: 'StatusChange',
      content: `Lead updated: ${changedFields.join(', ')}`,
      timestamp: new Date(),
      userName: 'System',
    });

  await lead.save();
  return lead;
};

const deleteLeadById = async (leadId: string): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');
  lead.isDeleted = true;
  await lead.save();
  return lead;
};

const updateLeadStatus = async (
  leadId: string,
  payload: { category?: string; leadStageId?: unknown },
): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  const stageData = await resolveLeadStageData(payload);
  const nextCategory = stageData.category;
  const leadStageValue = (lead as unknown as Record<string, unknown>).leadStageId;
  const previousCategory =
    leadStageValue && typeof leadStageValue === 'object' && 'name' in (leadStageValue as Record<string, unknown>)
      ? String((leadStageValue as Record<string, unknown>).name ?? '').trim() || 'Unknown'
      : 'Unknown';

  if (stageData.leadStageId) {
    const changedStage = String(lead.leadStageId ?? '') !== String(stageData.leadStageId);
    lead.leadStageId = stageData.leadStageId;
    if (changedStage) {
      const [latest] = await LeadModel.find({
        leadStageId: stageData.leadStageId,
        isDeleted: false,
        _id: { $ne: lead._id },
      })
        .sort({ stageOrder: -1 })
        .select('stageOrder')
        .limit(1)
        .lean();
      lead.stageOrder = Math.max(1, Number(latest?.stageOrder ?? 0) + 1);
    }
  }
  lead.status = resolveStatusFromCategory(nextCategory);
  lead.activities.unshift({
    type: 'StatusChange',
    content: `Status changed from ${previousCategory} to ${nextCategory}`,
    timestamp: new Date(),
    userName: 'System',
  });
  await lead.save();
  return lead;
};

const reorderLeadsByCategory = async (
  category: string | undefined,
  orderedIds: string[],
  leadStageIdInput?: unknown,
): Promise<ILeadDoc[]> => {
  const normalizedCategory = normalizeCategory(category);
  const stageData = await resolveLeadStageData({
    category: normalizedCategory,
    leadStageId: leadStageIdInput,
  });
  if (!stageData.leadStageId) return [];

  const validIds = orderedIds
    .map((id) => String(id ?? '').trim())
    .map((id) => getObjectId(id))
    .filter((id): id is Types.ObjectId => id instanceof Types.ObjectId);

  if (!validIds.length) return [];

  const leads = await LeadModel.find({
    _id: { $in: validIds },
    leadStageId: stageData.leadStageId,
    isDeleted: false,
  })
    .select('_id')
    .lean();

  if (!leads.length) return [];

  const availableIds = new Set(leads.map((lead) => String(lead._id)));
  const orderedExistingIds = validIds.filter((id) => availableIds.has(String(id)));
  const updates = orderedExistingIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { stageOrder: index + 1 } },
    },
  }));

  if (updates.length > 0) await LeadModel.bulkWrite(updates);

  return LeadModel.find({
    leadStageId: stageData.leadStageId,
    isDeleted: false,
  }).sort({ stageOrder: 1, createdAt: 1 });
};

const addNote = async (leadId: string, note: string): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  const trimmed = String(note ?? '').trim();
  if (!trimmed) throw new ApiError(httpStatus.BAD_REQUEST, 'Note is required');

  lead.notes.push(trimmed);
  lead.activities.unshift({
    type: 'Note',
    content: trimmed,
    timestamp: new Date(),
    userName: 'System',
  });

  await lead.save();
  return lead;
};

const addFollowUp = async (
  leadId: string,
  followUp: {
    title: string;
    taskType?: 'Follow-up' | 'Call' | 'Email' | 'WhatsApp' | 'Meeting' | 'Other';
    dueDate: Date;
    dueTime?: string;
    priority?: 'Low' | 'Medium' | 'High';
  },
): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  const dueDate = new Date(followUp.dueDate);
  if (Number.isNaN(dueDate.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid dueDate');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  if (dueDate < today) throw new ApiError(httpStatus.BAD_REQUEST, 'Previous dates are not allowed');

  lead.followUps.push({
    title: String(followUp.title ?? '').trim(),
    taskType: followUp.taskType || 'Follow-up',
    dueDate: followUp.dueDate,
    dueTime: followUp.dueTime ? String(followUp.dueTime).trim() : undefined,
    completed: false,
    priority: followUp.priority || 'Medium',
  });
  lead.activities.unshift({
    type: 'Note',
    content: `Reminder added (${String(followUp.taskType ?? 'Follow-up')}): ${String(followUp.title ?? '').trim() || 'Task'}`,
    timestamp: new Date(),
    userName: 'System',
  });
  await lead.save();
  return lead;
};

const completeFollowUp = async (leadId: string, followUpId: string): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  const parsedFollowUpId = getObjectId(followUpId);
  if (!(parsedFollowUpId instanceof Types.ObjectId)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid followUpId');

  const followUpIndex = (lead.followUps as unknown as Array<Record<string, unknown>>).findIndex(
    (item) => String(item._id ?? '') === String(parsedFollowUpId),
  );
  if (followUpIndex < 0) throw new ApiError(httpStatus.NOT_FOUND, 'Follow-up not found');
  const followUp = lead.followUps[followUpIndex];

  if (!followUp.completed) {
    followUp.completed = true;
    lead.activities.unshift({
      type: 'StatusChange',
      content: `Reminder completed: ${String(followUp.title ?? '').trim() || 'Task'}`,
      timestamp: new Date(),
      userName: 'System',
    });
  }

  await lead.save();
  return lead;
};

const logActivity = async (
  leadId: string,
  payload: { type: 'Call' | 'Email' | 'Note' | 'StatusChange'; content: string; userName?: string },
): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  lead.activities.unshift({
    type: payload.type,
    content: String(payload.content ?? '').trim(),
    timestamp: new Date(),
    userName: String(payload.userName ?? 'System').trim() || 'System',
  });
  await lead.save();
  return lead;
};

const convertLeadToCustomer = async (leadId: string): Promise<ILeadDoc | null> => {
  const lead = await getLeadById(leadId);
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  const convertedStage = await resolveMasterIdByName(masterModels['lead-stages'], 'Converted');
  if (convertedStage) lead.leadStageId = convertedStage;
  lead.status = 'converted';
  lead.activities.unshift({
    type: 'StatusChange',
    content: 'Lead converted to customer',
    timestamp: new Date(),
    userName: 'System',
  });
  await lead.save();
  return lead;
};

export const leadService = {
  createLead,
  queryLeads,
  getLeadById,
  updateLeadById,
  deleteLeadById,
  updateLeadStatus,
  reorderLeadsByCategory,
  addNote,
  addFollowUp,
  completeFollowUp,
  logActivity,
  convertLeadToCustomer,
};
