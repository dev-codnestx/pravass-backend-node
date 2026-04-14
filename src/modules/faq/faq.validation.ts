import Joi from 'joi';

import { faqCategories, faqStatuses } from '@/shared/constants/enum.constant.js';
import { objectId } from '@/shared/validations/custom.validation.js';

export const createFaq = {
  body: Joi.object().keys({
    question: Joi.string().required().trim().min(5).max(500),
    answer: Joi.string().allow('').optional(),
    category: Joi.string()
      .required()
      .valid(...faqCategories),
    status: Joi.string()
      .valid(...faqStatuses)
      .default('Active'),
  }),
};

export const getFaqs = {
  query: Joi.object().keys({
    search: Joi.string().allow('').optional(),
    category: Joi.string()
      .valid(...faqCategories)
      .optional(),
    status: Joi.string()
      .valid(...faqStatuses)
      .optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

export const getFaq = {
  params: Joi.object().keys({
    faqId: Joi.string().custom(objectId),
  }),
};

export const updateFaq = {
  params: Joi.object().keys({
    faqId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      question: Joi.string().trim().min(5).max(500).optional(),
      answer: Joi.string().allow('').optional(),
      category: Joi.string()
        .valid(...faqCategories)
        .optional(),
      status: Joi.string()
        .valid(...faqStatuses)
        .optional(),
    })
    .min(1),
};

export const deleteFaq = {
  params: Joi.object().keys({
    faqId: Joi.string().custom(objectId),
  }),
};

export const toggleStatus = {
  params: Joi.object().keys({
    faqId: Joi.string().custom(objectId),
  }),
};
