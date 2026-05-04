import { Schema } from 'mongoose';
import { slugify } from '../slugify.js';

export interface SlugifyOptions {
  sourceField: string;
  targetField: string;
  unique?: boolean;
}

export const slugifyPlugin = (schema: Schema, options: SlugifyOptions) => {
  const { sourceField, targetField, unique = true } = options;

  // Add the target field to the schema if it doesn't exist
  if (!schema.path(targetField))
    schema.add({
      [targetField]: {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
        unique: unique,
      },
    });

  schema.pre('save', async function () {
    const doc = this as any;

    // Only generate slug if the source field is modified or target field is missing
    if (doc.isModified(sourceField) || !doc[targetField]) if (doc[sourceField]) doc[targetField] = slugify(doc[sourceField]);
  });
};
