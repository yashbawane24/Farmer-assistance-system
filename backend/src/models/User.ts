import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  mobile: string;
  password?: string;
  state: string;
  district: string;
  village: string;
  farmSize?: number;
  primaryCrop?: string;
  language: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  bookmarks: {
    schemes: string[];
    marketPrices: string[];
  };
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String }, // Hashed password for fallback login
  state: { type: String, required: true },
  district: { type: String, required: true },
  village: { type: String, required: true },
  farmSize: { type: Number },
  primaryCrop: { type: String },
  language: { type: String, default: 'en' },
  profilePicture: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bookmarks: {
    schemes: { type: [String], default: [] },
    marketPrices: { type: [String], default: [] }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);
