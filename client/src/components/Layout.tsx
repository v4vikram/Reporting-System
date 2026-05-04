import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../features/auth/store/authStore.ts';
import { MENU_ITEMS } from '../lib/menuConfig.ts';

/* ─── Avatar initials ────────────────────────────────────── */
function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${dim} rounded-xl bg-accent/15 text-accent font-bold flex items-center justify-center shrink-0 select-none`}>
      {initials}
    </div>
  );
}

/* ─── Role label ─────────────────────────────────────────── */
function roleLabel(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/* ═══════════════════════════════════════════════════════════ */
export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  /* Desktop: persistent. Mobile: overlay drawer */
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);

  /* Close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* Close mobile drawer on ESC */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = MENU_ITEMS.filter(item => user && item.roles.includes(user.role));

  /* Active check */
  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  /* ── Shared sidebar content ── */
  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black">E</span>
          </div>
          <span className="font-bold text-base text-text-primary tracking-tight">Enterprise</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-card text-text-secondary hover:text-text-primary transition-all duration-150"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-accent text-white shadow-md shadow-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-card'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'}`} />
              <span className="truncate">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-accent -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-border space-y-1 shrink-0">
        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card/60">
          <UserAvatar name={user?.name ?? 'U'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-text-secondary/60 truncate mt-0.5">{roleLabel(user?.role ?? '')}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-red-500 hover:bg-red-500/8 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-red-500 transition-colors" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  /* ── Current page label for breadcrumb ── */
  const currentPage = navItems.find(i => isActive(i.path))?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen bg-bg text-text-primary overflow-hidden">

      {/* ════════ DESKTOP SIDEBAR ════════ */}
      <AnimatePresence initial={false}>
        {desktopOpen && (
          <motion.aside
            key="desktop-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="hidden md:flex flex-col bg-sidebar border-r border-border z-20 overflow-hidden shrink-0"
            style={{ minWidth: 0 }}
          >
            <div className="w-[240px] h-full">
              <SidebarContent onClose={() => setDesktopOpen(false)} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ════════ MOBILE SIDEBAR OVERLAY ════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-sidebar border-r border-border shadow-2xl md:hidden"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ════════ MAIN ════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* ── Header ── */}
        <header className="h-16 bg-bg border-b border-border flex items-center justify-between px-4 sm:px-5 z-10 shrink-0 gap-3">

          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl border border-border hover:bg-card hover:border-accent/30 text-text-secondary hover:text-text-primary transition-all duration-150 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Desktop: toggle when sidebar closed */}
            {!desktopOpen && (
              <button
                onClick={() => setDesktopOpen(true)}
                className="hidden md:flex p-2 rounded-xl border border-border hover:bg-card hover:border-accent/30 text-text-secondary hover:text-text-primary transition-all duration-150 shrink-0"
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="hidden sm:inline text-text-secondary/50 text-xs">Home</span>
              <ChevronRight className="hidden sm:inline w-3 h-3 text-text-secondary/30 shrink-0" />
              <span className="font-semibold text-text-primary truncate text-sm">{currentPage}</span>
            </nav>
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-text-primary leading-tight truncate max-w-[140px]">{user?.name}</p>
              <p className="text-[11px] text-text-secondary/60 truncate">{roleLabel(user?.role ?? '')}</p>
            </div>
            <UserAvatar name={user?.name ?? 'U'} />
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="flex-1 overflow-y-auto bg-bg">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}