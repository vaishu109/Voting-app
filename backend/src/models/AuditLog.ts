import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  user: string; // email or 'anonymous'
  role: string;
  ipAddress: string;
  details?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  user: { type: String, required: true },
  role: { type: String, required: true },
  ipAddress: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export default model<IAuditLog>('AuditLog', AuditLogSchema);
