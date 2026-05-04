// menuConfig.ts
import {
  LayoutDashboard,
  Newspaper,
  Briefcase,
  FileText,
  Users
} from 'lucide-react';

export const MENU_ITEMS = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/',
    roles: ['super_admin', 'admin', 'user'],
  },
  {
    icon: Newspaper,
    label: 'News Coverage',
    path: '/news',
    roles: ['super_admin', 'admin'],
  },
  {
    icon: Briefcase,
    label: 'Projects',
    path: '/projects',
    roles: ['super_admin', 'admin', 'user'],
  },
  {
    icon: FileText,
    label: 'Reports',
    path: '/reports',
    roles: ['super_admin'],
  },
  {
    icon: Users,
    label: 'Users',
    path: '/users',
    roles: ['super_admin'],
  },
];