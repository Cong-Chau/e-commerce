import { Response, NextFunction } from "express";
import { RoleName } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import authService from "../services/auth.service";
import { sendSuccess, sendCreated } from "../utils/response.util";
import { AppError } from "../middlewares/error.middleware";
import type {
  SendOtpInput,
  RegisterInput,
  LoginInput,
  RefreshInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "../dtos/auth.dto";

// ─── Send OTP ─────────────────────────────────────────────────────────────────
export const sendOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body as SendOtpInput;
    const result = await authService.sendOtp(email);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password, otp, role } = req.body as RegisterInput;
    const user = await authService.register(
      name,
      email,
      password,
      otp,
      role as RoleName | undefined,
    );
    sendCreated(res, user, "Đăng ký tài khoản thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await authService.login(email, password);
    sendSuccess(res, result, "Đăng nhập thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refresh = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body as RefreshInput;
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens, "Làm mới token thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    await authService.logout(req.user.userId);
    sendSuccess(res, null, "Đăng xuất thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const profile = await authService.getProfile(req.user.userId);
    sendSuccess(res, profile, "Lấy thông tin cá nhân thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const { name, phone } = req.body as UpdateProfileInput;
    const updated = await authService.updateProfile(req.user.userId, {
      name,
      phone: phone ?? undefined,
    });
    sendSuccess(res, updated, "Cập nhật thông tin thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Google Auth ─────────────────────────────────────────────────────────────
export const googleAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.body as { token: string };
    if (!token) throw new AppError("token là bắt buộc", 400);
    const result = await authService.googleLogin(token);
    sendSuccess(res, result, "Đăng nhập Google thành công");
  } catch (err) {
    next(err);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError("Chưa xác thực", 401);
    const { oldPassword, newPassword } = req.body as ChangePasswordInput;
    await authService.changePassword(req.user.userId, oldPassword, newPassword);
    sendSuccess(res, null, "Đổi mật khẩu thành công. Vui lòng đăng nhập lại");
  } catch (err) {
    next(err);
  }
};
