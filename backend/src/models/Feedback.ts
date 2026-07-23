import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  userId?: string;
  name: string;
  mobile: string;
  rating: number;
  message: string;
  category: 'usability' | 'feature' | 'bug' | 'other';
  createdAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  category: { type: String, enum: ['usability', 'feature', 'bug', 'other'], default: 'other' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
