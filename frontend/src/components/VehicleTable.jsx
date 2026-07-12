import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Truck } from 'lucide-react';
import VehicleStatusBadge from './VehicleStatusBadge';

const VehicleTable = ({ vehicles, filters }) => {
  // Apply visual filtering locally
  const filteredVehicles = vehicles?.filter(vehicle => {
    if (filters.type !== 'All' && vehicle.type !== filters.type) return false;
    if (filters.status !== 'All' && vehicle.status !== filters.status) return false;
    if (filters.regNumber && !vehicle.regNumber.toLowerCase().includes(filters.regNumber.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
          <TableRow>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Reg. No. (Unique)</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Name/Model</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Type</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Capacity</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Odometer</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Acq. Cost</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!filteredVehicles || filteredVehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Truck className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                  <span>No vehicles match the filters.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredVehicles.map((vehicle) => (
              <TableRow key={vehicle._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                <TableCell className="font-bold text-slate-900 dark:text-white py-3.5 px-6">{vehicle.regNumber}</TableCell>
                <TableCell className="font-semibold text-slate-700 dark:text-slate-200 py-3.5 px-6">
                  {vehicle.name} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({vehicle.model})</span>
                </TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400 py-3.5 px-6">{vehicle.type}</TableCell>
                <TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium py-3.5 px-6">
                  {vehicle.maxLoadCapacity?.toLocaleString()} kg
                </TableCell>
                <TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium py-3.5 px-6">
                  {vehicle.odometer?.toLocaleString()} km
                </TableCell>
                <TableCell className="text-right text-slate-800 dark:text-slate-200 font-mono font-medium py-3.5 px-6">
                  ${vehicle.acquisitionCost?.toLocaleString() || '0'}
                </TableCell>
                <TableCell className="py-3.5 px-6">
                  <VehicleStatusBadge status={vehicle.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default VehicleTable;
