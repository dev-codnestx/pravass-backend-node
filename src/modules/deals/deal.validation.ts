import Joi from 'joi';
import { DealModel } from './deal.model.js';
import { generateJoiValidation } from '@/shared/validations/generateJoiValidation.js';

const createDeal = {
  body: generateJoiValidation(DealModel.schema),
};

const getDeals = {
  query: Joi.object().keys({
    title: Joi.string(),
    type: Joi.string(),
    status: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    search: Joi.string(),
  }),
};

const getDeal = {
  params: Joi.object().keys({
    dealId: Joi.string().required(),
  }),
};

const updateDeal = {
  params: Joi.object().keys({
    dealId: Joi.string().required(),
  }),
  body: generateJoiValidation(DealModel.schema, true),
};

const deleteDeal = {
  params: Joi.object().keys({
    dealId: Joi.string().required(),
  }),
};

export const dealValidation = {
  createDeal,
  getDeals,
  getDeal,
  updateDeal,
  deleteDeal,
};
