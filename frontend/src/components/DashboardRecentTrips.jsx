import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const DashboardRecentTrips = ({ trips, filters }) => {
  // Mock fallback exactly mirroring the mock image
  const mockTrips = [
    { id: 'TR001', vehicle: 'VAN-05', driver: 'Alex', status: 'On Trip', eta: '45 min', type: 'Van' },
    { id: 'TR002', vehicle: 'TRK-12', driver: 'John', status: 'Completed', eta: '—', type: 'Semi-Truck' },
    { id: 'TR003', vehicle: 'MINI-08', driver: 'Priya', status: 'Dispatched', eta: '1h 10m', type: 'Mini-Van' },
    { id: 'TR004', vehicle: '—', driver: '—', status: 'Draft', eta: 'Awaiting vehicle', type: 'None' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/30 text-slate-650 dark:text-slate-400">Draft</span>;
      case 'Dispatched':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold">Dispatched</span>;
      case 'On Trip':
      case 'In Transit':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold">On Trip</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/15 text-emerald-650 dark:text-emerald-400 font-bold">Completed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400">{status}</span>;
    }
  };

  const displayTrips = trips && trips.length > 0
    ? trips.map((t, idx) => ({
        id: `TR${(idx + 1).toString().padStart(3, '0')}`,
        vehicle: t.vehicleId?.regNumber || '—',
        driver: t.driverId?.name || '—',
        status: t.status === 'Dispatched' ? 'On Trip' : t.status,
        eta: t.status === 'Completed' ? '—' : t.status === 'Draft' ? 'Awaiting vehicle' : '45 min',
        type: t.vehicleId?.type || 'None',
        region: t.region || 'North'
      }))
    : mockTrips;

  // Apply filters if any
  const filteredTrips = displayTrips.filter(t => {
    if (filters.vehicleType !== 'All' && t.type !== filters.vehicleType) return false;
    if (filters.status !== 'All' && t.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-full">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Trips</h2>
      </div>
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
          <TableRow>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 py-3.5 px-6">Trip</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 py-3.5 px-6">Vehicle</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 py-3.5 px-6">Driver</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 py-3.5 px-6">Status</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 py-3.5 px-6">ETA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTrips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                No recent trips match the selected filters.
              </TableCell>
            </TableRow>
          ) : (
            filteredTrips.map((trip) => (
              <TableRow key={trip.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                <TableCell className="font-bold text-slate-900 dark:text-white py-4 px-6">{trip.id}</TableCell>
                <TableCell className="text-slate-800 dark:text-slate-200 font-bold py-4 px-6">{trip.vehicle}</TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 font-semibold py-4 px-6">{trip.driver}</TableCell>
                <TableCell className="py-4 px-6">{getStatusBadge(trip.status)}</TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400 py-4 px-6 font-semibold">{trip.eta}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DashboardRecentTrips;
