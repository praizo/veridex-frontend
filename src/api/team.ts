import api from './client';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
}

export const teamApi = {
  list: () => api.get<{ data: TeamMember[] }>('/team/members'),
  add: (data: { email: string; role: string }) => api.post('/team/members', data),
  updateRole: (userId: number, role: string) => api.put(`/team/members/${userId}`, { role }),
  remove: (userId: number) => api.delete(`/team/members/${userId}`),
};
