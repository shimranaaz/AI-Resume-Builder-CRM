import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error(err.stack);

  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};