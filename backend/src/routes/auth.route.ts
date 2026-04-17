import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  googleAuth,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '../dtos/auth.dto';

const router = Router();

// =========================================================================
// OpenAPI / Swagger JSDoc Annotations
// =========================================================================

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng ký tài khoản mới
 *     description: |
 *       Tạo tài khoản người dùng mới.
 *       - Nếu không truyền `role`, mặc định là **CUSTOMER**.
 *       - Chỉ cho phép đăng ký với role **CUSTOMER** hoặc **SELLER**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *           examples:
 *             customer:
 *               summary: Đăng ký Customer (mặc định)
 *               value:
 *                 name: Nguyễn Văn A
 *                 email: nguyenvana@example.com
 *                 password: Password@123
 *             seller:
 *               summary: Đăng ký Seller
 *               value:
 *                 name: Trần Thị B
 *                 email: tranthib@example.com
 *                 password: Password@123
 *                 role: SELLER
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               message: Đăng ký tài khoản thành công
 *               data:
 *                 id: 1
 *                 name: Nguyễn Văn A
 *                 email: nguyenvana@example.com
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Email đã được sử dụng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email đã được sử dụng
 */
router.post('/register', validate(RegisterDto), register);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng nhập bằng Google
 *     description: Xác thực Google ID token và trả về JWT của hệ thống.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token từ frontend
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/google', googleAuth);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng nhập
 *     description: Xác thực người dùng và trả về cặp **accessToken** / **refreshToken**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TokenPair'
 *             example:
 *               success: true
 *               message: Đăng nhập thành công
 *               data:
 *                 accessToken: "eyJhbGci..."
 *                 refreshToken: "eyJhbGci..."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', validate(LoginDto), login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Làm mới access token
 *     description: Dùng **refreshToken** hợp lệ để lấy cặp token mới.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshBody'
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TokenPair'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', validate(RefreshDto), refresh);

// ─── Protected ────────────────────────────────────────────────

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng xuất
 *     description: Thu hồi refresh token của người dùng hiện tại. Yêu cầu **Bearer Token**.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Đăng xuất thành công
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticate, logout);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Lấy thông tin cá nhân
 *     description: Trả về thông tin profile của người dùng đang đăng nhập.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   put:
 *     tags:
 *       - Auth
 *     summary: Cập nhật thông tin cá nhân
 *     description: Cập nhật **name** và/hoặc **phone** của người dùng hiện tại.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileBody'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(UpdateProfileDto), updateProfile);

/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Đổi mật khẩu
 *     description: Đổi mật khẩu cho tài khoản hiện tại. Mật khẩu mới phải có ít nhất **6 ký tự**.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordBody'
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Đổi mật khẩu thành công. Vui lòng đăng nhập lại
 *               data: null
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/change-password', authenticate, validate(ChangePasswordDto), changePassword);

export default router;
