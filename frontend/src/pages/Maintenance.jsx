import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, Plus, AlertCircle, Wrench, CheckCircle, ShieldAlert } from 'lucide-react';

const Maintenance = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch maintenance tickets
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      const res = await api.get('/maintenance');
      return res.data;
    }
  });

  // Fetch all vehicles to populate dropdown
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    },
    enabled: isOpen
  });

  // Open ticket mutation
  const openTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      const res = await api.post('/maintenance', ticketData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setIsOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to create maintenance ticket.');
    }
  });

  // Close ticket mutation
  const closeTicketMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/maintenance/${id}/close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to close ticket.');
    }
  });

  const resetForm = () => {
    setVehicleId('');
    setDescription('');
    setCost('');
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!vehicleId || !description) {
      setFormError('Please select a vehicle and describe the issue.');
      return;
    }

    openTicketMutation.mutate({
      vehicleId,
      description,
      cost: cost ? Number(cost) : 0
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/15 text-amber-600 dark:text-amber-400"><Wrench className="h-3 w-3" /> In Progress</span>;
      case 'Closed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Closed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading maintenance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl max-w-xl mx-auto border border-red-500/15 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failed to load maintenance records</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Maintenance Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log vehicle breakdowns, maintenance work, and service costs.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger
            render={
              <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-955 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98]" />
            }
          >
            <Plus className="h-4 w-4" /> Open Maintenance Ticket
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Open Service Ticket</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                Puts a vehicle in 'In Shop' status to exclude it from dispatching.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="mVehicle" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Vehicle *</Label>
                <select
                  id="mVehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                  required
                >
                  <option value="" className="bg-slate-900 text-white">-- Select Fleet Asset --</option>
                  {vehicles?.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v._id} value={v._id} className="bg-slate-900 text-white">
                      {v.regNumber} - {v.name} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mDescription" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issue / Service Details *</Label>
                <Input
                  id="mDescription"
                  placeholder="e.g. 50k km Engine oil & filter replacement"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mCost" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Estimated Cost ($)</Label>
                <Input
                  id="mCost"
                  type="number"
                  placeholder="250"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                />
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 font-semibold shadow" disabled={openTicketMutation.isPending}>
                  {openTicketMutation.isPending ? 'Submitting...' : 'Open Ticket'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
            <TableRow>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Vehicle</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Service Description</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-right">Cost ($)</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Status</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6">Opened At</TableHead>
              <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-6 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Wrench className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                    <span>No maintenance records.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                  <TableCell className="py-3.5 px-6">
                    {log.vehicleId ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">{log.vehicleId.regNumber}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{log.vehicleId.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Deleted Vehicle</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-750 dark:text-slate-300 font-medium py-3.5 px-6">{log.description}</TableCell>
                  <TableCell className="text-right font-mono text-slate-800 dark:text-slate-200 font-medium py-3.5 px-6">${log.cost?.toLocaleString()}</TableCell>
                  <TableCell className="py-3.5 px-6">{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 py-3.5 px-6">
                    {new Date(log.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="py-3.5 px-6 text-center">
                    {log.status === 'Open' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeTicketMutation.mutate(log._id)}
                        className="text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/5 h-8.5 rounded-xl px-3 font-semibold text-xs transition-all duration-200 active:scale-[0.98]"
                      >
                        Close & Release
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
                        Closed on {new Date(log.closedAt).toLocaleDateString()}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Maintenance;
