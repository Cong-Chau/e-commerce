import { Request, Response, NextFunction } from 'express';
import sellerService from '../services/seller.service';
import { sendCreated, sendSuccess } from '../utils/response.util';
import { AppError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import type { CreateSellerProfileInput } from '../dtos/seller.dto';

export const createSellerProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('Chua xac thuc', 401);

    const body = req.body as CreateSellerProfileInput;
    const profile = await sellerService.createProfile(req.user.userId, body);

    sendCreated(res, profile, 'Tao ho so nguoi ban thanh cong');
  } catch (error) {
    next(error);
  }
};

export const getMyCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) throw new AppError('Chưa xác thực', 401);
    const categories = await sellerService.getMyCategories(req.user.userId);
    sendSuccess(res, categories, 'Lấy danh mục thành công');
  } catch (error) {
    next(error);
  }
};

export const getSellerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = parseInt(String(req.params.id), 10);
    if (isNaN(sellerId)) {
      throw new AppError('ID người bán không hợp lệ', 400);
    }

    const profile = await sellerService.getProfile(sellerId);
    sendSuccess(res, profile, 'Lấy thông tin người bán thành công');
  } catch (error) {
    next(error);
  }
};
