import BannerModel from '../banner/banner.model.js';
import TourModel from '../tours/tour.model.js';
import { masterModels } from '../masters/models/master.models.js';
import { BANNER_PLACEMENTS } from '../banner/banner.constants.js';

/**
 * Get homepage data
 * @returns {Promise<Object>}
 */
const getHomepageData = async () => {
  const [heroBanners, destinations, featuredTours, bestPriceTours, promotionalBanners] = await Promise.all([
    // 1. Hero Banners with populated tours
    BannerModel.find({
      placement: BANNER_PLACEMENTS.HOMEPAGE_HERO,
      status: 'active',
      isDeleted: false,
    })
      .populate({
        path: 'tours',
        match: { isDeleted: false, status: 'active' },
        populate: { path: 'destinationIds', select: 'name' },
        select: 'name slug price duration media destinationIds description ratings reviews',
      })
      .sort({ priority: -1 }),

    // 2. Destinations
    masterModels.destinations
      .find({
        status: 'active',
        deletedAt: null,
      })
      .limit(50)
      .sort({ createdAt: -1 }),

    // 3. Featured Packages (Show all active, featured first)
    TourModel.find({
      status: 'active',
      isDeleted: false,
    })
      .populate('destinationIds', 'name')
      .limit(20)
      .sort({ isFeatured: -1, createdAt: -1 }),

    // 4. Best Price Tours (Sorted by price)
    TourModel.find({
      status: 'active',
      isDeleted: false,
    })
      .populate('destinationIds', 'name')
      .sort({ price: 1 })
      .limit(40),

    // 5. Promotional Banners (Horizontal only for homepage)
    BannerModel.find({
      placement: BANNER_PLACEMENTS.PROMOTIONAL,
      orientation: 'horizontal',
      status: 'active',
      isDeleted: false,
    }).sort({ priority: -1 }),
  ]);

  return {
    heroBanners,
    destinations,
    featuredTours,
    bestPriceTours,
    promotionalBanners,
  };
};

export const homepageService = {
  getHomepageData,
};
