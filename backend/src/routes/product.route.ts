import { Router } from 'express';
import { createProduct, updateProduct, updateProductImages, getMyProducts, getProductById, toggleProductStatus } from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { CreateProductDto, UpdateProductDto, UpdateProductImagesDto, MyProductsQueryDto } from '../dtos/product.dto';

const router = Router();

/**
 * @openapi
 * /products/me:
 *   get:
 *     tags:
 *       - Products
 *     summary: Lấy danh sách sản phẩm của tôi (Seller)
 *     description: |
 *       Trả về danh sách sản phẩm do Seller đang đăng nhập sở hữu.
 *       Hỗ trợ lọc theo **trạng thái**, **danh mục**, **từ khoá tìm kiếm** và **phân trang**.
 *       Yêu cầu quyền **SELLER**.
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
 *         description: Số sản phẩm mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, DELETED]
 *         description: Lọc theo trạng thái sản phẩm (bỏ trống để lấy tất cả)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Lọc theo ID danh mục
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường)
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyProductsResponse'
 *             example:
 *               success: true
 *               message: Lấy danh sách sản phẩm thành công
 *               items:
 *                 - id: 10
 *                   name: Áo thun nam basic
 *                   price: "150000"
 *                   stock: 100
 *                   status: ACTIVE
 *                   created_at: "2026-04-01T08:00:00.000Z"
 *                   category:
 *                     id: 1
 *                     name: Thời Trang Nam
 *                   images:
 *                     - id: 5
 *                       image_url: https://example.com/images/ao-thun.jpg
 *                   _count:
 *                     reviews: 12
 *                     orderItems: 35
 *               total: 24
 *               page: 1
 *               limit: 10
 *               totalPages: 3
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden – Không có quyền SELLER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Bạn không có quyền thực hiện hành động này
 */
/**
 * @openapi
 * /products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Thêm sản phẩm mới (Seller)
 *     description: |
 *       Tạo một sản phẩm mới cho Seller đang đăng nhập.
 *       `seller_id` được lấy tự động từ token — không cần truyền trong body.
 *       Yêu cầu quyền **SELLER**.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductBody'
 *           example:
 *             name: Áo thun nam basic
 *             description: Chất liệu cotton 100%, thoáng mát
 *             price: 150000
 *             stock: 100
 *             category_id: 3
 *             images:
 *               - https://example.com/images/ao-thun-1.jpg
 *               - https://example.com/images/ao-thun-2.jpg
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateProductResponse'
 *             example:
 *               success: true
 *               message: Tạo sản phẩm thành công
 *               data:
 *                 id: 42
 *                 name: Áo thun nam basic
 *                 description: Chất liệu cotton 100%, thoáng mát
 *                 price: "150000"
 *                 stock: 100
 *                 status: ACTIVE
 *                 created_at: "2026-04-15T08:00:00.000Z"
 *                 category:
 *                   id: 3
 *                   name: Thời Trang Nam
 *                 images:
 *                   - id: 10
 *                     image_url: https://example.com/images/ao-thun-1.jpg
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden – Không có quyền SELLER
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Danh mục không tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Danh mục không tồn tại
 */
router.post(
  '/',
  authenticate,
  authorize('SELLER'),
  validate(CreateProductDto),
  createProduct,
);

