import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
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
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Vehicles', icon: Truck },
    { path: '/drivers', label: 'Drivers', icon: Users },
    { path: '/trips', label: 'Trips', icon: Route },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/expenses', label: 'Fuel & Expenses', icon: Fuel },
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 }
  ];

  return (
    <div className="flex h-screen bg-muted/40 font-sans text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card text-card-foreground">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Truck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight text-primary">TransitOps</span>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Summary */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-none mb-1">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 border rounded-md text-xs font-medium text-destructive hover:bg-destructive/5 transition-colors border-destructive/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight text-primary">TransitOps</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted"
            title="Logout"
          >
            <LogOut className="h-5 w-5 text-destructive" />
          </button>
        </header>

        {/* Dynamic Screen Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
