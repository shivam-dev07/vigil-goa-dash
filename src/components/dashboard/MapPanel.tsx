import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import { useRealTimeDuties } from '@/hooks/useRealTimeData';
import { useState } from 'react';

interface MapPanelProps {
  selectedDutyId?: string;
  onDutyFocus?: (duty: any) => void;
  height?: string;
}

export function MapPanel({ selectedDutyId, onDutyFocus, height = "400px" }: MapPanelProps) {
  const { duties } = useRealTimeDuties();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <Card style={{ height }}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base">Live Duty Map</span>
            <span className="text-xs text-muted-foreground">(duties: {duties.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-6 w-6 p-0 ml-2"
              title="Refresh map markers"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
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
          key={refreshKey}
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