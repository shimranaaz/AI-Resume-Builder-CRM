import { Request, Response, NextFunction } from "express";
import * as auditService from "../services/audit.service";
import { sendSuccess } from "../utils/response";

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const logs = await auditService.getAuditLogs();
    return sendSuccess(res, "Audit logs fetched successfully", logs);
  } catch (error) {
    next(error);
  }
};