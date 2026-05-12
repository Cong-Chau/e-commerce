import { Router } from 'express';
import { getSellerProfile } from '../controllers/seller.controller';

const router = Router();

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
 *                   created_at: "2026-05-11T10:00:00.000Z"
 *       400:
 *         description: ID không hợp lệ hoặc người dùng không phải là người bán
 *       404:
 *         description: Không tìm thấy người bán
 */
router.get('/:id/profile', getSellerProfile);

export default router;
