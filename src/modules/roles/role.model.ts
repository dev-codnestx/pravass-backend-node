import { Schema, model, Document, Types } from 'mongoose';
import { APP_MODULES, APP_ACTIONS } from '../permissions/permission.constants.js';

export interface IRolePermission {
  module: (typeof APP_MODULES)[number];
  actions: (typeof APP_ACTIONS)[number][];
}

export interface IRole extends Document {
  name: string;
  code: string; // e.g. ADMIN, SALES_EXEC
  description?: string;
  permissions: IRolePermission[];
  isSystem: boolean;
  status: 'active' | 'inactive';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<IRolePermission>(
  {
    module: { type: String, enum: APP_MODULES, required: true },
    actions: [{ type: String, enum: APP_ACTIONS, required: true }],
  },
  { _id: false },
);

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    description: { type: String, trim: true },
    permissions: { type: [rolePermissionSchema], default: [] },
    isSystem: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

roleSchema.index({ name: 1 }, { unique: true });

export const RoleModel = model<IRole>('Role', roleSchema);
