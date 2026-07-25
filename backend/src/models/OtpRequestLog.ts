import mongoose, { Schema, Document } from 'mongoose';

export interface IOtpRequestLog extends Document {
  mobile: string;
  requestedAt: Date;
}

const OtpRequestLogSchema: Schema = new Schema({
  mobile: { type: String, required: true, index: true },
  requestedAt: { type: Date, default: Date.now }
});

// Set up the TTL index on requestedAt to automatically delete logs after 1 hour (3600 seconds)
OtpRequestLogSchema.index({ requestedAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.model<IOtpRequestLog>('OtpRequestLog', OtpRequestLogSchema);
