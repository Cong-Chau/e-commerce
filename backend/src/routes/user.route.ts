import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { getAllUser } from "../controllers/user.controller";

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Lấy danh sách người dùng (có phân trang)
 *     description: |
 *       Trả về tất cả người dùng **không phải ADMIN**, hỗ trợ phân trang.
 *       Yêu cầu quyền **ADMIN**.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Số bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUsers'
 *             example:
 *               success: true
 *               message: Lấy danh sách người dùng thành công
 *               items:
 *                 - id: 1
 *                   name: Nguyễn Văn An
 *                   email: nguyenvanan@gmail.com
 *                   phone: "0901234501"
 *                   status: ACTIVE
 *                   roles: [CUSTOMER]
 *                   created_at: "2026-04-14T08:00:00.000Z"
 *               total: 20
 *               page: 1
 *               limit: 10
 *               totalPages: 2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden – Không có quyền ADMIN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Bạn không có quyền thực hiện hành động này
 */
router.get("/", authenticate, authorize("ADMIN"), getAllUser);

export default router;
