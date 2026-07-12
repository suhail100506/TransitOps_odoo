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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Loader2, Plus, AlertCircle, Wrench, CheckCircle2, ShieldAlert } from 'lucide-react';

const Vehicles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Semi-Truck');
  const [maxLoadCapacity, setMaxLoadCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [formError, setFormError] = useState('');

  const isManager = ['Admin', 'Dispatcher'].includes(user?.role);

  // Fetch vehicles
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await api.get('/vehicles');
      return res.data;
    }
  });

  // Create vehicle mutation
  const createVehicleMutation = useMutation({
    mutationFn: async (newVehicle) => {
      const res = await api.post('/vehicles', newVehicle);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setIsOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to create vehicle.');
    }
  });

  const resetForm = () => {
    setRegNumber('');
    setName('');
    setModel('');
    setType('Semi-Truck');
    setMaxLoadCapacity('');
    setOdometer('');
    setAcquisitionCost('');
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!regNumber || !name || !model || !type || !maxLoadCapacity || !acquisitionCost) {
      setFormError('Please fill in all required fields.');
      return;
    }

    createVehicleMutation.mutate({
      regNumber,
      name,
      model,
      type,
      maxLoadCapacity: Number(maxLoadCapacity),
      odometer: Number(odometer) || 0,
      acquisitionCost: Number(acquisitionCost)
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
      case 'AVAILABLE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Available</span>;
      case 'On Trip':
      case 'DISPATCHED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Loader2 className="h-3 w-3 animate-spin" /> On Trip</span>;
      case 'In Shop':
      case 'UNDER_MAINTENANCE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"><Wrench className="h-3 w-3" /> In Shop</span>;
      case 'Retired':
      case 'OUT_OF_SERVICE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive dark:bg-destructive/30 dark:text-destructive"><ShieldAlert className="h-3 w-3" /> Retired</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading vehicle registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg max-w-xl mx-auto border border-destructive/20 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Failed to load vehicle registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vehicle Registry</h1>
          <p className="text-muted-foreground">Manage and track fleet vehicles.</p>
        </div>

        {isManager && (
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Register Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register Vehicle</DialogTitle>
                <DialogDescription>
                  Enter vehicle metrics to enroll it in the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="regNumber">Reg Number *</Label>
                    <Input
                      id="regNumber"
                      placeholder="e.g. VAN-05"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Mercedes Sprinter"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      placeholder="e.g. 2024 Cargo"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="type">Type *</Label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      required
                    >
                      <option value="Van">Van</option>
                      <option value="Flatbed">Flatbed</option>
                      <option value="Semi-Truck">Semi-Truck</option>
                      <option value="Box Truck">Box Truck</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1 col-span-1">
                    <Label htmlFor="capacity">Capacity (kg) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="1200"
                      value={maxLoadCapacity}
                      onChange={(e) => setMaxLoadCapacity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <Label htmlFor="odometer">Odometer (km)</Label>
                    <Input
                      id="odometer"
                      type="number"
                      placeholder="0"
                      value={odometer}
                      onChange={(e) => setOdometer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 col-span-1">
                    <Label htmlFor="cost">Cost ($) *</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="45000"
                      value={acquisitionCost}
                      onChange={(e) => setAcquisitionCost(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createVehicleMutation.isPending}>
                    {createVehicleMutation.isPending ? 'Registering...' : 'Register Vehicle'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reg Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Max Load</TableHead>
              <TableHead className="text-right">Odometer</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No vehicles registered yet.
                </TableCell>
              </TableRow>
            ) : (
              vehicles?.map((vehicle) => (
                <TableRow key={vehicle._id}>
                  <TableCell className="font-bold">{vehicle.regNumber}</TableCell>
                  <TableCell>{vehicle.name}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell className="text-right">{vehicle.maxLoadCapacity.toLocaleString()} kg</TableCell>
                  <TableCell className="text-right">{vehicle.odometer.toLocaleString()} km</TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Vehicles;
