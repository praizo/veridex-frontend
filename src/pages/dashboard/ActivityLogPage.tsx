import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityLogApi } from '@/api/activity-logs';
import { format } from 'date-fns';
import { ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['activity-logs', page],
    queryFn: () => activityLogApi.get(page).then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>
        <p className="text-muted-foreground">
          System audit trails and user activity within your organization.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : !response?.data?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  <ShieldAlert className="mx-auto mb-2 h-6 w-6" />
                  No activity logs found.
                </TableCell>
              </TableRow>
            ) : (
              response.data.map((log) => {
                let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
                if (log.action.includes('FAIL') || log.action.includes('ERROR')) badgeVariant = 'destructive';
                else if (log.action.includes('SUCCESS') || log.action.includes('CONFIRM') || log.action.includes('SIGN')) badgeVariant = 'default';
                else if (log.action.includes('UPDATE')) badgeVariant = 'secondary';

                return (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <Badge variant={badgeVariant} className="font-mono text-[10px] tracking-wider uppercase">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-75 truncate" title={log.description}>{log.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {log.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none">{log.user.name}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                       {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {response?.meta && response.meta.last_page > 1 && (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Showing page {response.meta.current_page} of {response.meta.last_page} ({response.meta.total} total logs)
            </p>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= response.meta.last_page}
                >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}
