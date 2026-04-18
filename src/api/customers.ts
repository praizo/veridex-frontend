import client from './client';

export interface Customer {
  id: number;
  name: string;
  tin: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country_code?: string;
}

export interface CustomerPayload {
  name: string;
  tin: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country_code?: string;
}

export interface CustomerListParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export const customerApi = {
  list: (params?: CustomerListParams) => client.get('/customers', { params }),
  get: (id: number) => client.get(`/customers/${id}`),
  create: (data: CustomerPayload) => client.post('/customers', data),
  update: (id: number, data: CustomerPayload) => client.put(`/customers/${id}`, data),
  delete: (id: number) => client.delete(`/customers/${id}`),
};
