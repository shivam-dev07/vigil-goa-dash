import { Users, Shield, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MapPanel } from '@/components/dashboard/MapPanel';
import { RecentLogs } from '@/components/dashboard/RecentLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRealTimeOfficers, useRealTimeDuties, useRealTimeCompliance } from '@/hooks/useRealTimeData';
import { initializeDemoData } from '@/utils/seedData';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { officers, loading: officersLoading } = useRealTimeOfficers();
  const { duties, activeDuties, completedDuties, loading: dutiesLoading } = useRealTimeDuties();
  const { logs, recentLogs, loading: logsLoading } = useRealTimeCompliance();
  const { toast } = useToast();
  
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
        {recentLogs.length === 0 && (
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Officers"
          value={officers.length}
          icon={Users}
          loading={officersLoading}
        />
        <StatsCard
          title="Active Duties"
          value={activeDuties.length}
          icon={Shield}
          loading={dutiesLoading}
        />
        <StatsCard
          title="Completed Duties"
          value={completedDuties.length}
          icon={CheckCircle}
          loading={dutiesLoading}
        />
        <StatsCard
          title="Recent Activities"
          value={recentLogs.length}
          icon={AlertTriangle}
          loading={logsLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Panel */}
        <div className="lg:col-span-1">
          <MapPanel />
        </div>

        {/* Recent Logs */}
        <div className="lg:col-span-1">
          <RecentLogs />
        </div>
      </div>
    </div>
  );
}