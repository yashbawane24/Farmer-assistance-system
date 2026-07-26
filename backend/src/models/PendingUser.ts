import mongoose, { Schema, Document } from 'mongoose';

export interface IPendingUser extends Document {
  name: string;
  mobile: string;
  email: string;
  password?: string;
  state: string;
  district: string;
  village: string;
  farmSize?: number;
  soilType?: string;
  primaryCrop?: string;
  language: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const PendingUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String },
  state: { type: String, required: true },
  district: { type: String, required: true },
  village: { type: String, required: true },
  farmSize: { type: Number },
  soilType: { type: String },
  primaryCrop: { type: String },
  language: { type: String, default: 'en' },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Set up TTL index to automatically delete unverified registration records after 5 minutes (300 seconds)
PendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

export default mongoose.model<IPendingUser>('PendingUser', PendingUserSchema);
