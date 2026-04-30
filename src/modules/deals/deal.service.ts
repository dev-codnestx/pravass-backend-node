import httpStatus from 'http-status';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import DealModel from './deal.model.js';
import { IDeal, IDealDoc } from './deal.interfaces.js';

const toDateStart = (value: Date | string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date provided');

  date.setHours(0, 0, 0, 0);
  return date;
};

const validateDateRange = (start: Date | string, end: Date | string) => {
  const startDate = toDateStart(start);
  const endDate = toDateStart(end);
  const today = toDateStart(new Date());

  if (startDate.getTime() < today.getTime())
    throw new ApiError(httpStatus.BAD_REQUEST, 'Start date cannot be before current date');

  if (endDate.getTime() < startDate.getTime())
    throw new ApiError(httpStatus.BAD_REQUEST, 'End date must be equal to or after start date');
};

const createDeal = async (dealBody: IDeal): Promise<IDealDoc> => {
  validateDateRange(dealBody.start, dealBody.end);
  return DealModel.create(dealBody);
};

const queryDeals = async (filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult> =>
  DealModel.paginate({ ...filter, isDeleted: false }, { ...options, populate: (options.populate as string) || 'tourIds' });
const getDealById = async (id: string): Promise<IDealDoc | null> =>
  DealModel.findOne({ _id: id, isDeleted: false }).populate('tourIds');

const updateDealById = async (dealId: string, updateBody: Partial<IDeal>): Promise<IDealDoc | null> => {
  const deal = await getDealById(dealId);
  if (!deal) throw new ApiError(httpStatus.NOT_FOUND, 'Deal not found');

  const nextStart = updateBody.start ?? deal.start;
  const nextEnd = updateBody.end ?? deal.end;
  validateDateRange(nextStart, nextEnd);

  Object.assign(deal, updateBody);
  await deal.save();
  return deal;
};

const deleteDealById = async (dealId: string): Promise<IDealDoc | null> => {
  const deal = await getDealById(dealId);
  if (!deal) throw new ApiError(httpStatus.NOT_FOUND, 'Deal not found');

  deal.isDeleted = true;
  await deal.save();
  return deal;
};

export const dealService = {
  createDeal,
  queryDeals,
  getDealById,
  updateDealById,
  deleteDealById,
};
