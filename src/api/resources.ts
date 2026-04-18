import client from './client';

export interface HsCode {
  hscode: string;
  value: string;
  category?: string;
}

export interface Currency {
  code: string;
  value: string;
}

export interface TaxCategory {
  code: string;
  value: string;
  percent: string;
}

export interface InvoiceType {
  code: string;
  value: string;
}

export interface PaymentMeans {
  code: string;
  value: string;
}

export interface ServiceCode {
  code: string;
  value: string;
}

export interface VatExemption {
  code: string;
  value: string;
}

export const resourceApi = {
  hsCodes: () => client.get<{ data: HsCode[] }>('/resources/hs-codes'),
  currencies: () => client.get<{ data: Currency[] }>('/resources/currencies'),
  taxCategories: () => client.get<{ data: TaxCategory[] }>('/resources/tax-categories'),
  invoiceTypes: () => client.get<{ data: InvoiceType[] }>('/resources/invoice-types'),
  paymentMeans: () => client.get<{ data: PaymentMeans[] }>('/resources/payment-means'),
  serviceCodes: () => client.get<{ data: ServiceCode[] }>('/resources/service-codes'),
  vatExemptions: () => client.get<{ data: VatExemption[] }>('/resources/vat-exemptions'),
};
