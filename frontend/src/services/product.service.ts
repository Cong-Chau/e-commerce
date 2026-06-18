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

export interface ProductDetail extends ProductItem {
  description: string | null;
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

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category_id: number;
  images?: string[];
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
  category_id?: number;
}

export const productService = {
  async getMyProducts(params?: GetMyProductsParams) {
    const res = await api.get<GetMyProductsResponse>("/products/me", { params });
    return res.data;
  },

  async getProductById(id: number) {
    const res = await api.get<{ data: ProductDetail }>(`/products/${id}`);
    return res.data.data;
  },

  async updateProduct(id: number, payload: UpdateProductPayload) {
    const res = await api.patch<{ data: ProductDetail }>(`/products/${id}`, payload);
    return res.data.data;
  },

  async updateProductImages(id: number, images: string[]) {
    const res = await api.put<{ data: ProductImage[] }>(`/products/${id}/images`, { images });
    return res.data.data;
  },

  async toggleProductStatus(id: number) {
    const res = await api.patch<{ data: { id: number; status: ProductStatus } }>(
      `/products/${id}/toggle-status`,
    );
    return res.data.data;
  },

  async createProduct(payload: CreateProductPayload) {
    const res = await api.post<{ data: { id: number } }>("/products", payload);
    return res.data.data;
  },
};
