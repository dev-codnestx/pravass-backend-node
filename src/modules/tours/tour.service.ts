/* eslint-disable camelcase */

import httpStatus from 'http-status';
import mongoose from 'mongoose';

import { masterModels } from '@/modules/masters/models/master.models.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import { ITour, ITourDoc, ITourMedia, ITourPolicies, TourStatus } from './tour.interfaces.js';
import TourModel from './tour.model.js';

const normalizeStatus = (status: unknown): TourStatus | undefined => {
  if (typeof status !== 'string') return undefined;
  const lowered = status.trim().toLowerCase();
  if (lowered === 'active' || lowered === 'draft' || lowered === 'archived') return lowered;
  return undefined;
};

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toPolicyArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean);

  if (typeof value === 'string')
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  return [];
};

const uniqueStrings = (values: unknown[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = toTrimmedString(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
};

const toObjectIdStrings = (values: unknown[]): string[] =>
  uniqueStrings(values).filter((value) => mongoose.Types.ObjectId.isValid(value));

const resolveTourTypeMeta = async (value: unknown): Promise<{ id: string; name?: string } | undefined> => {
  const normalized = toTrimmedString(value);
  if (!normalized) return undefined;

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    const byId = await masterModels['tour-types'].findById(normalized).select('name').lean();
    if (!byId?._id) return undefined;
    return { id: String(byId._id), name: toTrimmedString(byId.name) };
  }

  const masterTourType = await masterModels['tour-types']
    .findOne({ name: { $regex: `^${normalized}$`, $options: 'i' }, deletedAt: null })
    .select('_id name')
    .lean();
  if (!masterTourType?._id) return undefined;
  return { id: String(masterTourType._id), name: toTrimmedString(masterTourType.name) };
};

const sanitizeDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const nextArray = value.map((entry) => sanitizeDeep(entry)).filter((entry) => entry !== undefined);
    return nextArray.length > 0 ? nextArray : undefined;
  }

  if (value && typeof value === 'object') {
    const pairs = Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, sanitizeDeep(entry)] as const)
      .filter(([, entry]) => entry !== undefined);
    return pairs.length > 0 ? Object.fromEntries(pairs) : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (value === null || value === undefined) return undefined;
  return value;
};

const normalizeMedia = (rawMedia: unknown): ITourMedia[] | undefined => {
  if (!Array.isArray(rawMedia)) return undefined;

  const normalized = rawMedia
    .map((entry, index) => {
      const item = entry as Record<string, unknown>;
      const url = toTrimmedString(item.url) ?? toTrimmedString(item.file);
      if (!url) return null;
      const typeRaw = toTrimmedString(item.type)?.toLowerCase();
      const type: ITourMedia['type'] =
        typeRaw === 'video' || typeRaw === 'document' || typeRaw === 'image' ? typeRaw : 'image';
      const fallbackLabel = url.split('/').pop()?.split('?')[0] || `Media ${index + 1}`;
      const text = toTrimmedString(item.text) ?? toTrimmedString(item.title) ?? fallbackLabel;
      return {
        url,
        type,
        alt_text: toTrimmedString(item.alt_text) ?? fallbackLabel,
        title: toTrimmedString(item.title) ?? text,
        text,
      } as ITourMedia;
    })
    .filter((entry): entry is ITourMedia => Boolean(entry));

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeItinerary = (rawItinerary: unknown): ITour['itinerary'] | undefined => {
  if (!Array.isArray(rawItinerary)) return undefined;

  const normalized = rawItinerary
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const item = entry as Record<string, unknown>;

      const dayNumber =
        typeof item.day === 'number' ? item.day : typeof item.dayNumber === 'number' ? item.dayNumber : index + 1;
      const day = Number.isFinite(dayNumber) && dayNumber > 0 ? Math.floor(dayNumber) : 0;
      if (!day) return null;

      const activityIds = [
        ...(Array.isArray(item.activityIds) ? item.activityIds : []),
        ...(Array.isArray(item.activities) ? item.activities : []),
      ]
        .map((activityId) => toTrimmedString(activityId))
        .filter((activityId): activityId is string => Boolean(activityId));

      const transfers = (Array.isArray(item.transfers) ? item.transfers : [])
        .map((transfer) => {
          if (typeof transfer === 'string') {
            const [routeRaw = '', modeRaw = ''] = transfer.includes('::') ? transfer.split('::') : [transfer, ''];
            const [fromRaw = '', toRaw = ''] = routeRaw.includes('->') ? routeRaw.split('->') : ['', ''];
            const fromDestinationId = toTrimmedString(fromRaw);
            const toDestinationId = toTrimmedString(toRaw);
            const transportMode = toTrimmedString(modeRaw);
            if (!fromDestinationId && !toDestinationId && !transportMode) return null;
            return sanitizeDeep({
              fromDestinationId,
              toDestinationId,
              transportMode,
            }) as NonNullable<NonNullable<ITour['itinerary']>[number]['transfers']>[number];
          }

          if (!transfer || typeof transfer !== 'object') return null;
          const itemTransfer = transfer as Record<string, unknown>;
          const normalizedTransfer = sanitizeDeep({
            fromDestinationId: toTrimmedString(itemTransfer.fromDestinationId),
            toDestinationId: toTrimmedString(itemTransfer.toDestinationId),
            transportTypeId: toTrimmedString(itemTransfer.transportTypeId),
            transportMode: toTrimmedString(itemTransfer.transportMode),
          });

          return normalizedTransfer as NonNullable<NonNullable<ITour['itinerary']>[number]['transfers']>[number];
        })
        .filter(Boolean);

      const normalizedDay = sanitizeDeep({
        day,
        title: toTrimmedString(item.title),
        description: toTrimmedString(item.description),
        hotelId: toTrimmedString(item.hotelId) ?? toTrimmedString(item.hotel),
        hotel: toTrimmedString(item.hotel),
        roomTypeId: toTrimmedString(item.roomTypeId) ?? toTrimmedString(item.roomType),
        roomType: toTrimmedString(item.roomType),
        activityIds: activityIds.length > 0 ? [...new Set(activityIds)] : undefined,
        transfers: transfers.length > 0 ? transfers : undefined,
      });

      return normalizedDay as NonNullable<ITour['itinerary']>[number];
    })
    .filter(Boolean) as NonNullable<ITour['itinerary']>;

  return normalized.length > 0 ? normalized : undefined;
};

