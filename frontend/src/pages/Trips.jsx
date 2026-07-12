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
import {
  Loader2,
  Plus,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  MapPin,
  Scale,
  Calendar,
  Layers
} from 'lucide-react';

const Trips = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [completeTripId, setCompleteTripId] = useState(null);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);

  // Creation Form states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [formError, setFormError] = useState('');

  // Completion Form states
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completeError, setCompleteError] = useState('');

  // Fetch all trips
  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips');
      return res.data;
    }
  });

  // Fetch available vehicles for dispatch assignment
  const { data: availableVehicles } = useQuery({
    queryKey: ['availableVehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles/available');
      return res.data;
    },
    enabled: isOpen // Fetch only when dialog opens
  });

  // Fetch available drivers for dispatch assignment
  const { data: availableDrivers } = useQuery({
    queryKey: ['availableDrivers'],
    queryFn: async () => {
      const res = await api.get('/drivers/available');
      return res.data;
    },
    enabled: isOpen
  });

  // Trip operations mutations
  const createTripMutation = useMutation({
    mutationFn: async (newTrip) => {
      const res = await api.post('/trips', newTrip);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setIsOpen(false);
      resetCreateForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to create trip.');
    }
  });

  const dispatchTripMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/trips/${id}/dispatch`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Dispatch failed.');
    }
  });

  const completeTripMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.post(`/trips/${id}/complete`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setCompleteTripId(null);
      setFinalOdometer('');
      setFuelConsumed('');
      setCompleteError('');
    },
    onError: (err) => {
      setCompleteError(err.response?.data?.error || 'Failed to log completion.');
    }
  });

  const cancelTripMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/trips/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Cancellation failed.');
    }
  });

  const resetCreateForm = () => {
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setFormError('');
  };

  const handleCreateTrip = (e) => {
    e.preventDefault();
    setFormError('');

    if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      setFormError('Please fill in all required fields.');
      return;
    }

    createTripMutation.mutate({
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance)
    });
  };

  const handleCompleteTripSubmit = (e) => {
    e.preventDefault();
    setCompleteError('');

    if (!finalOdometer || !fuelConsumed) {
      setCompleteError('Please provide both odometer and fuel consumption figures.');
      return;
    }

    completeTripMutation.mutate({
      id: completeTripId,
      data: {
        finalOdometer: Number(finalOdometer),
        fuelConsumed: Number(fuelConsumed)
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/30 text-slate-600 dark:text-slate-400">Draft</span>;
      case 'Dispatched':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/15 text-cyan-600 dark:text-cyan-400"><Loader2 className="h-3 w-3 animate-spin" /> In Transit</span>;
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3.5 w-3.5" /> Completed</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 dark:bg-red-500/20 border border-red-500/15 text-red-600 dark:text-red-400"><XCircle className="h-3.5 w-3.5" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{status}</span>;
    }
  };

  const selectedVehicleObj = availableVehicles?.find(v => v._id === vehicleId);
  const vehicleCapacity = selectedVehicleObj ? selectedVehicleObj.maxLoadCapacity : 0;
  const isOverCapacity = vehicleCapacity > 0 && cargoWeight && Number(cargoWeight) > vehicleCapacity;
  const excessWeight = isOverCapacity ? Number(cargoWeight) - vehicleCapacity : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading transit logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl max-w-xl mx-auto border border-red-500/15 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failed to load trips registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Trip Dispatch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Coordinate, schedule, and track transit routes.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Create Trip Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-5xl w-full p-0 overflow-hidden rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 h-full max-h-[85vh]">
              {/* Left Column (Form) */}
              <div className="lg:col-span-3 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-900/80 overflow-y-auto max-h-[80vh] flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Create Trip</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure routes and assign vehicle & driver capacity.</p>
                  </div>

                  <form onSubmit={handleCreateTrip} className="space-y-4">
                    {formError && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="source" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Source *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <Input
                            id="source"
                            placeholder="City, State"
                            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="destination" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Destination *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <Input
                            id="destination"
                            placeholder="City, State"
                            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="cargoWeight" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cargo Weight (kg) *</Label>
                        <div className="relative">
                          <Scale className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <Input
                            id="cargoWeight"
                            type="number"
                            placeholder="500"
                            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                            value={cargoWeight}
                            onChange={(e) => setCargoWeight(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="distance" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Planned Dist (km) *</Label>
                        <div className="relative">
                          <Layers className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <Input
                            id="distance"
                            type="number"
                            placeholder="350"
                            className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                            value={plannedDistance}
                            onChange={(e) => setPlannedDistance(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="vehicleSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Vehicle *</Label>
                      <select
                        id="vehicleSelect"
                        value={vehicleId}
                        onChange={(e) => setVehicleId(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                        required
                      >
                        <option value="" className="bg-slate-900 text-white font-semibold">-- Choose Available Vehicle --</option>
                        {availableVehicles?.map(v => (
                          <option key={v._id} value={v._id} className="bg-slate-900 text-white font-semibold">
                            {v.regNumber} - {v.name} (Max: {v.maxLoadCapacity} kg)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="driverSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Select Driver *</Label>
                      <select
                        id="driverSelect"
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                        required
                      >
                        <option value="" className="bg-slate-900 text-white font-semibold">-- Choose Available Driver --</option>
                        {availableDrivers?.map(d => (
                          <option key={d._id} value={d._id} className="bg-slate-900 text-white font-semibold">
                            {d.name} (Score: {d.safetyScore})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Capacity warning indicator block */}
                    {isOverCapacity && (
                      <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400 space-y-1 text-xs">
                        <div className="font-bold">Vehicle Capacity: {vehicleCapacity} kg</div>
                        <div className="font-bold">Cargo Weight: {cargoWeight} kg</div>
                        <div className="flex items-center gap-1.5 font-bold mt-1 text-[11px]">
                          <AlertCircle className="h-4 w-4" /> Capacity exceeded by {excessWeight} kg — dispatch blocked
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900/80">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsOpen(false)}
                        className="rounded-xl px-4 py-2 text-xs font-bold border-slate-200/60 dark:border-slate-800/85 hover:bg-slate-50 dark:hover:bg-slate-900 h-10 min-w-[80px]"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTripMutation.isPending || isOverCapacity}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 text-xs font-bold shadow h-10 min-w-[120px]"
                      >
                        {isOverCapacity ? 'Dispatch (disabled)' : (createTripMutation.isPending ? 'Saving...' : 'Dispatch')}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column (Live Board) */}
              <div className="lg:col-span-2 p-6 bg-slate-50/50 dark:bg-slate-900/20 overflow-y-auto max-h-[80vh] flex flex-col justify-between gap-6 min-h-[500px]">
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-white">Live Board</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Simulator/Live cards mapping */}
                    {(trips && trips.length > 0 ? trips.slice(0, 3) : [
                      { _id: 'TR001', vehicleId: { regNumber: 'VAN-05', name: 'Sprinter' }, driverId: { name: 'Alex' }, source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub', status: 'Dispatched', eta: '45 min' },
                      { _id: 'TR004', vehicleId: { regNumber: 'TRUCK-04', name: 'Volvo FM' }, driverId: { name: 'Suresh' }, source: 'Vatva Industrial Area', destination: 'Sanand Warehouse', status: 'Draft', eta: 'Awaiting driver' },
                      { _id: 'TR006', vehicleId: null, driverId: null, source: 'Mansa', destination: 'Kalol Depot', status: 'Cancelled', eta: 'Vehicle went to shop' }
                    ]).map((card, idx) => {
                      const tripId = card._id.startsWith('TR') ? card._id : `TR${(idx + 1).toString().padStart(3, '0')}`;
                      const vehicleDriver = card.vehicleId ? `${card.vehicleId.regNumber} / ${card.driverId?.name?.toUpperCase() || 'UNASSIGNED'}` : 'Unassigned';
                      const eta = card.eta || (card.status === 'Completed' ? '—' : card.status === 'Draft' ? 'Awaiting driver' : '45 min');
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-900 dark:text-white">{tripId}</span>
                            <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] tracking-tight">{vehicleDriver}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-805 dark:text-slate-200">{card.source} &rarr; {card.destination}</p>
                          <div className="flex items-center justify-between pt-1">
                            {card.status === 'Dispatched' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/15">Dispatched</span>
                            )}
                            {card.status === 'Draft' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 dark:text-slate-400 border border-slate-200">Draft</span>
                            )}
                            {card.status === 'Cancelled' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/15">Cancelled</span>
                            )}
                            {card.status === 'Completed' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">Completed</span>
                            )}
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">{eta}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/80">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-normal">
                    On Complete: odometer &rarr; fuel log &rarr; expenses &rarr; Vehicle & Driver Available
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Completion logger dialog */}
      <Dialog open={!!completeTripId} onOpenChange={(open) => { if (!open) setCompleteTripId(null); }}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Complete Trip</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Log final trip statistics to return assets back to availability.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteTripSubmit} className="space-y-5 py-2">
            {completeError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{completeError}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="finalOdom" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Final Odometer Reading (km) *</Label>
              <Input
                id="finalOdom"
                type="number"
                placeholder="Current odometer + distance"
                value={finalOdometer}
                onChange={(e) => setFinalOdometer(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fuelCons" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Fuel Consumed (Liters) *</Label>
              <Input
                id="fuelCons"
                type="number"
                placeholder="Liters of fuel used"
                value={fuelConsumed}
                onChange={(e) => setFuelConsumed(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                required
              />
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 font-semibold shadow" disabled={completeTripMutation.isPending}>
                {completeTripMutation.isPending ? 'Logging...' : 'Complete & Close'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>      <div className="border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/80">
              <TableRow>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4">Route (Source &rarr; Dest)</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4">Vehicle</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4">Driver</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4 text-right">Weight</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4 text-right">Distance</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4">Status</TableHead>
                <TableHead className="font-semibold text-slate-600 dark:text-slate-300 py-3.5 px-4 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-slate-700" />
                      <span>No trips scheduled yet.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                trips?.map((trip) => (
                  <TableRow 
                    key={trip._id} 
                    onClick={() => setSelectedTripDetails(trip)}
                    className="cursor-pointer hover:bg-slate-50/40 dark:hover:bg-slate-900/40 border-b border-slate-100 dark:border-slate-900/80 last:border-0 transition-colors"
                  >
                    <TableCell className="font-bold text-slate-900 dark:text-white py-3.5 px-4">
                      <span className="flex items-center gap-2">
                        <span>{trip.source}</span>
                        <span className="text-slate-400 font-normal">&rarr;</span>
                        <span>{trip.destination}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      {trip.vehicleId ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white">{trip.vehicleId.regNumber}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{trip.vehicleId.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Deleted</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-705 dark:text-slate-300 font-medium py-3.5 px-4">
                      {trip.driverId ? trip.driverId.name : <span className="text-slate-400 text-xs italic">Deleted</span>}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium py-3.5 px-4">{trip.cargoWeight.toLocaleString()} kg</TableCell>
                    <TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium py-3.5 px-4">
                      {trip.status === 'Completed' ? `${trip.actualDistance} km (actual)` : `${trip.plannedDistance} km (planned)`}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">{getStatusBadge(trip.status)}</TableCell>
                    <TableCell className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {trip.status === 'Draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => { e.stopPropagation(); dispatchTripMutation.mutate(trip._id); }}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1 h-8 rounded-xl px-3 font-semibold text-xs shadow-sm"
                            >
                              <Play className="h-3 w-3" /> Dispatch
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); cancelTripMutation.mutate(trip._id); }}
                              className="text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30 hover:bg-red-500/5 h-8 rounded-xl px-3 font-semibold text-xs"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {trip.status === 'Dispatched' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={(e) => { e.stopPropagation(); setCompleteTripId(trip._id); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 h-8 rounded-xl px-3 font-semibold text-xs shadow-sm"
                            >
                              <CheckCircle className="h-3 w-3" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); cancelTripMutation.mutate(trip._id); }}
                              className="text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-500/30 hover:bg-red-500/5 h-8 rounded-xl px-3 font-semibold text-xs"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {['Completed', 'Cancelled'].includes(trip.status) && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">Closed</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Trip Details & Lifecycle Modal */}
      <Dialog open={!!selectedTripDetails} onOpenChange={(open) => { if (!open) setSelectedTripDetails(null); }}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Trip Details</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Technical dispatch sheet and active transit state.
            </DialogDescription>
          </DialogHeader>

          {selectedTripDetails && (
            <div className="space-y-6 py-4">
              {/* Stepper Progress */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Trip Lifecycle</span>
                <div className="flex items-center justify-between relative px-2 pt-2">
                  <div className="absolute left-4 right-4 top-1.5 h-0.5 bg-slate-200 dark:bg-slate-850 -z-10" />
                  
                  {/* Draft Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                    <span className="text-[10px] font-bold text-emerald-605 dark:text-emerald-400">Draft</span>
                  </div>

                  {/* Dispatched Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                      ['Dispatched', 'Completed'].includes(selectedTripDetails.status) 
                        ? 'bg-cyan-500 shadow-sm shadow-cyan-500/20' 
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <span className={`text-[10px] font-bold ${
                      ['Dispatched', 'Completed'].includes(selectedTripDetails.status)
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-450 dark:text-slate-550'
                    }`}>Dispatched</span>
                  </div>

                  {/* Completed Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                      selectedTripDetails.status === 'Completed' 
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' 
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <span className={`text-[10px] font-bold ${
                      selectedTripDetails.status === 'Completed'
                        ? 'text-emerald-605 dark:text-emerald-400'
                        : 'text-slate-450 dark:text-slate-550'
                    }`}>Completed</span>
                  </div>

                  {/* Cancelled Node */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                      selectedTripDetails.status === 'Cancelled' 
                        ? 'bg-red-500 shadow-sm shadow-red-500/20' 
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <span className={`text-[10px] font-bold ${
                      selectedTripDetails.status === 'Cancelled'
                        ? 'text-red-650 dark:text-red-400'
                        : 'text-slate-450 dark:text-slate-550'
                    }`}>Cancelled</span>
                  </div>
                </div>
              </div>

              {/* Details table grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Source</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-205">{selectedTripDetails.source}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Destination</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-205">{selectedTripDetails.destination}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Vehicle</span>
                  <p className="font-semibold text-slate-805 dark:text-slate-200">
                    {selectedTripDetails.vehicleId ? `${selectedTripDetails.vehicleId.regNumber} (${selectedTripDetails.vehicleId.name})` : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Driver</span>
                  <p className="font-semibold text-slate-805 dark:text-slate-200">
                    {selectedTripDetails.driverId ? selectedTripDetails.driverId.name : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cargo Weight</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-205">{selectedTripDetails.cargoWeight.toLocaleString()} kg</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Distance</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-250">
                    {selectedTripDetails.status === 'Completed' ? `${selectedTripDetails.actualDistance} km (actual)` : `${selectedTripDetails.plannedDistance} km (planned)`}
                  </p>
                </div>
                {selectedTripDetails.status === 'Completed' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Actual Odometer</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-205">{selectedTripDetails.actualOdometer?.toLocaleString()} km</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Fuel Consumed</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-205">{selectedTripDetails.fuelConsumed?.toLocaleString()} Liters</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => setSelectedTripDetails(null)}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 text-xs font-bold shadow"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trips;
