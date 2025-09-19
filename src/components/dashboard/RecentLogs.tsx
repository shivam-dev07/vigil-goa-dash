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
        return 'bg-green-500';
      case 'geofence-violation':
        return 'bg-yellow-500';
      case 'incident-report':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'geofence-violation':
      case 'incident-report':
        return 'destructive' as const;
      case 'check-in':
      case 'check-out':
        return 'default' as const;
      case 'patrol-update':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'check-in':
        return '✅';
      case 'check-out':
        return '🚪';
      case 'patrol-update':
        return '🚶‍♂️';
      case 'geofence-violation':
        return '⚠️';
      case 'incident-report':
        return '🚨';
      default:
        return '📝';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'check-in':
        return 'Check In';
      case 'check-out':
        return 'Check Out';
      case 'patrol-update':
        return 'Patrol Update';
      case 'geofence-violation':
        return 'Geofence Violation';
      case 'incident-report':
        return 'Incident Report';
      default:
        return action.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
              <div key={log.id} className="flex items-start justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(log.action)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">
                        {log.officerName}
                      </p>
                      <Badge 
                        variant={getActionVariant(log.action)}
                        className="text-xs px-2 py-0.5"
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{log.location.name}</span>
                    </p>
                    {log.details && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatTime(log.timestamp)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp && typeof log.timestamp === 'object' && 'toDate' in log.timestamp
                      ? log.timestamp.toDate().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                      : new Date(log.timestamp as unknown as string).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                    }
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