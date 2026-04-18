import client from './client';

export interface ActivityLog {
  id: number;
  action: string;
  description: string;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const activityLogApi = {
  get: (page = 1) => client.get<PaginatedResponse<ActivityLog>>('/activity-logs', { params: { page } }),
};