const applyPolicyAliases = (payload: Record<string, unknown>) => {
  const policies =
    payload.policies && typeof payload.policies === 'object'
      ? (payload.policies as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const payment = [
    ...toPolicyArray(policies.payment),
    ...toPolicyArray(policies.paymentPolicy),
    ...toPolicyArray(payload.paymentPolicy),
  ];

  const cancellation = [
    ...toPolicyArray(policies.cancellation),
    ...toPolicyArray(policies.cancellationPolicy),
    ...toPolicyArray(payload.cancellationPolicy),
  ];

  const termsAndConditions = [
    ...toPolicyArray(policies.termsAndConditions),
    ...toPolicyArray(policies.terms),
    ...toPolicyArray(payload.terms),
    ...toPolicyArray(payload.termsAndConditions),
  ];

  const normalizedPolicies: ITourPolicies = {
    payment: [...new Set(payment)],
    cancellation: [...new Set(cancellation)],
    termsAndConditions: [...new Set(termsAndConditions)],
  };

  payload.policies = normalizedPolicies;

  if (!payload.paymentPolicy && normalizedPolicies.payment && normalizedPolicies.payment.length > 0)
    payload.paymentPolicy = normalizedPolicies.payment.join('\n');

  if (!payload.cancellationPolicy && normalizedPolicies.cancellation && normalizedPolicies.cancellation.length > 0)
    payload.cancellationPolicy = normalizedPolicies.cancellation.join('\n');

  if (!payload.terms && normalizedPolicies.termsAndConditions && normalizedPolicies.termsAndConditions.length > 0)
    payload.terms = normalizedPolicies.termsAndConditions.join('\n');
};

const normalizeTourPayload = async (tourBody: Partial<ITour>): Promise<Partial<ITour>> => {
  const mutableBody = { ...(tourBody as Record<string, unknown>) };

  const status = normalizeStatus(mutableBody.status);
  if (status) mutableBody.status = status;

  applyPolicyAliases(mutableBody);

  const activityIds = [
    ...toPolicyArray(mutableBody.activityIds),
    ...(Array.isArray(mutableBody.activities)
      ? mutableBody.activities
          .map((entry) => toTrimmedString((entry as Record<string, unknown>)?.id))
          .filter((entry): entry is string => Boolean(entry))
      : []),
  ];
  if (activityIds.length > 0) mutableBody.activityIds = [...new Set(activityIds)];

  const destinationIds = Array.isArray(mutableBody.destinationIds) ? toObjectIdStrings(mutableBody.destinationIds) : [];
  if (destinationIds.length > 0) mutableBody.destinationIds = destinationIds;

  const resolvedTourType = await resolveTourTypeMeta(mutableBody.tourType);
  if (resolvedTourType) mutableBody.tourType = resolvedTourType.id;
  else if (mutableBody.tourType !== undefined)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tourType. Provide a valid master tour type');

  const departureCities = Array.isArray(mutableBody.departureCities) ? uniqueStrings(mutableBody.departureCities) : [];
  if (departureCities.length > 0) mutableBody.departureCities = departureCities;

  const inclusionIds = Array.isArray(mutableBody.inclusionIds) ? uniqueStrings(mutableBody.inclusionIds) : [];
  if (inclusionIds.length > 0) mutableBody.inclusionIds = inclusionIds;

  const exclusionIds = Array.isArray(mutableBody.exclusionIds) ? uniqueStrings(mutableBody.exclusionIds) : [];
  if (exclusionIds.length > 0) mutableBody.exclusionIds = exclusionIds;

  if (mutableBody.basePricing && typeof mutableBody.basePricing === 'object') {
    const basePricing = mutableBody.basePricing as Record<string, unknown>;
    mutableBody.basePricing = sanitizeDeep({
      adult:
        typeof basePricing.adult === 'number'
          ? basePricing.adult
          : toTrimmedString(basePricing.adult)
            ? Number(basePricing.adult)
            : undefined,
      child:
        typeof basePricing.child === 'number'
          ? basePricing.child
          : toTrimmedString(basePricing.child)
            ? Number(basePricing.child)
            : undefined,
      infant:
        typeof basePricing.infant === 'number'
          ? basePricing.infant
          : toTrimmedString(basePricing.infant)
            ? Number(basePricing.infant)
            : undefined,
    }) as ITour['basePricing'];
  }

  if (Array.isArray(mutableBody.seasonalPricing))
    mutableBody.seasonalPricing = mutableBody.seasonalPricing
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return undefined;
        const rule = entry as Record<string, unknown>;
        return sanitizeDeep({
          startDate: toTrimmedString(rule.startDate) ?? rule.startDate,
          endDate: toTrimmedString(rule.endDate) ?? rule.endDate,
          adjustmentType: toTrimmedString(rule.adjustmentType) ?? 'PERCENT',
          value: typeof rule.value === 'number' ? rule.value : toTrimmedString(rule.value) ? Number(rule.value) : undefined,
        });
      })
      .filter(Boolean) as ITour['seasonalPricing'];

  const media = normalizeMedia(mutableBody.media);
  if (media) mutableBody.media = media;

  const itinerary = normalizeItinerary(mutableBody.itinerary);
  if (itinerary) mutableBody.itinerary = itinerary;

  if (!media) {
    const gallery = Array.isArray(mutableBody.gallery)
      ? mutableBody.gallery.map((entry) => toTrimmedString(entry)).filter((entry): entry is string => Boolean(entry))
      : [];

    const videoUrl = toTrimmedString(mutableBody.videoUrl);
    if (gallery.length > 0 || videoUrl)
      mutableBody.media = [
        ...gallery.map((url) => ({ url, type: 'image' as const })),
        ...(videoUrl ? [{ url: videoUrl, type: 'video' as const }] : []),
      ];
  }

  const cleaned = sanitizeDeep(mutableBody);
  return (cleaned as Partial<ITour>) ?? {};
};

