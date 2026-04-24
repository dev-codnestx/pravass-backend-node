import Joi from 'joi';

import { blogCategories, blogStatuses } from '@/shared/constants/enum.constant.js';
import { objectId } from '@/shared/validations/custom.validation.js';

export const createBlog = {
  body: Joi.object().keys({
    featuredImage: Joi.string().required(),
    title: Joi.string().required().trim().min(3).max(200),
    category: Joi.string()
      .required()
      .valid(...blogCategories),
    author: Joi.string().allow('').optional().trim(),
    content: Joi.string().allow('').optional(),
    status: Joi.string()
      .valid(...blogStatuses)
      .default('Draft'),
    publishedDate: Joi.date().optional(),
  }),
};

export const getBlogs = {
  query: Joi.object().keys({
    search: Joi.string().allow('').optional(),
    category: Joi.string()
      .valid(...blogCategories)
      .optional(),
    status: Joi.string()
      .valid(...blogStatuses)
      .optional(),
    sortBy: Joi.string().optional(),
    projectBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

export const getBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
};

export const updateBlog = {
  params: Joi.object().keys({
    blogId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      featuredImage: Joi.string().allow('').optional(),
      title: Joi.string().trim().min(3).max(200).optional(),
      category: Joi.string()
        .valid(...blogCategories)
        .optional(),
      author: Joi.string().allow('').optional().trim(),
      content: Joi.string().allow('').optional(),
      status: Joi.string()
        .valid(...blogStatuses)
        .optional(),
      publishedDate: Joi.date().optional(),
    })
    .min(1),
};

export const deleteBlog = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
};

export const toggleStatus = {
  params: Joi.object().keys({
    blogId: Joi.string().custom(objectId),
  }),
};
