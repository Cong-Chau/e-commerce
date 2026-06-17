import { Router } from "express";
import { suggestDescription } from "../controllers/ai.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * /ai/suggest-description:
 *   post:
 *     tags:
 *       - AI
 *     summary: Gợi ý mô tả shop bằng Google Gemini
 *     description: |
 *       Dùng Google Gemini 2.0 Flash để sinh tự động đoạn mô tả shop (~2-3 câu) bằng tiếng Việt,
 *       dựa trên tên shop do seller cung cấp.
 *       Chỉ dành cho tài khoản có vai trò **SELLER**.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuggestDescriptionBody'
 *     responses:
 *       200:
 *         description: Tạo mô tả thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuggestDescriptionResponse'
 *       400:
 *         description: Thiếu shop_name hoặc shop_name rỗng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Tài khoản không có vai trò SELLER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: GEMINI_API_KEY chưa được cấu hình trên server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/suggest-description",
  authenticate,
  authorize("SELLER"),
  suggestDescription,
);

export default router;
