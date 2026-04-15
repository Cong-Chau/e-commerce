import { z } from 'zod';

export const CreateCategoryDto = z.object({
  name: z
    .string()
    .min(2, 'Tên danh mục phải có ít nhất 2 ký tự')
    .max(100, 'Tên danh mục không được vượt quá 100 ký tự'),
  parent_id: z.number().int().positive('parent_id phải là số nguyên dương').nullable().optional(),
});

export const UpdateCategoryDto = z.object({
  name: z
    .string()
    .min(2, 'Tên danh mục phải có ít nhất 2 ký tự')
    .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
    .optional(),
  parent_id: z.number().int().positive('parent_id phải là số nguyên dương').nullable().optional(),
}).refine((data) => data.name !== undefined || data.parent_id !== undefined, {
  message: 'Vui lòng cung cấp ít nhất name hoặc parent_id',
});

export type CreateCategoryInput = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryDto>;
