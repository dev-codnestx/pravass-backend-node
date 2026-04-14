import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '@/shared/utils/catchAsync.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import pick from '@/shared/utils/pick.js';
import { PaginateOptions } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { faqService } from './index.js';

export const createFaq = catchAsync(async (req: Request, res: Response) => {
  const faq = await faqService.createFaq({
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });
  res.status(httpStatus.CREATED).success({ faq }, responseCodes.FaqResponseCodes.SUCCESS, 'FAQ created successfully');
});

export const getFaqs = catchAsync(async (req: Request, res: Response) => {
  const filter = faqService.buildFaqFilter(req.query);
  const options: PaginateOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await faqService.queryFaqs(filter, options);
  res.success(result, responseCodes.FaqResponseCodes.SUCCESS, 'FAQs fetched successfully');
});

export const getFaq = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['faqId'] === 'string') {
    const faq = await faqService.getFaqById(req.params['faqId']);
    if (!faq) throw new ApiError(httpStatus.NOT_FOUND, 'FAQ not found');

    res.success({ faq }, responseCodes.FaqResponseCodes.SUCCESS, 'FAQ fetched successfully');
  }
});

export const updateFaq = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['faqId'] === 'string') {
    const faq = await faqService.updateFaqById(req.params['faqId'], {
      ...req.body,
      updatedBy: req.user.id,
    });
    res.success({ faq }, responseCodes.FaqResponseCodes.SUCCESS, 'FAQ updated successfully');
  }
});

export const deleteFaq = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['faqId'] === 'string') {
    await faqService.deleteFaqById(req.params['faqId']);
    res.success(null, responseCodes.FaqResponseCodes.SUCCESS, 'FAQ deleted successfully');
  }
});

export const toggleStatus = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['faqId'] === 'string') {
    const faq = await faqService.toggleFaqStatus(req.params['faqId'], req.user.id);
    res.success({ faq }, responseCodes.FaqResponseCodes.SUCCESS, 'FAQ status toggled successfully');
  }
});
