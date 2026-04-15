import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "./error.middleware";

export const validate =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join(", ");
      return next(new AppError(message, 400));
    }

    req.body = result.data;
    next();
  };

// Validate req.query (dùng cho GET với query params)
export const validateQuery =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join(", ");
      return next(new AppError(message, 400));
    }

    // req.query là getter trên prototype Express — dùng defineProperty để shadow nó
    // với own property chứa data đã parse (bao gồm giá trị số đã coerce)
    Object.defineProperty(req, 'query', {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
