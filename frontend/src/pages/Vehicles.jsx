import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import VehicleFilters from '../components/VehicleFilters';
import VehicleTable from '../components/VehicleTable';
import AddVehicleDialog from '../components/AddVehicleDialog';

const Vehicles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'fleet_manager' || user?.role === 'admin';

  // Filters state
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    regNumber: ''
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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
  const handleAddVehicle = async (vehicleData) => {
    return createVehicleMutation.mutateAsync(vehicleData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading vehicle registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl max-w-xl mx-auto border border-red-500/15 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failed to load vehicle registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Vehicle Registry</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track fleet vehicles.</p>
        </div>

        {isManager && (
          <AddVehicleDialog
            onAddVehicle={handleAddVehicle}
            isPending={createVehicleMutation.isPending}
          />
        )}
      </div>

      {/* Filters row */}
      <VehicleFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Table content */}
      <VehicleTable vehicles={vehicles} filters={filters} />

      {/* Business rules footer */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 leading-relaxed">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Rule: Registration Number must be unique. Retired or In Shop vehicles are automatically hidden from the dispatcher's Active Trip Assignment panel.</span>
        </p>
      </div>
    </div>
  );
};

export default Vehicles;
