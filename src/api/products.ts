import client from './client';

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  unit: string;
  hsn_code: string;
  product_category: string;
}

export interface ProductPayload {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  unit: string;
  hsn_code: string;
  product_category: string;
}

export const productApi = {
  list: (params?: any) => client.get('/products', { params }),
  get: (id: number) => client.get(`/products/${id}`),
  create: (data: ProductPayload) => client.post('/products', data),
  update: (id: number, data: ProductPayload) => client.put(`/products/${id}`, data),
  delete: (id: number) => client.delete(`/products/${id}`),
};
