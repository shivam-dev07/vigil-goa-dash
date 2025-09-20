import { Users, Shield, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MapPanel } from '@/components/dashboard/MapPanel';
import { RecentLogs } from '@/components/dashboard/RecentLogs';
import { ActiveDutiesList } from '@/components/dashboard/ActiveDutiesList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRealTimeOfficers, useRealTimeDuties, useRealTimeCompliance } from '@/hooks/useRealTimeData';
import { useRealTimeRecentActivities } from '@/hooks/useActivitiesData';
import { initializeDemoData } from '@/utils/seedData';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function Dashboard() {
  const { officers, loading: officersLoading, error: officersError } = useRealTimeOfficers();
  const { duties, activeDuties, completedDuties, loading: dutiesLoading, error: dutiesError } = useRealTimeDuties();
  const { logs, recentLogs, loading: logsLoading, error: logsError } = useRealTimeCompliance();
  const { recentActivities, loading: activitiesLoading } = useRealTimeRecentActivities();
  const { toast } = useToast();
  
  const [selectedDutyId, setSelectedDutyId] = useState<string | undefined>();
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleInitializeDemoData = async () => {
    try {
      await initializeDemoData();
      toast({
        title: "Demo data initialized",
        description: "Sample officers, duties, and logs have been added to the database.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize demo data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDutyClick = (duty: any) => {
    setSelectedDutyId(duty.id);
  };

  const handleDutyFocus = (duty: any) => {
    // Optional: Add any additional logic when a duty is focused
    console.log('Focused on duty:', duty);
  };

  // Show error messages if any
  if (officersError || dutiesError || logsError) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-destructive mb-2">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to connect to the database. Please check your internet connection and try again.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {currentDate} • {currentTime}
          </p>
        </div>
        {recentActivities.length === 0 && (
          <Button 
            onClick={handleInitializeDemoData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Initialize Demo Data
          </Button>
        )}
      </div>

      {/* Stats Cards - Compact size to prevent overlapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          title="Total Officers"
          value={officers.length}
          icon={Users}
          loading={officersLoading}
          className="h-16 p-3"
        />
        <StatsCard
          title="Active Duties"
          value={activeDuties.length}
          icon={Shield}
          loading={dutiesLoading}
          className="h-16 p-3"
        />
        <StatsCard
          title="Completed Duties"
          value={completedDuties.length}
          icon={CheckCircle}
          loading={dutiesLoading}
          className="h-16 p-3"
        />
        <StatsCard
          title="Recent Activities"
          value={recentActivities.length}
          icon={AlertTriangle}
          loading={activitiesLoading}
          className="h-16 p-3"
        />
      </div>

      {/* Main Content Grid - Map takes more space */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map Panel - Takes 3/4 of the width */}
        <div className="xl:col-span-3">
          <MapPanel 
            selectedDutyId={selectedDutyId}
            onDutyFocus={handleDutyFocus}
            height="600px"
          />
        </div>

        {/* Active Duties List - Takes 1/4 of the width */}
        <div className="xl:col-span-1">
          <ActiveDutiesList 
            onDutyClick={handleDutyClick}
            selectedDutyId={selectedDutyId}
            maxHeight="600px"
          />
        </div>
      </div>

      {/* Recent Logs - Reduced height */}
      <div className="grid grid-cols-1">
        <RecentLogs maxHeight="300px" />
      </div>
    </div>
  );
}