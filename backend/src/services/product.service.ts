import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import type { CreateProductInput, UpdateProductImagesInput, UpdateProductInput, MyProductsQuery } from '../dtos/product.dto';

export class ProductService {
  // ─── Seller: thêm sản phẩm mới ───────────────────────────────
  async createProduct(sellerId: number, data: CreateProductInput) {
    const category = await prisma.category.findUnique({ where: { id: data.category_id } });
    if (!category) throw new AppError('Danh mục không tồn tại', 404);

    const { images, ...productData } = data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        seller_id: sellerId,
        ...(images?.length && {
          images: { createMany: { data: images.map((url) => ({ image_url: url })) } },
        }),
      },
      select: {
        id:          true,
        name:        true,
        description: true,
        price:       true,
        stock:       true,
        status:      true,
        created_at:  true,
        category:    { select: { id: true, name: true } },
        images:      { select: { id: true, image_url: true } },
      },
    });

    return product;
  }

  // ─── Seller: cập nhật ảnh sản phẩm ──────────────────────────
  async updateProductImages(sellerId: number, productId: number, data: UpdateProductImagesInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Sản phẩm không tồn tại', 404);
    if (product.seller_id !== sellerId) throw new AppError('Bạn không có quyền chỉnh sửa sản phẩm này', 403);

    const images = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { product_id: productId } });
      await tx.productImage.createMany({
        data: data.images.map((url) => ({ product_id: productId, image_url: url })),
      });
      return tx.productImage.findMany({
        where: { product_id: productId },
        select: { id: true, image_url: true },
      });
    });

    return images;
  }

  // ─── Seller: cập nhật thông tin sản phẩm ────────────────────
  async updateProduct(sellerId: number, productId: number, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Sản phẩm không tồn tại', 404);
    if (product.seller_id !== sellerId) throw new AppError('Bạn không có quyền chỉnh sửa sản phẩm này', 403);

    if (data.category_id) {
      const category = await prisma.category.findUnique({ where: { id: data.category_id } });
      if (!category) throw new AppError('Danh mục không tồn tại', 404);
    }

    return prisma.product.update({
      where: { id: productId },
      data,
      select: {
        id:          true,
        name:        true,
        description: true,
        price:       true,
        stock:       true,
        status:      true,
        created_at:  true,
        category:    { select: { id: true, name: true } },
        images:      { select: { id: true, image_url: true } },
        _count:      { select: { reviews: true, orderItems: true } },
      },
    });
  }

  // ─── Seller: lấy chi tiết 1 sản phẩm ────────────────────────
  async getProductById(productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id:          true,
        name:        true,
        description: true,
        price:       true,
        stock:       true,
        status:      true,
        created_at:  true,
        category:    { select: { id: true, name: true } },
        images:      { select: { id: true, image_url: true } },
        _count:      { select: { reviews: true, orderItems: true } },
      },
    });

    if (!product) throw new AppError('Sản phẩm không tồn tại', 404);
    return product;
  }

  // ─── Seller: bật/tắt bán sản phẩm ──────────────────────────────
  async toggleProductStatus(sellerId: number, productId: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Sản phẩm không tồn tại', 404);
    if (product.seller_id !== sellerId) throw new AppError('Bạn không có quyền chỉnh sửa sản phẩm này', 403);

    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    return prisma.product.update({
      where: { id: productId },
      data: { status: nextStatus },
      select: {
        id:     true,
        status: true,
      },
    });
  }

  // ─── Seller: lấy danh sách sản phẩm của mình ─────────────────
  async getMyProducts(sellerId: number, query: MyProductsQuery) {
    const { page, limit, status, category_id, search } = query;
    const skip = (page - 1) * limit;

    const where = {
      seller_id: sellerId,
      ...(status      && { status }),
      ...(category_id && { category_id }),
      ...(search      && { name: { contains: search, mode: 'insensitive' as const } }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        select: {
          id:          true,
          name:        true,
          price:       true,
          stock:       true,
          status:      true,
          created_at:  true,
          category:    { select: { id: true, name: true } },
          images:      { select: { id: true, image_url: true }, take: 1 },
          _count:      { select: { reviews: true, orderItems: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  }
}

export default new ProductService();
