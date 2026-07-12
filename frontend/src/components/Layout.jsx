import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  User as UserIcon
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, role: ['driver'] },
    { path: '/vehicles', label: 'Fleet Registry', icon: Truck, role: ['fleet_manager'] },
    { path: '/drivers', label: 'Drivers & Compliance', icon: Users, role: ['safety_officer'] },
    { path: '/trips', label: 'Trips Dispatch', icon: Route, role: ['driver'] },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench, role: ['fleet_manager'] },
    { path: '/expenses', label: 'Fuel & Expenses', icon: Fuel, role: ['financial_analyst'] },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, role: ['financial_analyst'] },
    { path: '/users', label: 'User Management', icon: UserIcon, role: ['admin'] }
  ];

  const roleRoutes = {
    fleet_manager: ['/vehicles', '/maintenance'],
    driver: ['/', '/trips'],
    safety_officer: ['/drivers'],
    financial_analyst: ['/expenses', '/reports'],
    admin: ['/', '/vehicles', '/drivers', '/trips', '/maintenance', '/expenses', '/reports', '/users']
  };

  const defaultLanding = {
    fleet_manager: '/vehicles',
    driver: '/',
    safety_officer: '/drivers',
    financial_analyst: '/expenses',
    admin: '/users'
  };

  // If user is loaded, assert path permissions
  if (user) {
    if (user.role !== 'admin') {
      const allowedPaths = roleRoutes[user.role] || [];
      if (!allowedPaths.includes(location.pathname)) {
        const landing = defaultLanding[user.role] || '/';
        return <Navigate to={landing} replace />;
      }
    }
  }

  const allowedItems = navItems.filter((item) => item.role.includes(user?.role) || user?.role === 'admin');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950/40 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-all duration-300">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100 dark:border-slate-900/80">
          <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/25 rounded-xl text-cyan-600 dark:text-cyan-400">
            <Truck className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">TransitOps</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold shadow-sm border-l-2 border-cyan-500 rounded-l-none pl-3'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-cyan-500' : 'text-slate-500 dark:text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Summary */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-900/80 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 shadow-sm border border-cyan-500/15">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200 leading-none mb-1.5">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize truncate">
                {user?.role === 'driver' ? 'dispatcher' : user?.role === 'admin' ? 'Administrator' : user?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 border rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 border-red-500/20 dark:border-red-500/30 transition-all duration-200 active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950/20">
        {/* Header */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-950 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 dark:bg-cyan-500/25 rounded-lg text-cyan-600 dark:text-cyan-400">
              <Truck className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">TransitOps</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-red-500 dark:hover:text-red-400 border border-slate-200/60 dark:border-slate-800/80"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Dynamic Screen Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
