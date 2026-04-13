import Joi from 'joi';
import { BannerModel } from './banner.model.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const createBanner = {
  body: generateJoiValidation(BannerModel.schema),
};

const getBanners = {
  query: Joi.object().keys({
    title: Joi.string(),
    placement: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
  }),
};

const getBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().required(),
  }),
};

const updateBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().required(),
  }),
  body: generateJoiValidation(BannerModel.schema, true),
};

const deleteBanner = {
  params: Joi.object().keys({
    bannerId: Joi.string().required(),
  }),
};

export const bannerValidation = {
  createBanner,
  getBanners,
  getBanner,
  updateBanner,
  deleteBanner,
};
