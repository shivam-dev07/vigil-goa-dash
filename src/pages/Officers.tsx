import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function Officers() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Officers Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Officer Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will manage the officer database with profiles, contact information, duty history, and performance metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}