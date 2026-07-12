import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import DashboardFilters from '../components/DashboardFilters';
import DashboardStats from '../components/DashboardStats';
import DashboardRecentTrips from '../components/DashboardRecentTrips';
import DashboardVehicleStatus from '../components/DashboardVehicleStatus';

const Dashboard = () => {
  // Filters state
  const [filters, setFilters] = useState({
    vehicleType: 'All',
    status: 'All',
    region: 'All'
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Fetch all dashboard KPIs
  const { data: kpis, isLoading: loadingKpis, error: kpisError } = useQuery({
    queryKey: ['dashboardKpis'],
    queryFn: async () => {
      const res = await api.get('/dashboard/kpis');
      return res.data;
    },
    refetchOnWindowFocus: true
  });

  // Fetch recent trips
  const { data: trips, isLoading: loadingTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips');
      return res.data;
    }
  });

  // Fetch all vehicles for status graphs
  const { data: vehicles, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    }
  });

  const isDataLoading = loadingKpis || loadingTrips || loadingVehicles;

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading dashboard metrics...</p>
      </div>
    );
  }

  if (kpisError) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl max-w-xl mx-auto border border-red-500/15 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failed to load dashboard KPIs</h3>
          <p className="text-xs opacity-90">{kpisError.response?.data?.error || kpisError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time telemetry and operation overview.</p>
      </div>

      {/* Filters Row */}
      <DashboardFilters filters={filters} onChange={handleFilterChange} />

      {/* 7 KPI stats cards */}
      <DashboardStats kpis={kpis} />

      {/* Lower grid content */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <DashboardRecentTrips trips={trips} filters={filters} />
        </div>
        <div className="md:col-span-1">
          <DashboardVehicleStatus vehicles={vehicles} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
