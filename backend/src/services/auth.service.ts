import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import prisma from "../config/prisma";
import config from "../config/env";
import { AppError } from "../middlewares/error.middleware";
import type { UpdateProfileInput } from "../dtos/auth.dto";
import { RoleName } from "@prisma/client";

export interface JwtPayload {
  userId: number;
  email: string;
  roles: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

// ─── AuthService ──────────────────────────────────────────────────────────────

export class AuthService {
  // ─── Register ────────────────────────────────────────────────
  async register(
    name: string,
    email: string,
    password: string,
    role: RoleName = RoleName.CUSTOMER,
  ) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Email đã được sử dụng", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: { name, email },
      });

      await tx.account.create({
        data: {
          user_id: newUser.id,
          username: email,
          password: hashedPassword,
          provider: "LOCAL",
          is_verified: false,
        },
      });

      // Gán role cho user
      const roleRecord = await tx.role.findUnique({ where: { name: role } });
      if (roleRecord) {
        await tx.userRole.create({
          data: { user_id: newUser.id, role_id: roleRecord.id },
        });
      }

      return newUser;
    });

    return { id: user.id, name: user.name, email: user.email };
  }

  // ─── Login ───────────────────────────────────────────────────
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: { where: { provider: "LOCAL" } },
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.accounts.length === 0) {
      throw new AppError("Email hoặc mật khẩu không đúng", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Tài khoản đã bị khoá", 403);
    }

    const account = user.accounts[0];
    const isMatch = await bcrypt.compare(password, account.password ?? "");
    if (!isMatch) {
      throw new AppError("Email hoặc mật khẩu không đúng", 401);
    }

    const roles = user.userRoles.map((ur: any) => ur.role.name as string);
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      roles,
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + config.refreshToken.expiresInMs);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        refresh_token: refreshToken,
        refresh_token_expires_at: expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, roles },
    };
  }

  // ─── Refresh Token ───────────────────────────────────────────
  async refresh(token: string) {
    const account = await prisma.account.findUnique({
      where: { refresh_token: token },
      include: {
        user: { include: { userRoles: { include: { role: true } } } },
      },
    });

    if (
      !account ||
      !account.refresh_token_expires_at ||
      account.refresh_token_expires_at < new Date()
    ) {
      throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401);
    }

    if (account.user.status !== "ACTIVE") {
      throw new AppError("Tài khoản đã bị khoá", 403);
    }

    const roles = account.user.userRoles.map(
      (ur: any) => ur.role.name as string,
    );
    const newAccessToken = signAccessToken({
      userId: account.user.id,
      email: account.user.email,
      roles,
    });

    // Xoay refresh token mới (rotation)
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + config.refreshToken.expiresInMs);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        refresh_token: newRefreshToken,
        refresh_token_expires_at: expiresAt,
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ─── Logout ──────────────────────────────────────────────────
  async logout(userId: number) {
    // Clear refresh tokens across all providers for this user
    await prisma.account.updateMany({
      where: { user_id: userId },
      data: {
        refresh_token: null,
        refresh_token_expires_at: null,
      },
    });
  }

  // ─── Google Login ─────────────────────────────────────────────
  async googleLogin(idToken: string) {
    if (!config.google.clientId) {
      throw new AppError("Google OAuth chưa được cấu hình", 500);
    }

    // 1. Verify ID token with Google
    const client = new OAuth2Client(config.google.clientId);
    let payload: TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError("Token Google không hợp lệ", 401);
    }

    if (!payload?.email) {
      throw new AppError("Không lấy được thông tin từ Google", 401);
    }

    const { sub: providerId, email, name } = payload;

    // 2. Find or create user + Google account (transactional)
    const { userId, googleAccountId } = await prisma.$transaction(async (tx: any) => {
      // Already linked a Google account with this Google sub?
      const existingGoogleAccount = await tx.account.findFirst({
        where: { provider: "GOOGLE", provider_id: providerId },
      });

      if (existingGoogleAccount) {
        return {
          userId: existingGoogleAccount.user_id as number,
          googleAccountId: existingGoogleAccount.id as number,
        };
      }

      // Check user by email (could be an existing LOCAL user)
      let uid: number;
      const existingUser = await tx.user.findUnique({ where: { email } });

      if (existingUser) {
        uid = existingUser.id;
      } else {
        // Create new user
        const newUser = await tx.user.create({
          data: { name: name ?? email, email },
        });
        uid = newUser.id;

        // Assign default CUSTOMER role
        const customerRole = await tx.role.findUnique({
          where: { name: RoleName.CUSTOMER },
        });
        if (customerRole) {
          await tx.userRole.create({
            data: { user_id: uid, role_id: customerRole.id },
          });
        }
      }

      // Link Google account to the user
      const googleAccount = await tx.account.create({
        data: {
          user_id: uid,
          provider: "GOOGLE",
          provider_id: providerId,
          is_verified: true,
        },
      });

      return { userId: uid, googleAccountId: googleAccount.id as number };
    });

    // 3. Load user with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) throw new AppError("Không thể xác thực người dùng", 500);
    if (user.status !== "ACTIVE") throw new AppError("Tài khoản đã bị khoá", 403);

    // 4. Issue JWT + refresh token
    const roles = user.userRoles.map((ur: any) => ur.role.name as string);
    const accessToken = signAccessToken({ userId: user.id, email: user.email, roles });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + config.refreshToken.expiresInMs);

    await prisma.account.update({
      where: { id: googleAccountId },
      data: { refresh_token: refreshToken, refresh_token_expires_at: expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, roles },
    };
  }

  // ─── Get Profile ─────────────────────────────────────────────
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        sellerProfile: true,
      },
    });

    if (!user) throw new AppError("Người dùng không tồn tại", 404);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.userRoles.map((ur: any) => ur.role.name),
      sellerProfile: user.sellerProfile,
    };
  }

  // ─── Update Profile ──────────────────────────────────────────
  async updateProfile(
    userId: number,
    data: Pick<UpdateProfileInput, "name"> & { phone?: string },
  ) {
    if (!data.name && !data.phone) {
      throw new AppError("Không có thông tin nào được cập nhật", 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }

  // ─── Change Password ─────────────────────────────────────────
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const account = await prisma.account.findFirst({
      where: { user_id: userId, provider: "LOCAL" },
    });

    if (!account || !account.password) {
      throw new AppError("Tài khoản không hỗ trợ đổi mật khẩu", 400);
    }

    const isMatch = await bcrypt.compare(oldPassword, account.password);
    if (!isMatch) {
      throw new AppError("Mật khẩu hiện tại không đúng", 401);
    }

    if (oldPassword === newPassword) {
      throw new AppError("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashed,
        // Huỷ tất cả refresh token sau khi đổi mật khẩu
        refresh_token: null,
        refresh_token_expires_at: null,
      },
    });
  }

  // ─── Verify JWT ──────────────────────────────────────────────
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch {
      throw new AppError("Token không hợp lệ hoặc đã hết hạn", 401);
    }
  }
}

export default new AuthService();
