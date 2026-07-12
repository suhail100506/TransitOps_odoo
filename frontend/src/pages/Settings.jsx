import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !password || !role) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      await authAPI.createUser({ name, email, password, role });
      setSuccess(`User "${name}" has been successfully registered with the role of "${role}".`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('driver');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <Shield className="h-16 w-16 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          Only system administrators can access this configuration panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Manage system configurations, user directory, and role provisioning policies.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Provision Form */}
        <Card className="md:col-span-2 shadow-md border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-950/70 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Users className="h-5 w-5 text-cyan-500" />
              Provision New User Account
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Add new staff members and configure their system-wide operational access levels.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateUser}>
            <CardContent className="space-y-4 px-6 pb-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 dark:bg-red-500/25 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 dark:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Security Access Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="driver" className="bg-slate-900 text-white">Dispatcher (Driver)</option>
                    <option value="fleet_manager" className="bg-slate-900 text-white">Fleet Manager</option>
                    <option value="safety_officer" className="bg-slate-900 text-white">Safety Officer</option>
                    <option value="financial_analyst" className="bg-slate-900 text-white">Financial Analyst</option>
                    <option value="admin" className="bg-slate-900 text-white">System Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="px-5 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium transition-all shadow-md active:scale-[0.98]" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Register User'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Sidebar Info Card */}
        <Card className="shadow-md border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-950/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Security Directory Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Administrative Provisioning</h4>
              <p>Public registrations are disabled. User accounts must be created manually by an Administrator inside this settings module.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Role Restrictions</h4>
              <p>Each user account is limited to the features authorized for their specified role. System Admins maintain global view and write capabilities.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
