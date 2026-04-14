import { PaginationQuery, PaginatedResult } from '../types';

export const parsePagination = (query: PaginationQuery) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sort = query.sort || 'createdAt';
  const order: 'asc' | 'desc' = query.order === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, sort, order };
};

export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
