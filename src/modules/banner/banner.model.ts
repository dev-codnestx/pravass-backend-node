import { Schema, model } from 'mongoose';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';
import { IBannerDoc, IBannerModel } from './banner.interfaces.js';
import { BANNER_PLACEMENTS } from './banner.constants.js';
import { CommonStatus } from '@/shared/constants/enum.constant.js';

const bannerSchema = new Schema<IBannerDoc, IBannerModel>(
  {
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    placement: {
      type: String,
      required: true,
      enum: Object.values(BANNER_PLACEMENTS),
      default: BANNER_PLACEMENTS.HOMEPAGE_HERO,
    },
    start: { type: Date },
    end: { type: Date },
    priority: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(CommonStatus),
      default: CommonStatus.ACTIVE,
    },
    isDeleted: { type: Boolean, default: false },
    ctaText: { type: String, trim: true },
    ctaLink: { type: String, trim: true },
    image: { type: String, trim: true, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

bannerSchema.plugin(toJSON);
bannerSchema.plugin(paginate);

export const BannerModel = model<IBannerDoc, IBannerModel>('Banner', bannerSchema);
export default BannerModel;
