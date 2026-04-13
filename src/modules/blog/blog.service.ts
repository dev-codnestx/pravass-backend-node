import httpStatus from 'http-status';

import Blog from '@/modules/blog/blog.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { CreateBlogBody, IBlogDoc, UpdateBlogBody } from './blog.interfaces.js';

/**
 * Create a blog
 * @param {CreateBlogBody} blogBody
 * @returns {Promise<IBlogDoc>}
 */
export const createBlog = async (blogBody: CreateBlogBody): Promise<IBlogDoc> => {
  if (await Blog.isTitleTaken(blogBody.title))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A blog with this title already exists',
      undefined,
      true,
      '',
      responseCodes.BlogResponseCodes.TITLE_ALREADY_EXISTS,
    );

  // Auto-set publishedDate if status is Published and no date provided
  if (blogBody.status === 'Published' && !blogBody.publishedDate) blogBody.publishedDate = new Date();

  return Blog.create(blogBody);
};

/**
 * Query for blogs with pagination, search, and filters
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
// TODO: later add correct type
/* eslint-disable @typescript-eslint/no-explicit-any */
export const queryBlogs = (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult> =>
  Promise.resolve(Blog.paginate(filter, options as any));

/**
 * Get blog by id
 * @param {string} blogId
 * @returns {Promise<IBlogDoc | null>}
 */
export const getBlogById = async (blogId: string): Promise<IBlogDoc | null> => Blog.findById(blogId);

/**
 * Update blog by id
 * @param {string} blogId
 * @param {UpdateBlogBody} updateBody
 * @returns {Promise<IBlogDoc | null>}
 */
export const updateBlogById = async (blogId: string, updateBody: UpdateBlogBody): Promise<IBlogDoc | null> => {
  const blog = await getBlogById(blogId);
  if (!blog)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Blog not found',
      undefined,
      true,
      '',
      responseCodes.BlogResponseCodes.NOT_FOUND,
    );

  if (updateBody.title && updateBody.title !== blog.title && (await Blog.isTitleTaken(updateBody.title, blogId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A blog with this title already exists',
      undefined,
      true,
      '',
      responseCodes.BlogResponseCodes.TITLE_ALREADY_EXISTS,
    );

  // Auto-set publishedDate when switching to Published
  if (updateBody.status === 'Published' && blog.status === 'Draft' && !updateBody.publishedDate)
    updateBody.publishedDate = new Date();

  Object.assign(blog, updateBody);
  await blog.save();
  return blog;
};

/**
 * Delete blog by id
 * @param {string} blogId
 * @returns {Promise<IBlogDoc | null>}
 */
export const deleteBlogById = async (blogId: string): Promise<IBlogDoc | null> => {
  const blog = await getBlogById(blogId);
  if (!blog)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Blog not found',
      undefined,
      true,
      '',
      responseCodes.BlogResponseCodes.NOT_FOUND,
    );

  await blog.deleteOne();
  return blog;
};

/**
 * Toggle blog status (Draft <-> Published)
 * @param {string} blogId
 * @returns {Promise<IBlogDoc | null>}
 */
export const toggleBlogStatus = async (blogId: string, updatedBy: any): Promise<IBlogDoc | null> => {
  const blog = await getBlogById(blogId);
  if (!blog)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Blog not found',
      undefined,
      true,
      '',
      responseCodes.BlogResponseCodes.NOT_FOUND,
    );

  blog.status = blog.status === 'Draft' ? 'Published' : 'Draft';
  blog.updatedBy = updatedBy;

  // Auto-set publishedDate when toggling to Published
  if (blog.status === 'Published' && !blog.publishedDate) blog.publishedDate = new Date();

  await blog.save();
  return blog;
};

/**
 * Build filter from query params for blog listing
 * @param {Record<string, any>} query
 * @returns {Record<string, any>}
 */
export const buildBlogFilter = (query: Record<string, any>): Record<string, any> => {
  const filter: Record<string, any> = {};

  if (query.search)
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { author: { $regex: query.search, $options: 'i' } },
      { content: { $regex: query.search, $options: 'i' } },
    ];

  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;

  return filter;
};
