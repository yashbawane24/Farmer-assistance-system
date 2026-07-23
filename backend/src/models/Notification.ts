import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string; // 'all' for broadcasts, or user specific ID
  title: string;
  message: string;
  type: 'weather' | 'market' | 'scheme' | 'disease' | 'admin';
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: String, required: true }, // can be specific userId or 'all'
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['weather', 'market', 'scheme', 'disease', 'admin'], required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
