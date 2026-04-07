import { api } from '@/lib/api';
import type { ServiceCategory } from '@/types';

export async function listServiceCategoriesApi(): Promise<ServiceCategory[]> {
  return api.get<ServiceCategory[]>('/admin/service-categories');
}

export async function createServiceCategoryApi(name: string): Promise<ServiceCategory> {
  return api.post<ServiceCategory>('/admin/service-categories', { name });
}

export async function deleteServiceCategoryApi(id: string): Promise<void> {
  await api.delete(`/admin/service-categories/${id}`);
}
