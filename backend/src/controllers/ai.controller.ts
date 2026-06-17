import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AppError } from "../middlewares/error.middleware";
import { sendSuccess } from "../utils/response.util";
import { aiService } from "../services/ai.service";

export const suggestDescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { shop_name, categories } = req.body as { shop_name?: string; categories?: string[] };
    if (!shop_name?.trim()) {
      throw new AppError("shop_name là bắt buộc", 400);
    }

    const description = await aiService.suggestShopDescription(shop_name.trim(), categories);
    sendSuccess(res, { description }, "Tạo mô tả thành công");
  } catch (err) {
    next(err);
  }
};
