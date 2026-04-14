import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { blogService } from './index.js';

export const createBlog = catchAsync(async (req: Request, res: Response) => {
  // TODO: Replace with AWS S3 upload logic later
  const blog = await blogService.createBlog({
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });
  res.status(httpStatus.CREATED).success({ blog }, responseCodes.BlogResponseCodes.SUCCESS, 'Blog created successfully');
});

export const getBlogs = catchAsync(async (req: Request, res: Response) => {
  const filter = blogService.buildBlogFilter(req.query);
  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await blogService.queryBlogs(filter, options);
  res.success(result, responseCodes.BlogResponseCodes.SUCCESS, 'Blogs fetched successfully');
});

export const getBlog = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['blogId'] === 'string') {
    const blog = await blogService.getBlogById(req.params['blogId']);
    if (!blog) throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');

    res.success({ blog }, responseCodes.BlogResponseCodes.SUCCESS, 'Blog fetched successfully');
  }
});

export const updateBlog = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['blogId'] === 'string') {
    // TODO: Replace with AWS S3 upload logic later
    const blog = await blogService.updateBlogById(req.params['blogId'], {
      ...req.body,
      updatedBy: req.user.id,
    });
    res.success({ blog }, responseCodes.BlogResponseCodes.SUCCESS, 'Blog updated successfully');
  }
});

export const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['blogId'] === 'string') {
    await blogService.deleteBlogById(req.params['blogId']);
    res.success(null, responseCodes.BlogResponseCodes.SUCCESS, 'Blog deleted successfully');
  }
});

export const toggleStatus = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['blogId'] === 'string') {
    const blog = await blogService.toggleBlogStatus(req.params['blogId'], req.user.id);
    res.success({ blog }, responseCodes.BlogResponseCodes.SUCCESS, 'Blog status toggled successfully');
  }
});
