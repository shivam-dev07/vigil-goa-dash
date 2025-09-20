import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { useRealTimeRecentActivities } from '@/hooks/useActivitiesData';
import { Activity } from '@/services/activities';

interface RecentLogsProps {
  maxHeight?: string;
}

export function RecentLogs({ maxHeight = "600px" }: RecentLogsProps) {
  const { recentActivities, loading } = useRealTimeRecentActivities();

  if (loading) {
    return (
      <Card style={{ height: maxHeight }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
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

  const getStatusColor = (type: string) => {
    switch (type) {
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

  const getActionVariant = (type: string) => {
    switch (type) {
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

  const getActionIcon = (type: string) => {
    switch (type) {
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

  const getActionLabel = (type: string) => {
    switch (type) {
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
        return type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
      minute: '2-digit',
    });
  };

  return (
    <Card style={{ height: maxHeight }}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="text-sm sm:text-base">Recent Activity Logs</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-64px)] overflow-hidden">
        {/* ✅ Height-aware scrollable wrapper with proper alignment */}
        <div className="h-full overflow-y-auto space-y-2 sm:space-y-3 pr-2">
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity logs</p>
              <p className="text-xs">
                Logs will appear here as officers perform duties
              </p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between p-3 sm:p-4 bg-card border border-border rounded-lg hover:bg-accent/50 transition-colors w-full"
              >
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg">{getActionIcon(activity.type)}</span>
                    <div
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        activity.type
                      )}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">
                        {activity.officerId}
                      </p>
                      <Badge
                        variant={getActionVariant(activity.type)}
                        className="text-xs px-2 py-0.5"
                      >
                        {getActionLabel(activity.type)}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">
                      {activity.title}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{activity.location}</span>
                    </p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                  <p className="text-xs text-muted-foreground font-medium hidden sm:block">
                    {formatTime(activity.timestamp)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp &&
                    typeof activity.timestamp === 'object' &&
                    'toDate' in activity.timestamp
                      ? activity.timestamp
                          .toDate()
                          .toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })
                      : new Date(
                          activity.timestamp as unknown as string
                        ).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
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