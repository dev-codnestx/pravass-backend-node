import { Schema, model, Document } from 'mongoose';

import { IPermission } from './permission.interface.js';

const permissionSchema = new Schema<IPermission & Document>(
  {
    name: { type: String, required: true },
    description: { type: String },
    module: [
      {
        moduleName: { type: String, required: true },
        actions: {
          type: [String],
          enum: ['create', 'retrieve', 'update', 'delete'],
          required: true,
        },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: Schema.Types.ObjectId, required: true, ref: 'Company' },
  },
  {
    timestamps: true, // Handles createdAt and updatedAt
  },
);

export const Permission = model<IPermission & Document>('Permission', permissionSchema);
