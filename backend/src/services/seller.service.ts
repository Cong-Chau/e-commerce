import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import type { CreateSellerProfileInput } from '../dtos/seller.dto';

export class SellerService {
  async createProfile(sellerId: number, data: CreateSellerProfileInput) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        sellerProfile: true,
        userRoles: { include: { role: true } }
      }
    });

    if (!seller) {
      throw new AppError('Không tìm thấy người bán', 404);
    }

    const isSeller = seller.userRoles.some(ur => ur.role.name === 'SELLER');
    if (!isSeller) {
      throw new AppError('Người dùng này không phải là người bán', 400);
    }

    if (seller.sellerProfile) {
      throw new AppError('Người bán đã có hồ sơ cửa hàng', 409);
    }

    const { shippings, category_ids, ...profileData } = data;

    if (category_ids.length) {
      const existingCount = await prisma.category.count({
        where: { id: { in: category_ids } }
      });
      if (existingCount !== category_ids.length) {
        throw new AppError('Một hoặc nhiều danh mục không tồn tại', 400);
      }
    }

    const profile = await prisma.sellerProfile.create({
      data: {
        ...profileData,
        user_id: sellerId,
        ...(shippings.length && {
          sellerShippings: {
            create: shippings.map((name) => ({
              shipping: {
                connectOrCreate: {
                  where: { name },
                  create: { name }
                }
              }
            }))
          }
        }),
        ...(category_ids.length && {
          sellerCategories: {
            create: category_ids.map((category_id) => ({ category_id }))
          }
        })
      },
      include: {
        sellerShippings: {
          include: { shipping: true }
        },
        sellerCategories: {
          include: { category: true }
        }
      }
    });

    return {
      id: profile.id,
      shop_name: profile.shop_name,
      shop_logo: profile.shop_logo,
      shop_description: profile.shop_description,
      pickup_address: profile.pickup_address,
      owner_name: profile.owner_name,
      owner_phone: profile.owner_phone,
      shippings: profile.sellerShippings.map(ss => ss.shipping.name),
      categories: profile.sellerCategories.map(sc => ({ id: sc.category.id, name: sc.category.name })),
      created_at: profile.created_at
    };
  }

  async getMyCategories(sellerId: number) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { user_id: sellerId },
      include: {
        sellerCategories: {
          include: { category: true }
        }
      }
    });

    if (!profile) {
      throw new AppError('Người bán chưa có hồ sơ cửa hàng', 404);
    }

    return profile.sellerCategories.map(sc => ({ id: sc.category.id, name: sc.category.name }));
  }

  async getProfile(sellerId: number) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        sellerProfile: {
          include: {
            sellerShippings: {
              include: { shipping: true }
            },
            sellerCategories: {
              include: { category: true }
            }
          }
        },
        userRoles: { include: { role: true } }
      }
    });

    if (!seller) {
      throw new AppError('Không tìm thấy người bán', 404);
    }

    const isSeller = seller.userRoles.some(ur => ur.role.name === 'SELLER');
    if (!isSeller) {
      throw new AppError('Người dùng này không phải là người bán', 400);
    }

    return {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      status: seller.status,
      created_at: seller.created_at,
      profile: seller.sellerProfile ? {
        id: seller.sellerProfile.id,
        shop_name: seller.sellerProfile.shop_name,
        shop_logo: seller.sellerProfile.shop_logo,
        shop_description: seller.sellerProfile.shop_description,
        pickup_address: seller.sellerProfile.pickup_address,
        owner_name: seller.sellerProfile.owner_name,
        owner_phone: seller.sellerProfile.owner_phone,
        shippings: seller.sellerProfile.sellerShippings.map(ss => ss.shipping.name),
        categories: seller.sellerProfile.sellerCategories.map(sc => ({ id: sc.category.id, name: sc.category.name })),
        created_at: seller.sellerProfile.created_at
      } : null
    };
  }
}

export default new SellerService();
