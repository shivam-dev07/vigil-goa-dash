import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, MapPin } from 'lucide-react';

export default function AssignDuty() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Assign Duty</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Duty Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Duty Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Duty assignment form will be implemented with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Officer selection dropdown</li>
                <li>Duty type (Naka/Patrol) selection</li>
                <li>Date and time range pickers</li>
                <li>Location assignment with map integration</li>
                <li>Geofence creation tools</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Assignment Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] bg-secondary rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Interactive Leaflet map for duty assignment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}