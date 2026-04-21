import { Model, Document } from 'mongoose';

interface CloneOptions<T> {
  model: Model<T>;
  id: string;
  overrides?: Partial<T>;
  omitFields?: string[];
}

export const cloneDocument = async <T extends Document>({ model, id, overrides = {}, omitFields = [] }: CloneOptions<T>) => {
  try {
    const existing = await model.findById(id);

    if (!existing) throw new Error('Document not found');

    const obj = existing.toObject() as any;

    // Default fields to remove
    const defaultOmit = ['_id', 'id', 'createdAt', 'updatedAt', '__v'];

    const fieldsToRemove = [...defaultOmit, ...omitFields];

    for (const field of fieldsToRemove) delete obj[field];

    const newDoc = await model.create({
      ...obj,
      ...overrides,
    });

    return newDoc;
  } catch (e: any) {
    throw new Error(e);
  }
};
