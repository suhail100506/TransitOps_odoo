import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Users } from 'lucide-react';
import DriverStatusBadge from './DriverStatusBadge';

const DriverTable = ({ drivers, searchQuery, selectedStatusFilter }) => {
  const getScoreBadge = (score) => {
    if (score >= 90) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/15">{score} / 100</span>;
    if (score >= 75) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15">{score} / 100</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15">{score} / 100</span>;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const filteredDrivers = drivers?.filter(driver => {
    // Search query match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = driver.name.toLowerCase().includes(query);
      const licenseMatch = driver.licenseNumber.toLowerCase().includes(query);
      if (!nameMatch && !licenseMatch) return false;
    }
    // Status match
    if (selectedStatusFilter && driver.status !== selectedStatusFilter) return false;
    return true;
  });

  return (
    <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
          <TableRow>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Driver</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">License Number</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Category</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">License Expiry</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Contact</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Safety Score</TableHead>
            <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!filteredDrivers || filteredDrivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Users className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                  <span>No operators found matching the active criteria.</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredDrivers.map((driver) => {
              const expired = isExpired(driver.licenseExpiryDate);
              return (
                <TableRow key={driver._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                  <TableCell className="font-bold text-slate-900 dark:text-white py-3.5 px-6">{driver.name}</TableCell>
                  <TableCell className="font-mono text-slate-500 dark:text-slate-400 text-xs py-3.5 px-6">{driver.licenseNumber}</TableCell>
                  <TableCell className="text-slate-750 dark:text-slate-300 font-medium py-3.5 px-6">{driver.licenseCategory}</TableCell>
                  <TableCell className={`py-3.5 px-6 font-semibold text-xs ${expired ? 'text-red-500 dark:text-red-400' : 'text-slate-550 dark:text-slate-455'}`}>
                    <span>
                      {new Date(driver.licenseExpiryDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {expired && <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] font-bold tracking-wider uppercase border border-red-500/15">Expired</span>}
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300 py-3.5 px-6">{driver.contactNumber}</TableCell>
                  <TableCell className="py-3.5 px-6">{getScoreBadge(driver.safetyScore)}</TableCell>
                  <TableCell className="py-3.5 px-6">
                    <DriverStatusBadge status={driver.status} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DriverTable;
