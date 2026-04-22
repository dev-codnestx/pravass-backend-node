import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import responseCode from '@/shared/utils/responseCode/responseCode.js';
import { dealService } from './deal.service.js';

const createDeal = catchAsync(async (req: Request, res: Response) => {
  const deal = await dealService.createDeal(req.body);
  return res
    .status(httpStatus.CREATED)
    .success(deal, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Deal created successfully');
});

const getDeals = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['title', 'type', 'status', 'isDeleted']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

  const result = await dealService.queryDeals(filter, options);
  return res.success(result, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Deals fetched successfully');
});

const getDeal = catchAsync(async (req: Request, res: Response) => {
  const deal = await dealService.getDealById(req.params.dealId);
  if (!deal) return res.status(httpStatus.NOT_FOUND).error('Deal not found');
  return res.success(deal, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Deal fetched successfully');
});

const updateDeal = catchAsync(async (req: Request, res: Response) => {
  const deal = await dealService.updateDealById(req.params.dealId, req.body);
  return res.success(deal, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Deal updated successfully');
});

const deleteDeal = catchAsync(async (req: Request, res: Response) => {
  await dealService.deleteDealById(req.params.dealId);
  return res.success(null, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Deal deleted successfully');
});

export const dealController = {
  createDeal,
  getDeals,
  getDeal,
  updateDeal,
  deleteDeal,
};
