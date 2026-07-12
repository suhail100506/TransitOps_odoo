import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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
import { Loader2, AlertCircle, Wrench, CheckCircle, Search, Save } from 'lucide-react';

const Maintenance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'fleet_manager' || user?.role === 'admin';

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusVal, setStatusVal] = useState('Open');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    }
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
      setFormSuccess('Maintenance record logged successfully!');
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to log maintenance record.');
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
    // keep statusVal and date default
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!isManager) {
      setFormError('Access denied. Only Fleet Managers or Admins can log service records.');
      return;
    }

    if (!vehicleId || !description) {
      setFormError('Please select a vehicle and specify service details.');
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
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/15 text-amber-600 dark:text-amber-450 font-bold">In Shop</span>;
      case 'Closed':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-450 font-bold">Completed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{status}</span>;
    }
  };

  // Filter logs based on search query
  const filteredLogs = logs?.filter(log => {
    const term = searchQuery.toLowerCase();
    const regNum = log.vehicleId?.regNumber?.toLowerCase() || '';
    const name = log.vehicleId?.name?.toLowerCase() || '';
    const desc = log.description?.toLowerCase() || '';
    return regNum.includes(term) || name.includes(term) || desc.includes(term);
  }) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading maintenance console...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl max-w-xl mx-auto border border-red-500/15 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failed to load maintenance registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Maintenance Operations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log vehicle breakdowns, scheduled checkups, and repair costs.</p>
        </div>

        {/* Search bar matching layout */}
        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            placeholder="Search service logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-xs font-semibold focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-sm"
          />
        </div>
      </div>

      {/* Grid split pane layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: LOG SERVICE RECORD */}
        <div className="lg:col-span-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Log Service Record</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Report breakdown diagnostics or log scheduled maintenance.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="logVehicle" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vehicle *</Label>
              <select
                id="logVehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={!isManager}
                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                required
              >
                <option value="" className="bg-slate-900 text-white font-semibold">-- Select Fleet Asset --</option>
                {vehicles?.filter(v => v.status !== 'Retired').map(v => (
                  <option key={v._id} value={v._id} className="bg-slate-900 text-white font-semibold">
                    {v.regNumber} - {v.name} ({v.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logServiceType" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Service Type *</Label>
              <Input
                id="logServiceType"
                placeholder="e.g. Oil Change, Engine Repair"
                value={description}
                disabled={!isManager}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logCost" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cost ($)</Label>
              <Input
                id="logCost"
                type="number"
                placeholder="e.g. 2500"
                value={cost}
                disabled={!isManager}
                onChange={(e) => setCost(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logDate" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</Label>
              <Input
                id="logDate"
                type="date"
                value={date}
                disabled={!isManager}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-11 text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logStatus" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</Label>
              <select
                id="logStatus"
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                disabled={true} // Defaults to 'Open' (In Shop) upon creation based on business flows
                className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-550 dark:text-slate-400 shadow-sm cursor-not-allowed"
              >
                <option value="Open">In Shop</option>
              </select>
            </div>

            {isManager && (
              <Button
                type="submit"
                disabled={openTicketMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm mt-6 cursor-pointer"
              >
                <Save className="h-4 w-4" /> {openTicketMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            )}
          </form>
        </div>

        {/* Right column: SERVICE LOG Table */}
        <div className="lg:col-span-8 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Service Log</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">History of maintenance activities and currently active shop operations.</p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
                <TableRow>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3.5 px-6">Vehicle</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3.5 px-6">Service</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3.5 px-6 text-right">Cost ($)</TableHead>
                  <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3.5 px-6">Status</TableHead>
                  {isManager && <TableHead className="font-bold text-slate-550 dark:text-slate-400 py-3.5 px-6 text-center">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 5 : 4} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Wrench className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                        <span>No service records match the filter criteria.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors">
                      <TableCell className="py-4 px-6">
                        {log.vehicleId ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white">{log.vehicleId.regNumber}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{log.vehicleId.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic font-medium">Deleted Vehicle</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300 font-bold py-4 px-6">{log.description}</TableCell>
                      <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200 py-4 px-6">${log.cost?.toLocaleString()}</TableCell>
                      <TableCell className="py-4 px-6">{getStatusBadge(log.status)}</TableCell>
                      {isManager && (
                        <TableCell className="py-4 px-6 text-center">
                          {log.status === 'Open' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => closeTicketMutation.mutate(log._id)}
                              className="text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 hover:bg-emerald-500/5 h-8.5 rounded-xl px-3 font-semibold text-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                            >
                              Complete
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                              Done ({new Date(log.closedAt || log.updatedAt).toLocaleDateString()})
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
