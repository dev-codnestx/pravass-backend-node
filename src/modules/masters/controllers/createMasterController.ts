import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose, { type Model } from 'mongoose';

import type { IMasterDoc } from '@/modules/masters/models/master.models.js';
import { toMasterLabel, type MasterModuleKey, type MasterStatus } from '@/modules/masters/common/master.constants.js';
import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

const RESERVED_QUERY_KEYS = new Set(['page', 'limit', 'search', 'status', 'sortBy', 'populate']);
const DEFAULT_POPULATE = [
  { path: 'createdBy', select: 'fullName email' },
  { path: 'updatedBy', select: 'fullName email' },
] as const;
type PopulateSpec = { path: string; select?: string };

const toNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

const toStatus = (value: unknown, fallback?: MasterStatus): MasterStatus | undefined => {
  if (typeof value === 'boolean') return value ? 'active' : 'inactive';
  if (typeof value !== 'string') return fallback;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'active' || normalized === 'inactive') return normalized;
  return fallback;
};

const toObjectIdIfPossible = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) return new mongoose.Types.ObjectId(trimmed);

  return trimmed;
};

const coerceFilterValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return coerceFilterValue(value[value.length - 1]);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && trimmed !== '') return asNumber;

    return toObjectIdIfPossible(trimmed);
  }

  return value;
};

const normalizePayload = (body: Record<string, unknown>, mode: 'create' | 'update'): Record<string, unknown> => {
  const normalized: Record<string, unknown> = {};

  Object.entries(body).forEach(([key, value]) => {
    if (['_id', 'id', '__v', 'createdAt', 'updatedAt', 'deletedAt'].includes(key)) return;

    if (key === 'name') {
      if (typeof value === 'string') normalized[key] = value.trim();
      else normalized[key] = value;
      return;
    }

    if (key === 'status') {
      const status = toStatus(value);
      if (status) normalized[key] = status;
      return;
    }

    normalized[key] = value;
  });

  if (mode === 'create' && !normalized.status) normalized.status = 'active';

  return normalized;
};

const buildQuery = (queryInput: Request['query']): Record<string, unknown> => {
  const query: Record<string, unknown> = { deletedAt: null };

  const status = toStatus(queryInput.status);
  const search = typeof queryInput.search === 'string' ? queryInput.search.trim() : '';

  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };

  Object.entries(queryInput).forEach(([key, value]) => {
    if (RESERVED_QUERY_KEYS.has(key) || value === undefined || value === '') return;
    query[key] = coerceFilterValue(value);
  });

  return query;
};

const parsePopulate = (value: unknown): PopulateSpec[] => {
  if (typeof value !== 'string') return [];

  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<PopulateSpec[]>((acc, entry) => {
      const [pathPart, selectPart] = entry.split(':');
      const path = pathPart?.trim();
      if (!path) return acc;

      const select = selectPart
        ?.split(',')
        .map((field) => field.trim())
        .filter(Boolean)
        .join(' ');

      acc.push({ path, select });
      return acc;
    }, []);
};

const applyPopulate = <T extends { populate: (path: string, select?: string) => T }>(query: T, populateValue?: unknown) => {
  const specs = [...DEFAULT_POPULATE, ...parsePopulate(populateValue)];
  const seen = new Set<string>();

  specs.forEach(({ path, select }) => {
    if (seen.has(path)) return;
    seen.add(path);
    query.populate(path, select);
  });

  return query;
};

export const createMasterController = (Model: Model<IMasterDoc>, moduleKey: MasterModuleKey) => {
  const label = toMasterLabel(moduleKey);

  return {
    list: catchAsync(async (req: Request, res: Response) => {
      const page = toNumber(req.query.page, 1);
      const limit = Math.min(toNumber(req.query.limit, 20), 100);
      const skip = (page - 1) * limit;
      const query = buildQuery(req.query);

      const [items, total] = await Promise.all([
        applyPopulate(Model.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit), req.query.populate).lean(),
        Model.countDocuments(query),
      ]);

      res.success(
        {
          items,
          total,
          page,
          limit,
        },
        responseCodes.LocationResponseCodes.SUCCESS,
        `${label} fetched successfully`,
      );
    }),

    getById: catchAsync(async (req: Request, res: Response) => {
      const item = Model.findOne({
        _id: req.params.id,
        deletedAt: null,
      });

      const populatedItem = await applyPopulate(item, req.query.populate).lean();

      if (!populatedItem) throw new ApiError(httpStatus.NOT_FOUND, `${label} not found`);

      res.success(populatedItem, responseCodes.LocationResponseCodes.SUCCESS, `${label} fetched successfully`);
    }),

    create: catchAsync(async (req: Request, res: Response) => {
      const payload = normalizePayload(req.body as Record<string, unknown>, 'create');

      if (!payload.createdBy && req.user?.id) payload.createdBy = req.user.id;
      if (!payload.updatedBy && req.user?.id) payload.updatedBy = req.user.id;

      const created = await Model.create(payload);
      const item = await applyPopulate(Model.findById(created._id), req.query.populate).lean();

      res
        .status(httpStatus.CREATED)
        .success(item, responseCodes.LocationResponseCodes.SUCCESS, `${label} created successfully`);
    }),

    update: catchAsync(async (req: Request, res: Response) => {
      const payload = normalizePayload(req.body as Record<string, unknown>, 'update');

      if (req.user?.id) payload.updatedBy = req.user.id;

      if (!Object.keys(payload).length)
        throw new ApiError(httpStatus.BAD_REQUEST, 'At least one updatable field is required');

      const updated = Model.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $set: payload },
        { new: true, runValidators: true },
      );

      const populatedUpdated = await applyPopulate(updated, req.query.populate).lean();

      if (!populatedUpdated) throw new ApiError(httpStatus.NOT_FOUND, `${label} not found`);

      res.success(populatedUpdated, responseCodes.LocationResponseCodes.SUCCESS, `${label} updated successfully`);
    }),

    remove: catchAsync(async (req: Request, res: Response) => {
      const updatePayload: Record<string, unknown> = {
        status: 'inactive',
        deletedAt: new Date(),
      };

      if (req.user?.id) updatePayload.updatedBy = req.user.id;

      const deleted = await Model.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { $set: updatePayload },
        { new: true },
      ).lean();

      if (!deleted) throw new ApiError(httpStatus.NOT_FOUND, `${label} not found`);

      res.success(null, responseCodes.LocationResponseCodes.SUCCESS, `${label} deleted successfully`);
    }),
  };
};
