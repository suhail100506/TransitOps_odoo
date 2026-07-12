import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Percent,
  Truck,
  Users,
  Navigation,
  CheckCircle2,
  Fuel,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Wrench
} from 'lucide-react';

const Dashboard = () => {
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: dashboardAPI.getKpis,
    refetchOnWindowFocus: true
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg max-w-xl mx-auto border border-destructive/20 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Failed to load dashboard KPIs</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Fleet Utilization',
      value: `${kpis?.fleetUtilization ?? 0}%`,
      description: 'Active vehicles vs total fleet size',
      icon: Percent,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Active Vehicles',
      value: `${kpis?.activeVehicles ?? 0}`,
      description: `${kpis?.availableVehicles ?? 0} available · ${kpis?.inMaintenance ?? 0} in shop`,
      icon: Truck,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Drivers on Duty',
      value: `${kpis?.driversOnDuty ?? 0}`,
      description: 'Drivers currently on active trips',
      icon: Users,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Active Trips',
      value: `${kpis?.activeTrips ?? 0}`,
      description: `${kpis?.pendingTrips ?? 0} pending dispatch`,
      icon: Navigation,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Completed Trips',
      value: `${kpis?.completedTrips ?? 0}`,
      description: 'Total trips completed to date',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Avg Fuel Efficiency',
      value: kpis?.avgFuelEfficiency ? `${kpis.avgFuelEfficiency} km/L` : 'N/A',
      description: 'Across all completed trip records',
      icon: Fuel,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    }
  ];

  const expiringCount = kpis?.expiringLicenses ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Real-time telemetry and operation overview.</p>
      </div>

      {/* License Expiry Alert Banner */}
      {expiringCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              License Expiry Warning
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {expiringCount} driver license{expiringCount > 1 ? 's' : ''} will expire within the next 30 days.
              Review the <a href="/drivers" className="underline font-medium">Drivers</a> page immediately.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className={`p-2 rounded-md ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fleet Status Live Summary */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Fleet Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 divide-x text-center">
            <div className="px-4 py-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-medium text-muted-foreground">Available</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{kpis?.availableVehicles ?? 0}</p>
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-medium text-muted-foreground">On Trip</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{kpis?.activeVehicles ?? 0}</p>
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Wrench className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">In Shop</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{kpis?.inMaintenance ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
