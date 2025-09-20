import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, loading = false, className }: StatsCardProps) {
  return (
    <Card className={cn("transition-all duration-200 hover:shadow-elevation", className)}>
      <CardContent className="p-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            {loading ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
            {trend && !loading && (
              <p className={cn(
                "text-xs flex items-center gap-1",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                <span className="text-muted-foreground">vs last month</span>
              </p>
            )}
          </div>
          <div className="h-9 w-9 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}