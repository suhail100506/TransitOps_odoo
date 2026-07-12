import React from 'react';
import { CheckCircle2, Loader2, UserMinus, UserX } from 'lucide-react';

const DriverStatusBadge = ({ status }) => {
  switch (status) {
    case 'Available':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/15 text-emerald-600 dark:text-emerald-450"><CheckCircle2 className="h-3 w-3" /> Available</span>;
    case 'On Trip':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/15 text-cyan-600 dark:text-cyan-400"><Loader2 className="h-3 w-3 animate-spin" /> On Trip</span>;
    case 'Off Duty':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/30 text-slate-655 dark:text-slate-400"><UserMinus className="h-3 w-3" /> Off Duty</span>;
    case 'Suspended':
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 dark:bg-red-500/20 border border-red-500/15 text-red-600 dark:text-red-405"><UserX className="h-3 w-3" /> Suspended</span>;
    default:
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{status}</span>;
  }
};

export default DriverStatusBadge;
