import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2, ShieldAlert, Save } from 'lucide-react';

const Settings = () => {
  // General settings local state initialized from localStorage
  const [depotName, setDepotName] = useState(() => localStorage.getItem('setting_depot_name') || '');
  const [currency, setCurrency] = useState(() => localStorage.getItem('setting_currency') || '');
  const [distanceUnit, setDistanceUnit] = useState(() => localStorage.getItem('setting_distance_unit') || '');
  
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('setting_depot_name', depotName || 'Gandhinagar Depot GJ4');
    localStorage.setItem('setting_currency', currency || 'INR (Rs)');
    localStorage.setItem('setting_distance_unit', distanceUnit || 'Kilometers');
    setSuccessMsg('General settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // RBAC matrix definition matching the mockup
  const rbacData = [
    {
      role: 'Fleet Manager',
      fleet: 'check',
      drivers: 'check',
      trips: 'dash',
      fuel: 'dash',
      analytics: 'check'
    },
    {
      role: 'Dispatcher',
      fleet: 'view',
      drivers: 'dash',
      trips: 'check',
      fuel: 'dash',
      analytics: 'dash'
    },
    {
      role: 'Safety Officer',
      fleet: 'dash',
      drivers: 'check',
      trips: 'view',
      fuel: 'dash',
      analytics: 'dash'
    },
    {
      role: 'Financial Analyst',
      fleet: 'view',
      drivers: 'dash',
      trips: 'dash',
      fuel: 'check',
      analytics: 'check'
    }
  ];

  const renderCell = (val) => {
    switch (val) {
      case 'check':
        return <span className="text-emerald-500 font-bold text-base">✓</span>;
      case 'view':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">view</span>;
      case 'dash':
      default:
        return <span className="text-slate-350 dark:text-slate-600 font-medium">—</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure general registry options and view access control configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: GENERAL Form */}
        <div className="lg:col-span-5 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">General</h2>
            <p className="text-[11px] text-slate-550 mt-0.5">Depot details, operating currencies, and metrics system.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="depotName" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Depot Name</Label>
              <Input
                id="depotName"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                placeholder="Gandhinagar Depot GJ4"
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="INR (Rs)"
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="distanceUnit" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Distance Unit</Label>
              <Input
                id="distanceUnit"
                value={distanceUnit}
                onChange={(e) => setDistanceUnit(e.target.value)}
                placeholder="Kilometers"
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
              />
            </div>

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm mt-6 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </form>
        </div>

        {/* Right Column: ROLE-BASED ACCESS (RBAC) */}
        <div className="lg:col-span-7 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Role-Based Access (RBAC)</h2>
            <p className="text-[11px] text-slate-550 mt-0.5">Authorization permissions matrix mapped across operational departments.</p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
                <TableRow>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3 px-4">Role</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3 px-4 text-center">Fleet</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3 px-4 text-center">Drivers</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3 px-4 text-center">Trips</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3 px-4 text-center">Fuel/Exp.</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3 px-4 text-center">Analytics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rbacData.map((row) => (
                  <TableRow key={row.role} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900/80 last:border-0">
                    <TableCell className="font-bold text-slate-850 dark:text-slate-300 py-3 px-4">{row.role}</TableCell>
                    <TableCell className="text-center py-3 px-4">{renderCell(row.fleet)}</TableCell>
                    <TableCell className="text-center py-3 px-4">{renderCell(row.drivers)}</TableCell>
                    <TableCell className="text-center py-3 px-4">{renderCell(row.trips)}</TableCell>
                    <TableCell className="text-center py-3 px-4">{renderCell(row.fuel)}</TableCell>
                    <TableCell className="text-center py-3 px-4">{renderCell(row.analytics)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
