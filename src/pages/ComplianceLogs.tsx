import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function ComplianceLogs() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Compliance Logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Duty Compliance History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will show detailed compliance logs including check-in/out times, geofence violations, and duty completion reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}