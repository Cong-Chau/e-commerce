import { z } from 'zod';

// ─── Register ─────────────────────────────────────────────────────────────────
export const RegisterDto = z.object({
  name: z
    .string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không được vượt quá 100 ký tự'),
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const LoginDto = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const RefreshDto = z.object({
  refreshToken: z.string().min(1, 'refreshToken không hợp lệ'),
});

// ─── Update Profile ───────────────────────────────────────────────────────────
export const UpdateProfileDto = z
  .object({
    name: z
      .string()
      .min(2, 'Tên phải có ít nhất 2 ký tự')
      .max(100, 'Tên không được vượt quá 100 ký tự')
      .optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{9,15}$/, 'Số điện thoại không hợp lệ')
      .nullable()
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.phone !== undefined, {
    message: 'Vui lòng cung cấp ít nhất name hoặc phone',
  });

// ─── Change Password ──────────────────────────────────────────────────────────
export const ChangePasswordDto = z
  .object({
    oldPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  });

// ─── Inferred Types ───────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
export type RefreshInput = z.infer<typeof RefreshDto>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordDto>;
