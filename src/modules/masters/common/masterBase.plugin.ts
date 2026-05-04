import { Schema } from 'mongoose';

import { MASTER_STATUSES, MasterStatus } from '@/modules/masters/common/master.constants.js';
import { slugifyPlugin } from '@/shared/utils/plugins/slugify.plugin.js';

export type { MasterStatus };

export interface MasterBasePluginOptions {
  addSlug?: boolean;
}

export const applyMasterBasePlugin = (schema: Schema, options: MasterBasePluginOptions = {}) => {
  schema.add({
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: MASTER_STATUSES,
      default: 'active',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  });

  schema.set('timestamps', true);

  schema.index({ name: 1, deletedAt: 1 });
  schema.index({ status: 1, deletedAt: 1 });

  if (options.addSlug) schema.plugin(slugifyPlugin, { sourceField: 'name', targetField: 'slug' });
};
