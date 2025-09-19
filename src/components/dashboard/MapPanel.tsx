import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

// Placeholder for Leaflet map - will be implemented with proper Leaflet integration
export function MapPanel() {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Live Duty Map
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-80px)]">
        <div className="w-full h-full bg-gradient-to-br from-primary-light to-secondary rounded-b-lg flex items-center justify-center relative overflow-hidden">
          {/* Map placeholder with mock data visualization */}
          <div className="absolute inset-4 bg-card rounded-lg shadow-inner flex items-center justify-center">
            <div className="text-center space-y-4">
              <Navigation className="h-12 w-12 text-primary mx-auto" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Interactive Map Loading...</p>
                <p className="text-xs text-muted-foreground">
                  Leaflet integration with OpenStreetMap tiles
                </p>
              </div>
              
              {/* Mock indicators */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Active Duties (5)</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span>Naka Points (3)</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span>Patrol Routes (2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}