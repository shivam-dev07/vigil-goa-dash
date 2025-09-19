import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { InteractiveMap } from '@/components/maps/InteractiveMap';

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
        <InteractiveMap 
          height="100%" 
          center={[15.2993, 74.1240]} // Goa coordinates
          zoom={11}
        />
      </CardContent>
    </Card>
  );
}