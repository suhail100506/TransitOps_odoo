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
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Wrench className="h-3 w-3" /> In Progress</span>;
      case 'Closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3" /> Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading maintenance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg max-w-xl mx-auto border border-destructive/20 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Failed to load maintenance records</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Maintenance Operations</h1>
          <p className="text-muted-foreground">Log vehicle breakdowns, maintenance work, and service costs.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Open Maintenance Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Open Service Ticket</DialogTitle>
              <DialogDescription>
                Puts a vehicle in 'In Shop' status to exclude it from dispatching.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="mVehicle">Select Vehicle *</Label>
                <select
                  id="mVehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">-- Select Fleet Asset --</option>
                  {vehicles?.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v._id} value={v._id}>
                      {v.regNumber} - {v.name} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mDescription">Issue / Service Details *</Label>
                <Input
                  id="mDescription"
                  placeholder="e.g. 50k km Engine oil & filter replacement"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mCost">Estimated Cost ($)</Label>
                <Input
                  id="mCost"
                  type="number"
                  placeholder="250"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={openTicketMutation.isPending}>
                  {openTicketMutation.isPending ? 'Submitting...' : 'Open Ticket'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Service Description</TableHead>
              <TableHead className="text-right">Cost ($)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Opened At</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No maintenance records.
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>
                    {log.vehicleId ? (
                      <div>
                        <div className="font-bold">{log.vehicleId.regNumber}</div>
                        <div className="text-xs text-muted-foreground">{log.vehicleId.name}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Deleted Vehicle</span>
                    )}
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell className="text-right font-mono">${log.cost?.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.status === 'Open' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeTicketMutation.mutate(log._id)}
                        className="text-green-600 border-green-200 hover:bg-green-50 h-8"
                      >
                        Close & Release
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
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
