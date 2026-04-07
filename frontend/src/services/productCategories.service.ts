import { api } from '@/lib/api';
import type { ProductCategory } from '@/types';

export async function listCategoriesApi(): Promise<ProductCategory[]> {
  return api.get<ProductCategory[]>('/admin/product-categories');
}

export async function createCategoryApi(name: string): Promise<ProductCategory> {
  return api.post<ProductCategory>('/admin/product-categories', { name });
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await api.delete(`/admin/product-categories/${id}`);
}
