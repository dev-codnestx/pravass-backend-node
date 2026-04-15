import mongoose from 'mongoose';
import { toJSON, paginate } from '@/shared/utils/plugins/index.js';
import { ITestimonialDoc, ITestimonialModel } from './testimonial.interfaces.js';

const testimonialSchema = new mongoose.Schema<ITestimonialDoc, ITestimonialModel>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhoto: {
      type: String,
      trim: true,
    },
    tour: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    testimonial: {
      type: String,
      required: true,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// add plugin that converts mongoose to json
testimonialSchema.plugin(toJSON);
testimonialSchema.plugin(paginate);

const Testimonial = mongoose.model<ITestimonialDoc, ITestimonialModel>('Testimonial', testimonialSchema);

export default Testimonial;
