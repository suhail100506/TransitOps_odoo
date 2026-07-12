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

const AddVehicleDialog = ({ onAddVehicle, isPending }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Semi-Truck');
  const [maxLoadCapacity, setMaxLoadCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [formError, setFormError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!regNumber || !name || !model || !type || !maxLoadCapacity || !acquisitionCost) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      await onAddVehicle({
        regNumber,
        name,
        model,
        type,
        maxLoadCapacity: Number(maxLoadCapacity),
        odometer: Number(odometer) || 0,
        acquisitionCost: Number(acquisitionCost)
      });
      setIsOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create vehicle.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger
        render={
          <Button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-955 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98]" />
        }
      >
        <Plus className="h-4 w-4" /> Register Vehicle
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Register Vehicle</DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Enter vehicle metrics to enroll it in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-600 dark:text-red-400 rounded-xl text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="regNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reg Number *</Label>
              <Input
                id="regNumber"
                placeholder="e.g. VAN-05"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Sprinter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="model" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Model *</Label>
              <Input
                id="model"
                placeholder="e.g. 2024 Cargo"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type *</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                required
              >
                <option value="Van" className="bg-slate-900 text-white">Van</option>
                <option value="Flatbed" className="bg-slate-900 text-white font-semibold">Flatbed</option>
                <option value="Semi-Truck" className="bg-slate-900 text-white font-semibold">Semi-Truck</option>
                <option value="Box Truck" className="bg-slate-900 text-white font-semibold">Box Truck</option>
                <option value="Mini-Van" className="bg-slate-900 text-white font-semibold">Mini-Van</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="capacity" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium leading-none">Max Load *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="kg"
                value={maxLoadCapacity}
                onChange={(e) => setMaxLoadCapacity(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="odometer" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium leading-none">Odometer</Label>
              <Input
                id="odometer"
                type="number"
                placeholder="km"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="cost" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium leading-none">Cost ($) *</Label>
              <Input
                id="cost"
                type="number"
                placeholder="45000"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-xl px-4 py-2 font-bold shadow" disabled={isPending}>
              {isPending ? 'Registering...' : 'Register Vehicle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
