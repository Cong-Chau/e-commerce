import { Response } from 'express';
import { ApiResponse, PaginatedResult } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Thành công',
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Tạo thành công'): Response => {
  return sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  result: PaginatedResult<T>,
  message = 'Thành công'
): Response => {
  return res.status(200).json({ success: true, message, ...result });
};
