import mongoose, { Document, Schema } from "mongoose";
export interface ICall extends Document {
  leadId: mongoose.Types.ObjectId;
  callDate: Date;
  duration: number;
  outcome: string;
  remarks?: string;
  nextFollowUp?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const CallSchema = new Schema<ICall>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    callDate: { type: Date, required: true, default: Date.now },
    duration: { type: Number, required: true, min: 0 },
    outcome: {
      type: String,
      required: true,
      enum: ["Interested", "Busy", "No Answer", "Call Back Later", "Not Interested"],
    },
    remarks: { type: String, trim: true },
    nextFollowUp: { type: Date },
  },
  { timestamps: true }
);
export default mongoose.model<ICall>("Call", CallSchema);