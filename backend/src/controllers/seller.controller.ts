import { Request, Response, NextFunction } from 'express';
import sellerService from '../services/seller.service';
import { sendSuccess } from '../utils/response.util';
import { AppError } from '../middlewares/error.middleware';

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
