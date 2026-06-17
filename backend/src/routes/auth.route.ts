import { Router } from 'express';
import {
  sendOtp,
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
  SendOtpDto,
  RegisterDto,
  LoginDto,
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
/**
 * @openapi
 * /auth/send-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Gửi mã OTP xác thực email
 *     description: |
 *       Tạo và gửi mã OTP 6 chữ số đến email để xác thực trước khi đăng ký.
 *       - OTP có hiệu lực trong **5 phút**
 *       - Tối đa **5 lần** nhập sai trước khi bị khoá
 *       - Nếu đã có OTP cũ → tự động ghi đè
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP đã được gửi
 *       409:
 *         description: Email đã được đăng ký
 */
router.post('/send-otp', validate(SendOtpDto), sendOtp);

router.post('/register', validate(RegisterDto), register);

/**
 * @openapi
 * /auth/google:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng nhập bằng Google
 *     description: |
 *       Xác thực Google ID token. **accessToken** và **refreshToken** được set vào
 *       httpOnly cookie trên response, không trả về trong body.
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
 *     description: |
 *       Xác thực người dùng. **accessToken** và **refreshToken** được set vào
 *       httpOnly cookie trên response (không trả về trong body).
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *             example:
 *               success: true
 *               message: Đăng nhập thành công
 *               data:
 *                 user:
 *                   id: 1
 *                   name: "Nguyễn Văn A"
 *                   email: "nguyenvana@example.com"
 *                   roles: ["CUSTOMER"]
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
 *     description: |
 *       Dùng **refreshToken** httpOnly cookie (gửi tự động bởi browser) để lấy
 *       cặp token mới. Không cần request body — cặp token mới được set lại
 *       vào cookie trên response.
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', refresh);

// ─── Protected ────────────────────────────────────────────────

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng xuất
 *     description: Thu hồi refresh token của người dùng hiện tại và xoá cookie accessToken/refreshToken.
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
