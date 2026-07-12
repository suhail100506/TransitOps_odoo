import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

const AddDriverDialog = ({ onAddDriver, isPending }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setName('');
    setLicenseNumber('');
    setLicenseCategory('');
    setLicenseExpiryDate('');
    setContactNumber('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      await onAddDriver({
        name,
        licenseNumber,
        licenseCategory,
        licenseExpiryDate,
        contactNumber
      });
      setIsOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to register operator.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-955 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Driver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Register Driver</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Create a new record for a company-registered operator.
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
            <Label htmlFor="driverName" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name *</Label>
            <Input
              id="driverName"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="licenseNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">License Number *</Label>
              <Input
                id="licenseNumber"
                placeholder="e.g. DL-9831920"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licenseCategory" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Category *</Label>
              <Input
                id="licenseCategory"
                placeholder="e.g. Heavy Rig (Class A)"
                value={licenseCategory}
                onChange={(e) => setLicenseCategory(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="licenseExpiry" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expiry Date *</Label>
              <Input
                id="licenseExpiry"
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Contact Phone *</Label>
              <Input
                id="contactNumber"
                placeholder="+1 (555) 123-4567"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-955 rounded-xl px-4 py-2 font-bold shadow" disabled={isPending}>
              {isPending ? 'Registering...' : 'Add Driver'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDriverDialog;
