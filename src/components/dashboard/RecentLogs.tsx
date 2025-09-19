import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { useRealTimeCompliance } from '@/hooks/useRealTimeData';

export function RecentLogs() {
  const { recentLogs, loading } = useRealTimeCompliance();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (action: string) => {
    switch (action) {
      case 'check-in':
      case 'check-out':
      case 'patrol-update':
        return 'bg-success';
      case 'geofence-violation':
        return 'bg-warning';
      case 'incident-report':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'geofence-violation':
      case 'incident-report':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const formatTime = (
    timestamp: Date | { toDate: () => Date } | string | number | null | undefined
  ) => {
    if (!timestamp) return 'Unknown';
    const date =
      typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp
        ? timestamp.toDate()
        : new Date(timestamp as string | number | Date);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity logs</p>
              <p className="text-xs">Logs will appear here as officers perform duties</p>
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(log.action)}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {log.officerName}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {log.location.name}
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={getActionVariant(log.action)}
                    className="text-xs"
                  >
                    {log.action.replace('-', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(log.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}