/**
 * @openapi
 * /products/{id}/images:
 *   put:
 *     tags:
 *       - Products
 *     summary: Cập nhật ảnh sản phẩm (Seller)
 *     description: |
 *       Thay thế toàn bộ ảnh của sản phẩm bằng danh sách ảnh mới.
 *       Chỉ Seller sở hữu sản phẩm mới được phép cập nhật.
 *       Yêu cầu quyền **SELLER**.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductImagesBody'
 *           example:
 *             images:
 *               - https://example.com/images/ao-thun-new-1.jpg
 *               - https://example.com/images/ao-thun-new-2.jpg
 *     responses:
 *       200:
 *         description: Cập nhật ảnh thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateProductImagesResponse'
 *             example:
 *               success: true
 *               message: Cập nhật ảnh sản phẩm thành công
 *               data:
 *                 - id: 11
 *                   image_url: https://example.com/images/ao-thun-new-1.jpg
 *                 - id: 12
 *                   image_url: https://example.com/images/ao-thun-new-2.jpg
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Không phải chủ sở hữu sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Bạn không có quyền chỉnh sửa sản phẩm này
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Cập nhật thông tin sản phẩm (Seller)
 *     description: |
 *       Cập nhật một hoặc nhiều trường của sản phẩm. Chỉ Seller sở hữu mới được chỉnh sửa.
 *       Yêu cầu quyền **SELLER**.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 minimum: 0
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, OUT_OF_STOCK]
 *               category_id:
 *                 type: integer
 *           example:
 *             name: Áo thun nam basic v2
 *             price: 180000
 *             stock: 50
 *             status: ACTIVE
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Cập nhật sản phẩm thành công
 *               data:
 *                 id: 42
 *                 name: Áo thun nam basic v2
 *                 price: "180000"
 *                 stock: 50
 *                 status: ACTIVE
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Không phải chủ sở hữu sản phẩm
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Bạn không có quyền chỉnh sửa sản phẩm này
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
/**
 * @openapi
 * /products/{id}/toggle-status:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Bật / Tắt bán sản phẩm (Seller)
 *     description: |
 *       Chuyển đổi trạng thái sản phẩm giữa **ACTIVE** và **INACTIVE**.
 *       - Nếu đang `ACTIVE` → chuyển sang `INACTIVE` (ngừng bán)
 *       - Nếu đang `INACTIVE` hoặc `OUT_OF_STOCK` → chuyển sang `ACTIVE` (bật bán lại)
 *
 *       Chỉ Seller sở hữu sản phẩm mới được phép thao tác. Không cần body.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái thành công
 *         content:
 *           application/json:
 *             examples:
 *               deactivated:
 *                 summary: Ngừng bán
 *                 value:
 *                   success: true
 *                   message: Đã ngừng bán sản phẩm
 *                   data:
 *                     id: 42
 *                     status: INACTIVE
 *               activated:
 *                 summary: Bật bán lại
 *                 value:
 *                   success: true
 *                   message: Đã bật bán sản phẩm
 *                   data:
 *                     id: 42
 *                     status: ACTIVE
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Không phải chủ sở hữu sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Bạn không có quyền chỉnh sửa sản phẩm này
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:id/toggle-status',
  authenticate,
  authorize('SELLER'),
  toggleProductStatus,
);

router.patch(
  '/:id',
  authenticate,
  authorize('SELLER'),
  validate(UpdateProductDto),
  updateProduct,
);

router.put(
  '/:id/images',
  authenticate,
  authorize('SELLER'),
  validate(UpdateProductImagesDto),
  updateProductImages,
);

router.get(
  '/me',
  authenticate,
  authorize('SELLER'),
  validateQuery(MyProductsQueryDto),
  getMyProducts,
);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     description: |
 *       Trả về đầy đủ thông tin sản phẩm bao gồm mô tả và toàn bộ ảnh.
 *       Endpoint công khai — không yêu cầu xác thực.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Lấy chi tiết sản phẩm thành công
 *               data:
 *                 id: 42
 *                 name: Áo thun nam basic
 *                 description: Chất liệu cotton 100%, thoáng mát
 *                 price: "150000"
 *                 stock: 85
 *                 status: ACTIVE
 *                 created_at: "2026-04-15T08:00:00.000Z"
 *                 category:
 *                   id: 3
 *                   name: Thời Trang Nam
 *                 images:
 *                   - id: 10
 *                     image_url: https://example.com/images/ao-thun-1.jpg
 *                   - id: 11
 *                     image_url: https://example.com/images/ao-thun-2.jpg
 *                 _count:
 *                   reviews: 12
 *                   orderItems: 35
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', getProductById);

export default router;
