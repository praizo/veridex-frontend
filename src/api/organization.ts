import api from './client';

export interface Organization {
  id: number;
  name: string;
  tin: string;
  email: string | null;
  telephone: string | null;
  street_name: string | null;
  city_name: string | null;
  postal_zone: string | null;
  country_code: string;
  business_description: string | null;
  service_id: string | null;
  nrs_business_id: string | null;
  created_at: string;
}

export const organizationApi = {
  getCurrent: () => api.get<Organization>('/organization/current'),
  update: (data: Partial<Organization>) => api.put<Organization>(`/organizations/${data.id}`, data),
  switch: (organizationId: number) => api.post('/organizations/switch', { organization_id: organizationId }),
};
