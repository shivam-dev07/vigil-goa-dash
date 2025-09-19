import { Users, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MapPanel } from '@/components/dashboard/MapPanel';
import { RecentLogs } from '@/components/dashboard/RecentLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeOfficers, useRealTimeDuties, useRealTimeCompliance } from '@/hooks/useRealTimeData';

export default function Dashboard() {
  const { officers } = useRealTimeOfficers();
  const { activeDuties, completedDuties } = useRealTimeDuties();
  const { recentLogs } = useRealTimeCompliance();
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

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Officers"
          value={officers.length}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Active Duties"
          value={activeDuties.length}
          icon={Shield}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Completed Duties"
          value={completedDuties.length}
          icon={CheckCircle}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Recent Activities"
          value={recentLogs.length}
          icon={AlertTriangle}
          trend={{ value: -25, isPositive: false }}
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