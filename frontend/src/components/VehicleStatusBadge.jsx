import React from 'react';
import { Loader2, Wrench, CheckCircle2, ShieldAlert } from 'lucide-react';

const VehicleStatusBadge = ({ status }) => {
  switch (status) {
    case 'Available':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/15 text-emerald-600 dark:text-emerald-450"><CheckCircle2 className="h-3 w-3" /> Available</span>;
    case 'On Trip':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/15 text-cyan-600 dark:text-cyan-400"><Loader2 className="h-3 w-3 animate-spin" /> On Trip</span>;
    case 'In Shop':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/15 text-amber-600 dark:text-amber-450"><Wrench className="h-3 w-3" /> In Shop</span>;
    case 'Retired':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 dark:bg-red-500/20 border border-red-500/15 text-red-600 dark:text-red-400"><ShieldAlert className="h-3 w-3" /> Retired</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{status}</span>;
  }
};

export default VehicleStatusBadge;
