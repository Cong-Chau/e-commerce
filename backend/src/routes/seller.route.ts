import { Router } from 'express';
import { createSellerProfile, getMyCategories, getSellerProfile } from '../controllers/seller.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { CreateSellerProfileDto } from '../dtos/seller.dto';

const router = Router();

/**
 * @openapi
 * /sellers/me/profile:
 *   post:
 *     tags:
 *       - Sellers
 *     summary: Tao ho so cua hang cho Seller dang dang nhap
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             shop_name: "Shop Cua Tui"
 *             shop_logo: "https://example.com/logo.png"
 *             shop_description: "Chuyen ban do cong nghe"
 *             pickup_address: "123 Duong ABC, Quan 1, TP.HCM"
 *             owner_name: "Nguyen Van Ban"
 *             owner_phone: "0901234568"
 *             shippings: ["FAST", "EXPRESS"]
 *             category_ids: [28, 29]
 *     responses:
 *       201:
 *         description: Tao ho so nguoi ban thanh cong
 *       400:
 *         description: Du lieu khong hop le
 *       401:
 *         description: Chua xac thuc
 *       403:
 *         description: Khong co quyen SELLER
 *       409:
 *         description: Seller da co ho so
 */
router.post(
  '/me/profile',
  authenticate,
  authorize('SELLER'),
  validate(CreateSellerProfileDto),
  createSellerProfile,
);

/**
 * @openapi
 * /sellers/{id}/profile:
 *   get:
 *     tags:
 *       - Sellers
 *     summary: Lấy thông tin người bán
 *     description: Trả về thông tin chi tiết của người bán, bao gồm cả profile shop (nếu có).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của người bán (user_id)
 *     responses:
 *       200:
 *         description: Lấy thông tin người bán thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Lấy thông tin người bán thành công
 *               data:
 *                 id: 2
 *                 name: "Người Bán 1"
 *                 email: "seller1@gmail.com"
 *                 phone: "0901234567"
 *                 status: "ACTIVE"
 *                 created_at: "2026-05-11T10:00:00.000Z"
 *                 profile:
 *                   id: 1
 *                   shop_name: "Shop Của Tui"
 *                   shop_logo: "https://example.com/logo.png"
 *                   shop_description: "Chuyên bán đồ công nghệ"
 *                   pickup_address: "123 Đường ABC, Quận 1, TP.HCM"
 *                   owner_name: "Nguyễn Văn Bán"
 *                   owner_phone: "0901234568"
 *                   shippings: ["FAST", "EXPRESS"]
 *                   categories:
 *                     - id: 28
 *                       name: "Điện Thoại Di Động"
 *                   created_at: "2026-05-11T10:00:00.000Z"
 *       400:
 *         description: ID không hợp lệ hoặc người dùng không phải là người bán
 *       404:
 *         description: Không tìm thấy người bán
 */
/**
 * @openapi
 * /sellers/me/categories:
 *   get:
 *     tags:
 *       - Sellers
 *     summary: Lấy danh mục của shop đang đăng nhập
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh mục thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Lấy danh mục thành công
 *               data:
 *                 - id: 28
 *                   name: Điện Thoại Di Động
 *                 - id: 29
 *                   name: Phụ Kiện Điện Thoại
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Không có quyền SELLER
 *       404:
 *         description: Seller chưa có hồ sơ
 */
router.get('/me/categories', authenticate, authorize('SELLER'), getMyCategories);

router.get('/:id/profile', getSellerProfile);

export default router;
