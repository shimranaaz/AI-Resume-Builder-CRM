import Call from "../models/Call";
import Lead from "../models/Lead";
import { createAuditLog } from "./audit.service";

export const getAllCalls = async () => {
  return await Call.find()
    .populate("leadId", "name email mobile")
    .sort({ callDate: -1 });
};

export const createCall = async (data: any) => {
  const call = await Call.create(data);

  // Always update lastContactDate and increment followUpCount
  const leadUpdate: any = {
    $set: { lastContactDate: new Date() },
    $inc: { followUpCount: 1 },
  };

  // Outcome-based lead status and follow-up handling
  if (data.outcome === "Interested") {
    leadUpdate.$set.status = "Interested";
    if (data.nextFollowUp) {
      leadUpdate.$set.nextFollowUp = new Date(data.nextFollowUp);
    }
  } else if (data.outcome === "Follow Up" || data.outcome === "Call Back Later") {
    leadUpdate.$set.status = "Follow Up";
    if (data.nextFollowUp) {
      leadUpdate.$set.nextFollowUp = new Date(data.nextFollowUp);
    }
  } else if (data.outcome === "Closed Won") {
    leadUpdate.$set.status = "Closed Won";
    leadUpdate.$set.nextFollowUp = null;
  } else if (data.outcome === "Closed Lost") {
    leadUpdate.$set.status = "Closed Lost";
    leadUpdate.$set.nextFollowUp = null;
  } else if (data.outcome === "Not Interested") {
    leadUpdate.$set.status = "Called";
    leadUpdate.$set.nextFollowUp = null;
} else {
  // Busy, No Answer — update status, and carry the follow-up date forward
  leadUpdate.$set.status = "Called";
  if (data.nextFollowUp) {
    leadUpdate.$set.nextFollowUp = new Date(data.nextFollowUp);
  }
}

  await Lead.findByIdAndUpdate(data.leadId, leadUpdate);
  await createAuditLog("Call Logged", data.leadId);

  return call;
};

export const deleteCall = async (id: string) => {
  const call = await Call.findByIdAndDelete(id);
  return call;
};