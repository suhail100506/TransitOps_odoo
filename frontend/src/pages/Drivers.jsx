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
import { Loader2, Plus, AlertCircle, CheckCircle2, UserX, UserMinus } from 'lucide-react';

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
      setIsOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to create driver record.');
    }
  });

  const resetForm = () => {
    setName('');
    setLicenseNumber('');
    setLicenseCategory('');
    setLicenseExpiryDate('');
    setContactNumber('');
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      setFormError('Please fill in all required fields.');
      return;
    }

    createDriverMutation.mutate({
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="h-3 w-3" /> Available</span>;
      case 'On Trip':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Loader2 className="h-3 w-3 animate-spin" /> On Trip</span>;
      case 'Off Duty':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground"><UserMinus className="h-3 w-3" /> Off Duty</span>;
      case 'Suspended':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive dark:bg-destructive/30 dark:text-destructive"><UserX className="h-3 w-3" /> Suspended</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{status}</span>;
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return <span className="text-green-600 font-semibold">{score} / 100</span>;
    if (score >= 75) return <span className="text-amber-600 font-semibold">{score} / 100</span>;
    return <span className="text-destructive font-bold">{score} / 100</span>;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Loading driver records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg max-w-xl mx-auto border border-destructive/20 my-8">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">Failed to load driver registry</h3>
          <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Driver Management</h1>
          <p className="text-muted-foreground">Monitor driver registration, licenses, and safety profiles.</p>
        </div>

        {isManager && (
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register Driver</DialogTitle>
                <DialogDescription>
                  Create a new record for a company-registered operator.
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
                  <Label htmlFor="driverName">Full Name *</Label>
                  <Input
                    id="driverName"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="licenseNumber">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      placeholder="e.g. DL-9831920"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="licenseCategory">Category *</Label>
                    <Input
                      id="licenseCategory"
                      placeholder="e.g. Heavy Rig (Class A)"
                      value={licenseCategory}
                      onChange={(e) => setLicenseCategory(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="licenseExpiry">Expiry Date *</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      value={licenseExpiryDate}
                      onChange={(e) => setLicenseExpiryDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contactNumber">Contact Phone *</Label>
                    <Input
                      id="contactNumber"
                      placeholder="+1 (555) 123-4567"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={createDriverMutation.isPending}>
                    {createDriverMutation.isPending ? 'Registering...' : 'Add Driver'}
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
              <TableHead>Driver</TableHead>
              <TableHead>License Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>License Expiry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Safety Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No drivers registered yet.
                </TableCell>
              </TableRow>
            ) : (
              drivers?.map((driver) => (
                <TableRow key={driver._id}>
                  <TableCell className="font-semibold">{driver.name}</TableCell>
                  <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.licenseCategory}</TableCell>
                  <TableCell>
                    {new Date(driver.licenseExpiryDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>{driver.contactNumber}</TableCell>
                  <TableCell>{getScoreBadge(driver.safetyScore)}</TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Drivers;
