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
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base">Live Duty Map</span>
            <span className="text-xs text-muted-foreground">(duties: {duties.length})</span>
          </div>
          {/* Legend - Responsive */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-gray-800">
                N
              </div>
              <span className="text-muted-foreground hidden sm:inline">Naka</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-xs font-bold text-blue-600">
                P
              </div>
              <span className="text-muted-foreground hidden sm:inline">Patrol</span>
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