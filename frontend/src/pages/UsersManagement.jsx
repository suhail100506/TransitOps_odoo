import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  DialogTitle
} from '@/components/ui/dialog';
import {
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Edit,
  Trash2,
  Key,
  Check,
  X,
  UserPlus
} from 'lucide-react';

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Create User Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  
  // Edit User Modal states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('Active');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Users List
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await authAPI.getUsers();
      return res;
    },
    enabled: currentUser?.role === 'admin'
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: authAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccess(`User "${name}" successfully registered under role "${role.replace('_', ' ')}"!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('driver');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to enroll new user.');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => authAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccess('User account updated successfully.');
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to update user.');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: authAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccess('User account deleted successfully.');
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Failed to delete user.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    createUserMutation.mutate({ name, email, password, role });
  };

  const handleOpenEdit = (userToEdit) => {
    setError('');
    setSuccess('');
    setEditingUser(userToEdit);
    setEditName(userToEdit.name);
    setEditEmail(userToEdit.email);
    setEditRole(userToEdit.role);
    setEditStatus(userToEdit.status);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!editName || !editEmail || !editRole) {
      setError('Name, email, and role are required.');
      return;
    }

    updateUserMutation.mutate({
      id: editingUser._id,
      data: {
        name: editName,
        email: editEmail,
        role: editRole,
        status: editStatus
      }
    });
  };

  const handleDeleteUser = (userToDelete) => {
    setError('');
    setSuccess('');

    if (userToDelete._id === currentUser.id) {
      setError('Cannot delete your own administrator account.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user "${userToDelete.name}"?`)) {
      deleteUserMutation.mutate(userToDelete._id);
    }
  };

  const getRoleBadgeColor = (roleStr) => {
    switch (roleStr) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'fleet_manager':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
      case 'safety_officer':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'financial_analyst':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  if (currentUser?.role !== 'admin') {
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

  const loading = createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">User Management</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enroll and manage credentialed roles in the TransitOps cluster.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Registration Card */}
        <Card className="lg:col-span-4 shadow-lg border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-950/70">
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
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
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
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
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
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
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
                  className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regRole" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Role *</Label>
                <select
                  id="regRole"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
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
            <CardFooter className="pt-4">
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

        {/* Right Column: User Management Table */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-md border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-950/70 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Active User Directory</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Inspect registered users, manage permission levels, or deactivate accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : (
                <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3 px-4">Name</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3 px-4">Email</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3 px-4">Role</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3 px-4">Status</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 py-3 px-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users && users.map((u) => (
                          <TableRow key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                            <TableCell className="font-medium text-slate-900 dark:text-white py-3 px-4">{u.name}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 py-3 px-4">{u.email}</TableCell>
                            <TableCell className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide leading-none ${getRoleBadgeColor(u.role)}`}>
                                {u.role === 'driver' ? 'dispatcher' : u.role.replace('_', ' ')}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                u.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                              }`}>
                                {u.status === 'Active' ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                {u.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-lg hover:border-cyan-500/30 hover:text-cyan-500"
                                  onClick={() => handleOpenEdit(u)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className={`h-8 w-8 rounded-lg ${
                                    u._id === currentUser.id
                                      ? 'opacity-40 cursor-not-allowed'
                                      : 'hover:border-red-500/30 hover:text-red-500'
                                  }`}
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={u._id === currentUser.id}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Modal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-950 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-cyan-500" />
              Modify User Profile
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Make changes to user properties, change status, or assign permission roles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="editName" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editEmail" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editRole" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Role</Label>
                <select
                  id="editRole"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                  required
                  disabled={editingUser?._id === currentUser.id}
                >
                  <option value="driver" className="bg-slate-900 text-white">Dispatcher (Driver)</option>
                  <option value="fleet_manager" className="bg-slate-900 text-white">Fleet Manager</option>
                  <option value="safety_officer" className="bg-slate-900 text-white">Safety Officer</option>
                  <option value="financial_analyst" className="bg-slate-900 text-white">Financial Analyst</option>
                  <option value="admin" className="bg-slate-900 text-white">System Administrator</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editStatus" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</Label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 text-slate-900 dark:text-white"
                  required
                  disabled={editingUser?._id === currentUser.id}
                >
                  <option value="Active" className="bg-slate-900 text-white">Active</option>
                  <option value="Inactive" className="bg-slate-900 text-white">Inactive</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl px-4 text-xs font-semibold"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-xl px-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
