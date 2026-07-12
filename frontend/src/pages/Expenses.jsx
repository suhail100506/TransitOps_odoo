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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Fuel & Expenses</h1>
        <p className="text-muted-foreground">Log fuel top-ups, highway tolls, and incidental operating costs.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="fuel" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" /> Fuel Logs
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Road Expenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Form */}
            <Card className="col-span-1 border shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Log Fuel Top-up</CardTitle>
                <CardDescription>Record liters and cost of fuel added.</CardDescription>
              </CardHeader>
              <form onSubmit={handleFuelSubmit}>
                <CardContent className="space-y-4">
                  {fuelError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{fuelError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="fuelVeh">Select Vehicle *</Label>
                    <select
                      id="fuelVeh"
                      value={fuelVehicleId}
                      onChange={(e) => setFuelVehicleId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles?.map(v => (
                        <option key={v._id} value={v._id}>{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="liters">Liters *</Label>
                    <Input
                      id="liters"
                      type="number"
                      placeholder="e.g. 45"
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fuelCost">Cost ($) *</Label>
                    <Input
                      id="fuelCost"
                      type="number"
                      placeholder="e.g. 75"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button type="submit" className="w-full flex items-center gap-2" disabled={logFuelMutation.isPending}>
                    <Plus className="h-4 w-4" /> Save Fuel Log
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* List */}
            <Card className="md:col-span-2 border shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Recent Fuel Logs</CardTitle>
                <CardDescription>Overview of recorded fuel consumption records.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                {loadingFuel ? (
                  <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Liters</TableHead>
                        <TableHead className="text-right">Cost ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelLogs?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No fuel logs recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fuelLogs?.map(log => (
                          <TableRow key={log._id}>
                            <TableCell className="font-bold">{log.vehicleId?.regNumber || 'Deleted'}</TableCell>
                            <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">{log.liters} L</TableCell>
                            <TableCell className="text-right font-mono">${log.cost?.toFixed(2)}</TableCell>
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
            <Card className="col-span-1 border shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Log Toll or Fee</CardTitle>
                <CardDescription>Record operational road expenditures.</CardDescription>
              </CardHeader>
              <form onSubmit={handleExpenseSubmit}>
                <CardContent className="space-y-4">
                  {expError && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{expError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="expVeh">Select Vehicle *</Label>
                    <select
                      id="expVeh"
                      value={expVehicleId}
                      onChange={(e) => setExpVehicleId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles?.map(v => (
                        <option key={v._id} value={v._id}>{v.regNumber} - {v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="expType">Expense Type *</Label>
                    <select
                      id="expType"
                      value={expType}
                      onChange={(e) => setExpType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="toll">Highway Toll</option>
                      <option value="other">Other incidentals</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="expAmount">Amount ($) *</Label>
                    <Input
                      id="expAmount"
                      type="number"
                      placeholder="e.g. 15"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  <Button type="submit" className="w-full flex items-center gap-2" disabled={logExpenseMutation.isPending}>
                    <DollarSign className="h-4 w-4" /> Save Expense
                  </Button>
                </CardContent>
              </form>
            </Card>

            {/* List */}
            <Card className="md:col-span-2 border shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Recent Road Expenses</CardTitle>
                <CardDescription>Overview of recorded toll and operational expenditures.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                {loadingExpenses ? (
                  <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No general expenses logged.
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses?.map(exp => (
                          <TableRow key={exp._id}>
                            <TableCell className="font-bold">{exp.vehicleId?.regNumber || 'Deleted'}</TableCell>
                            <TableCell>{new Date(exp.date).toLocaleDateString()}</TableCell>
                            <TableCell className="capitalize">{exp.type}</TableCell>
                            <TableCell className="text-right font-mono">${exp.amount?.toFixed(2)}</TableCell>
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
