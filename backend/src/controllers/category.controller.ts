import { Request, Response, NextFunction } from 'express';
import categoryService from '../services/category.service';
import { sendSuccess, sendCreated } from '../utils/response.util';
import { AppError } from '../middlewares/error.middleware';
import type { CreateCategoryInput, UpdateCategoryInput } from '../dtos/category.dto';

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categoryService.getAll();
    sendSuccess(res, categories, 'Lấy danh sách danh mục thành công');
  } catch (err) {
    next(err);
  }
};

export const getCategoriesAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categoryService.getAllForAdmin();
    sendSuccess(res, categories, 'Lấy danh sách danh mục thành công');
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const category = await categoryService.create(req.body as CreateCategoryInput);
    sendCreated(res, category, 'Tạo danh mục thành công');
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new AppError('ID danh mục không hợp lệ', 400);

    const category = await categoryService.update(id, req.body as UpdateCategoryInput);
    sendSuccess(res, category, 'Cập nhật danh mục thành công');
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!id) throw new AppError('ID danh mục không hợp lệ', 400);

    await categoryService.delete(id);
    sendSuccess(res, null, 'Xoá danh mục thành công');
  } catch (err) {
    next(err);
  }
};
