import { Router } from "express";
import {
  getCategories,
  getCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateCategoryDto, UpdateCategoryDto } from "../dtos/category.dto";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /categories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Lấy danh sách danh mục
 *     description: |
 *       Trả về toàn bộ danh mục gốc kèm danh mục con (nested 1 cấp).
 *       Không yêu cầu xác thực — dành cho **CUSTOMER** và **SELLER**.
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryListResponse'
 *             example:
 *               success: true
 *               message: Lấy danh sách danh mục thành công
 *               data:
 *                 - id: 1
 *                   name: Thời Trang Nam
 *                   parent_id: null
 *                   children: []
 *                 - id: 2
 *                   name: Điện Thoại & Phụ Kiện
 *                   parent_id: null
 *                   children:
 *                     - id: 28
 *                       name: Điện Thoại Di Động
 *                       parent_id: 2
 *                     - id: 29
 *                       name: Phụ Kiện Điện Thoại
 *                       parent_id: 2
 */
router.get("/", getCategories);

// ─────────────────────────────────────────────────────────────────────────────
// GET /categories/admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories/admin:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Lấy danh sách danh mục kèm số sản phẩm (Admin)
 *     description: |
 *       Trả về toàn bộ danh mục gốc kèm danh mục con và **tổng số sản phẩm** của mỗi danh mục.
 *       Yêu cầu quyền **ADMIN**.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryAdminListResponse'
 *             example:
 *               success: true
 *               message: Lấy danh sách danh mục thành công
 *               data:
 *                 - id: 1
 *                   name: Thời Trang Nam
 *                   parent_id: null
 *                   productCount: 42
 *                   children: []
 *                 - id: 2
 *                   name: Điện Thoại & Phụ Kiện
 *                   parent_id: null
 *                   productCount: 158
 *                   children:
 *                     - id: 28
 *                       name: Điện Thoại Di Động
 *                       parent_id: 2
 *                       productCount: 90
 *                     - id: 29
 *                       name: Phụ Kiện Điện Thoại
 *                       parent_id: 2
 *                       productCount: 68
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
router.get("/admin", authenticate, authorize("ADMIN"), getCategoriesAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// POST /categories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Tạo danh mục mới
 *     description: |
 *       Tạo danh mục gốc hoặc danh mục con. Hệ thống hỗ trợ tối đa **2 cấp**:
 *       - Không truyền `parent_id` (hoặc `null`) → danh mục gốc.
 *       - Truyền `parent_id` trỏ tới danh mục gốc → danh mục con.
 *       - Không thể tạo cấp 3 (danh mục con của danh mục con).
 *
 *       Yêu cầu quyền **ADMIN**.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryBody'
 *           examples:
 *             rootCategory:
 *               summary: Tạo danh mục gốc
 *               value:
 *                 name: Thực Phẩm & Đồ Uống
 *             childCategory:
 *               summary: Tạo danh mục con
 *               value:
 *                 name: Điện Thoại Di Động
 *                 parent_id: 2
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryItemResponse'
 *             examples:
 *               rootCreated:
 *                 summary: Tạo danh mục gốc thành công
 *                 value:
 *                   success: true
 *                   message: Tạo danh mục thành công
 *                   data:
 *                     id: 28
 *                     name: Thực Phẩm & Đồ Uống
 *                     parent_id: null
 *               childCreated:
 *                 summary: Tạo danh mục con thành công
 *                 value:
 *                   success: true
 *                   message: Tạo danh mục thành công
 *                   data:
 *                     id: 29
 *                     name: Điện Thoại Di Động
 *                     parent_id: 2
 *       400:
 *         description: Bad Request – Dữ liệu không hợp lệ hoặc vi phạm giới hạn 2 cấp
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 summary: Lỗi validation
 *                 value:
 *                   success: false
 *                   message: Tên danh mục phải có ít nhất 2 ký tự
 *               depthError:
 *                 summary: Vi phạm giới hạn 2 cấp
 *                 value:
 *                   success: false
 *                   message: Không thể tạo danh mục cấp 3
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
 *       404:
 *         description: Not Found – Danh mục cha không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Danh mục cha không tồn tại
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate(CreateCategoryDto),
  createCategory,
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /categories/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Cập nhật danh mục
 *     description: |
 *       Cập nhật **name** và/hoặc **parent_id** của danh mục.
 *       Cần cung cấp ít nhất một trong hai trường.
 *       Yêu cầu quyền **ADMIN**.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID của danh mục cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryBody'
 *           examples:
 *             updateName:
 *               summary: Đổi tên danh mục
 *               value:
 *                 name: Thời Trang Nam & Nữ
 *             moveToRoot:
 *               summary: Chuyển thành danh mục gốc
 *               value:
 *                 parent_id: null
 *             changeParent:
 *               summary: Đổi danh mục cha
 *               value:
 *                 parent_id: 3
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryItemResponse'
 *             example:
 *               success: true
 *               message: Cập nhật danh mục thành công
 *               data:
 *                 id: 1
 *                 name: Thời Trang Nam & Nữ
 *                 parent_id: null
 *       400:
 *         description: Bad Request – Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noData:
 *                 summary: Không có trường nào được cung cấp
 *                 value:
 *                   success: false
 *                   message: Vui lòng cung cấp ít nhất name hoặc parent_id
 *               selfParent:
 *                 summary: Đặt chính mình làm cha
 *                 value:
 *                   success: false
 *                   message: Danh mục không thể là cha của chính nó
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
 *       404:
 *         description: Not Found – Danh mục hoặc danh mục cha không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               categoryNotFound:
 *                 summary: Danh mục không tồn tại
 *                 value:
 *                   success: false
 *                   message: Danh mục không tồn tại
 *               parentNotFound:
 *                 summary: Danh mục cha không tồn tại
 *                 value:
 *                   success: false
 *                   message: Danh mục cha không tồn tại
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(UpdateCategoryDto),
  updateCategory,
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /categories/:id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Xoá danh mục
 *     description: |
 *       Xoá danh mục theo ID. Yêu cầu quyền **ADMIN**.
 *
 *       **Điều kiện để xoá thành công:**
 *       - Danh mục không còn sản phẩm nào.
 *       - Danh mục không còn danh mục con nào.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 28
 *         description: ID của danh mục cần xoá
 *     responses:
 *       200:
 *         description: Xoá thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Xoá danh mục thành công
 *               data: null
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
 *       404:
 *         description: Not Found – Danh mục không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Danh mục không tồn tại
 *       409:
 *         description: Conflict – Không thể xoá do ràng buộc dữ liệu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               hasProducts:
 *                 summary: Danh mục còn sản phẩm
 *                 value:
 *                   success: false
 *                   message: Không thể xoá danh mục đang có 42 sản phẩm
 *               hasChildren:
 *                 summary: Danh mục còn danh mục con
 *                 value:
 *                   success: false
 *                   message: Không thể xoá danh mục đang có 3 danh mục con
 */
router.delete("/:id", authenticate, authorize("ADMIN"), deleteCategory);

export default router;
