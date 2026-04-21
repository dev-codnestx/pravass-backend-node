import httpStatus from 'http-status';

import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';

import { ISpecialityTour, ISpecialityTourDoc } from './specialityTour.interfaces.js';
import SpecialityTourModel from './specialityTour.model.js';

const normalizeSlug = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const buildDuplicateSlug = async (baseSlug: string): Promise<string> => {
  const normalizedBase = normalizeSlug(baseSlug) || 'speciality-tour';
  const slugPrefix = `${normalizedBase}-copy`;
  const escapedPrefix = slugPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const duplicatePattern = new RegExp(`^${escapedPrefix}(?:-(\\d+))?$`);

  const existingDuplicates = await SpecialityTourModel.find({ slug: duplicatePattern }, { slug: 1, _id: 0 }).lean();

  if (!existingDuplicates.length) return slugPrefix;

  let maxSuffix = 1;
  existingDuplicates.forEach((entry) => {
    const slug = normalizeSlug(entry?.slug);
    const match = slug.match(duplicatePattern);
    if (!match) return;

    const suffix = match[1] ? Number(match[1]) : 1;
    if (Number.isFinite(suffix)) maxSuffix = Math.max(maxSuffix, suffix);
  });

  return `${slugPrefix}-${maxSuffix + 1}`;
};

const createSpecialityTour = async (payload: Partial<ISpecialityTour>): Promise<ISpecialityTourDoc> => {
  const slug = normalizeSlug(payload.slug);

  if (!slug) throw new ApiError(httpStatus.BAD_REQUEST, 'Slug is required');

  if (await SpecialityTourModel.isSlugTaken(slug))
    throw new ApiError(httpStatus.BAD_REQUEST, 'A speciality tour with this slug already exists');

  return SpecialityTourModel.create({
    ...payload,
    slug,
  });
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const querySpecialityTours = (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult> =>
  Promise.resolve(SpecialityTourModel.paginate(filter, options as any));

const getSpecialityTourById = async (specialityTourId: string): Promise<ISpecialityTourDoc | null> =>
  SpecialityTourModel.findById(specialityTourId);

const updateSpecialityTourById = async (
  specialityTourId: string,
  payload: Partial<ISpecialityTour>,
): Promise<ISpecialityTourDoc> => {
  const specialityTour = await getSpecialityTourById(specialityTourId);

  if (!specialityTour) throw new ApiError(httpStatus.NOT_FOUND, 'Speciality tour not found');

  const updates: Partial<ISpecialityTour> = { ...payload };

  if (payload.slug) {
    const normalizedSlug = normalizeSlug(payload.slug);
    if (await SpecialityTourModel.isSlugTaken(normalizedSlug, specialityTourId))
      throw new ApiError(httpStatus.BAD_REQUEST, 'A speciality tour with this slug already exists');
    updates.slug = normalizedSlug;
  }

  Object.assign(specialityTour, updates);
  await specialityTour.save();

  return specialityTour;
};

const deleteSpecialityTourById = async (specialityTourId: string): Promise<ISpecialityTourDoc> => {
  const specialityTour = await getSpecialityTourById(specialityTourId);

  if (!specialityTour) throw new ApiError(httpStatus.NOT_FOUND, 'Speciality tour not found');

  await specialityTour.deleteOne();
  return specialityTour;
};

const duplicateSpecialityTourById = async (specialityTourId: string, actorId?: string): Promise<ISpecialityTourDoc> => {
  const source = await getSpecialityTourById(specialityTourId);

  if (!source) throw new ApiError(httpStatus.NOT_FOUND, 'Speciality tour not found');

  const sourceObject = source.toObject();
  const duplicateSlug = await buildDuplicateSlug(sourceObject.slug);

  return SpecialityTourModel.create({
    title: `${sourceObject.title} (Copy)`,
    slug: duplicateSlug,
    description: sourceObject.description ?? '',
    banner: sourceObject.banner ?? '',
    status: 'Inactive',
    packages: (sourceObject.packages ?? []).map((entry) => ({
      packageId: entry.packageId,
      sortOrder: entry.sortOrder,
    })),
    createdBy: actorId ?? sourceObject.createdBy,
    updatedBy: actorId ?? sourceObject.updatedBy,
  });
};

const buildSpecialityTourFilter = (query: Record<string, unknown>): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  if (typeof query.search === 'string' && query.search.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [{ title: searchRegex }, { slug: searchRegex }, { description: searchRegex }];
  }

  if (typeof query.status === 'string' && query.status.trim()) filter.status = query.status.trim();

  return filter;
};

export const specialityTourService = {
  createSpecialityTour,
  querySpecialityTours,
  getSpecialityTourById,
  updateSpecialityTourById,
  deleteSpecialityTourById,
  duplicateSpecialityTourById,
  buildSpecialityTourFilter,
};
