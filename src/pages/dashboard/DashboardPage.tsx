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
    Package, 
    CheckCircle2,
    Send,
    Activity
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { formatDistanceToNow } from 'date-fns';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back. Here is a real-time overview of your NRS connectivity and invoicing.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
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
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-muted-foreground" />
                Recent Activity
            </CardTitle>
            <CardDescription>
              Submission history and organization-wide events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <div className="flex h-50 items-center justify-center space-y-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
               </div>
            ) : response?.recent_activity.length === 0 ? (
              <div className="flex h-50 items-center justify-center text-sm text-muted-foreground italic">
                No recent activity to show.
              </div>
            ) : (
                <div className="space-y-8">
                    {response?.recent_activity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4">
                            <div className="mt-1 flex h-2 w-2 rounded-full bg-primary" />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {activity.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {activity.user.name} • {formatDistanceToNow(new Date(activity.created_at))} ago
                                </p>
                            </div>
                        </div>
                    ))}
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
