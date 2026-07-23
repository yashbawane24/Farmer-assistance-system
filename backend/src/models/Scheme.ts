import mongoose, { Schema, Document } from 'mongoose';

export interface IScheme extends Document {
  title: string;
  category: string;
  overview: string;
  eligibility: string[];
  benefits: string[];
  documentsRequired: string[];
  applicationProcess: string;
  link: string;
  createdAt: Date;
}

const SchemeSchema: Schema = new Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  overview: { type: String, required: true },
  eligibility: { type: [String], required: true },
  benefits: { type: [String], required: true },
  documentsRequired: { type: [String], required: true },
  applicationProcess: { type: String, required: true },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IScheme>('Scheme', SchemeSchema);
