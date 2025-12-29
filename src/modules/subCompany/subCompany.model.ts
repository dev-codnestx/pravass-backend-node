import { Schema, model, Document } from 'mongoose';
import { ISubCompany } from './subCompany.interface.js';

const subCompanySchema = new Schema<ISubCompany & Document>(
  {
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    phone: { type: String },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    company: { type: Schema.Types.ObjectId, required: true, ref: 'Company' },
  },
  {
    timestamps: true,
  },
);

export const SubCompany = model<ISubCompany & Document>('SubCompany', subCompanySchema);
