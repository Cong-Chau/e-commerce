import { z } from "zod";

export const CreateSellerProfileDto = z.object({
  shop_name: z.string().trim().min(2, "Tên shop tối thiểu 2 ký tự").max(255),
  shop_logo: z.url("URL logo không hợp lệ").optional(),
  shop_description: z.string().trim().max(1000).optional(),
  pickup_address: z.string().trim().max(500).optional(),
  owner_name: z.string().trim().max(255).optional(),
  owner_phone: z.string().trim().max(20).optional(),
  shippings: z
    .array(z.enum(["FAST", "EXPRESS", "SAME_DAY"]))
    .refine((items) => new Set(items).size === items.length, {
      message: "Phương thức vận chuyển bị trùng",
    })
    .default([]),
  category_ids: z
    .array(z.number().int().positive())
    .refine((items) => new Set(items).size === items.length, {
      message: "Danh mục bị trùng",
    })
    .default([]),
});

export type CreateSellerProfileInput = z.infer<typeof CreateSellerProfileDto>;
