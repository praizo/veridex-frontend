import client from './client';

export interface DashboardStats {
  total_invoices: number;
  validated: number;
  signed: number;
  transmitted: number;
  customers: number;
  products: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  created_at: string;
  user: {
    name: string;
  };
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_activity: ActivityLog[];
}

export const dashboardApi = {
  get: () => client.get<{ data: DashboardResponse }>('/dashboard'),
  getHealth: () => client.get<{ status: string; latency?: string; error?: string }>('/dashboard/health'),
};
