import mongoose, { Schema, Document } from 'mongoose';

export interface IDiseaseReport extends Document {
  userId: string;
  cropType: string;
  imageUrl: string;
  diseaseName: string;
  confidence: number;
  symptoms: string[];
  causes: string[];
  treatment: {
    organic: string[];
    chemical: string[];
    prevention: string[];
  };
  createdAt: Date;
}

const DiseaseReportSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cropType: { type: String, required: true },
  imageUrl: { type: String, required: true },
  diseaseName: { type: String, required: true },
  confidence: { type: Number, required: true },
  symptoms: { type: [String], required: true },
  causes: { type: [String], required: true },
  treatment: {
    organic: { type: [String], default: [] },
    chemical: { type: [String], default: [] },
    prevention: { type: [String], default: [] }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDiseaseReport>('DiseaseReport', DiseaseReportSchema);
