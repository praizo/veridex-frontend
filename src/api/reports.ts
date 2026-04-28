import client from './client';

export const reportApi = {
  exportInvoicesCsv: (params?: Record<string, unknown>) => client.get('/reports/invoices/csv', { params, responseType: 'blob' }),
  getB2cSummary: () => client.get('/reports/b2c/summary'),
};
