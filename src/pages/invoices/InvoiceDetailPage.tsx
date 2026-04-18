import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ArrowLeft, 
    CheckCircle2, 
    Printer, 
    ShieldCheck, 
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { invoiceApi } from '@/api/invoices';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.get(Number(id)).then(res => res.data),
  });

  const invoice = response?.data;

  // NRS Mutations
  const validateMutation = useMutation({
    mutationFn: () => invoiceApi.validate(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success("NRS Validation Passed", { description: "You can now proceed to sign the invoice." });
    },
    onError: (err: any) => {
      toast.error("NRS Validation Failed", { description: err.response?.data?.message || "Check invoice data and try again." });
    },
    onSettled: () => setActiveAction(null)
  });

  const signMutation = useMutation({
    mutationFn: () => invoiceApi.sign(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success("Invoice Signed & Submitted", { description: "An IRN has been generated and the invoice has been transmitted." });
    },
    onError: (err: any) => {
      toast.error("Signing Failed", { description: err.response?.data?.message || "NRS rejected the signing request." });
    },
    onSettled: () => setActiveAction(null)
  });

  const transmitMutation = useMutation({
    mutationFn: () => invoiceApi.transmit(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success("Invoice Transmitted", { description: "The official invoice has been delivered to the customer via NRS." });
    },
    onError: (err: any) => {
      toast.error("Transmission Failed", { description: err.response?.data?.message || "NRS could not deliver the invoice." });
    },
    onSettled: () => setActiveAction(null)
  });

  const paymentMutation = useMutation({
    mutationFn: (status: string) => invoiceApi.updatePayment(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success("Payment Updated", { description: "The invoice payment status has been modified." });
    },
    onError: () => toast.error("Update Failed")
  });

  const handleDownloadPdf = async () => {
    try {
        setActiveAction('download');
        const response = await invoiceApi.downloadPdf(Number(id));
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (err: any) {
        toast.error("Download Failed", { description: "Could not generate the official PDF." });
    } finally {
        setActiveAction(null);
    }
  };

  const handleAction = (action: string, mutation: any) => {
    setActiveAction(action);
    mutation.mutate();
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!invoice) return <div className="p-8">Invoice not found.</div>;

  const isDraft = ['draft', 'validation_failed'].includes(invoice.status);
  const isValidated = ['validated', 'sign_failed'].includes(invoice.status);
  const isSigned = ['signed', 'transmitted', 'confirmed', 'transmit_failed'].includes(invoice.status);
  const isTransmitted = ['transmitted', 'confirmed'].includes(invoice.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{invoice.invoice_number}</h2>
                <Badge variant={isSigned ? "default" : "secondary"}>
                    {invoice.status.toUpperCase()}
                </Badge>
            </div>
            <p className="text-muted-foreground">Internal Tracking ID: #{invoice.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadPdf}
                disabled={activeAction === 'download'}
            >
                {activeAction === 'download' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />} 
                {activeAction === 'download' ? 'Generating...' : 'Print PDF'}
            </Button>
            {isDraft && (
                <Button 
                    variant="secondary" 
                    size="sm"
                    disabled={!!activeAction}
                    onClick={() => handleAction('validate', validateMutation)}
                >
                    {activeAction === 'validate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Step 1: Validate
                </Button>
            )}
            {isValidated && (
                <Button 
                    size="sm"
                    disabled={!!activeAction}
                    onClick={() => handleAction('sign', signMutation)}
                >
                    {activeAction === 'sign' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Step 2: Sign & Official Submission
                </Button>
            )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-blue-900/5">
          <div className="bg-slate-50 border-b px-8 py-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                 <span className="text-sm font-medium tracking-tight text-slate-500 uppercase">Live Document Preview</span>
             </div>
             <p className="text-xs text-slate-400 font-mono">ID: {invoice.id}</p>
          </div>
          
          <div className="p-8 md:p-12 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-4">From (Supplier)</p>
                    <p className="font-extrabold text-2xl tracking-tight text-slate-900">{invoice.organization?.name}</p>
                    <p className="text-sm text-slate-500 font-medium">TIN: {invoice.organization?.tin || 'N/A'}</p>
                </div>
                <div className="md:text-right space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Billed To (Customer)</p>
                    <p className="font-extrabold text-2xl tracking-tight text-slate-900">{invoice.customer?.name}</p>
                    <p className="text-sm text-slate-500 font-medium">TIN: {invoice.customer?.tin || 'N/A'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-50/80 border border-slate-100">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Issue Date</p>
                    <p className="font-semibold text-slate-800">{invoice.issue_date}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Due Date</p>
                    <p className="font-semibold text-slate-800">{invoice.due_date || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Type</p>
                    <p className="font-semibold text-slate-800">{invoice.invoice_type_code}</p>
                </div>
                {invoice.irn && (
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> FIRS IRN
                        </p>
                        <p className="font-mono text-xs font-bold text-slate-700 truncate" title={invoice.irn}>{invoice.irn.substring(0,18)}...</p>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <Table className="[&_tr]:border-b-slate-100">
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-slate-500 text-xs tracking-wider uppercase font-bold">Item Description</TableHead>
                            <TableHead className="text-right text-slate-500 text-xs tracking-wider uppercase font-bold">Qty</TableHead>
                            <TableHead className="text-right text-slate-500 text-xs tracking-wider uppercase font-bold">Price</TableHead>
                            <TableHead className="text-right text-slate-500 text-xs tracking-wider uppercase font-bold">Tax</TableHead>
                            <TableHead className="text-right text-slate-500 text-xs tracking-wider uppercase font-bold">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.lines?.map((line: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-5">
                                    <p className="font-bold text-slate-800">{line.item_name}</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-50 truncate">{line.item_description}</p>
                                </TableCell>
                                <TableCell className="text-right font-medium text-slate-600">{line.invoiced_quantity}</TableCell>
                                <TableCell className="text-right font-medium text-slate-600">₦{Number(line.price_amount).toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 uppercase font-bold">
                                        {line.tax_category_id || 'VAT'} <span className="ml-1 opacity-50">{line.tax_percent}%</span>
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-slate-800">₦{Number(line.line_extension_amount).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
                <div className="w-full max-w-sm space-y-4">
                    <div className="flex justify-between text-sm items-center py-1">
                        <span className="text-slate-500 font-medium tracking-wide">Subtotal</span>
                        <span className="font-semibold text-slate-700">₦{Number(invoice.line_extension_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center py-1">
                        <span className="text-slate-500 font-medium tracking-wide">VAT (calculated)</span>
                        <span className="font-semibold text-slate-700">₦{Number(invoice.tax_inclusive_amount - invoice.line_extension_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-t-2 border-slate-900 mt-2">
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">Total Due</span>
                        <span className="text-2xl font-black text-blue-600 tracking-tight">₦{Number(invoice.payable_amount).toLocaleString()}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Compliance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className={`h-2 w-2 rounded-full ${isSigned ? 'bg-green-500' : 'bg-muted'}`} />
                        <span className="text-sm font-medium">FIRS Signed</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`h-2 w-2 rounded-full ${isTransmitted ? 'bg-green-500' : 'bg-muted'}`} />
                        <span className="text-sm font-medium">FIRS Transmitted</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="space-y-2">
                        <span className="text-sm font-medium">Payment Status</span>
                        <Select 
                            value={invoice.payment_status} 
                            onValueChange={(val) => paymentMutation.mutate(val)}
                            disabled={paymentMutation.isPending}
                        >
                            <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending Update</SelectItem>
                                <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                                <SelectItem value="PAID">Fully Paid</SelectItem>
                                <SelectItem value="REJECTED">Rejected Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {invoice.qr_code_url && (
                        <div className="flex flex-col items-center gap-2 pt-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm border">
                                <img src={invoice.qr_code_url} alt="NRS QR Code" className="h-32 w-32" />
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Official MBS QR Code</p>
                        </div>
                    )}
                    {invoice.irn && !invoice.qr_code_url && (
                        <div className="mt-4 p-3 bg-muted rounded-md border text-[10px] font-mono break-all self-center">
                            IRN: {invoice.irn}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {invoice.state_transitions?.length > 0 ? (
                            invoice.state_transitions.map((transition: any, idx: number) => (
                                <div key={idx} className="relative pl-4 border-l pb-4 last:pb-0">
                                    <div className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-primary" />
                                    <p className="text-xs font-bold leading-none capitalize">{transition.to_status.replace('_', ' ')}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {transition.trigger} • {new Date(transition.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-muted-foreground italic">
                                No activity recorded yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
