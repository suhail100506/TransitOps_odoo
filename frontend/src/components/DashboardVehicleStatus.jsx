import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardVehicleStatus = ({ vehicles }) => {
  // Calculate counts dynamically if vehicles array is present, otherwise use mock proportions
  const counts = vehicles && vehicles.length > 0
    ? {
        Available: vehicles.filter(v => v.status === 'Available').length,
        'On Trip': vehicles.filter(v => v.status === 'On Trip').length,
        'In Shop': vehicles.filter(v => v.status === 'In Shop').length,
        Retired: vehicles.filter(v => v.status === 'Retired').length
      }
    : {
        Available: 42,
        'On Trip': 18,
        'In Shop': 5,
        Retired: 2
      };

  const total = counts.Available + counts['On Trip'] + counts['In Shop'] + counts.Retired;
  const maxVal = Math.max(counts.Available, counts['On Trip'], counts['In Shop'], counts.Retired, 1);

  const statuses = [
    {
      name: 'Available',
      value: counts.Available,
      percentage: Math.round((counts.Available / maxVal) * 100),
      color: 'bg-emerald-500 dark:bg-emerald-400'
    },
    {
      name: 'On Trip',
      value: counts['On Trip'],
      percentage: Math.round((counts['On Trip'] / maxVal) * 100),
      color: 'bg-cyan-500 dark:bg-cyan-400'
    },
    {
      name: 'In Shop',
      value: counts['In Shop'],
      percentage: Math.round((counts['In Shop'] / maxVal) * 100),
      color: 'bg-amber-500 dark:bg-amber-400'
    },
    {
      name: 'Retired',
      value: counts.Retired,
      percentage: Math.round((counts.Retired / maxVal) * 100),
      color: 'bg-red-500 dark:bg-red-400'
    }
  ];

  return (
    <Card className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden h-full">
      <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Vehicle Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {statuses.map((status, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-600 dark:text-slate-350">{status.name}</span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">{status.value}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-3.5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${status.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${status.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DashboardVehicleStatus;
