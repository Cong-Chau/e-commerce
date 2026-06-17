import { Response, NextFunction } from "express";
import { RoleName } from "@prisma/client";
import { AuthRequest } from "../middlewares/auth.middleware";
import authService from "../services/auth.service";
import { sendSuccess, sendCreated } from "../utils/response.util";
import { AppError } from "../middlewares/error.middleware";
import config from "../config/env";
import type {
  SendOtpInput,
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
} from "../dtos/auth.dto";

const REFRESH_TOKEN_PATH = "/api/v1/auth";

// ─── Cookie helpers ─────────────────────────────────────────────────────────
function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.jwt.expiresInMs,
    path: "/",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.refreshToken.expiresInMs,
    path: REFRESH_TOKEN_PATH,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: REFRESH_TOKEN_PATH });
}

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
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user }, "Đăng nhập thành công");
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
    const token = req.cookies?.refreshToken;
    if (!token) throw new AppError("Không có refresh token", 401);

    const tokens = await authService.refresh(token);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, null, "Làm mới token thành công");
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
    clearAuthCookies(res);
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
    const { token, role } = req.body as { token: string; role?: string };
    if (!token) throw new AppError("token là bắt buộc", 400);
    const result = await authService.googleLogin(token, role);
    if ("needsRole" in result) {
      sendSuccess(res, { needsRole: true }, "Cần chọn vai trò");
      return;
    }
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user }, "Đăng nhập Google thành công");
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
