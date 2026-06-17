import api from './api';

export interface CategoryItem {
  id: number;
  name: string;
  parent_id: number | null;
  children?: CategoryItem[];
}

export const categoryService = {
  async getAll(): Promise<CategoryItem[]> {
    const res = await api.get<{ data: CategoryItem[] }>('/categories');
    return res.data.data;
  },
};
