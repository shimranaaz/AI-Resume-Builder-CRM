import mongoose, { Document, Schema } from "mongoose";

export interface ILead extends Document {
  name: string;
  email: string;
  mobile: string;
  source: string;
  status: string;
  nextFollowUp?: Date;
  lastContactDate?: Date;
  followUpCount: number;
  notes?: string;
  expectedRevenue: number;
  actualRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    source: {
      type: String,
      required: true,
      enum: ["LinkedIn", "WhatsApp", "Website", "Referral", "Cold Call", "Other"],
    },
    status: {
      type: String,
      required: true,
      enum: ["New Lead", "Called", "Interested", "Follow Up", "Demo Scheduled", "Demo Completed", "Closed Won", "Closed Lost"],
      default: "New Lead",
    },
    nextFollowUp: { type: Date },
    lastContactDate: { type: Date },
    followUpCount: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    expectedRevenue: { type: Number, default: 0, min: 0 },
    actualRevenue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ILead>("Lead", LeadSchema);