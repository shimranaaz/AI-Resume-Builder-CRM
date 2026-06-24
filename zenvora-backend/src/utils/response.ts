import { Response } from "express";

export const sendSuccess = (
  res: Response,
  message: string,
  data: any = {},
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string | string[] | null,
  statusCode: number = 500
): Response => {
  return res.status(statusCode).json({
    success: false,
    message: Array.isArray(message)
      ? message[0]
      : message ?? "An error occurred",
  });
};