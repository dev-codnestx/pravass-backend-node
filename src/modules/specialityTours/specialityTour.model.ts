import { Schema, Types, model } from 'mongoose';

import { paginate, toJSON } from '@/shared/utils/plugins/index.js';
import { slugifyPlugin } from '@/shared/utils/plugins/slugify.plugin.js';

import { ISpecialityTourDoc, ISpecialityTourModel, specialityTourStatuses } from './specialityTour.interfaces.js';

const packageLinkSchema = new Schema(
  {
    packageId: { type: Types.ObjectId, ref: 'Tour', required: true, index: true },
    sortOrder: { type: Number, min: 1, default: 1 },
  },
  { _id: true },
);

const specialityTourSchema = new Schema<ISpecialityTourDoc, ISpecialityTourModel>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    description: { type: String, trim: true, default: '' },
    banner: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: specialityTourStatuses,
      default: 'Active',
      index: true,
    },
    packages: { type: [packageLinkSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

specialityTourSchema.index({ slug: 1 }, { unique: true });

specialityTourSchema.pre('validate', function normalizeSpecialityTour() {
  const draft = this as ISpecialityTourDoc;
  if (typeof draft.title === 'string') draft.title = draft.title.trim();

  if (Array.isArray(draft.packages)) {
    const seen = new Set<string>();
    const normalized = draft.packages
      .map((entry, index) => {
        const packageId = entry?.packageId ? String(entry.packageId).trim() : '';
        if (!packageId || seen.has(packageId)) return null;
        seen.add(packageId);
        return {
          packageId: entry.packageId,
          sortOrder: typeof entry.sortOrder === 'number' && entry.sortOrder > 0 ? Math.floor(entry.sortOrder) : index + 1,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        return a.sortOrder - b.sortOrder;
      })
      .map((entry, index) => ({
        ...entry,
        sortOrder: index + 1,
      }));

    draft.packages = normalized as ISpecialityTourDoc['packages'];
  }
});

specialityTourSchema.plugin(toJSON);
specialityTourSchema.plugin(paginate);
specialityTourSchema.plugin(slugifyPlugin, { sourceField: 'title', targetField: 'slug' });

specialityTourSchema.statics.isSlugTaken = async function isSlugTaken(slug: string, excludeId?: string) {
  const existing = await this.findOne({ slug: slug.trim().toLowerCase(), _id: { $ne: excludeId } });
  return Boolean(existing);
};

export const SpecialityTourModel = model<ISpecialityTourDoc, ISpecialityTourModel>('SpecialityTour', specialityTourSchema);

export default SpecialityTourModel;
