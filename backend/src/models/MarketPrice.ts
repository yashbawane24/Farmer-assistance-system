import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketPrice extends Document {
  cropName: string;
  marketName: string;
  state: string;
  district: string;
  todayPrice: number;
  yesterdayPrice: number;
  weeklyTrend: number[]; // Array of past 7 prices
  monthlyTrend: number[]; // Array of past 4 weeks or 30 days
  updatedAt: Date;
}

const MarketPriceSchema: Schema = new Schema({
  cropName: { type: String, required: true },
  marketName: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  todayPrice: { type: Number, required: true },
  yesterdayPrice: { type: Number, required: true },
  weeklyTrend: { type: [Number], default: [] },
  monthlyTrend: { type: [Number], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMarketPrice>('MarketPrice', MarketPriceSchema);
