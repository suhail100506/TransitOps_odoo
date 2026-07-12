import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DriverFilters = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
      <Input
        placeholder="Search operators, license numbers..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-xs font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm"
      />
    </div>
  );
};

export default DriverFilters;
