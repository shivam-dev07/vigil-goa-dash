import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, User, Shield, Circle } from 'lucide-react';
import { useRealTimeDuties } from '@/hooks/useRealTimeData';
import { useRealTimeOfficers } from '@/hooks/useRealTimeData';
import { useState } from 'react';

interface ActiveDutiesListProps {
  onDutyClick?: (duty: any) => void;
  selectedDutyId?: string;
  maxHeight?: string;
}

export function ActiveDutiesList({ onDutyClick, selectedDutyId, maxHeight = "400px" }: ActiveDutiesListProps) {
  const { duties, loading } = useRealTimeDuties();
  const { officers } = useRealTimeOfficers();

  // Get officer details helper with backward compatibility
  const getOfficerDetails = (duty: any) => {
    // Handle both old (officerUid) and new (officerUids) data structures
    const officerUids = duty.officerUids || (duty.officerUid ? [duty.officerUid] : []);
    
    const dutyOfficers = officers.filter(o => o && officerUids.includes(o.id!));
    if (dutyOfficers.length === 0) {
      return {
        name: 'Unknown Officer',
        designation: 'Unknown',
        staffId: 'Unknown'
      };
    }
    
    if (dutyOfficers.length === 1) {
      const officer = dutyOfficers[0];
      return {
        name: officer.staff_name || 'Unknown Officer',
        designation: officer.staff_designation || 'Unknown',
        staffId: officer.staff_id || 'Unknown'
      };
    }
    
    // Multiple officers
    return {
      name: `${dutyOfficers.length} Officers`,
      designation: dutyOfficers.map(o => o.staff_designation).join(', '),
      staffId: dutyOfficers.map(o => o.staff_id).join(', ')
    };
  };

  // Filter duties to show only active/incomplete duties that haven't expired
  const activeDuties = duties.filter(duty => {
    if (!duty || !duty.location || !duty.location.polygon || duty.location.polygon.length === 0) return false;
    
    // Don't show completed duties
    if (duty.status === 'complete' || duty.status === 'completed') return false;
    
    // Check if duty has expired
    if (duty.endTime) {
      const endTime = new Date(duty.endTime);
      const now = new Date();
      if (endTime < now) return false; // Duty has expired
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'incomplete':
        return 'bg-yellow-500';
      case 'assigned':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'incomplete':
        return 'secondary';
      case 'assigned':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Card style={{ height: maxHeight }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Active Duties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-3 w-12 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ height: maxHeight }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Active Duties ({activeDuties.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-80px)] p-4">
          {activeDuties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Shield className="h-8 w-8 mb-2" />
              <p className="text-sm">No active duties</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDuties.map((duty) => {
                try {
                  const officer = getOfficerDetails(duty);
                  const isSelected = selectedDutyId === duty.id;
                
                return (
                  <Button
                    key={duty.id}
                    variant={isSelected ? "default" : "ghost"}
                    className={`w-full justify-start p-3 h-auto ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => onDutyClick?.(duty)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {duty.type === 'naka' ? (
                            <Circle className="h-4 w-4 text-green-500" />
                          ) : (
                            <MapPin className="h-4 w-4 text-blue-500" />
                          )}
                          <div className="text-left">
                            <p className="font-medium text-sm">{officer.name}</p>
                            <p className="text-xs opacity-70">{officer.designation}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={getStatusVariant(duty.status)} 
                          className={`text-xs ${getStatusColor(duty.status)}`}
                        >
                          {duty.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(duty.startTime)}</span>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
                } catch (error) {
                  console.error('Error processing duty:', duty.id, error);
                  return null;
                }
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
