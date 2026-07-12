import React from 'react';
import { Input } from '@/components/ui/input';

const VehicleFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-4 items-center w-full">
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <select
          value={filters.type}
          onChange={(e) => onFilterChange('type', e.target.value)}
          className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold tracking-tight shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-700 dark:text-slate-355 cursor-pointer transition-colors"
        >
          <option value="All" className="bg-slate-900 text-white font-semibold">Type: All</option>
          <option value="Semi-Truck" className="bg-slate-900 text-white font-semibold">Semi-Truck</option>
          <option value="Box Truck" className="bg-slate-900 text-white font-semibold">Box Truck</option>
          <option value="Van" className="bg-slate-900 text-white font-semibold">Van</option>
          <option value="Mini-Van" className="bg-slate-900 text-white font-semibold">Mini-Van</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold tracking-tight shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-700 dark:text-slate-355 cursor-pointer transition-colors"
        >
          <option value="All" className="bg-slate-900 text-white font-semibold">Status: All</option>
          <option value="Available" className="bg-slate-900 text-white font-semibold">Available</option>
          <option value="On Trip" className="bg-slate-900 text-white font-semibold">On Trip</option>
          <option value="In Shop" className="bg-slate-900 text-white font-semibold">In Shop</option>
          <option value="Retired" className="bg-slate-900 text-white font-semibold">Retired</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[200px] flex-grow md:flex-grow-0">
        <Input
          placeholder="Search reg. no..."
          value={filters.regNumber}
          onChange={(e) => onFilterChange('regNumber', e.target.value)}
          className="h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 text-xs font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>
    </div>
  );
};

export default VehicleFilters;
