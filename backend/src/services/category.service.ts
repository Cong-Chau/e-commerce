import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import type { CreateCategoryInput, UpdateCategoryInput } from '../dtos/category.dto';

export class CategoryService {
  // ─── Dành cho SELLER & CUSTOMER ───────────────────────────────
  async getAll() {
    return prisma.category.findMany({
      where: { parent_id: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        parent_id: true,
        children: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, parent_id: true },
        },
      },
    });
  }

  // ─── Dành cho ADMIN — có tổng số sản phẩm ────────────────────
  async getAllForAdmin() {
    const categories = await prisma.category.findMany({
      where: { parent_id: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        parent_id: true,
        _count: { select: { products: true } },
        children: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            parent_id: true,
            _count: { select: { products: true } },
          },
        },
      },
    });

    return categories.map(({ _count, children, ...cat }) => ({
      ...cat,
      productCount: _count.products,
      children: children.map(({ _count: cc, ...child }) => ({
        ...child,
        productCount: cc.products,
      })),
    }));
  }

  // ─── Tạo danh mục ────────────────────────────────────────────
  async create(data: CreateCategoryInput) {
    if (data.parent_id) {
      const parent = await prisma.category.findUnique({ where: { id: data.parent_id } });
      if (!parent) throw new AppError('Danh mục cha không tồn tại', 404);
      if (parent.parent_id !== null) throw new AppError('Không thể tạo danh mục cấp 3', 400);
    }

    return prisma.category.create({
      data: { name: data.name, parent_id: data.parent_id ?? null },
      select: { id: true, name: true, parent_id: true },
    });
  }

  // ─── Cập nhật danh mục ───────────────────────────────────────
  async update(id: number, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError('Danh mục không tồn tại', 404);

    if (data.parent_id !== undefined && data.parent_id !== null) {
      if (data.parent_id === id) throw new AppError('Danh mục không thể là cha của chính nó', 400);

      const parent = await prisma.category.findUnique({ where: { id: data.parent_id } });
      if (!parent) throw new AppError('Danh mục cha không tồn tại', 404);
      if (parent.parent_id !== null) throw new AppError('Không thể tạo danh mục cấp 3', 400);
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
      },
      select: { id: true, name: true, parent_id: true },
    });
  }

  // ─── Xoá danh mục ───────────────────────────────────────────
  async delete(id: number) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new AppError('Danh mục không tồn tại', 404);
    if (category._count.products > 0)
      throw new AppError(`Không thể xoá: danh mục đang có ${category._count.products} sản phẩm`, 409);
    if (category._count.children > 0)
      throw new AppError(`Không thể xoá: danh mục đang có ${category._count.children} danh mục con`, 409);

    await prisma.category.delete({ where: { id } });
  }
}

export default new CategoryService();
