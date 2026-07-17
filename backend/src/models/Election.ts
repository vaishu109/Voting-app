import { Schema, model, Document } from 'mongoose';

export interface IElection extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'paused' | 'ended' | 'published';
  rules?: string;
  eligibility?: string;
  bannerImage?: string;
  createdAt: Date;
}

const ElectionSchema = new Schema<IElection>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['upcoming', 'active', 'paused', 'ended', 'published'], 
    default: 'upcoming' 
  },
  rules: { type: String },
  eligibility: { type: String },
  bannerImage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default model<IElection>('Election', ElectionSchema);
