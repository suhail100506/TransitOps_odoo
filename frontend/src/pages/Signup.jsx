import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, AlertCircle } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('fleet_manager');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/10 p-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200/60 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-950/70 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-slate-200 dark:hover:border-slate-800">
        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-2xl text-cyan-600 dark:text-cyan-400 shadow-sm border border-cyan-500/20">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Account</CardTitle>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            Register to join the TransitOps fleet portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6 pb-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 dark:bg-red-500/25 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10 px-3.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10 px-3.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-10 px-3.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Access Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-3.5 py-1.5 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 focus:border-cyan-500 md:text-sm text-slate-900 dark:text-white"
                required
              >
                <option value="fleet_manager" className="bg-slate-900 text-white">Fleet Manager</option>
                <option value="driver" className="bg-slate-900 text-white">Dispatcher</option>
                <option value="safety_officer" className="bg-slate-900 text-white">Safety Officer</option>
                <option value="financial_analyst" className="bg-slate-900 text-white">Financial Analyst</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-6 pb-8">
            <Button type="submit" className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-medium transition-all shadow-md active:scale-[0.98]" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold transition-all">
                Log In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
