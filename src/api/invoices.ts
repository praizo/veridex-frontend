import client from './client';

export interface InvoiceLine {
  line_id: string;
  item_name: string;
  item_description: string;
  hsn_code: string;
  product_category: string;
  invoiced_quantity: number;
  price_amount: number;
  base_quantity: number;
  price_unit: string;
  line_extension_amount: number;
  tax_category_id?: string;
  tax_percent: number;
}

export interface InvoicePayload {
  customer_id: number;
  invoice_number: string;
  invoice_type_code: string;
  issue_date: string;
  due_date?: string;
  document_currency_code: string;
  legal_monetary_total: {
    line_extension_amount: number;
    tax_exclusive_amount: number;
    tax_inclusive_amount: number;
    payable_amount: number;
  };
  lines: InvoiceLine[];
  tax_totals?: {
    tax_amount: number;
    taxable_amount: number;
    subtotal_tax_amount: number;
    tax_category_id: string;
    tax_percent: number;
  }[];
  payment_means?: {
    payment_means_code: string;
    payment_due_date?: string;
  }[];
}

export interface InvoiceListParams {
  page?: number;
  per_page?: number;
  status?: string;
}

export const invoiceApi = {
  list: (params?: InvoiceListParams) => client.get('/invoices', { params }),
  get: (id: number) => client.get(`/invoices/${id}`),
  create: (data: InvoicePayload) => client.post('/invoices', data),
  
  // NRS specific actions
  validate: (id: number) => client.post(`/invoices/${id}/validate`),
  sign: (id: number) => client.post(`/invoices/${id}/sign`),
  transmit: (id: number) => client.post(`/invoices/${id}/transmit`),
  downloadPdf: (id: number) => client.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  updatePayment: (id: number, status: string) => client.patch(`/invoices/${id}/payment`, { payment_status: status }),
};
