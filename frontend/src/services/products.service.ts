import { api } from '../lib/api';
import type { Product } from '../types';

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category?: string;
  imageUrl?: string;
  isActive?: boolean;
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function listProductsApi(): Promise<Product[]> {
  return api.get<Product[]>('/admin/products');
}

export async function createProductApi(payload: ProductPayload): Promise<Product> {
  return api.post<Product>('/admin/products', payload);
}

export async function updateProductApi(id: string, payload: Partial<ProductPayload>): Promise<Product> {
  return api.patch<Product>(`/admin/products/${id}`, payload);
}

export async function deleteProductApi(id: string): Promise<void> {
  return api.delete(`/admin/products/${id}`);
}

export async function adjustStockApi(id: string, delta: number): Promise<Product> {
  return api.patch<Product>(`/admin/products/${id}/stock`, { delta });
}

// ─── Profissional (leitura para alertas de estoque) ───────────────────────────
export async function listProfProductsApi(): Promise<Product[]> {
  return api.get<Product[]>('/professional/products');
}

// ─── Público (upsell no agendamento) ─────────────────────────────────────────
export async function listPublicProductsApi(slug: string): Promise<Product[]> {
  return api.get<Product[]>(`/public/${slug}/products`);
}
