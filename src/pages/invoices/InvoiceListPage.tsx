import { useQuery } from '@tanstack/react-query';
import { Plus, MoreHorizontal, FileText, Calendar, User, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { invoiceApi } from '@/api/invoices';
import { reportApi } from '@/api/reports';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const { data: response, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoiceApi.list().then(res => res.data),
  });

  const invoices = response?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Manage and track your official e-invoices and their NRS status.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={async () => {
                    try {
                        setIsExporting(true);
                        const response = await reportApi.exportInvoicesCsv();
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `ledger_export_${new Date().getTime()}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                        toast.success("Export Complete", { description: "CSV file downloaded successfully." });
                    } catch (error) {
                        toast.error("Export Failed", { description: "Unabled to generate the CSV ledger." });
                    } finally {
                        setIsExporting(false);
                    }
                }}
                disabled={isExporting}
            >
                <FileText className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button className="flex items-center gap-2" onClick={() => navigate('/invoices/create')}>
            <Plus className="h-4 w-4" />
            Create Invoice
            </Button>
        </div>
      </div>
      
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="w-30">Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>NRS Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                  No invoices found. Click "Create Invoice" to start your first submission.
                </TableCell>
              </TableRow>
            ) : (
                invoices.map((invoice: Record<string, unknown>, index: number) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {index + 1}
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                            {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {invoice.customer?.name}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {invoice.issue_date}
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                            ₦{Number(invoice.payable_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                            <Badge variant={invoice.status === 'transmitted' ? 'default' : 'secondary'} className="capitalize">
                                {invoice.status.replace('_', ' ')}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 px-3 text-xs font-semibold hover:bg-primary hover:text-white transition-all duration-300"
                                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                                >
                                    <Eye className="mr-1 h-3 w-3" /> View & Sign
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Invoice Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => navigate(`/invoices/${invoice.id}`)}>
                                            <Eye className="mr-2 h-4 w-4" /> Detail View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <FileText className="mr-2 h-4 w-4" /> Download PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
