import api from "./api";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export interface GetMyProductsParams {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  category_id?: number;
  search?: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductItem {
  id: number;
  name: string;
  price: string;
  stock: number;
  status: ProductStatus;
  created_at: string;
  category: ProductCategory;
  images: ProductImage[];
  _count: {
    reviews: number;
    orderItems: number;
  };
}

export interface GetMyProductsResponse {
  success: boolean;
  message: string;
  items: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productService = {
  async getMyProducts(params?: GetMyProductsParams) {
    const res = await api.get<GetMyProductsResponse>("/products/me", {
      params,
    });
    return res.data;
  },
};
