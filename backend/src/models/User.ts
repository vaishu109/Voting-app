import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  voterID: string;
  passwordHash: string;
  role: 'Admin' | 'Election Officer' | 'Candidate' | 'Voter';
  verified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  profilePhoto?: string;
  hasVoted: string[]; // Array of Election IDs
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String, required: true },
  voterID: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Election Officer', 'Candidate', 'Voter'], default: 'Voter' },
  verified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  profilePhoto: { type: String },
  hasVoted: [{ type: Schema.Types.ObjectId, ref: 'Election' }],
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default model<IUser>('User', UserSchema);
