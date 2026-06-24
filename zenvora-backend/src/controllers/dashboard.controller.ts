import { Request, Response, NextFunction } from "express";
import * as dashboardService from "../services/dashboard.service";
import { sendSuccess } from "../utils/response";

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return sendSuccess(res, "Dashboard stats fetched successfully", stats);
  } catch (error) {
    next(error);
  }
};