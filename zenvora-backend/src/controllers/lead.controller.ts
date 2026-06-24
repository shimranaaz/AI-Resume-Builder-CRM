import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationError } from "express-validator";
import * as leadService from "../services/lead.service";
import { sendSuccess, sendError } from "../utils/response";

const getFirstError = (req: Request): string | null => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err: ValidationError = errors.array()[0];
    return err.type === "field" ? err.msg : "Validation error";
  }
  return null;
};

export const getAllLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leads = await leadService.getAllLeads(req.query);
    return sendSuccess(res, "Leads fetched successfully", leads);
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.getLeadById(req.params.id as string);
    if (!lead) return sendError(res, "Lead not found", 404);
    return sendSuccess(res, "Lead fetched successfully", lead);
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errMsg = getFirstError(req);
    if (errMsg) return sendError(res, errMsg, 400);
    const lead = await leadService.createLead(req.body);
    return sendSuccess(res, "Lead created successfully", lead, 201);
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendError(res, `${field} already exists`, 400);
    }
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errMsg = getFirstError(req);
    if (errMsg) return sendError(res, errMsg, 400);
    const lead = await leadService.updateLead(req.params.id as string, req.body);
    if (!lead) return sendError(res, "Lead not found", 404);
    return sendSuccess(res, "Lead updated successfully", lead);
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return sendError(res, `${field} already exists`, 400);
    }
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await leadService.deleteLead(req.params.id as string);
    if (!lead) return sendError(res, "Lead not found", 404);
    return sendSuccess(res, "Lead deleted successfully", {});
  } catch (error) {
    next(error);
  }
};