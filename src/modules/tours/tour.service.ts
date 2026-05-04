/* eslint-disable camelcase */

import httpStatus from 'http-status';
import mongoose, { Types } from 'mongoose';
import axios from 'axios';

import { masterModels } from '@/modules/masters/models/master.models.js';
import config from '@/shared/config/config.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { cloneDocument } from '@/shared/utils/copy.command.js';
import { getEntityByIdWithQueryString } from '@/shared/utils/modelPopulateFields.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import { IDeparture, ITour, ITourDoc, ITourMedia, ITourPolicies, TourStatus } from './tour.interfaces.js';
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

const resolveActivityIdsFromDestinations = async (destinationIds: string[]): Promise<string[]> => {
  if (!destinationIds.length) return [];

  const destinations = await masterModels.destinations
    .find({ _id: { $in: destinationIds } })
    .select('activityIds')
    .lean();

  const activityIdSet = new Set<string>();
  destinations.forEach((destination) => {
    const activityIds = Array.isArray(destination.activityIds) ? destination.activityIds : [];
    activityIds.forEach((activityId) => {
      const normalizedId = toTrimmedString(String(activityId));
      if (normalizedId && mongoose.Types.ObjectId.isValid(normalizedId)) activityIdSet.add(normalizedId);
    });
  });

  return Array.from(activityIdSet);
};

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
    if (value instanceof Date) return value;
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
      const isCover =
        typeof item.isCover === 'boolean'
          ? item.isCover
          : typeof item.cover === 'boolean'
            ? item.cover
            : typeof item.is_cover === 'boolean'
              ? item.is_cover
              : undefined;
      const fallbackLabel = url.split('/').pop()?.split('?')[0] || `Media ${index + 1}`;
      const text = toTrimmedString(item.text) ?? toTrimmedString(item.title) ?? fallbackLabel;
      return {
        url,
        type,
        isCover,
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

const normalizeDepartures = async (rawDepartures: unknown): Promise<ITour['departures'] | undefined> => {
  if (!Array.isArray(rawDepartures)) return undefined;

  const normalized = await Promise.all(
    rawDepartures.map(async (entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const item = entry as Record<string, unknown>;

      const startDate = toTrimmedString(item.startDate) ?? item.startDate;
      const endDate = toTrimmedString(item.endDate) ?? item.endDate;

      const flightOptions = (Array.isArray(item.flightOptions) ? item.flightOptions : []).map((option: any) =>
        sanitizeDeep({
          id: toTrimmedString(option.id),
          airlineName: toTrimmedString(option.airlineName),
          flightNumber: toTrimmedString(option.flightNumber),
          from: toTrimmedString(option.from),
          to: toTrimmedString(option.to),
          departureTime: toTrimmedString(option.departureTime),
          arrivalTime: toTrimmedString(option.arrivalTime),
          duration: toTrimmedString(option.duration),
          type: toTrimmedString(option.type),
          seats: typeof option.seats === 'number' ? option.seats : undefined,
          totalSeats: typeof option.totalSeats === 'number' ? option.totalSeats : undefined,
        }),
      );

      let seatStates = (Array.isArray(item.seatStates) ? item.seatStates : []).map((seat: any) =>
        sanitizeDeep({
          seat_no: toTrimmedString(seat.seat_no),
          status: toTrimmedString(seat.status),
          row: typeof seat.row === 'number' ? seat.row : undefined,
          column: typeof seat.column === 'number' ? seat.column : undefined,
          level: toTrimmedString(seat.level),
          type: toTrimmedString(seat.type),
        }),
      );

      const vehicleId = toTrimmedString(item.vehicleId);

      // If seatStates is empty but vehicleId is provided, pull from MasterVehicle
      if (seatStates.length === 0 && vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
        const vehicle = await masterModels.vehicles.findById(vehicleId).lean();
        const layout = (vehicle as any)?.seatLayout;
        if (layout && Array.isArray(layout.seats))
          seatStates = layout.seats.map((s: any) => ({
            seat_no: s.seat_no || s.number,
            status: s.status || 'available',
            row: s.row,
            column: s.column,
            level: s.level,
            type: s.type,
          }));
      }

      const departureCities = (Array.isArray(item.departureCities) ? item.departureCities : []).map((cityEntry: any) =>
        sanitizeDeep({
          city: toTrimmedString(cityEntry.city),
          joiningPoints: (Array.isArray(cityEntry.joiningPoints) ? cityEntry.joiningPoints : []).map((p: any) =>
            sanitizeDeep({ name: toTrimmedString(p.name), time: toTrimmedString(p.time) }),
          ),
          leavingPoints: (Array.isArray(cityEntry.leavingPoints) ? cityEntry.leavingPoints : []).map((p: any) =>
            sanitizeDeep({ name: toTrimmedString(p.name), time: toTrimmedString(p.time) }),
          ),
        }),
      );

      const normalizedDeparture = sanitizeDeep({
        id: toTrimmedString(item.id),
        cityId: toTrimmedString(item.cityId),
        cityIds: Array.isArray(item.cityIds) ? uniqueStrings(item.cityIds) : undefined,
        startDate: startDate ? new Date(startDate as any) : undefined,
        endDate: endDate ? new Date(endDate as any) : undefined,
        transportMode: toTrimmedString(item.transportMode),
        transportTypeId: toTrimmedString(item.transportTypeId),
        transportId: toTrimmedString(item.transportId) ?? toTrimmedString(item.transport_id),
        transport_id: toTrimmedString(item.transport_id) ?? toTrimmedString(item.transportId),
        vehicleId,
        seats: typeof item.seats === 'number' ? item.seats : undefined,
        price: typeof item.price === 'number' ? item.price : undefined,
        joiningLeavingAllowed: typeof item.joiningLeavingAllowed === 'boolean' ? item.joiningLeavingAllowed : undefined,
        departureCities: departureCities.length > 0 ? departureCities : undefined,
        joiningPoints: Array.isArray(item.joiningPoints) ? uniqueStrings(item.joiningPoints) : undefined,
        leavingPoints: Array.isArray(item.leavingPoints) ? uniqueStrings(item.leavingPoints) : undefined,
        totalSeatsAvailable: typeof item.totalSeatsAvailable === 'number' ? item.totalSeatsAvailable : undefined,
        airlineName: toTrimmedString(item.airlineName),
        flightNumber: toTrimmedString(item.flightNumber),
        flightOptions: flightOptions.length > 0 ? flightOptions : undefined,
        trainName: toTrimmedString(item.trainName),
        trainNumber: toTrimmedString(item.trainNumber),
        seatStates: seatStates.length > 0 ? seatStates : undefined,
      });

      return normalizedDeparture as IDeparture;
    }),
  );

  const filtered = normalized.filter(Boolean) as IDeparture[];
  return filtered.length > 0 ? filtered : undefined;
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
  const refundPolicyId =
    toTrimmedString(policies.refundPolicyId) ??
    toTrimmedString(policies.refundPolicy) ??
    toTrimmedString(payload.refundPolicy);

  const normalizedPolicies: ITourPolicies = {
    payment: [...new Set(payment)],
    cancellation: [...new Set(cancellation)],
    termsAndConditions: [...new Set(termsAndConditions)],
    refundPolicyId,
  };

  payload.policies = normalizedPolicies;

  if (!payload.paymentPolicy && normalizedPolicies.payment && normalizedPolicies.payment.length > 0)
    payload.paymentPolicy = normalizedPolicies.payment.join('\n');

  if (!payload.cancellationPolicy && normalizedPolicies.cancellation && normalizedPolicies.cancellation.length > 0)
    payload.cancellationPolicy = normalizedPolicies.cancellation.join('\n');

  if (!payload.terms && normalizedPolicies.termsAndConditions && normalizedPolicies.termsAndConditions.length > 0)
    payload.terms = normalizedPolicies.termsAndConditions.join('\n');

  if (!payload.refundPolicy && normalizedPolicies.refundPolicyId) payload.refundPolicy = normalizedPolicies.refundPolicyId;
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

  const hasDestinationIdsInPayload = Array.isArray(mutableBody.destinationIds);
  const destinationIds = hasDestinationIdsInPayload ? toObjectIdStrings(mutableBody.destinationIds as unknown[]) : [];
  if (hasDestinationIdsInPayload) mutableBody.destinationIds = destinationIds;

  const hasExplicitActivityIds =
    Array.isArray(mutableBody.activityIds) || (Array.isArray(mutableBody.activities) && mutableBody.activities.length > 0);
  if (hasDestinationIdsInPayload && !hasExplicitActivityIds) {
    const mappedActivityIds = await resolveActivityIdsFromDestinations(destinationIds);
    // eslint-disable-next-line require-atomic-updates
    mutableBody.activityIds = mappedActivityIds;
  }

  const resolvedTourType = await resolveTourTypeMeta(mutableBody.tourType);
  // eslint-disable-next-line require-atomic-updates
  if (resolvedTourType) mutableBody.tourType = resolvedTourType.id;
  else if (mutableBody.tourType !== undefined)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tourType. Provide a valid master tour type');

  const departureCities = Array.isArray(mutableBody.departureCities)
    ? mutableBody.departureCities
        .map((entry) => (typeof entry === 'object' ? entry : toTrimmedString(entry)))
        .filter(Boolean)
    : [];
  if (departureCities.length > 0)
    if (typeof departureCities[0] === 'string') mutableBody.departureCities = uniqueStrings(departureCities);
    else
      // It's already the new structure or mixed, let it be for now or handle as needed
      mutableBody.departureCities = departureCities;

  const departures = await normalizeDepartures(mutableBody.departures);
  if (departures) {
    // eslint-disable-next-line require-atomic-updates
    mutableBody.departures = departures;

    // Auto-populate root departureCities from departures.cityIds
    const allCityIds = departures.flatMap((dep) => dep.cityIds || []).filter(Boolean);
    if (allCityIds.length > 0) {
      const existingCities = Array.isArray(mutableBody.departureCities) ? mutableBody.departureCities : [];
      mutableBody.departureCities = uniqueStrings([...existingCities, ...allCityIds] as string[]);
    }
  } else if (Array.isArray(mutableBody.batches) && mutableBody.batches.length > 0) {
    // Map batches to departures if no explicit departures are provided
    // Capture dependencies into a local variable before the await to prevent drift/race conditions
    const batchMappingInput = mutableBody.batches.map((batch: any) => ({
      id: batch.id,
      startDate: batch.date,
      transportMode: mutableBody.transportType || 'BUS', // Fallback to BUS
      vehicleId: mutableBody.vehicleId,
      price: mutableBody.price,
    }));

    const normalizedBatches = await normalizeDepartures(batchMappingInput);
    if (normalizedBatches)
      // eslint-disable-next-line require-atomic-updates
      mutableBody.departures = normalizedBatches;
  }

  const inclusionIds = Array.isArray(mutableBody.inclusionIds) ? uniqueStrings(mutableBody.inclusionIds) : [];
  if (inclusionIds.length > 0) mutableBody.inclusionIds = inclusionIds;

  const exclusionIds = Array.isArray(mutableBody.exclusionIds) ? uniqueStrings(mutableBody.exclusionIds) : [];
  if (exclusionIds.length > 0) mutableBody.exclusionIds = exclusionIds;

  if (mutableBody.basePricing && typeof mutableBody.basePricing === 'object') {
    const basePricing = mutableBody.basePricing as Record<string, unknown>;
    const bp: any = {};
    if (basePricing.adult !== undefined)
      bp.adult = typeof basePricing.adult === 'number' ? basePricing.adult : Number(basePricing.adult);
    if (basePricing.child !== undefined)
      bp.child = typeof basePricing.child === 'number' ? basePricing.child : Number(basePricing.child);
    if (basePricing.infant !== undefined)
      bp.infant = typeof basePricing.infant === 'number' ? basePricing.infant : Number(basePricing.infant);
    if (basePricing.taxPercent !== undefined)
      bp.taxPercent = typeof basePricing.taxPercent === 'number' ? basePricing.taxPercent : Number(basePricing.taxPercent);
    if (basePricing.taxAmount !== undefined)
      bp.taxAmount = typeof basePricing.taxAmount === 'number' ? basePricing.taxAmount : Number(basePricing.taxAmount);

    mutableBody.basePricing = sanitizeDeep(bp) as ITour['basePricing'];
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
        ...gallery.map((url, index) => ({ url, type: 'image' as const, isCover: index === 0 })),
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
    const tourTypeVal = normalizedFilter.tourType;
    if (typeof tourTypeVal === 'string') {
      const typeNames = tourTypeVal
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const resolvedResults = await Promise.all(
        typeNames.map(async (name) => {
          if (Types.ObjectId.isValid(name)) return new Types.ObjectId(name);

          const resolved = await resolveTourTypeMeta(name);
          return resolved ? new Types.ObjectId(resolved.id) : null;
        }),
      );

      const resolvedIds = resolvedResults.filter((id): id is Types.ObjectId => id !== null);

      if (resolvedIds.length > 0) normalizedFilter.tourType = { $in: resolvedIds };
      else
        // If no valid IDs were resolved from the names, use a non-matching ID
        normalizedFilter.tourType = new Types.ObjectId();
    }
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

type FlightLookupSuggestion = {
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  stops: number;
};

const toTimeValue = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(11, 16);
};

const searchFlightsByAirline = async (airline: string): Promise<FlightLookupSuggestion[]> => {
  const normalizedAirline = airline.trim().toUpperCase();
  if (!normalizedAirline) return [];

  const apiKey = config.aviationstack.apiKey;
  if (!apiKey) return [];

  const { data } = await axios.get(config.aviationstack.baseUrl, {
    params: {
      access_key: apiKey,
      airline_iata: normalizedAirline,
    },
    timeout: 15000,
  });

  const rows = Array.isArray(data?.data) ? data.data : [];
  const suggestions: FlightLookupSuggestion[] = [];
  const seen = new Set<string>();

  rows.forEach((flight: Record<string, unknown>) => {
    const flightNode = (flight.flight as Record<string, unknown>) || {};
    const departureNode = (flight.departure as Record<string, unknown>) || {};
    const arrivalNode = (flight.arrival as Record<string, unknown>) || {};

    const flightNumber = String(flightNode.iata ?? flightNode.number ?? '')
      .trim()
      .toUpperCase();
    const from = String(departureNode.iata ?? '')
      .trim()
      .toUpperCase();
    const to = String(arrivalNode.iata ?? '')
      .trim()
      .toUpperCase();
    if (!flightNumber || !from || !to) return;

    const key = `${flightNumber}-${from}-${to}`;
    if (seen.has(key)) return;
    seen.add(key);

    const stops = Math.max(0, Number(flightNode.number_of_stops ?? 0));
    suggestions.push({
      flightNumber,
      from,
      to,
      departureTime: toTimeValue(departureNode.scheduled),
      arrivalTime: toTimeValue(arrivalNode.scheduled),
      stops: Number.isFinite(stops) ? stops : 0,
    });
  });

  return suggestions;
};

const getTourById = async (id: string, options?: { populate?: string; fields?: string }): Promise<ITourDoc | null> => {
  let tour: ITourDoc | null = null;
  if (options && (options.populate || options.fields))
    try {
      tour = await getEntityByIdWithQueryString({
        model: TourModel,
        entityId: id,
        populate: options.populate,
        fields: options.fields,
      });
    } catch (err: any) {
      if (err.statusCode === 200 || err.statusCode === 404) return null;
      throw err;
    }
  else tour = await TourModel.findOne({ _id: id, isDeleted: false });

  if (!tour || tour.isDeleted) return null;

  // Professional On-the-fly Population:
  // If departures have vehicleId but NO seatStates, populate them from MasterVehicle
  if (Array.isArray(tour.departures))
    await Promise.all(
      tour.departures.map(async (dep) => {
        if ((!dep.seatStates || dep.seatStates.length === 0) && dep.vehicleId) {
          const vehicle = await masterModels.vehicles.findById(dep.vehicleId).lean();
          const layout = (vehicle as any)?.seatLayout;
          if (layout && Array.isArray(layout.seats)) {
            const mappedSeats = layout.seats.map((s: any) => ({
              seat_no: s.seat_no || s.number,
              status: s.status || 'available',
              row: s.row,
              column: s.column,
              level: s.level,
              type: s.type,
            }));
            // eslint-disable-next-line require-atomic-updates
            dep.seatStates = mappedSeats;
          }
        }
      }),
    );

  return tour;
};

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

const duplicateTourById = async (tourId: string): Promise<ITourDoc> => {
  const sourceTour = await getTourById(tourId);
  if (!sourceTour) throw new ApiError(httpStatus.NOT_FOUND, 'Tour not found');

  const sourceName = toTrimmedString(sourceTour.name) ?? 'Untitled Tour';
  const clonedResult = await cloneDocument<any>({
    model: TourModel,
    id: String(sourceTour._id),
    omitFields: ['deletedAt'],
    overrides: {
      name: `${sourceName} Copy`,
      code: undefined,
      status: 'draft',
      isDeleted: false,
    },
  });

  const clonedTour = Array.isArray(clonedResult) ? clonedResult[0] : clonedResult;
  return clonedTour as ITourDoc;
};

export const tourService = {
  createTour,
  queryTours,
  searchFlightsByAirline,
  getTourById,
  updateTourById,
  deleteTourById,
  duplicateTourById,
};
