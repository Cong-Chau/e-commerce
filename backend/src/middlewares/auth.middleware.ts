import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import { AppError } from "./error.middleware";
import { RoleName } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    roles: string[];
  };
}

// ─── Xác thực JWT ─────────────────────────────────────────────
export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return next(new AppError("Không có token xác thực", 401));
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Phân quyền từ token (không cần DB) ───────────────────────
export const authorize = (...roles: RoleName[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Chưa xác thực", 401));
    }

    const hasRole = roles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) {
      return next(new AppError("Bạn không có quyền thực hiện hành động này", 403));
    }

    next();
  };
};
