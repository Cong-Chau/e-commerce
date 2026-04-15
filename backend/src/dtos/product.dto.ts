import { z } from "zod";

export const CreateProductDto = z.object({
  name: z.string().min(2, "Tên sản phẩm tối thiểu 2 ký tự").max(255),
  description: z.string().optional(),
  price: z.number().positive("Giá phải lớn hơn 0"),
  stock: z.number().int().min(0, "Số lượng không âm").default(0),
  category_id: z.number().int().positive("category_id không hợp lệ"),
  images: z.array(z.url("URL ảnh không hợp lệ")).optional(),
});

export const UpdateProductImagesDto = z.object({
  images: z.array(z.url("URL ảnh không hợp lệ")).min(1, "Cần ít nhất 1 ảnh"),
});

export const MyProductsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(["ACTIVE", "INACTIVE", "DELETED"]).optional(),
  category_id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
});

export type UpdateProductImagesInput = z.infer<typeof UpdateProductImagesDto>;
export type CreateProductInput = z.infer<typeof CreateProductDto>;
export type MyProductsQuery = z.infer<typeof MyProductsQueryDto>;
