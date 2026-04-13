import httpStatus from 'http-status';
import BannerModel from './banner.model.js';
import { IBanner, IBannerDoc } from './banner.interfaces.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import { CommonStatus } from '@/shared/constants/enum.constant.js';

/**
 * Create a banner
 * @param {IBanner} bannerBody
 * @returns {Promise<IBannerDoc>}
 */
const createBanner = async (bannerBody: IBanner): Promise<IBannerDoc> => BannerModel.create(bannerBody);

/**
 * Query for banners
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryBanners = async (filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult> =>
  BannerModel.paginate({ ...filter, isDeleted: false } as Record<string, unknown>, options);

/**
 * Get banner by id
 * @param {string} id
 * @returns {Promise<IBannerDoc | null>}
 */
const getBannerById = async (id: string): Promise<IBannerDoc | null> => BannerModel.findOne({ _id: id, isDeleted: false });

/**
 * Update banner by id
 * @param {string} bannerId
 * @param {Partial<IBanner>} updateBody
 * @returns {Promise<IBannerDoc | null>}
 */
const updateBannerById = async (bannerId: string, updateBody: Partial<IBanner>): Promise<IBannerDoc | null> => {
  const banner = await getBannerById(bannerId);
  if (!banner) throw new ApiError(httpStatus.NOT_FOUND, 'Banner not found');
  Object.assign(banner, updateBody);
  await banner.save();
  return banner;
};

/**
 * Delete banner by id
 * @param {string} bannerId
 * @returns {Promise<IBannerDoc | null>}
 */
const deleteBannerById = async (bannerId: string): Promise<IBannerDoc | null> => {
  const banner = await getBannerById(bannerId);
  if (!banner) throw new ApiError(httpStatus.NOT_FOUND, 'Banner not found');
  banner.isDeleted = true;
  banner.status = CommonStatus.INACTIVE;
  await banner.save();
  return banner;
};

export const bannerService = {
  createBanner,
  queryBanners,
  getBannerById,
  updateBannerById,
  deleteBannerById,
};