const ensureUniqueCode = async (code?: string, excludeId?: string) => {
  const normalizedCode = toTrimmedString(code);
  if (!normalizedCode) return;

  const existing = await TourModel.findOne({
    code: normalizedCode.toUpperCase(),
    isDeleted: false,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('_id');

  if (existing) throw new ApiError(httpStatus.BAD_REQUEST, 'A tour with this code already exists');
};

const syncMediaFallbackFields = (payload: Partial<ITour>) => {
  const media = Array.isArray(payload.media) ? payload.media : [];
  if (media.length === 0) return;

  const gallery = media.filter((entry) => entry.type === 'image').map((entry) => entry.url);
  const video = media.find((entry) => entry.type === 'video')?.url;

  if (!payload.gallery || payload.gallery.length === 0) payload.gallery = gallery;
  if (!payload.videoUrl && video) payload.videoUrl = video;
};

const createTour = async (tourBody: ITour): Promise<ITourDoc> => {
  const normalizedBody = await normalizeTourPayload(tourBody);
  syncMediaFallbackFields(normalizedBody);
  await ensureUniqueCode(normalizedBody.code);

  return TourModel.create(normalizedBody);
};

const queryTours = async (filter: Record<string, unknown>, options: PaginateOptions): Promise<QueryResult<ITourDoc>> => {
  const normalizedFilter = { ...filter };

  if (normalizedFilter.tourType) {
    const resolvedTourType = await resolveTourTypeMeta(normalizedFilter.tourType);
    if (resolvedTourType) normalizedFilter.tourType = resolvedTourType.id;
    else normalizedFilter.tourType = '__NO_MATCH__';
  }

  const limit = Math.min(Math.max(Number(options.limit ?? 10), 1), 100);
  const page = Math.max(Number(options.page ?? 1), 1);

  return TourModel.paginate(
    { ...normalizedFilter, isDeleted: false },
    {
      ...options,
      limit,
      page,
      sortBy: options.sortBy || 'createdAt:desc',
    },
  );
};

const getTourById = async (id: string): Promise<ITourDoc | null> => TourModel.findOne({ _id: id, isDeleted: false });

const updateTourById = async (tourId: string, updateBody: Partial<ITour>): Promise<ITourDoc | null> => {
  const tour = await getTourById(tourId);
  if (!tour) throw new ApiError(httpStatus.NOT_FOUND, 'Tour not found');

  const payload: Partial<ITour> = await normalizeTourPayload(updateBody);
  syncMediaFallbackFields(payload);
  await ensureUniqueCode(payload.code, tourId);

  Object.assign(tour, payload);
  await tour.save();
  return tour;
};

const deleteTourById = async (tourId: string): Promise<ITourDoc | null> => {
  const tour = await getTourById(tourId);
  if (!tour) throw new ApiError(httpStatus.NOT_FOUND, 'Tour not found');
  tour.isDeleted = true;
  tour.status = 'archived';
  await tour.save();
  return tour;
};

export const tourService = {
  createTour,
  queryTours,
  getTourById,
  updateTourById,
  deleteTourById,
};
