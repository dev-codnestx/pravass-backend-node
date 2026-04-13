import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/shared/utils/catchAsync.js';
import pick from '@/shared/utils/pick.js';
import { bannerService } from './banner.service.js';
import responseCode from '@/shared/utils/responseCode/responseCode.js';

const createBanner = catchAsync(async (req: Request, res: Response) => {
  const banner = await bannerService.createBanner(req.body);
  return res
    .status(httpStatus.CREATED)
    .success(banner, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Banner created successfully');
});

const getBanners = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['title', 'placement', 'status', 'isDeleted']);

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
  const result = await bannerService.queryBanners(filter, options);
  return res.success(result, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Banners fetched successfully');
});

const getBanner = catchAsync(async (req: Request, res: Response) => {
  const banner = await bannerService.getBannerById(req.params.bannerId);
  if (!banner) return res.status(httpStatus.NOT_FOUND).error('Banner not found');
  return res.success(banner, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Banner fetched successfully');
});

const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const banner = await bannerService.updateBannerById(req.params.bannerId, req.body);
  return res.success(banner, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Banner updated successfully');
});

const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  await bannerService.deleteBannerById(req.params.bannerId);
  return res.success(null, responseCode.BannerResponseCodes?.SUCCESS || 200, 'Banner deleted successfully');
});

export const bannerController = {
  createBanner,
  getBanners,
  getBanner,
  updateBanner,
  deleteBanner,
};
