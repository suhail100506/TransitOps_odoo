import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, AlertCircle, Plus, Search, Fuel, DollarSign, Calculator } from 'lucide-react';

const Expenses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'financial_analyst' || user?.role === 'admin';

  // Modal states
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpOpen, setIsExpOpen] = useState(false);

  // Form states - Fuel
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelError, setFuelError] = useState('');

  // Form states - Expenses
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('toll');
  const [expAmount, setExpAmount] = useState('');
  const [expError, setExpError] = useState('');

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    }
  });

  // Fetch fuel logs
  const { data: fuelLogs, isLoading: loadingFuel } = useQuery({
    queryKey: ['fuelLogs'],
    queryFn: async () => {
      const res = await api.get('/fuel-logs');
      return res.data;
    }
  });

  // Fetch road expense logs
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses');
      return res.data;
    }
  });

  // Fetch maintenance logs to calculate linked maint cost
  const { data: maintenanceLogs, isLoading: loadingMaint } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
      return res.data;
    }
  });

  // Fetch trips to link expenses and status
  const { data: trips, isLoading: loadingTrips } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips');
      return res.data;
    }
  });

  // Fuel mutation
  const logFuelMutation = useMutation({
    mutationFn: async (log) => {
      const res = await api.post('/fuel-logs', log);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setIsFuelOpen(false);
      resetFuelForm();
    },
    onError: (err) => {
      setFuelError(err.response?.data?.error || 'Failed to log fuel entry.');
    }
  });

  // Expense mutation
  const logExpenseMutation = useMutation({
    mutationFn: async (exp) => {
      const res = await api.post('/expenses', exp);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setIsExpOpen(false);
      resetExpForm();
    },
    onError: (err) => {
      setExpError(err.response?.data?.error || 'Failed to log expense entry.');
    }
  });

  const resetFuelForm = () => {
    setFuelVehicleId('');
    setFuelLiters('');
    setFuelCost('');
    setFuelError('');
  };

  const resetExpForm = () => {
    setExpVehicleId('');
    setExpType('toll');
    setExpAmount('');
    setExpError('');
  };

  const handleFuelSubmit = (e) => {
    e.preventDefault();
    setFuelError('');

    if (!fuelVehicleId || !fuelLiters || !fuelCost) {
      setFuelError('Please fill in all fields.');
      return;
    }

    logFuelMutation.mutate({
      vehicleId: fuelVehicleId,
      liters: Number(fuelLiters),
      cost: Number(fuelCost)
    });
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    setExpError('');

    if (!expVehicleId || !expType || !expAmount) {
      setExpError('Please fill in all fields.');
      return;
    }

    logExpenseMutation.mutate({
      vehicleId: expVehicleId,
      type: expType,
      amount: Number(expAmount)
    });
  };

  const getTripStatusBadge = (status) => {
    switch (status) {
      case 'Available':
      case 'Dispatched':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-450 font-bold">Available</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/10 border border-slate-900/15 text-slate-700 dark:bg-slate-800 dark:text-slate-400 font-bold">Completed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400">{status}</span>;
    }
  };

  // Filter fuel logs by search query
  const filteredFuel = fuelLogs?.filter(log => {
    const term = searchQuery.toLowerCase();
    return log.vehicleId?.regNumber?.toLowerCase().includes(term) || log.vehicleId?.name?.toLowerCase().includes(term);
  }) || [];

  // Map trips to detailed road expenses dynamically
  const roadExpenses = trips?.map((trip, idx) => {
    const vExpenses = expenses?.filter(e => e.vehicleId?._id === trip.vehicleId?._id) || [];
    const toll = vExpenses.filter(e => e.type === 'toll').reduce((sum, e) => sum + e.amount, 0);
    const other = vExpenses.filter(e => e.type === 'other').reduce((sum, e) => sum + e.amount, 0);

    const vMaintenance = maintenanceLogs?.filter(m => m.vehicleId?._id === trip.vehicleId?._id) || [];
    const maint = vMaintenance.reduce((sum, m) => sum + m.cost, 0);

    return {
      tripId: `TR${(idx + 1).toString().padStart(3, '0')}`,
      vehicle: trip.vehicleId?.regNumber || '—',
      vehicleName: trip.vehicleId?.name || '',
      toll,
      other,
      maint,
      total: toll + other + maint,
      status: trip.status === 'Dispatched' ? 'Available' : trip.status === 'Draft' ? 'Draft' : 'Completed'
    };
  }) || [];

  // Filter road expenses by search query
  const filteredRoadExpenses = roadExpenses.filter(item => {
    const term = searchQuery.toLowerCase();
    return item.vehicle.toLowerCase().includes(term) || item.tripId.toLowerCase().includes(term) || item.vehicleName.toLowerCase().includes(term);
  });

  // Calculate grand totals
  const grandFuelCost = fuelLogs?.reduce((sum, f) => sum + f.cost, 0) || 0;
  const grandMaintCost = maintenanceLogs?.reduce((sum, m) => sum + m.cost, 0) || 0;
  const grandRoadExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const grandTotal = grandFuelCost + grandMaintCost + grandRoadExpenses;

  const isPageLoading = loadingFuel || loadingExpenses || loadingMaint || loadingTrips;

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading ledger metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Fuel & Expense Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log fuel refills and review operational road expenditures.</p>
        </div>

        {/* Action button triggers */}
        {isManager && (
          <div className="flex items-center gap-3">
            <Dialog open={isFuelOpen} onOpenChange={(open) => { setIsFuelOpen(open); if (!open) resetFuelForm(); }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] cursor-pointer">
                  <Plus className="h-4 w-4" /> Log Fuel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Log Fuel Top-up</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">Record fuel liters and cost metrics for a vehicle.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleFuelSubmit} className="space-y-4 py-3">
                  {fuelError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{fuelError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="logFuelVeh" className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Select Vehicle *</Label>
                    <select
                      id="logFuelVeh"
                      value={fuelVehicleId}
                      onChange={(e) => setFuelVehicleId(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="" className="bg-slate-900 text-white font-semibold">-- Choose Vehicle --</option>
                      {vehicles?.map(v => (
                        <option key={v._id} value={v._id} className="bg-slate-900 text-white font-semibold">{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logFuelLiters" className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Liters *</Label>
                    <Input
                      id="logFuelLiters"
                      type="number"
                      placeholder="e.g. 45"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logFuelCost" className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Cost ($) *</Label>
                    <Input
                      id="logFuelCost"
                      type="number"
                      placeholder="e.g. 150"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
                      required
                    />
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 text-xs font-semibold" disabled={logFuelMutation.isPending}>
                      {logFuelMutation.isPending ? 'Saving...' : 'Save Fuel Log'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isExpOpen} onOpenChange={(open) => { setIsExpOpen(open); if (!open) resetExpForm(); }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm active:scale-[0.98] cursor-pointer">
                  <Plus className="h-4 w-4" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Log Toll or Fee</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">Record highway tolls or general operational expenses.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4 py-3">
                  {expError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{expError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="logExpVeh" className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Select Vehicle *</Label>
                    <select
                      id="logExpVeh"
                      value={expVehicleId}
                      onChange={(e) => setExpVehicleId(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="" className="bg-slate-900 text-white font-semibold font-semibold">-- Choose Vehicle --</option>
                      {vehicles?.map(v => (
                        <option key={v._id} value={v._id} className="bg-slate-900 text-white font-semibold font-semibold">{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logExpType" className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Expense Type *</Label>
                    <select
                      id="logExpType"
                      value={expType}
                      onChange={(e) => setExpType(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="toll" className="bg-slate-900 text-white font-semibold">Highway Toll</option>
                      <option value="other" className="bg-slate-900 text-white font-semibold">Other incidentals</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logExpAmount" className="text-xs font-semibold uppercase tracking-wider text-slate-550 dark:text-slate-400">Amount ($) *</Label>
                    <Input
                      id="logExpAmount"
                      type="number"
                      placeholder="e.g. 50"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
                      required
                    />
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 text-xs font-semibold" disabled={logExpenseMutation.isPending}>
                      {logExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Search Input Control */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <Input
          placeholder="Search by vehicle reg..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-xs font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm"
        />
      </div>

      {/* FUEL LOGS TABLE CARD */}
      <Card className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Fuel Logs</h2>
          <p className="text-[11px] text-slate-550">Recorded liters and fuel top-up costs for fleet assets.</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
              <TableRow>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6">Vehicle</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6">Date</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6 text-right">Liters</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6 text-right">Fuel Cost ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFuel.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Fuel className="h-8 w-8 stroke-[1.5] text-slate-350" />
                      <span>No fuel logs match the search query.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFuel.map(log => (
                  <TableRow key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                    <TableCell className="py-4 px-6">
                      {log.vehicleId ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">{log.vehicleId.regNumber}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{log.vehicleId.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-450 text-xs italic font-semibold">Deleted Vehicle</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-550 dark:text-slate-400 py-4 px-6 font-semibold">
                      {new Date(log.date || log.createdAt).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 dark:text-slate-300 font-bold py-4 px-6">{log.liters} L</TableCell>
                    <TableCell className="text-right text-slate-900 dark:text-white font-bold py-4 px-6">${log.cost?.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* OTHER EXPENSES TABLE CARD */}
      <Card className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Other Expenses (Toll / Misc)</h2>
          <p className="text-[11px] text-slate-550">Toll gates, maintenance linked, and incidental operational charges.</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
              <TableRow>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6">Trip</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6">Vehicle</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6 text-right">Toll ($)</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6 text-right">Other ($)</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6 text-right">Maint. (Linked) ($)</TableHead>
                <TableHead className="font-bold text-slate-550 dark:text-slate-450 py-3.5 px-6 text-center">Total / Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoadExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DollarSign className="h-8 w-8 stroke-[1.5] text-slate-350" />
                      <span>No linked operational expenses match the search query.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoadExpenses.map((item) => (
                  <TableRow key={item.tripId} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                    <TableCell className="font-bold text-slate-900 dark:text-white py-4 px-6">{item.tripId}</TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">{item.vehicle}</span>
                        {item.vehicleName && <span className="text-[10px] text-slate-400 font-semibold">{item.vehicleName}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-800 dark:text-slate-200 font-bold py-4 px-6">${item.toll.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-800 dark:text-slate-200 font-bold py-4 px-6">${item.other.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-800 dark:text-slate-200 font-bold py-4 px-6">${item.maint.toLocaleString()}</TableCell>
                    <TableCell className="py-4 px-6 text-center flex flex-col items-center justify-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">${item.total.toLocaleString()}</span>
                      {getTripStatusBadge(item.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* TOTAL OPERATIONAL COST (AUTO) */}
      <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2.5">
          <Calculator className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Operational Cost (Auto) = Fuel + Maint + Road Expenses</span>
        </div>
        <span className="text-2xl font-extrabold text-amber-500">${grandTotal.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default Expenses;
