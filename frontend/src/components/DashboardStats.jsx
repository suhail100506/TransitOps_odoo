import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const DashboardStats = ({ kpis }) => {
  const stats = [
    {
      title: 'Active Vehicles',
      value: kpis?.activeVehicles ?? 53,
      borderColor: 'border-l-cyan-500 dark:border-l-cyan-400'
    },
    {
      title: 'Available Vehicles',
      value: kpis?.availableVehicles ?? 42,
      borderColor: 'border-l-emerald-500 dark:border-l-emerald-400'
    },
    {
      title: 'Vehicles In Maintenance',
      value: kpis?.inMaintenance ?? 5,
      borderColor: 'border-l-amber-500 dark:border-l-amber-400'
    },
    {
      title: 'Active Trips',
      value: kpis?.activeTrips ?? 18,
      borderColor: 'border-l-cyan-500 dark:border-l-cyan-400'
    },
    {
      title: 'Pending Trips',
      value: kpis?.pendingTrips ?? 9,
      borderColor: 'border-l-slate-400 dark:border-l-slate-500'
    },
    {
      title: 'Drivers On Duty',
      value: kpis?.driversOnDuty ?? 26,
      borderColor: 'border-l-cyan-500 dark:border-l-cyan-400'
    },
    {
      title: 'Fleet Utilization',
      value: kpis?.fleetUtilization !== undefined ? `${kpis.fleetUtilization}%` : '81%',
      borderColor: 'border-l-emerald-500 dark:border-l-emerald-400'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {stats.map((stat, idx) => (
        <Card 
          key={idx} 
          className={`border border-slate-200/60 dark:border-slate-800/80 border-l-4 ${stat.borderColor} rounded-xl bg-white dark:bg-slate-900/50 shadow-sm hover-lift transition-all duration-300`}
        >
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[90px]">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">{stat.title}</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{stat.value}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
