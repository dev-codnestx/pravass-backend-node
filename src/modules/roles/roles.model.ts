import { Schema, model, Document } from 'mongoose';
import { IRole } from './roles.interface.js';

const roleSchema = new Schema<IRole & Document>(
  {
    name: { type: String, required: true },
    description: { type: String },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    parentRole: { type: Schema.Types.ObjectId, ref: 'Role' },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: Schema.Types.ObjectId, required: true, ref: 'Company' },
  },
  {
    timestamps: true,
  },
);

export const Role = model<IRole & Document>('Role', roleSchema);
