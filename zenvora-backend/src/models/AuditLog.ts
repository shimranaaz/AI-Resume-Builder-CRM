import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  leadId?: mongoose.Types.ObjectId;
  timestamp: Date;
  performedBy: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "Lead Created",
        "Lead Updated",
        "Lead Deleted",
        "Call Logged",
        "Follow Up Completed",
      ],
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
    },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: String, required: true, default: "system" },
  },
  { timestamps: true }
);

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);