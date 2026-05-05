import httpStatus from 'http-status';
import ApiError from '@/shared/utils/errors/ApiError.js';
import Transaction, { ITransaction, ITransactionDoc } from './transaction.model.js';

/**
 * Create a transaction record
 * @param {ITransaction} transactionBody
 * @returns {Promise<ITransactionDoc>}
 */
export const createTransaction = async (transactionBody: Partial<ITransaction>): Promise<ITransactionDoc> =>
  Transaction.create(transactionBody);

/**
 * Query transactions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<any>}
 */
export const queryTransactions = async (filter: Record<string, any>, options: Record<string, any>): Promise<any> =>
  Transaction.paginate(filter, options);

/**
 * Get transaction by ID
 * @param {string} id
 * @returns {Promise<ITransactionDoc | null>}
 */
export const getTransactionById = async (id: string): Promise<ITransactionDoc | null> =>
  Transaction.findById(id).populate('bookingId');

/**
 * Update transaction by ID
 * @param {string} id
 * @param {Partial<ITransaction>} updateBody
 * @returns {Promise<ITransactionDoc | null>}
 */
export const updateTransactionById = async (
  id: string,
  updateBody: Partial<ITransaction>,
): Promise<ITransactionDoc | null> => {
  const transaction = await Transaction.findById(id);
  if (!transaction) throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  Object.assign(transaction, updateBody);
  await transaction.save();
  return transaction;
};

/**
 * Get transaction by Gateway Order ID
 * @param {string} gatewayOrderId
 * @returns {Promise<ITransactionDoc | null>}
 */
export const getTransactionByOrderId = async (gatewayOrderId: string): Promise<ITransactionDoc | null> =>
  Transaction.findOne({ gatewayOrderId });
