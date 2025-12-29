import { Schema, model, Document } from 'mongoose';
import { ICompany } from './company.interface.js';

const companySchema = new Schema<ICompany & Document>(
  {
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
);

export const Company = model<ICompany & Document>('Company', companySchema);
