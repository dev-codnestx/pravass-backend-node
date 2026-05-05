import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/shared/utils/catchAsync.js';
import { homepageService } from './homepage.service.js';

const getHomepage = catchAsync(async (_req: Request, res: Response) => {
  const data = await homepageService.getHomepageData();
  return res.success(data, httpStatus.OK, 'Homepage data fetched successfully');
});

export const homepageController = {
  getHomepage,
};
