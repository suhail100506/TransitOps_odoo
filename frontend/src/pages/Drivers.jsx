import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverAPI } from '../services/api';
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
import {
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle2,
  UserX,
  UserMinus,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'];

const getDaysUntilExpiry = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

const Drivers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [formError, setFormError] = useState('');

  const isManager = user?.role === 'fleet_manager';

  // Fetch drivers with filter
  const { data: drivers, isLoading, error } = useQuery({
    queryKey: ['drivers', statusFilter],
    queryFn: () => driverAPI.getAll(statusFilter !== 'All' ? { status: statusFilter } : {})
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: driverAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
      setIsOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.error || 'Failed to create driver record.');
    }
  });

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }) => driverAPI.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Failed to change driver status.');
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

    createDriverMutation.mutate({ name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" /> Available</span>;
      case 'On Trip':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 animate-spin" /> On Trip</span>;
      case 'Off Duty':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground"><UserMinus className="h-3 w-3" /> Off Duty</span>;
      case 'Suspended':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive"><UserX className="h-3 w-3" /> Suspended</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{status}</span>;
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return <span className="text-green-600 font-semibold">{score} / 100</span>;
    if (score >= 75) return <span className="text-amber-600 font-semibold">{score} / 100</span>;
    return <span className="text-destructive font-bold">{score} / 100</span>;
  };

  const getLicenseBadge = (dateStr) => {
    const days = getDaysUntilExpiry(dateStr);
    const formatted = new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    if (days < 0) {
      return (
        <div>
          <p className="text-destructive font-semibold text-xs">{formatted}</p>
          <span className="inline-flex items-center gap-1 text-xs text-destructive font-bold">
            <AlertCircle className="h-3 w-3" /> Expired
          </span>
        </div>
      );
    }
    if (days <= 30) {
      return (
        <div>
          <p className="text-amber-700 dark:text-amber-400 font-semibold text-xs">{formatted}</p>
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">
            <AlertTriangle className="h-3 w-3" /> Expires in {days}d
          </span>
        </div>
      );
    }
    return <p className="text-sm">{formatted}</p>;
  };

  const getRowHighlight = (driver) => {
    const days = getDaysUntilExpiry(driver.licenseExpiryDate);
    if (days < 0) return 'border-l-4 border-l-destructive bg-destructive/5';
    if (days <= 30) return 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10';
    return '';
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

  const expiredCount = drivers?.filter(d => getDaysUntilExpiry(d.licenseExpiryDate) < 0).length ?? 0;
  const expiringSoonCount = drivers?.filter(d => { const days = getDaysUntilExpiry(d.licenseExpiryDate); return days >= 0 && days <= 30; }).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Driver Management</h1>
          <p className="text-muted-foreground">Monitor driver registration, licenses, and safety profiles.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none flex h-9 items-center rounded-md border border-input bg-background px-3 pr-8 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                  <DialogDescription>Create a new record for a company-registered operator.</DialogDescription>
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
                    <Input id="driverName" placeholder="e.g. Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="licenseNumber">License Number *</Label>
                      <Input id="licenseNumber" placeholder="e.g. DL-9831920" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="licenseCategory">Category *</Label>
                      <Input id="licenseCategory" placeholder="e.g. Heavy Rig (Class A)" value={licenseCategory} onChange={(e) => setLicenseCategory(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="licenseExpiry">Expiry Date *</Label>
                      <Input id="licenseExpiry" type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="contactNumber">Contact Phone *</Label>
                      <Input id="contactNumber" placeholder="+1 (555) 123-4567" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
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
      </div>

      {/* License Alert Summary */}
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {expiredCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium">
              <AlertCircle className="h-4 w-4" />
              {expiredCount} Expired License{expiredCount > 1 ? 's' : ''}
            </div>
          )}
          {expiringSoonCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg text-sm text-amber-800 dark:text-amber-300 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {expiringSoonCount} License{expiringSoonCount > 1 ? 's' : ''} Expiring Soon
            </div>
          )}
        </div>
      )}

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
              {isManager && <TableHead className="text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isManager ? 8 : 7} className="text-center py-8 text-muted-foreground">
                  No drivers found{statusFilter !== 'All' ? ` with status "${statusFilter}"` : ''}.
                </TableCell>
              </TableRow>
            ) : (
              drivers?.map((driver) => (
                <TableRow key={driver._id} className={getRowHighlight(driver)}>
                  <TableCell className="font-semibold">{driver.name}</TableCell>
                  <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.licenseCategory}</TableCell>
                  <TableCell>{getLicenseBadge(driver.licenseExpiryDate)}</TableCell>
                  <TableCell>{driver.contactNumber}</TableCell>
                  <TableCell>{getScoreBadge(driver.safetyScore)}</TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  {isManager && (
                    <TableCell className="text-center">
                      {driver.status !== 'On Trip' ? (
                        <div className="relative inline-block">
                          <select
                            className="appearance-none h-7 rounded-md border border-input bg-background px-2 pr-6 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                            value={driver.status}
                            onChange={(e) => {
                              if (e.target.value !== driver.status) {
                                changeStatusMutation.mutate({ id: driver._id, status: e.target.value });
                              }
                            }}
                            disabled={changeStatusMutation.isPending}
                          >
                            <option value="Available">Available</option>
                            <option value="Off Duty">Off Duty</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">On Trip</span>
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
  );
};

export default Drivers;
