import AuditLog from "../models/AuditLog";
import mongoose from "mongoose";

export const createAuditLog = async (
  action: string,
  leadId?: mongoose.Types.ObjectId,
  performedBy: string = "system"
): Promise<void> => {
  await AuditLog.create({
    action,
    leadId,
    performedBy,
    timestamp: new Date(),
  });
};

export const getAuditLogs = async () => {
  return await AuditLog.find()
    .populate("leadId", "name email")
    .sort({ timestamp: -1 });
};