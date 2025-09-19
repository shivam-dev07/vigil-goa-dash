import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, MapPin } from 'lucide-react';

// Mock data for recent logs
const mockLogs = [
  {
    id: '1',
    officerId: 'P012345',
    officerName: 'Officer Sharma',
    action: 'Check-in',
    location: 'Sector 5 - Downtown',
    timestamp: '02:15',
    status: 'success' as const,
  },
  {
    id: '2',
    officerId: 'P012346',
    officerName: 'Officer Patel',
    action: 'Patrol Complete',
    location: 'Beach Road',
    timestamp: '01:45',
    status: 'success' as const,
  },
  {
    id: '3',
    officerId: 'P012347',
    officerName: 'Officer Singh',
    action: 'Geofence Violation',
    location: 'Market Area',
    timestamp: '01:30',
    status: 'warning' as const,
  },
  {
    id: '4',
    officerId: 'P012348',
    officerName: 'Officer Das',
    action: 'Check-out',
    location: 'Police Station',
    timestamp: '01:15',
    status: 'success' as const,
  },
];

export function RecentLogs() {
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
          {mockLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${
                  log.status === 'success' ? 'bg-success' : 
                  log.status === 'warning' ? 'bg-warning' : 'bg-destructive'
                }`} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {log.officerName} ({log.officerId})
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {log.location}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={log.status === 'success' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {log.action}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}