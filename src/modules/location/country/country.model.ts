import { Schema, model } from 'mongoose';

import { ICountry } from '@/modules/location/location.interfaces.js';
import { paginate, toJSON } from '@/shared/utils/plugins/index.js';

const countrySchema = new Schema<ICountry>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    loc: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// add plugin that converts mongoose to json
countrySchema.plugin(toJSON);
countrySchema.plugin(paginate);

const Country = model<ICountry>('Country', countrySchema);

export default Country;
