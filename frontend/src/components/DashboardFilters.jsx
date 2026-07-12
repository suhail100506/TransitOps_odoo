import React from 'react';

const DashboardFilters = ({ filters, onChange }) => {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Filters</span>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <select
            value={filters.vehicleType}
            onChange={(e) => onChange('vehicleType', e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold tracking-tight shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-700 dark:text-slate-355 cursor-pointer transition-colors"
          >
            <option value="All" className="bg-slate-900 text-white font-semibold">Vehicle Type: All</option>
            <option value="Semi-Truck" className="bg-slate-900 text-white font-semibold">Semi-Truck</option>
            <option value="Box Truck" className="bg-slate-900 text-white font-semibold">Box Truck</option>
            <option value="Van" className="bg-slate-900 text-white font-semibold">Van</option>
            <option value="Mini-Van" className="bg-slate-900 text-white font-semibold">Mini-Van</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <select
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold tracking-tight shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-700 dark:text-slate-355 cursor-pointer transition-colors"
          >
            <option value="All" className="bg-slate-900 text-white font-semibold">Status: All</option>
            <option value="Available" className="bg-slate-900 text-white font-semibold">Available</option>
            <option value="On Trip" className="bg-slate-900 text-white font-semibold">On Trip</option>
            <option value="In Shop" className="bg-slate-900 text-white font-semibold">In Shop</option>
            <option value="Retired" className="bg-slate-900 text-white font-semibold">Retired</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <select
            value={filters.region}
            onChange={(e) => onChange('region', e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold tracking-tight shadow-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-700 dark:text-slate-355 cursor-pointer transition-colors"
          >
            <option value="All" className="bg-slate-900 text-white font-semibold">Region: All</option>
            <option value="North" className="bg-slate-900 text-white font-semibold">North</option>
            <option value="South" className="bg-slate-900 text-white font-semibold">South</option>
            <option value="East" className="bg-slate-900 text-white font-semibold">East</option>
            <option value="West" className="bg-slate-900 text-white font-semibold">West</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
