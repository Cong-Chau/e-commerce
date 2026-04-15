import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import productService from "../services/product.service";
import { buildPaginatedResult } from "../utils/pagination.util";
import { sendPaginated, sendCreated, sendSuccess } from "../utils/response.util";
import { AppError } from "../middlewares/error.middleware";
import type { CreateProductInput, UpdateProductImagesInput, MyProductsQuery } from "../dtos/product.dto";

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);

    console.log(req);

    const body = req.body as CreateProductInput;
    const product = await productService.createProduct(req.user.userId, body);

    sendCreated(res, product, "Tạo sản phẩm thành công");
  } catch (err) {
    next(err);
  }
};

export const updateProductImages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);

    const productId = Number(req.params.id);
    const body = req.body as UpdateProductImagesInput;
    const images = await productService.updateProductImages(req.user.userId, productId, body);

    sendSuccess(res, images, "Cập nhật ảnh sản phẩm thành công");
  } catch (err) {
    next(err);
  }
};

export const getMyProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);

    const query = req.query as unknown as MyProductsQuery; // đã validate + parse bởi validateQuery middleware
    const { items, total } = await productService.getMyProducts(
      req.user.userId,
      query,
    );

    sendPaginated(
      res,
      buildPaginatedResult(items, total, query.page, query.limit),
      "Lấy danh sách sản phẩm thành công",
    );
  } catch (err) {
    next(err);
  }
};
