import { Outlet, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  FileText,
  Newspaper
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../features/auth/store/authStore.ts';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Newspaper, label: 'News Coverage', path: '/news' },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    ...(user?.role === 'super_admin' ? [{ icon: Users, label: 'Users', path: '/users' }] : []),
  ];

  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-sidebar border-r border-border flex flex-col shadow-xl z-20 whitespace-nowrap"
          >
            <div className="p-5 flex items-center justify-between border-b border-border h-16">
              <span className="font-bold text-xl text-accent">Enterprise</span>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="p-2 hover:bg-card rounded-lg text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-4 p-3.5 hover:bg-card rounded-lg text-text-secondary hover:text-text-primary transition-all group"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-3.5 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-all active:scale-95 group"
              >
                <LogOut className="w-5 h-5 shrink-0 group-hover:block" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-bg border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-card rounded-lg flex items-center justify-center text-text-primary active:scale-95"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>Home</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-text-primary font-medium">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
              <p className="text-xs text-text-secondary capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-accent font-bold shadow-sm">
              {user?.name[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-bg relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
