import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import DriverFilters from '../components/DriverFilters';
import DriverTable from '../components/DriverTable';
import AddDriverDialog from '../components/AddDriverDialog';

const Drivers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [formError, setFormError] = useState('');

  const isManager = ['Admin', 'Dispatcher'].includes(user?.role);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);

  // Fetch drivers
  const { data: drivers, isLoading, error } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const res = await api.get('/drivers');
      return res.data;
    }
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (newDriver) => {
      const res = await api.post('/drivers', newDriver);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }
  });

  const handleAddDriver = async (driverData) => {
    return createDriverMutation.mutateAsync(driverData);
  };

  const toggleStatuses = [
    { label: 'Available', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/15' },
    { label: 'On Trip', style: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/15' },
    { label: 'Off Duty', style: 'bg-slate-200/50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-300/30' },
    { label: 'Suspended', style: 'bg-red-500/10 text-red-600 dark:text-red-405 border border-red-500/15' }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading driver records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl max-w-xl mx-auto border border-red-500/15 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold text-sm">Failed to load driver registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Drivers & Safety Profiles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor driver registration, licenses, and safety profiles.</p>
        </div>

        {isManager && (
          <AddDriverDialog
            onAddDriver={handleAddDriver}
            isPending={createDriverMutation.isPending}
          />
        )}
      </div>

      {/* Search Filter bar */}
      <div className="flex items-center justify-between">
        <DriverFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      {/* Driver Data Table Grid */}
      <DriverTable
        drivers={drivers}
        searchQuery={searchQuery}
        selectedStatusFilter={selectedStatusFilter}
      />

      {/* Toggle Status section from mockup */}
      <div className="space-y-3.5">
        <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Toggle Status Filter</span>
        <div className="flex flex-wrap gap-3">
          {toggleStatuses.map((t) => {
            const isSelected = selectedStatusFilter === t.label;
            return (
              <button
                key={t.label}
                onClick={() => setSelectedStatusFilter(isSelected ? null : t.label)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-250 cursor-pointer shadow-sm border ${isSelected
                    ? 'ring-2 ring-offset-2 ring-cyan-500 scale-[0.98] ' + t.style
                    : 'opacity-70 hover:opacity-100 ' + t.style
                  }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety warning disclaimer note */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 leading-relaxed">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Rule: Any operator with an expired license category or suspended status is automatically blocked from trip allocation.</span>
        </p>
      </div>
    </div>
  );
};

export default Drivers;
