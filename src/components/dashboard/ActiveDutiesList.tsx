import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, User, Shield, Circle } from 'lucide-react';
import { useRealTimeDuties } from '@/hooks/useRealTimeData';
import { useRealTimeOfficers } from '@/hooks/useRealTimeData';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ActiveDutiesListProps {
  onDutyClick?: (duty: any) => void;
  selectedDutyId?: string;
  maxHeight?: string;
}

export function ActiveDutiesList({ onDutyClick, selectedDutyId, maxHeight = "400px" }: ActiveDutiesListProps) {
  const { duties, loading } = useRealTimeDuties();
  const { officers, loading: officersLoading } = useRealTimeOfficers();

  // Get officer details helper with backward compatibility
  const getOfficerDetails = (duty: any) => {
    // If officers still loading, return placeholder to avoid flicker to Unknown
    if (officersLoading) {
      return {
        name: 'Loading officers…',
        designation: '',
        staffId: ''
      };
    }
    // Handle both old/new structures and fallbacks from assignment form
    const officerUidsRaw = duty.officerUids || duty.officerIds || (duty.officerUid ? [duty.officerUid] : []);
    // Normalize possible shapes: string IDs, numbers, or objects like { id: '...' }
    const officerUids = (officerUidsRaw || []).map((v: any) => {
      if (v && typeof v === 'object') {
        return String(v.id ?? v.uid ?? v.value ?? '').trim();
      }
      return String(v ?? '').trim();
    }).filter((v: string) => v.length > 0);

    let dutyOfficers = officers.filter(o => o && (
      officerUids.includes(String(o.id || '').trim()) ||
      officerUids.includes(String((o as any).docId || '').trim())
    ));
    // Fallback: try matching by staff_id if document id match failed (legacy data)
    if (dutyOfficers.length === 0) {
      dutyOfficers = officers.filter(o => o && officerUids.includes(String(o.staff_id || '').trim()));
    }
    if (dutyOfficers.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ActiveDutiesList] No officer match for duty', duty?.id, 'officerUids:', officerUids);
      }
      // Better fallback: show count or raw IDs if available
      if (officerUids.length > 0) {
        return {
          name: `${officerUids.length} Officer${officerUids.length > 1 ? 's' : ''}`,
          designation: 'Assigned',
          staffId: officerUids.join(', ')
        };
      }
      return {
        name: 'Unassigned',
        designation: '—',
        staffId: '—'
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
      designation: dutyOfficers.map(o => o.staff_designation).filter(Boolean).join(', '),
      staffId: dutyOfficers.map(o => o.staff_id).filter(Boolean).join(', ')
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
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Active Duties</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start justify-between p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer",
                  "bg-card border-border hover:bg-accent/50"
                )}
              >
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
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
      <CardHeader className="py-3 px-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="text-sm sm:text-base">Active Duties ({activeDuties.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100%-64px)] p-2 sm:p-4">
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
                  <div
                    key={duty.id}
                    className={cn(
                      "flex items-start justify-between p-2 sm:p-3 rounded-lg border transition-colors cursor-pointer",
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-sm" 
                        : "bg-card border-border hover:bg-accent/50"
                    )}
                    onClick={() => onDutyClick?.(duty)}
                  >
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {duty.type === 'naka' ? 'N' : 'P'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs sm:text-sm text-foreground truncate">{officer.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {officer.designation} • {officer.staffId}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                          {formatDate(duty.startTime)} at {formatTime(duty.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                      <Badge 
                        variant={duty.type === 'naka' ? 'default' : 'secondary'}
                        className="text-xs mb-1 hidden sm:inline-flex"
                      >
                        {duty.type?.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground hidden sm:block">
                        {duty.status?.toUpperCase() || 'UNKNOWN'}
                      </p>
                    </div>
                  </div>
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
