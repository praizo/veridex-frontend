import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Save, ArrowLeft, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resourceApi } from "@/api/resources";
import type { HsCode } from "@/api/resources";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { customerApi } from '@/api/customers';
import type { Customer } from '@/api/customers';
import { invoiceApi } from '@/api/invoices';
import { useQuery } from '@tanstack/react-query';
import { CustomerCreateDialog } from '../customers/components/CustomerCreateDialog';
import { toast } from 'sonner';

const invoiceLineSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  item_description: z.string().min(1, 'Description is required'),
  hsn_code: z.string().min(1, 'HSN code is required'),
  product_category: z.string().min(1, 'Category is required'),
  invoiced_quantity: z.number().min(0.0001, 'Quantity must be > 0'),
  price_amount: z.number().min(0, 'Price must be >= 0'),
  base_quantity: z.number().min(1),
  price_unit: z.string().min(1),
  tax_category_id: z.string().min(1, 'Tax category is required'),
  tax_percent: z.number(),
});

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_type_code: z.string().min(1, 'Invoice type is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().optional(),
  document_currency_code: z.string().min(1),
  payment_means_code: z.string().min(1, 'Payment method is required'),
  invoice_lines: z.array(invoiceLineSchema).min(1, 'At least one line item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

function HsnCombobox({ value, onSelect, hsCodes }: { value?: string; onSelect: (code: HsCode) => void; hsCodes: HsCode[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const codes = useMemo(() => {
    if (!Array.isArray(hsCodes)) return [];
    
    const searchLow = search.toLowerCase().trim();
    if (!searchLow) return hsCodes.slice(0, 100);
    
    return hsCodes
      .filter(c => 
        c.hscode.toLowerCase().includes(searchLow) || 
        c.value.toLowerCase().includes(searchLow)
      )
      .slice(0, 100);
  }, [hsCodes, search]);

  const selected = useMemo(() => {
    return Array.isArray(hsCodes) ? hsCodes.find((c) => c?.hscode === value) : null;
  }, [hsCodes, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-2 text-xs h-9 overflow-hidden"
        >
          {selected ? (
            <span className="truncate">{selected.hscode} - {selected.value}</span>
          ) : (
            "Select HSN..."
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-75 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search HS Code or Category..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
              <CommandEmpty>No HSN code found.</CommandEmpty>
              <CommandGroup>
                {codes?.map((code) => (
                  <CommandItem
                    key={code.hscode}
                    value={`${code.hscode} ${code.value}`}
                    onSelect={() => {
                      onSelect(code);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === code.hscode ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col text-left">
                        <span className="font-mono text-sm">{code.hscode}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{code.value}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch customers for selection
  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.list().then(res => res.data),
  });

  // Fetch FIRS HS Codes
  const { data: hsCodesData } = useQuery({
    queryKey: ['firs-hs-codes'],
    queryFn: () => resourceApi.hsCodes().then(res => res.data),
    staleTime: 86400000 // 24 hours
  });

  const { data: invoiceTypesData } = useQuery({
    queryKey: ['firs-invoice-types'],
    queryFn: () => resourceApi.invoiceTypes().then(res => res.data),
    staleTime: 86400000
  });

  const { data: taxCategoriesData } = useQuery({
    queryKey: ['firs-tax-categories'],
    queryFn: () => resourceApi.taxCategories().then(res => res.data),
    staleTime: 86400000
  });

  const { data: currenciesData } = useQuery({
    queryKey: ['firs-currencies'],
    queryFn: () => resourceApi.currencies().then(res => res.data),
    staleTime: 86400000
  });

  const { data: paymentMeansData } = useQuery({
    queryKey: ['firs-payment-means'],
    queryFn: () => resourceApi.paymentMeans().then(res => res.data),
    staleTime: 86400000
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      issue_date: new Date().toISOString().split('T')[0],
      document_currency_code: 'NGN',
      invoice_type_code: '380',
      payment_means_code: '30',
      invoice_lines: [
        {
          item_name: '',
          item_description: '',
          hsn_code: '',
          product_category: '',
          invoiced_quantity: 1,
          price_amount: 0,
          base_quantity: 1,
          price_unit: 'UNIT',
          tax_category_id: 'STANDARD_VAT',
          tax_percent: 7.5,
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invoice_lines'
  });

  const watchedLines = watch('invoice_lines');

  // Calculate totals
  const subtotal = (watchedLines || []).reduce((acc, line) => {
      const qty = typeof line.invoiced_quantity === 'number' ? line.invoiced_quantity : 0;
      const price = typeof line.price_amount === 'number' ? line.price_amount : 0;
      return acc + (qty * price);
  }, 0);
  
  const taxTotal = (watchedLines || []).reduce((acc, line) => {
    const qty = typeof line.invoiced_quantity === 'number' ? line.invoiced_quantity : 0;
    const price = typeof line.price_amount === 'number' ? line.price_amount : 0;
    const tax = typeof line.tax_percent === 'number' ? line.tax_percent : 7.5;
    const lineTotal = qty * price;
    return acc + (lineTotal * (tax / 100));
  }, 0);
  const grandTotal = subtotal + taxTotal;

  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSaving(true);
    try {
      const { invoice_lines, ...rest } = data;
      const payload = {
        ...rest,
        customer_id: parseInt(data.customer_id),
        legal_monetary_total: {
          line_extension_amount: subtotal,
          tax_exclusive_amount: subtotal,
          tax_inclusive_amount: grandTotal,
          payable_amount: grandTotal,
        },
        lines: invoice_lines.map((line, index) => ({
          ...line,
          line_id: (index + 1).toString(),
          line_extension_amount: line.invoiced_quantity * line.price_amount
        })),
        tax_totals: [{
           tax_amount: taxTotal,
           taxable_amount: subtotal,
           subtotal_tax_amount: taxTotal,
           tax_category_id: 'S',
           tax_percent: 7.5
        }]
      };

      const res = await invoiceApi.create(payload);
      const invoiceId = (res as { data: { data: { id: number } } }).data.data.id;
      
      toast.success("Invoice created", { 
        description: "Your draft has been saved. You can now validate and sign it." 
      });
      
      navigate(`/invoices/${invoiceId}`);
    } catch (error: unknown) {
      console.error('Failed to save invoice', error);
      toast.error("Creation failed", { 
        description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || "Please check the form for errors."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
          <p className="text-muted-foreground">Drafting a new official NRS submission.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number">Invoice Reference</Label>
                  <Input id="invoice_number" {...register('invoice_number')} />
                  {errors.invoice_number && <p className="text-xs text-destructive">{errors.invoice_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input id="issue_date" type="date" {...register('issue_date')} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Customer</Label>
                    <CustomerCreateDialog onSuccess={(id) => setValue('customer_id', id.toString())}>
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary hover:bg-primary/10">
                            <Plus className="h-3 w-3 mr-1" /> Add New
                        </Button>
                    </CustomerCreateDialog>
                </div>
                <Select 
                    value={watch('customer_id')} 
                    onValueChange={(val) => setValue('customer_id', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(customersData?.data || []).map((c: Customer) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="invoice_type_code">Invoice Type (NRS)</Label>
                  <Select 
                    value={watch('invoice_type_code')} 
                    onValueChange={(val) => setValue('invoice_type_code', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(invoiceTypesData?.data || []).map((t) => (
                        <SelectItem key={t.code} value={t.code}>{t.value} ({t.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select 
                    value={watch('payment_means_code')} 
                    onValueChange={(val) => setValue('payment_means_code', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {(paymentMeansData?.data || []).map((m) => (
                        <SelectItem key={m.code} value={m.code}>{m.value} ({m.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={watch('document_currency_code')} 
                    onValueChange={(val) => setValue('document_currency_code', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currenciesData?.data || []).map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.value} ({c.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add products or services to this invoice.</CardDescription>
            </div>
            <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => append({
                    item_name: '',
                    item_description: '',
                    hsn_code: '',
                    product_category: '',
                    invoiced_quantity: 1,
                    price_amount: 0,
                    base_quantity: 1,
                    price_unit: 'UNIT',
                    tax_category_id: 'STANDARD_VAT',
                    tax_percent: 7.5,
                })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-6 rounded-xl border bg-card/50 shadow-sm relative group hover:bg-card transition-colors">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-background border shadow-sm text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Identity (High Focus) */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Item & Description</Label>
                                <Input placeholder="Item name (e.g. Consultation)" {...register(`invoice_lines.${index}.item_name`)} className="font-medium" />
                                <Input placeholder="Detailed description..." className="text-xs" {...register(`invoice_lines.${index}.item_description`)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">HSN / Category</Label>
                                <HsnCombobox 
                                    value={watchedLines?.[index]?.hsn_code} 
                                    hsCodes={hsCodesData?.data || []}
                                    onSelect={(code) => {
                                        setValue(`invoice_lines.${index}.hsn_code`, code.hscode, { shouldValidate: true });
                                        setValue(`invoice_lines.${index}.product_category`, code.value, { shouldValidate: true });
                                    }}
                                />
                                <Input placeholder="Category" className="text-xs" {...register(`invoice_lines.${index}.product_category`)} />
                            </div>
                        </div>

                        {/* Column 2: Calculations & Compliance */}
                        <div className="space-y-4 border-l md:pl-8">
                            {/* Row 1: Volume & Tax */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Quantity</Label>
                                    <Input 
                                        type="number" 
                                        {...register(`invoice_lines.${index}.invoiced_quantity`, { valueAsNumber: true })} 
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tax Type</Label>
                                    <Select 
                                        value={watchedLines?.[index]?.tax_category_id || 'STANDARD_VAT'} 
                                        onValueChange={(val) => {
                                            const cat = (taxCategoriesData?.data || []).find(c => c.code === val);
                                            setValue(`invoice_lines.${index}.tax_category_id`, val, { shouldValidate: true });
                                            if (cat) {
                                                const p = parseFloat(cat.percent);
                                                setValue(`invoice_lines.${index}.tax_percent`, isNaN(p) ? 0 : p);
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="text-xs h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(taxCategoriesData?.data || []).map((cat) => (
                                                <SelectItem key={cat.code} value={cat.code}>
                                                    {cat.value} ({cat.percent}%)
                                                </SelectItem>
                                            ))}
                                            {(!taxCategoriesData?.data && !isSaving) && (
                                                <div className="p-2 text-xs text-muted-foreground italic">Fetching FIRS resources...</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {/* Row 2: Price & Result */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Unit Price (₦)</Label>
                                    <Input 
                                        type="number" 
                                        {...register(`invoice_lines.${index}.price_amount`, { valueAsNumber: true })} 
                                        className="h-10 font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Line Total (Excl. Tax)</Label>
                                    <div className="h-10 flex items-center px-3 rounded-md bg-primary/5 text-primary text-sm font-bold font-mono border border-primary/20">
                                      ₦{( (watchedLines?.[index]?.invoiced_quantity || 0) * (watchedLines?.[index]?.price_amount || 0) ).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="w-full max-w-sm space-y-2 p-4 rounded-lg bg-muted/50 border">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT (7.5%)</span>
                    <span>₦{taxTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <span>Total Payable</span>
                    <span className="text-primary">₦{grandTotal.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" type="button" onClick={() => navigate('/invoices')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Draft...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Create Invoice & Continue
                        </>
                    )}
                </Button>
            </div>
        </div>
      </form>
    </div>
  );
}
