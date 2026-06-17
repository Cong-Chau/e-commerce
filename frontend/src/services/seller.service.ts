import api from './api';
import type { SellerProfile } from '../types/auth';

export type ShippingMethod = 'FAST' | 'EXPRESS' | 'SAME_DAY';

export interface CreateSellerProfilePayload {
  shop_name: string;
  shop_logo?: string;
  shop_description?: string;
  pickup_address?: string;
  owner_name?: string;
  owner_phone?: string;
  shippings: ShippingMethod[];
  category_ids: number[];
}

export const sellerService = {
  async createProfile(payload: CreateSellerProfilePayload): Promise<SellerProfile> {
    const res = await api.post<{ data: SellerProfile }>('/sellers/me/profile', payload);
    return res.data.data;
  },

  async getMyCategories(): Promise<{ id: number; name: string }[]> {
    const res = await api.get<{ data: { id: number; name: string }[] }>('/sellers/me/categories');
    return res.data.data;
  },

  async suggestDescription(shopName: string, categories?: string[]): Promise<string> {
    const res = await api.post<{ data: { description: string } }>(
      '/ai/suggest-description',
      { shop_name: shopName, categories },
    );
    return res.data.data.description;
  },
};
