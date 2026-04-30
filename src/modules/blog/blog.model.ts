import { Schema, model, Document, Types } from 'mongoose';

import { blogStatuses } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { slugify } from '@/shared/utils/commonHelper.js';
import { IBlogModel } from './blog.interfaces.js';

export interface IBlog extends Document {
  _id: Types.ObjectId;
  featuredImage?: string;
  title: string;
  slug: string;
  category: string;
  author?: string;
  content?: string;
  status: 'Draft' | 'Published';
  publishedDate?: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    featuredImage: { type: String, trim: true, default: '' },
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
    category: {
      type: String,
      required: true,
      index: true,
    },
    author: { type: String, trim: true, default: '' },
    content: { type: String, default: '' },
    status: {
      type: String,
      enum: blogStatuses,
      default: 'Draft',
      index: true,
    },
    publishedDate: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);

blogSchema.pre('save', async function () {
  const doc = this as unknown as IBlog;
  if (doc.isModified('title') || !doc.slug) doc.slug = slugify(doc.title);
});

// Static: check if title is already taken
blogSchema.statics.isTitleTaken = async function (title: string, excludeBlogId?: string) {
  const blog = await this.findOne({ title, _id: { $ne: excludeBlogId } });
  return !!blog;
};

export const BlogModel = model<IBlog, IBlogModel>('Blog', blogSchema);
export default BlogModel;
