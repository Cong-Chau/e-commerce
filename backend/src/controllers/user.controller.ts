import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { parsePagination, buildPaginatedResult } from "../utils/pagination.util";
import { sendPaginated } from "../utils/response.util";

const userService = new UserService();

export const getAllUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { items, total } = await userService.getAllUser(page, limit);
    sendPaginated(res, buildPaginatedResult(items, total, page, limit), "Lấy danh sách người dùng thành công");
  } catch (error) {
    next(error);
  }
};
