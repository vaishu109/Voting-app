import { Schema, model, Document } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  party: string;
  symbol: string; // URL/base64 to symbols or name
  manifesto: string;
  biography: string;
  photo?: string;
  electionID: Schema.Types.ObjectId;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  userId?: Schema.Types.ObjectId; // User account backing candidate dashboard
  createdAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  name: { type: String, required: true },
  party: { type: String, required: true },
  symbol: { type: String, required: true },
  manifesto: { type: String, required: true },
  biography: { type: String, required: true },
  photo: { type: String },
  electionID: { type: Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
  socialLinks: {
    twitter: { type: String },
    facebook: { type: String },
    website: { type: String }
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  createdAt: { type: Date, default: Date.now }
});

export default model<ICandidate>('Candidate', CandidateSchema);
