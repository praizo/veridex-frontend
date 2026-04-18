import { useQuery } from '@tanstack/react-query';
import { reportApi } from '@/api/reports';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    Download, 
    Users, 
    TrendingUp, 
    ShieldCheck, 
    Loader2,
    FileBarChart,
    PieChart
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#10b981', // emerald-500
  failed: '#ef4444',    // red-500
  draft: '#64748b',     // slate-500
  transmitted: '#3b82f6', // blue-500
  validation_failed: '#f59e0b', // amber-500
};

export default function ReportB2CPage() {
  const { data: b2cData, isLoading } = useQuery({
    queryKey: ['b2c-summary'],
    queryFn: () => reportApi.getB2cSummary().then(res => res.data),
  });

  const handleExport = async () => {
    try {
      const response = await reportApi.exportInvoicesCsv({ customer_type: 'individual' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `b2c_invoices_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('B2C Report exported successfully');
    } catch (error) {
        toast.error('Failed to export report');
    }
  };

  if (isLoading) return (
    <div className="flex h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const chartData = b2cData?.data || [];
  const summary = b2cData?.summary || { count: 0, amount: 0, vat: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            B2C Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Consumer-level transaction insights and regulatory reporting.
          </p>
        </div>
        <Button onClick={handleExport} className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Download className="mr-2 h-4 w-4" /> Export B2C Invoices
        </Button>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total consumer Volume</CardDescription>
            <CardTitle className="text-3xl font-bold">{summary.count}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Total invoices issued to individuals
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-12 w-12 text-blue-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Receivable</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatCurrency(summary.amount)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total gross value of B2C transactions</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Regulatory VAT Liability</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatCurrency(summary.vat)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Summarized tax obligation for consumer sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ─── Status Chart ─── */}
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <div>
                <CardTitle>Lifecycle Distribution</CardTitle>
                <CardDescription>B2C invoices by regulatory state</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="status" 
                    type="category" 
                    tick={{ fontSize: 12 }} 
                    width={100}
                    tickFormatter={(val) => val.replace('_', ' ')}
                />
                <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff'
                    }}
                />
                <Bar dataKey="total_count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ─── Performance Insight ─── */}
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            <div>
                <CardTitle>Value Analysis</CardTitle>
                <CardDescription>Gross revenue breakdown by invoice status</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-75">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                    dataKey="status" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => val.split('_')[0].toUpperCase()}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                     formatter={(value: any) => formatCurrency(value)}
                     contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#fff'
                    }}
                />
                <Bar dataKey="total_amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
