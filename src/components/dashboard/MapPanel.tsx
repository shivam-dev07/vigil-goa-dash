import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useRealTimeDuties } from '@/hooks/useRealTimeData';
import { InteractiveMap } from '@/components/maps/InteractiveMap';

interface MapPanelProps {
  selectedDutyId?: string;
  onDutyFocus?: (duty: any) => void;
  height?: string;
}

export function MapPanel({ selectedDutyId, onDutyFocus, height = "400px" }: MapPanelProps) {
  const { duties } = useRealTimeDuties();
  return (
    <Card style={{ height }}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Duty Map
            <span className="text-xs text-muted-foreground">(duties: {duties.length})</span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-gray-800">
                N
              </div>
              <span className="text-muted-foreground">Naka</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-gray-800">
                P
              </div>
              <span className="text-muted-foreground">Patrol</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-80px)]">
        <InteractiveMap 
          height="100%" 
          center={[15.2993, 74.1240]} // Goa coordinates
          zoom={11}
          selectedDutyId={selectedDutyId}
          onDutyFocus={onDutyFocus}
        />
      </CardContent>
    </Card>
  );
}