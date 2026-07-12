import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, Plus, DollarSign, Fuel, Receipt } from 'lucide-react';

const Expenses = () => {
  const queryClient = useQueryClient();

  // Active tab state
  const [activeTab, setActiveTab] = useState('fuel');

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

  // Fetch expense logs
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await api.get('/expenses');
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
      setFuelVehicleId('');
      setFuelLiters('');
      setFuelCost('');
      setFuelError('');
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
      setExpVehicleId('');
      setExpType('toll');
      setExpAmount('');
      setExpError('');
    },
    onError: (err) => {
      setExpError(err.response?.data?.error || 'Failed to log expense entry.');
    }
  });

  const handleFuelSubmit = (e) => {
    e.preventDefault();
    setFuelError('');

    if (!fuelVehicleId || !fuelLiters || !fuelCost) {
      setFuelError('Please provide all details.');
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
      setExpError('Please provide all details.');
      return;
    }

    logExpenseMutation.mutate({
      vehicleId: expVehicleId,
      type: expType,
      amount: Number(expAmount)
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Fuel & Expenses</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log fuel top-ups, highway tolls, and incidental operating costs.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6">
          <TabsTrigger value="fuel" className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-cyan-500">
            <Fuel className="h-4 w-4" /> Fuel Logs
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm data-[state=active]:text-cyan-500">
            <Receipt className="h-4 w-4" /> Road Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Form */}
            <Card className="col-span-1 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Log Fuel Top-up</CardTitle>
                <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Record liters and cost of fuel added.</CardDescription>
              </CardHeader>
              <form onSubmit={handleFuelSubmit}>
                <CardContent className="space-y-4 pb-6">
                  {fuelError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{fuelError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="fuelVeh" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Vehicle *</Label>
                    <select
                      id="fuelVeh"
                      value={fuelVehicleId}
                      onChange={(e) => setFuelVehicleId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="" className="bg-slate-900 text-white">-- Choose Vehicle --</option>
                      {vehicles?.map(v => (
                        <option key={v._id} value={v._id} className="bg-slate-900 text-white">{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="liters" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Liters *</Label>
                    <Input
                      id="liters"
                      type="number"
                      placeholder="e.g. 45"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10 px-3.5"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fuelCost" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost ($) *</Label>
                    <Input
                      id="fuelCost"
                      type="number"
                      placeholder="e.g. 75"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10 px-3.5"
                      required
                    />
                  </div>
                </CardContent>
                <CardContent className="pt-0 pb-6 px-6">
                  <Button type="submit" className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" disabled={logFuelMutation.isPending}>
                    {logFuelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save Fuel Log
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* List */}
            <Card className="md:col-span-2 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Recent Fuel Logs</CardTitle>
                <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Overview of recorded fuel consumption records.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-slate-100 dark:border-slate-900/80">
                {loadingFuel ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Vehicle</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Date</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Liters</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Cost ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Fuel className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-750" />
                              <span>No fuel logs recorded.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        fuelLogs?.map(log => (
                          <TableRow key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                            <TableCell className="font-bold text-slate-900 dark:text-white py-3.5 px-6">{log.vehicleId?.regNumber || 'Deleted'}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 py-3.5 px-6">{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium py-3.5 px-6">{log.liters} L</TableCell>
                            <TableCell className="text-right text-slate-800 dark:text-slate-200 font-mono font-medium py-3.5 px-6">${log.cost?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expense" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Form */}
            <Card className="col-span-1 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Log Toll or Fee</CardTitle>
                <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Record operational road expenditures.</CardDescription>
              </CardHeader>
              <form onSubmit={handleExpenseSubmit}>
                <CardContent className="space-y-4 pb-6">
                  {expError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{expError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="expVeh" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Vehicle *</Label>
                    <select
                      id="expVeh"
                      value={expVehicleId}
                      onChange={(e) => setExpVehicleId(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="" className="bg-slate-900 text-white">-- Choose Vehicle --</option>
                      {vehicles?.map(v => (
                        <option key={v._id} value={v._id} className="bg-slate-900 text-white">{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expType" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expense Type *</Label>
                    <select
                      id="expType"
                      value={expType}
                      onChange={(e) => setExpType(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="toll" className="bg-slate-900 text-white">Highway Toll</option>
                      <option value="other" className="bg-slate-900 text-white">Other incidentals</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expAmount" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Amount ($) *</Label>
                    <Input
                      id="expAmount"
                      type="number"
                      placeholder="e.g. 15"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10 px-3.5"
                      required
                    />
                  </div>
                </CardContent>
                <CardContent className="pt-0 pb-6 px-6">
                  <Button type="submit" className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]" disabled={logExpenseMutation.isPending}>
                    {logExpenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />} Save Expense
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* List */}
            <Card className="md:col-span-2 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Recent Road Expenses</CardTitle>
                <CardDescription className="text-xs text-slate-400 dark:text-slate-500">Overview of recorded toll and operational expenditures.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t border-slate-100 dark:border-slate-900/80">
                {loadingExpenses ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
                      <TableRow>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Vehicle</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Date</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Type</TableHead>
                        <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Amount ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <DollarSign className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-750" />
                              <span>No general expenses logged.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses?.map(exp => (
                          <TableRow key={exp._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                            <TableCell className="font-bold text-slate-900 dark:text-white py-3.5 px-6">{exp.vehicleId?.regNumber || 'Deleted'}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 py-3.5 px-6">{new Date(exp.date).toLocaleDateString()}</TableCell>
                            <TableCell className="capitalize text-slate-700 dark:text-slate-300 py-3.5 px-6">{exp.type}</TableCell>
                            <TableCell className="text-right text-slate-800 dark:text-slate-200 font-mono font-medium py-3.5 px-6">${exp.amount?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
