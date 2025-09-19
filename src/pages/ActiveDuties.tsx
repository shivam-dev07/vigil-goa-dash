import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function ActiveDuties() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Active Duties</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Active Duty Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will display all currently active duty assignments with real-time tracking and status updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}