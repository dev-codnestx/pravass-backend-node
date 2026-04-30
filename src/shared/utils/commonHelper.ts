import { Types } from 'mongoose';

export const getObjectId = (value: string | Types.ObjectId): Types.ObjectId | string => {
  if (value instanceof Types.ObjectId) return value;

  if (Types.ObjectId.isValid(value)) return new Types.ObjectId(value);

  return value;
};

export const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

export const generateSixDigitRandomNumber = () => Math.floor(100000 + Math.random() * 900000);
export const generateFourDigitRandomNumber = () => Math.floor(1000 + Math.random() * 9000);

export const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
