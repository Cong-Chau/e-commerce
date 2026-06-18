import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import productService from "../services/product.service";
import { buildPaginatedResult } from "../utils/pagination.util";
import { sendPaginated, sendCreated, sendSuccess } from "../utils/response.util";
import { AppError } from "../middlewares/error.middleware";
import type { CreateProductInput, UpdateProductImagesInput, UpdateProductInput, MyProductsQuery } from "../dtos/product.dto";

export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);

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

export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);

    const productId = Number(req.params.id);
    if (isNaN(productId)) throw new AppError("ID sản phẩm không hợp lệ", 400);

    const body = req.body as UpdateProductInput;
    const product = await productService.updateProduct(req.user.userId, productId, body);
    sendSuccess(res, product, "Cập nhật sản phẩm thành công");
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const productId = Number(req.params.id);
    if (isNaN(productId)) throw new AppError("ID sản phẩm không hợp lệ", 400);

    const product = await productService.getProductById(productId);
    sendSuccess(res, product, "Lấy chi tiết sản phẩm thành công");
  } catch (err) {
    next(err);
  }
};

export const toggleProductStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);

    const productId = Number(req.params.id);
    if (isNaN(productId)) throw new AppError("ID sản phẩm không hợp lệ", 400);

    const result = await productService.toggleProductStatus(req.user.userId, productId);
    const message = result.status === "ACTIVE" ? "Đã bật bán sản phẩm" : "Đã ngừng bán sản phẩm";
    sendSuccess(res, result, message);
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
