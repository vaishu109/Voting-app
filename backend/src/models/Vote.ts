import { Schema, model, Document } from 'mongoose';

export interface IVote extends Document {
  electionID: Schema.Types.ObjectId;
  candidateID: Schema.Types.ObjectId;
  encryptedVote: string; // Hashed/encrypted representation for integrity check
  verificationHash: string; // Public verification token printed on receipt
  timestamp: Date;
}

const VoteSchema = new Schema<IVote>({
  electionID: { type: Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
  candidateID: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
  encryptedVote: { type: String, required: true },
  verificationHash: { type: String, required: true, unique: true, index: true },
  timestamp: { type: Date, default: Date.now }
});

export default model<IVote>('Vote', VoteSchema);
