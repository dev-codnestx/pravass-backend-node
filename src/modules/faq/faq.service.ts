import httpStatus from 'http-status';

import Faq from '@/modules/faq/faq.model.js';
import ApiError from '@/shared/utils/errors/ApiError.js';
import { PaginateOptions, QueryResult } from '@/shared/utils/plugins/paginate/paginate.js';
import responseCodes from '@/shared/utils/responseCode/responseCode.js';

import { CreateFaqBody, IFaqDoc, UpdateFaqBody } from './faq.interfaces.js';

/**
 * Create a FAQ
 * @param {CreateFaqBody} faqBody
 * @returns {Promise<IFaqDoc>}
 */
export const createFaq = async (faqBody: CreateFaqBody): Promise<IFaqDoc> => {
  if (await Faq.isQuestionTaken(faqBody.question))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A FAQ with this question already exists',
      undefined,
      true,
      '',
      responseCodes.FaqResponseCodes.QUESTION_ALREADY_EXISTS,
    );

  return Faq.create(faqBody);
};

/**
 * Query for FAQs with pagination, search, and filters
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
// TODO: later add correct type
/* eslint-disable @typescript-eslint/no-explicit-any */
export const queryFaqs = (filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult> =>
  Promise.resolve(Faq.paginate(filter, options as any));

/**
 * Get FAQ by id
 * @param {string} faqId
 * @returns {Promise<IFaqDoc | null>}
 */
export const getFaqById = async (faqId: string): Promise<IFaqDoc | null> => Faq.findById(faqId);

/**
 * Update FAQ by id
 * @param {string} faqId
 * @param {UpdateFaqBody} updateBody
 * @returns {Promise<IFaqDoc | null>}
 */
export const updateFaqById = async (faqId: string, updateBody: UpdateFaqBody): Promise<IFaqDoc | null> => {
  const faq = await getFaqById(faqId);
  if (!faq)
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ not found', undefined, true, '', responseCodes.FaqResponseCodes.NOT_FOUND);

  if (updateBody.question && updateBody.question !== faq.question && (await Faq.isQuestionTaken(updateBody.question, faqId)))
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'A FAQ with this question already exists',
      undefined,
      true,
      '',
      responseCodes.FaqResponseCodes.QUESTION_ALREADY_EXISTS,
    );

  Object.assign(faq, updateBody);
  await faq.save();
  return faq;
};

/**
 * Delete FAQ by id
 * @param {string} faqId
 * @returns {Promise<IFaqDoc | null>}
 */
export const deleteFaqById = async (faqId: string): Promise<IFaqDoc | null> => {
  const faq = await getFaqById(faqId);
  if (!faq)
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ not found', undefined, true, '', responseCodes.FaqResponseCodes.NOT_FOUND);

  await faq.deleteOne();
  return faq;
};

/**
 * Toggle FAQ status (Active <-> Inactive)
 * @param {string} faqId
 * @returns {Promise<IFaqDoc | null>}
 */
export const toggleFaqStatus = async (faqId: string, updatedBy: any): Promise<IFaqDoc | null> => {
  const faq = await getFaqById(faqId);
  if (!faq)
    throw new ApiError(httpStatus.NOT_FOUND, 'FAQ not found', undefined, true, '', responseCodes.FaqResponseCodes.NOT_FOUND);

  faq.status = faq.status === 'Active' ? 'Inactive' : 'Active';
  faq.updatedBy = updatedBy;
  await faq.save();
  return faq;
};

/**
 * Build filter from query params for FAQ listing
 * @param {Record<string, any>} query
 * @returns {Record<string, any>}
 */
export const buildFaqFilter = (query: Record<string, any>): Record<string, any> => {
  const filter: Record<string, any> = {};

  if (query.search)
    filter.$or = [
      { question: { $regex: query.search, $options: 'i' } },
      { answer: { $regex: query.search, $options: 'i' } },
    ];

  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;

  return filter;
};
