import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Percent, 
  Truck, 
  Users, 
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { data: kpis, isLoading, error } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data;
    },
    refetchOnWindowFocus: true // Refetches on focus as per roadmap guardrail
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
      color: 'text-blue-500'
    },
    {
      title: 'Active Vehicles',
      value: `${kpis?.activeVehicles ?? 0}`,
      description: `${kpis?.availableVehicles ?? 0} available, ${kpis?.inMaintenance ?? 0} in shop`,
      icon: Truck,
      color: 'text-green-500'
    },
    {
      title: 'Drivers on Duty',
      value: `${kpis?.driversOnDuty ?? 0}`,
      description: 'Drivers currently on active trips',
      icon: Users,
      color: 'text-amber-500'
    },
    {
      title: 'Trip Statistics',
      value: `${kpis?.activeTrips ?? 0}`,
      description: `${kpis?.pendingTrips ?? 0} trips pending dispatch`,
      icon: Navigation,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Real-time telemetry and operation overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="shadow-sm border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4.5 w-4.5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hero Welcome Info */}
      <Card className="p-6 border bg-gradient-to-br from-primary/5 to-accent-bg">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-2">Welcome to TransitOps Management</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Monitor and coordinate fleet logistics. Register assets under the Vehicles and Drivers sections, 
            create and dispatch cargo Trips, manage Maintenance schedules, and keep track of Fuel & incidentals.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
