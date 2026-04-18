import { useQuery } from '@tanstack/react-query';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle,
    CardDescription 
} from '@/components/ui/card';
import { 
    FileText, 
    Users, 
    CheckCircle2,
    Send,
    Activity,
    AlertCircle,
    ArrowUpRight,
    Clock
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.get().then(res => res.data.data),
  });

  const { data: healthData, isLoading: isHealthLoading } = useQuery({
    queryKey: ['dashboard-health'],
    queryFn: () => dashboardApi.getHealth().then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = [
    { 
        label: 'Total Invoices', 
        value: response?.stats.total_invoices || 0, 
        icon: FileText, 
        subValue: 'All time submissions', 
        color: 'text-blue-600' 
    },
    { 
        label: 'Official (Signed)', 
        value: response?.stats.signed || 0, 
        icon: CheckCircle2, 
        subValue: 'IRN generated', 
        color: 'text-green-600' 
    },
    { 
        label: 'Customers', 
        value: response?.stats.customers || 0, 
        icon: Users, 
        subValue: 'Active accounts', 
        color: 'text-purple-600' 
    },
    { 
        label: 'Transmitted', 
        value: response?.stats.transmitted || 0, 
        icon: Send, 
        subValue: 'Delivered to buyers', 
        color: 'text-orange-600' 
    },
  ];

  const getActivityIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('FAIL') || act.includes('ERROR')) return { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' };
    if (act.includes('SUCCESS') || act.includes('SIGN') || act.includes('TRANSMIT') || act.includes('CONFIRM')) return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (act.includes('CREATE') || act.includes('UPDATE')) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' };
    return { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  const truncateDescription = (text: string) => {
    if (text.length <= 120) return text;
    // Attempt to truncate JSON nicely
    if (text.includes('{')) {
        const parts = text.split(':');
        if (parts.length > 1) return parts[0] + ': [Technical Error Details]';
    }
    return text.substring(0, 117) + '...';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back. Here is a real-time overview of your NRS connectivity and invoicing.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stat.subValue}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
              </CardTitle>
              <CardDescription>
                Real-time submission history and system events.
              </CardDescription>
            </div>
            <Link 
              to="/activity" 
              className="group text-xs font-semibold text-primary flex items-center gap-1 hover:underline underline-offset-4"
            >
              View All <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex h-60 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
               </div>
            ) : response?.recent_activity.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground italic">
                No recent activity to show.
              </div>
            ) : (
                <div className="relative space-y-0 pl-1">
                    {/* Vertical Line */}
                    <div className="absolute left-4.75 top-2 bottom-2 w-px bg-muted/60" />

                    {response?.recent_activity.map((activity) => {
                        const style = getActivityIcon(activity.action);
                        return (
                            <div key={activity.id} className="relative flex items-start gap-4 pb-8 last:pb-2">
                                <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background ${style.bg} ${style.color} shadow-sm`}>
                                   <style.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 pt-1.5 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold tracking-tight text-slate-900 truncate pr-4" title={activity.description}>
                                            {truncateDescription(activity.description)}
                                        </p>
                                        <time className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> {formatDistanceToNow(new Date(activity.created_at))} ago
                                        </time>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                            {activity.user.name.charAt(0)}
                                        </div>
                                        <p className="text-[11px] font-medium text-muted-foreground">
                                           Initiated by <span className="text-slate-700">{activity.user.name}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>NRS Status</CardTitle>
            <CardDescription>
              Connectivity status with FIRS MBS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHealthLoading ? (
               <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
               </div>
            ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${healthData?.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        FIRS Gateway
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {healthData?.status === 'online' ? 'Connected and syncing' : 'Connection failed'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Latency</p>
                      <p className="text-xs text-muted-foreground">{healthData?.latency ?? 'N/A'}</p>
                    </div>
                  </div>
                  {healthData?.error && (
                    <div className="mt-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                       {healthData.error}
                    </div>
                  )}
                  <div className="mt-4 rounded-md border border-dashed p-4 text-center">
                     <p className="text-[10px] text-muted-foreground">
                        Veridex is an authorized MBS Solution provider. 
                        All data is transmitted via secure FIRS TLS protocols.
                     </p>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
