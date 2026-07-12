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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Draft</span>;
      case 'Dispatched':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Loader2 className="h-3 w-3 animate-spin" /> In Transit</span>;
      case 'Completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3.5 w-3.5" /> Completed</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3.5 w-3.5" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading transit logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg max-w-xl mx-auto border border-destructive/20 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Failed to load trips registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Trip Dispatch</h1>
          <p className="text-muted-foreground">Coordinate, schedule, and track transit routes.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Trip Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Create Trip (Draft)</DialogTitle>
              <DialogDescription>
                Configure routes and assign vehicle & driver capacity.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTrip} className="space-y-4 py-3">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="source">Source *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="source"
                      placeholder="City, State"
                      className="pl-9"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="destination">Destination *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="destination"
                      placeholder="City, State"
                      className="pl-9"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cargoWeight">Cargo Weight (kg) *</Label>
                  <div className="relative">
                    <Scale className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cargoWeight"
                      type="number"
                      placeholder="500"
                      className="pl-9"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="distance">Planned Dist (km) *</Label>
                  <div className="relative">
                    <Layers className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="distance"
                      type="number"
                      placeholder="350"
                      className="pl-9"
                      value={plannedDistance}
                      onChange={(e) => setPlannedDistance(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="vehicleSelect">Select Vehicle *</Label>
                <select
                  id="vehicleSelect"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">-- Choose Available Vehicle --</option>
                  {availableVehicles?.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.regNumber} - {v.name} (Max: {v.maxLoadCapacity} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="driverSelect">Select Driver *</Label>
                <select
                  id="driverSelect"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">-- Choose Available Driver --</option>
                  {availableDrivers?.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} (Score: {d.safetyScore})
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={createTripMutation.isPending}>
                  {createTripMutation.isPending ? 'Saving...' : 'Create Draft'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Completion logger dialog */}
      <Dialog open={!!completeTripId} onOpenChange={(open) => { if (!open) setCompleteTripId(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
            <DialogDescription>
              Log final trip statistics to return assets back to availability.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteTripSubmit} className="space-y-4 py-2">
            {completeError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{completeError}</span>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="finalOdom">Final Odometer Reading (km) *</Label>
              <Input
                id="finalOdom"
                type="number"
                placeholder="Vehicle current odometer + distance"
                value={finalOdometer}
                onChange={(e) => setFinalOdometer(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fuelCons">Fuel Consumed (Liters) *</Label>
              <Input
                id="fuelCons"
                type="number"
                placeholder="Liters of fuel used"
                value={fuelConsumed}
                onChange={(e) => setFuelConsumed(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={completeTripMutation.isPending}>
                {completeTripMutation.isPending ? 'Logging...' : 'Complete & Close Trip'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Route (Source &rarr; Dest)</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead className="text-right">Weight (kg)</TableHead>
              <TableHead className="text-right">Distance (km)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No trips scheduled yet.
                </TableCell>
              </TableRow>
            ) : (
              trips?.map((trip) => (
                <TableRow key={trip._id}>
                  <TableCell className="font-semibold">
                    {trip.source} &rarr; {trip.destination}
                  </TableCell>
                  <TableCell>
                    {trip.vehicleId ? (
                      <div>
                        <div className="font-bold">{trip.vehicleId.regNumber}</div>
                        <div className="text-xs text-muted-foreground">{trip.vehicleId.name}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Deleted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {trip.driverId ? trip.driverId.name : <span className="text-muted-foreground text-xs">Deleted</span>}
                  </TableCell>
                  <TableCell className="text-right">{trip.cargoWeight.toLocaleString()} kg</TableCell>
                  <TableCell className="text-right">
                    {trip.status === 'Completed' ? `${trip.actualDistance} km (actual)` : `${trip.plannedDistance} km (planned)`}
                  </TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {trip.status === 'Draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => dispatchTripMutation.mutate(trip._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 h-8"
                          >
                            <Play className="h-3 w-3" /> Dispatch
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTripMutation.mutate(trip._id)}
                            className="text-destructive border-destructive/20 hover:bg-destructive/5 h-8"
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
                            onClick={() => setCompleteTripId(trip._id)}
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 h-8"
                          >
                            <CheckCircle className="h-3 w-3" /> Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTripMutation.mutate(trip._id)}
                            className="text-destructive border-destructive/20 hover:bg-destructive/5 h-8"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {['Completed', 'Cancelled'].includes(trip.status) && (
                        <span className="text-xs text-muted-foreground italic">No actions available</span>
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
  );
};

export default Trips;
