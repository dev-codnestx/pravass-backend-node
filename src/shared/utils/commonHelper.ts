import { Types } from 'mongoose';

export const getObjectId = (value: string | Types.ObjectId): Types.ObjectId | string => {
  if (value instanceof Types.ObjectId) return value;

  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);

  return value;
};

export const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};
