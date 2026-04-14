import { Schema, model, Document, Types } from 'mongoose';

export interface IRolePermission {
  module: string;
  actions: string[];
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
    module: { type: String, required: true, trim: true },
    actions: [{ type: String, required: true, trim: true }],
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
