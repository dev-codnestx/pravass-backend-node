import { Schema, model, Document, Types } from 'mongoose';

import { faqCategories, faqStatuses } from '@/shared/constants/enum.constant.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

import { IFaqModel } from './faq.interfaces.js';

export interface IFaq extends Document {
  _id: Types.ObjectId;
  question: string;
  answer?: string;
  category: string;
  status: 'Active' | 'Inactive';
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true, index: true },
    answer: { type: String, default: '' },
    category: {
      type: String,
      enum: faqCategories,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: faqStatuses,
      default: 'Active',
      index: true,
    },
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

faqSchema.plugin(toJSON);
faqSchema.plugin(paginate);

// Static: check if question is already taken
faqSchema.statics.isQuestionTaken = async function (question: string, excludeFaqId?: string) {
  const faq = await this.findOne({ question, _id: { $ne: excludeFaqId } });
  return !!faq;
};

export const FaqModel = model<IFaq, IFaqModel>('Faq', faqSchema);
export default FaqModel;
