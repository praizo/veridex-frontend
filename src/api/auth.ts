import client from './client';

export interface User {
  id: number;
  name: string;
  email: string;
  current_organization_id: number;
  current_organization?: {
    id: number;
    name: string;
    nrs_business_id: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (data: { email: string; password?: string }) => client.post<AuthResponse>('/login', data),
  register: (data: { name: string; email: string; organization_name: string; password?: string }) => client.post<AuthResponse>('/register', data),
  logout: () => client.post('/logout'),
  me: () => client.get<User>('/me'),
};
