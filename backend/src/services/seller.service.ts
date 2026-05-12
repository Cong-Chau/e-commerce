import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export class SellerService {
  async getProfile(sellerId: number) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        sellerProfile: {
          include: {
            sellerShippings: {
              include: { shipping: true }
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
        created_at: seller.sellerProfile.created_at
      } : null
    };
  }
}

export default new SellerService();
