import React, { useState } from 'react';
import api from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

const UsersManagement = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('driver');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !password || !role) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/signup', { name, email, password, role });
      setSuccess(`User "${name}" successfully registered under role "${role.replace('_', ' ')}"!`);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to enroll new user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">User Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enroll and manage credentialed roles in the TransitOps cluster.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Registration Card */}
        <Card className="shadow-lg border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-950/70">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Enroll New Account</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Provision security keys and credentials for operators or analysts.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/15 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="regName" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name *</Label>
                <Input
                  id="regName"
                  placeholder="e.g. Rachel Green"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regEmail" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address *</Label>
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="rachel@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regPass" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Initial Password *</Label>
                <Input
                  id="regPass"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10.5"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regRole" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Role *</Label>
                <select
                  id="regRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs font-bold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                  required
                >
                  <option value="driver" className="bg-slate-900 text-white font-semibold">Dispatcher</option>
                  <option value="fleet_manager" className="bg-slate-900 text-white font-semibold">Fleet Manager</option>
                  <option value="safety_officer" className="bg-slate-900 text-white font-semibold">Safety Officer</option>
                  <option value="financial_analyst" className="bg-slate-900 text-white font-semibold">Financial Analyst</option>
                  <option value="admin" className="bg-slate-900 text-white font-semibold">System Administrator</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
              >
                <UserPlus className="h-4 w-4" /> {loading ? 'Enrolling...' : 'Enroll Account'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* User Management Guide Card */}
        <Card className="shadow-md border border-slate-250/30 dark:border-slate-850/60 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Access Scope Reference</h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Dispatcher Role</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Access to live Dashboard feeds and Trips Dispatch controls.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Fleet Manager Role</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Enroll vehicles, schedule vehicle maintenance sheets.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Safety Officer Role</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Oversee operator safety rankings, licenses validations, and expirations.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300">Financial Analyst Role</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">Analyze fuel trends, log expenses sheets, view Recharts reports.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UsersManagement;
