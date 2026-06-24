import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import * as callService from "../services/call.service";
import { sendSuccess, sendError } from "../utils/response";

export const getAllCalls = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const calls = await callService.getAllCalls();
    return sendSuccess(res, "Calls fetched successfully", calls);
  } catch (error) {
    next(error);
  }
};

export const createCall = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }
    const call = await callService.createCall(req.body);
    return sendSuccess(res, "Call logged successfully", call, 201);
  } catch (error: any) {
    if (error.name === "CastError") {
      return sendError(res, "Invalid Lead ID", 400);
    }
    next(error);
  }
};

export const deleteCall = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const call = await callService.deleteCall(req.params.id as string);
    if (!call) return sendError(res, "Call not found", 404);
    return sendSuccess(res, "Call deleted successfully", {});
  } catch (error) {
    next(error);
  }
};